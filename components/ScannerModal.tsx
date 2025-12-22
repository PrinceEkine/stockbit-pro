
import React, { useRef, useState, useEffect } from 'react';
import { X, Camera, RefreshCw, Zap, Maximize, Search } from 'lucide-react';
import { identifyProductFromImage, extractProductDetailsFromImage } from '../services/geminiService';

interface ScannerModalProps {
  onScan: (result: string | any) => void;
  onClose: () => void;
  mode?: 'id' | 'details' | 'price_check';
}

const ScannerModal: React.FC<ScannerModalProps> = ({ onScan, onClose, mode = 'id' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current || isScanning) return;

    setIsScanning(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      
      let result;
      if (mode === 'details') {
        result = await extractProductDetailsFromImage(base64Image);
      } else {
        result = await identifyProductFromImage(base64Image);
      }

      if (result) {
        onScan(result);
        onClose();
      } else {
        setError("Could not identify product. Try again with a clearer view.");
        setTimeout(() => setError(null), 3000);
      }
    }
    setIsScanning(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md no-print">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            {mode === 'price_check' ? <Search size={20} className="text-indigo-600" /> : <Maximize size={20} className="text-indigo-600" />}
            {mode === 'details' ? 'AI Product Data Extractor' : mode === 'price_check' ? 'Price Checker' : 'Product & Barcode Scanner'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="relative aspect-video bg-black flex items-center justify-center">
          {error ? (
            <div className="absolute inset-0 z-10 bg-rose-500/10 flex items-center justify-center p-6 text-center text-white">
              <div className="bg-rose-600 px-4 py-2 rounded-xl text-sm font-medium">
                {error}
              </div>
            </div>
          ) : null}

          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
            <div className="absolute inset-8 border-2 border-white/30 rounded-2xl border-dashed"></div>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-6 bg-slate-50 flex flex-col items-center gap-4">
          <p className="text-xs text-slate-500 text-center max-w-xs">
            {mode === 'details' 
              ? 'Point at a product label to automatically extract name, SKU, and category.' 
              : 'Position the barcode or product name within the frame.'}
          </p>
          
          <button 
            onClick={captureAndScan}
            disabled={!isCameraActive || isScanning}
            className={`
              w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all shadow-xl
              ${isScanning ? 'bg-slate-200 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'}
            `}
          >
            {isScanning ? (
              <>
                <RefreshCw size={24} className="animate-spin" />
                Analyzing with Gemini...
              </>
            ) : (
              <>
                <Camera size={24} />
                {mode === 'details' ? 'Scan & Extract Data' : mode === 'price_check' ? 'Check Price' : 'Capture & Identify'}
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(-100px); }
          50% { transform: translateY(100px); }
        }
      `}</style>
    </div>
  );
};

export default ScannerModal;
