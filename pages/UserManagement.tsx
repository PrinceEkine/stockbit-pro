
import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  CreditCard,
  Building2,
  Mail,
  Calendar,
  ChevronRight,
  UserCheck,
  XCircle,
  Zap,
  Star,
  Link as LinkIcon,
  ShieldAlert,
  Fingerprint,
  Lock,
  X,
  History,
  Activity
} from 'lucide-react';
import { User } from '../types';

interface UserManagementProps {
  users: User[];
  onUpdatePlan: (userId: string, type: 'monthly' | 'annual' | 'revoke') => Promise<boolean>;
  onAssignParent: (userId: string, parentId: string) => Promise<void>;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onUpdatePlan, onAssignParent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [targetParentId, setTargetParentId] = useState('');

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const admins = users.filter(u => u.role === 'admin' || u.role === 'user');

  const handleLink = async (userId: string) => {
    if (!targetParentId) return;
    try {
      await onAssignParent(userId, targetParentId);
      setLinkingId(null);
      setTargetParentId('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.role === 'admin') return (
      <div className="flex items-center gap-2 text-[10px] font-black text-brand-primary uppercase tracking-widest bg-brand-primary/10 px-3 py-1.5 rounded-lg border border-brand-primary/20">
         <Fingerprint size={12} className="animate-pulse" /> Root Entity
      </div>
    );
    if (user.isSubscribed) return (
      <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
         <ShieldCheck size={12} /> Pro-Node
      </div>
    );
    
    const start = new Date(user.trialStartDate);
    const now = new Date();
    const expiry = new Date(start);
    expiry.setDate(expiry.getDate() + 60);
    
    if (now > expiry) return (
      <div className="flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
         <XCircle size={12} /> Expired Link
      </div>
    );
    return (
      <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
         <Clock size={12} /> Trial Matrix
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-32">
       <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 no-print px-4 md:px-0">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full border border-brand-primary/20">
             <Lock size={14} className="animate-pulse" />
             <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Access Control Bureau</span>
          </div>
          <h1 className="text-4xl md:text-7xl font-display font-bold text-slate-900 dark:text-white tracking-tighter leading-tight">Entity Ops</h1>
          <div className="flex items-center gap-4 text-slate-400">
             <Users size={16} />
             <p className="text-[10px] font-bold uppercase tracking-[0.2em] leading-none">{users.length} Managed Identifiers</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3 rounded-[2rem] shadow-neo border border-slate-100 dark:border-slate-800 flex items-center gap-6">
           <div className="px-6 space-y-1 border-r border-slate-100 dark:border-slate-800">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Status</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white uppercase flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Operational
              </p>
           </div>
           <div className="px-6 space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Links</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white uppercase">Sync 100%</p>
           </div>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-neo mx-4 md:mx-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-all duration-300" size={24} />
          <input 
            type="text" 
            placeholder="Trace business nodes by company, email, or identifier..." 
            className="w-full pl-16 pr-10 py-6 bg-slate-50 dark:bg-slate-800/50 border-none rounded-3xl text-sm font-bold placeholder:text-slate-400 text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-brand-primary/10 shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-neo mx-4 md:mx-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="px-10 py-8">Business Node & Auth</th>
                <th className="px-10 py-8">Security Level</th>
                <th className="px-10 py-8">Parent Matrix</th>
                <th className="px-10 py-8 text-right">System Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-300">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center font-display font-bold text-xl shadow-neo group-hover:bg-brand-primary group-hover:text-white transition-all duration-500">
                        {user.companyName.charAt(0)}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none group-hover:text-brand-primary transition-colors">{user.companyName}</p>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2"><Mail size={12} className="text-slate-200 dark:text-slate-700" /> {user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    {getStatusBadge(user)}
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-3">
                       <LinkIcon size={14} className={user.parentId ? 'text-brand-primary' : 'text-slate-200 dark:text-slate-800'} />
                       <span className={`text-[10px] font-mono font-bold tracking-widest ${user.parentId ? 'text-slate-900 dark:text-white' : 'text-rose-400 italic font-black'}`}>
                        {user.parentId || 'ORPHAN_NODE'}
                       </span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => setLinkingId(user.id)}
                        className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-brand-primary rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:scale-110 active:scale-95 group/btn"
                        data-tooltip="Reprogram Parent Matrix"
                      >
                        <LinkIcon size={18} className="group-hover/btn:rotate-12 transition-transform" />
                      </button>
                      <button 
                        disabled={updatingId === user.id}
                        onClick={() => onUpdatePlan(user.id, user.isSubscribed ? 'revoke' : 'monthly')}
                        className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-3 ${user.isSubscribed ? 'bg-rose-500 text-white shadow-rose-500/20' : 'bg-emerald-500 text-white shadow-emerald-500/20'}`}
                      >
                        {user.isSubscribed ? <ShieldAlert size={16} /> : <Zap size={16} />}
                        {user.isSubscribed ? 'Revoke Protocol' : 'Approve Node'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                 <tr>
                    <td colSpan={4} className="py-24 text-center">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching entities found in current spectrum</p>
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {linkingId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] md:rounded-[4.5rem] w-full max-w-2xl relative shadow-neo-lg border border-white/5 animate-in zoom-in-95 duration-500 overflow-hidden">
            <div className="p-10 md:p-14 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white tracking-tighter uppercase">Parent Sync</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Operational Linking Protocol</p>
              </div>
              <button 
                onClick={() => setLinkingId(null)} 
                className="w-14 h-14 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-full flex items-center justify-center transition-all hover:rotate-90"
              >
                <X size={28} />
              </button>
            </div>

            <div className="p-10 md:p-14 space-y-10">
              <div className="p-8 bg-brand-primary/5 rounded-[2.5rem] border border-brand-primary/10 flex gap-6">
                 <div className="w-12 h-12 bg-brand-primary text-white rounded-2xl flex items-center justify-center shrink-0">
                    <ShieldCheck size={24} />
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Security Advisory</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight opacity-80">Linking a node to a parent matrix converts the entity into a subspace staff member. This action grants shared resource access.</p>
                 </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 ml-2">Target Host Node (Parent)</label>
                <select 
                  className="w-full px-8 py-6 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-[2rem] border-none outline-none font-bold text-sm focus:ring-4 focus:ring-brand-primary/10 transition-all appearance-none"
                  value={targetParentId}
                  onChange={e => setTargetParentId(e.target.value)}
                >
                  <option value="">SCANNING ACTIVE HOSTS...</option>
                  {admins.filter(a => a.id !== linkingId).map(a => (
                    <option key={a.id} value={a.id}>{a.companyName} (Auth: {a.name})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                <button 
                   onClick={() => setLinkingId(null)} 
                   className="px-10 py-6 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-rose-500 transition-colors leading-none"
                >
                   Abort Sync
                </button>
                <button 
                   onClick={() => handleLink(linkingId)} 
                   className="flex-1 py-6 bg-brand-primary text-white font-bold rounded-[2.5rem] shadow-neo-brand transition-all active:scale-95 uppercase text-[11px] tracking-widest translate-y-0 hover:-translate-y-1 shadow-xl shadow-brand-primary/20"
                >
                   Finalize Neural Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
