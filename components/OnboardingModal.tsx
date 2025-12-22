
import React, { useState } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Box, 
  ShoppingCart, 
  Sparkles, 
  ClipboardCheck, 
  Settings as SettingsIcon,
  CheckCircle2
} from 'lucide-react';

interface OnboardingModalProps {
  onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to StockBit Pro",
      description: "Your high-performance companion for inventory and sales management. Let's get your business running in 4 simple steps.",
      icon: <CheckCircle2 className="text-indigo-600" size={48} />,
      color: "bg-indigo-50"
    },
    {
      title: "Step 1: Inventory Setup",
      description: "Add your products in the Inventory tab. Use our AI Scanner to automatically detect SKUs and names from product labels using your camera.",
      icon: <Box className="text-blue-600" size={48} />,
      color: "bg-blue-50"
    },
    {
      title: "Step 2: Record Sales",
      description: "Use the Sales/POS module to check out customers. You can search for items or scan barcodes to build a cart and print receipts instantly.",
      icon: <ShoppingCart className="text-emerald-600" size={48} />,
      color: "bg-emerald-50"
    },
    {
      title: "Step 3: AI-Powered Insights",
      description: "Our integrated Gemini AI analyzes your data to predict low stock risks and identify your best-selling items automatically.",
      icon: <Sparkles className="text-purple-600" size={48} />,
      color: "bg-purple-50"
    },
    {
      title: "Step 4: Audit & Sync",
      description: "Regularly perform a 'Stocktake' to ensure your physical shelves match your digital records. Adjust discrepancies with a single click.",
      icon: <ClipboardCheck className="text-amber-600" size={48} />,
      color: "bg-amber-50"
    }
  ];

  const next = () => step < steps.length - 1 ? setStep(step + 1) : onClose();
  const prev = () => step > 0 && setStep(step - 1);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 relative">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
        >
          <X size={20} />
        </button>

        <div className={`p-12 flex flex-col items-center text-center transition-colors duration-500 ${steps[step].color}`}>
          <div className="mb-6 p-6 bg-white rounded-3xl shadow-xl shadow-slate-200/50">
            {steps[step].icon}
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-4">{steps[step].title}</h3>
          <p className="text-slate-600 leading-relaxed">{steps[step].description}</p>
        </div>

        <div className="p-8 bg-white border-t border-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-200'}`}
                />
              ))}
            </div>
            
            <div className="flex gap-3">
              {step > 0 && (
                <button 
                  onClick={prev}
                  className="px-4 py-2 text-slate-400 font-bold hover:text-slate-600 flex items-center gap-1"
                >
                  <ChevronLeft size={20} /> Back
                </button>
              )}
              <button 
                onClick={next}
                className="px-8 py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 flex items-center gap-2"
              >
                {step === steps.length - 1 ? 'Get Started' : 'Continue'} 
                {step < steps.length - 1 && <ChevronRight size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
