
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
  Link as LinkIcon
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
    if (user.role === 'admin') return <span className="bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">System Root</span>;
    if (user.isSubscribed) return <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1"><CheckCircle2 size={10} /> Professional</span>;
    
    const start = new Date(user.trialStartDate);
    const now = new Date();
    const expiry = new Date(start);
    expiry.setDate(expiry.getDate() + 60);
    
    if (now > expiry) return <span className="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1"><XCircle size={10} /> Expired</span>;
    return <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1"><Clock size={10} /> Trial Mode</span>;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Admin Panel <ShieldCheck className="text-indigo-600" />
          </h1>
          <p className="text-slate-500">Manage business accounts and repair orphan user links.</p>
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by company or email..." 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="px-8 py-4">Business & Account</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Parent ID</th>
                <th className="px-8 py-4 text-right">Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg shadow-inner">
                        {user.companyName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{user.companyName}</p>
                        <span className="text-xs text-slate-400 flex items-center gap-1"><Mail size={10} /> {user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {getStatusBadge(user)}
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-mono text-slate-400">
                      {user.parentId || <span className="text-rose-400">ORPHAN</span>}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setLinkingId(user.id)}
                        className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 flex items-center gap-1"
                      >
                        <LinkIcon size={14} /> Link Parent
                      </button>
                      <button 
                        disabled={updatingId === user.id}
                        onClick={() => onUpdatePlan(user.id, user.isSubscribed ? 'revoke' : 'monthly')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${user.isSubscribed ? 'bg-rose-50 text-rose-600' : 'bg-emerald-600 text-white'}`}
                      >
                        {user.isSubscribed ? <XCircle size={14} /> : <Zap size={14} />}
                        {user.isSubscribed ? 'Revoke' : 'Approve'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {linkingId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-lg p-12 shadow-2xl border border-white/5 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">Link to Parent Business</h3>
            <p className="text-xs text-slate-400 mb-8 font-bold uppercase tracking-widest leading-relaxed">Assigning a Parent ID will convert this user into a Staff member and grant them access to the Parent's Inventory.</p>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">Target Business Owner</label>
                <select 
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl border-none outline-none font-bold text-sm"
                  value={targetParentId}
                  onChange={e => setTargetParentId(e.target.value)}
                >
                  <option value="">Select Business...</option>
                  {admins.filter(a => a.id !== linkingId).map(a => (
                    <option key={a.id} value={a.id}>{a.companyName} ({a.name})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setLinkingId(null)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px]">Abort</button>
                <button onClick={() => handleLink(linkingId)} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl shadow-indigo-600/20">Finalize Link</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
