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
  CheckCircle2,
  ShieldCheck,
  Rocket
} from 'lucide-react';

interface OnboardingModalProps {
  onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to StockBit Pro",
      description: "You've successfully deployed a high-performance retail management suite. We've optimized every feature for Nigerian businesses to scale efficiently.",
      icon: <Rocket className="text-indigo-600" size={48} />,
      color: "bg-indigo-50",
      tip: "Start by verifying your company name in Settings."
    },
    {
      title: "1. Setup Your Catalog",
      description: "Navigate to the Inventory tab to add products. Pro Tip: Use the 'AI Scanner' to snap a photo of a label; Gemini AI will automatically extract the SKU, Name, and Category for you.",
      icon: <Box className="text-blue-600" size={48} />,
      color: "bg-blue-50",
      tip: "Set 'Min. Alert Levels' to receive low stock warnings."
    },
    {
      title: "2. Record Daily Sales",
      description: "The Sales/POS module is your register. Add items to cart, enter customer names for tracking, and print professional receipts after every transaction.",
      icon: <ShoppingCart className="text-emerald-600" size={48} />,
      color: "bg-emerald-50",
      tip: "Use 'Price Check' to quickly scan barcodes without creating a sale."
    },
    {
      title: "3. Perform Stock Audits",
      description: "Stocktaking ensures your system matches your physical shelves. Regularly use this tool to find discrepancies and sync your inventory with one click.",
      icon: <ClipboardCheck className="text-amber-600" size={48} />,
      color: "bg-amber-50",
      tip: "Perform audits weekly to prevent inventory leakage."
    },
    {
      title: "4. AI Strategy Insights",
      description: "Visit the AI Insights tab. Gemini analyzes your sales trends to suggest which products to restock and identifies slow-moving items eating your capital.",
      icon: <Sparkles className="text-purple-600" size={48} />,
      color: "bg-purple-50",
      tip: "Refresh insights every Monday for weekly planning."
    },
    {
      title: "5. Security & Multi-Device",
      description: "StockBit is cloud-synced via Supabase. You can log in from your phone, tablet, or PC simultaneously. Your data is protected by Row Level Security.",
      icon: <ShieldCheck className="text-slate-900" size={48} />,
      color: "bg-slate-100",
      tip: "Staff roles can be restricted in the Admin Panel."
    }
  ];

  const next = () => step < steps.length - 1 ? setStep(step + 1) : onClose();
  const prev = () => step > 0 && setStep(step - 1);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors z-10"
        >
          <X size={24} />
        </button>

        <div className="p-8 md:p-12">
          <div className="flex flex-col items-center text-center">
            <div className={`w-24 h-24 ${steps[step].color} rounded-[2rem] flex items-center justify-center mb-8 shadow-inner animate-in zoom-in-50`}>
              {steps[step].icon}
            </div>
            
            <h2 className="text-3xl font-black text-slate-900 mb-4">{steps[step].title}</h2>
            <p className="text-slate-500 leading-relaxed mb-8">
              {steps[step].description}
            </p>

            <div className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-8 flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <p className="text-xs font-bold text-slate-700 text-left">
                <span className="text-indigo-600">PRO TIP:</span> {steps[step].tip}
              </p>
            </div>

            <div className="flex items-center gap-2 mb-8">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-200'}`}
                />
              ))}
            </div>

            <div className="flex gap-4 w-full">
              {step > 0 && (
                <button 
                  onClick={prev}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={18} /> Back
                </button>
              )}
              <button 
                onClick={next}
                className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20"
              >
                {step === steps.length - 1 ? 'Get Started' : 'Continue'} 
                {step !== steps.length - 1 && <ChevronRight size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;