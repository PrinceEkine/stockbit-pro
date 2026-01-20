
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Zap, 
  Scan,
  CheckCircle2,
  Sparkles,
  Minimize2,
  ShoppingCart,
  Flashlight,
  Check
} from 'lucide-react';
import { identifyProductFromImage, extractProductDetailsFromImage } from '../services/geminiService';

interface ScannerModalProps {
  onScan: (result: string | any, stayOpen?: boolean) => void;
  onClose: () => void;
  mode?: 'id' | 'details' | 'price_check';
  cartCount?: number;
}

type ScannerStatus = 'initializing' | 'active' | 'processing' | 'error' | 'success_feedback' | 'minimized';

const ScannerModal: React.FC<ScannerModalProps> = ({ onScan, onClose, mode = 'id', cartCount = 0 }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const isMounted = useRef(true);
  
  const [status, setStatus] = useState<ScannerStatus>('initializing');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [lastScannedName, setLastScannedName] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [stream]);

  const playBeep = (type: 'success' | 'fail') => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'success') {
        osc.frequency.setValueAtTime(1000, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
      if (navigator.vibrate) navigator.vibrate(50);
    } catch (e) { console.warn(e); }
  };

  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities() as any;
    if (capabilities.torch) {
      const next = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: next }] } as any);
      if (isMounted.current) setTorchOn(next);
    }
  };

  const captureAndScan = useCallback(async () => {
    // success_feedback and processing block next scan to prevent overlapping
    if (!videoRef.current || !canvasRef.current || status === 'processing' || status === 'success_feedback' || !isMounted.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    setStatus('processing');
    canvas.width = 640;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const sourceWidth = video.videoWidth;
      const sourceHeight = video.videoHeight;
      const size = Math.min(sourceWidth, sourceHeight) * 0.8;
      const x = (sourceWidth - size) / 2;
      const y = (sourceHeight - size) / 2;
      
      ctx.drawImage(video, x, y, size, size, 0, 0, 640, 640);
      const base64Image = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
      
      try {
        const result = mode === 'details' 
          ? await extractProductDetailsFromImage(base64Image)
          : await identifyProductFromImage(base64Image);

        if (!isMounted.current) return;

        if (result) {
          playBeep('success');
          if (mode === 'details') {
            setLastScannedName(result.name || result.sku);
            setStatus('success_feedback');
            // Longer delay for full detail extraction
            setTimeout(() => { 
              if (isMounted.current) {
                onScan(result); 
                onClose(); 
              }
            }, 600);
          } else {
            onScan(result, true);
            setStatus('success_feedback');
            setLastScannedName(typeof result === 'string' ? result : (result.name || result.sku));
            // Faster recovery for continuous ID scanning
            setTimeout(() => { 
              if (isMounted.current) {
                setStatus('active'); 
                setLastScannedName(null); 
              }
            }, 400); 
          }
        } else {
          setStatus('active');
        }
      } catch (e) { 
        if (isMounted.current) setStatus('active');
      }
    }
  }, [status, mode, onScan, onClose]);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
        });
        if (!isMounted.current) {
          mediaStream.getTracks().forEach(t => t.stop());
          return;
        }
        setStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
        
        const track = mediaStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities() as any;
        setHasTorch(!!capabilities.torch);
        
        setIsCameraActive(true);
        setStatus('active');
      } catch (err) {
        if (isMounted.current) setStatus('error');
      }
    };
    startCamera();
  }, []);

  useEffect(() => {
    if (isCameraActive && status === 'active' && isMounted.current) {
      scanIntervalRef.current = window.setInterval(captureAndScan, 3000);
      return () => { if (scanIntervalRef.current) clearInterval(scanIntervalRef.current); };
    }
  }, [isCameraActive, status, captureAndScan]);

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/98 backdrop-blur-3xl no-print cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-500 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              status === 'processing' ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-900 text-white'
            }`}>
              {mode === 'details' ? <Sparkles size={24} /> : <Scan size={24} />}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                {mode === 'details' ? 'Smart Extractor' : 'Strict Sensor'}
              </h3>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">
                {status === 'processing' ? 'ANALYZING FRAME...' : 'CENTER ON PRODUCT CODE'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {hasTorch && (
              <button onClick={toggleTorch} className={`p-3 rounded-2xl transition-all ${torchOn ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                <Flashlight size={20} />
              </button>
            )}
            <button onClick={onClose} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-rose-500 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="relative aspect-square bg-slate-950 overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border-2 border-indigo-500/20 rounded-3xl relative">
              <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl shadow-[0_0_15px_rgba(79,70,229,0.3)]"></div>
              <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl shadow-[0_0_15px_rgba(79,70,229,0.3)]"></div>
              <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl shadow-[0_0_15px_rgba(79,70,229,0.3)]"></div>
              <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-indigo-500 rounded-br-xl shadow-[0_0_15px_rgba(79,70,229,0.3)]"></div>
              
              <div className={`absolute left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_10px_rgba(79,70,229,1)] ${
                status === 'processing' ? 'top-full opacity-100' : 'top-0 opacity-0'
              } animate-scan-line`}></div>
            </div>
          </div>

          <style>{`
            @keyframes scan-line {
              0% { top: 0; opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { top: 100%; opacity: 0; }
            }
            .animate-scan-line {
              animation: scan-line 2s linear infinite;
            }
          `}</style>
          
          {status === 'success_feedback' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-500/90 backdrop-blur-md text-white z-20 animate-in fade-in zoom-in-95 duration-200">
               <CheckCircle2 size={64} className="mb-4 animate-bounce" />
               <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Sync Complete</p>
               <h4 className="text-xl font-black uppercase mt-1 text-center px-8 truncate max-w-full">{lastScannedName}</h4>
            </div>
          )}
        </div>

        <div className="p-8 bg-white dark:bg-slate-900 space-y-4">
          <button 
            onClick={captureAndScan}
            disabled={status === 'processing' || status === 'success_feedback'}
            className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-[10px] tracking-widest rounded-2xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 shadow-2xl transition-all"
          >
            <Zap size={18} className="fill-current" /> Manual Analysis Trigger
          </button>
          
          <button 
            onClick={onClose}
            className="w-full py-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-300 font-black uppercase text-[10px] tracking-widest rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <Check size={18} /> Finish Scanning
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default ScannerModal;
