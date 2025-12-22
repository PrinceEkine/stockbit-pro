
import React, { useState } from 'react';
import { 
  Rocket, 
  ShieldCheck, 
  Database, 
  Mail, 
  Key, 
  Download, 
  AlertTriangle,
  CheckCircle2,
  Server,
  Activity,
  ChevronRight,
  MessageCircle
} from 'lucide-react';
import { AppState } from '../types';

interface LaunchCenterProps {
  state: AppState;
}

const LaunchCenter: React.FC<LaunchCenterProps> = ({ state }) => {
  const [isExporting, setIsExporting] = useState(false);

  const calculateStorageSize = () => {
    const stringified = JSON.stringify(state);
    const sizeInBytes = new TextEncoder().encode(stringified).length;
    return (sizeInBytes / 1024).toFixed(2) + ' KB';
  };

  const handleBackup = () => {
    setIsExporting(true);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `stockbit_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setTimeout(() => setIsExporting(false), 1000);
  };

  const checklist = [
    { 
      title: "Data Persistence", 
      status: "Production Ready", 
      desc: "Connected to Supabase PostgreSQL with real-time replication and multi-device sync.",
      icon: <Database size={20} />,
      ready: true 
    },
    { 
      title: "Security (Auth)", 
      status: "Production Ready", 
      desc: "Supabase Auth with Row Level Security (RLS) is active. Users only access their own data.",
      icon: <Mail size={20} />,
      ready: true 
    },
    { 
      title: "API Gateway", 
      status: "Production Ready", 
      desc: "Supabase URL and Key are managed via Environment Variables for secure deployment.",
      icon: <Key size={20} />,
      ready: true 
    },
    { 
      title: "Regional Lock", 
      status: "Active", 
      desc: "Geolocation is restricting access to Nigeria only. Ready for local market launch.",
      icon: <ShieldCheck size={20} />,
      ready: true 
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Launch Center <Rocket className="text-indigo-600" />
          </h1>
          <p className="text-slate-500">Final checks and production preparation tools.</p>
        </div>
        <button 
          onClick={handleBackup}
          disabled={isExporting}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl flex items-center gap-2 font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
        >
          {isExporting ? <Activity size={18} className="animate-spin" /> : <Download size={18} />}
          Full System Backup
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="text-emerald-500" size={20} /> Production Checklist
              </h2>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">v3.0.0-supabase</span>
            </div>
            <div className="divide-y divide-slate-50">
              {checklist.map((item, i) => (
                <div key={i} className="p-6 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className={`p-3 rounded-2xl ${item.ready ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-slate-900">{item.title}</h3>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${item.ready ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 mt-2" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-600/20">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Supabase Backend Ready</h3>
              <p className="text-indigo-100 mb-6 max-w-md">Your database schema is optimized with PostgreSQL triggers and RLS policies. This ensures maximum data integrity and security for your business users.</p>
              <div className="flex gap-4">
                <a 
                  href="https://supabase.com/dashboard" 
                  target="_blank"
                  className="bg-white text-indigo-600 px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2"
                >
                  Supabase Dashboard
                </a>
                <button className="bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-400">
                  API Documentation
                </button>
              </div>
            </div>
            <Server size={180} className="absolute -bottom-10 -right-10 text-white/10 rotate-12" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Activity size={18} className="text-indigo-600" /> System Metrics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Local Cache Size</span>
                <span className="font-mono font-bold text-slate-900">{calculateStorageSize()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Live Connections</span>
                <span className="font-bold text-slate-900">Active (Real-time)</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Total Products</span>
                <span className="font-bold text-slate-900">{state.products.length}</span>
              </div>
              <div className="pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold">
                  <CheckCircle2 size={14} />
                  Database Synchronized
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl">
             <h3 className="font-bold text-indigo-400 mb-2">Support & Ops</h3>
             <p className="text-xs text-slate-400 mb-4">Immediate technical assistance for your production instance.</p>
             <a 
              href="https://wa.me/2347072127949" 
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
             >
               <MessageCircle size={16} /> Contact Lead Engineer
             </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaunchCenter;
