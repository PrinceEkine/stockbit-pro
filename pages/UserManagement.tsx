
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
import { getTrialStatus } from '../store';
import { useToast } from '../components/ui/Toast';

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
  const toast = useToast();

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
      toast.error('Could not link account', err.message);
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.role === 'admin') return (
      <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/10 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
         <ShieldCheck size={12} /> Administrator
      </div>
    );
    if (user.isSubscribed) return (
      <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-900/10 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-800">
         <CheckCircle2 size={12} /> Active Pro
      </div>
    );
    
    // Use the canonical trial logic so this badge matches the actual access enforced app-wide.
    const { isExpired } = getTrialStatus(user);

    if (isExpired) return (
      <div className="flex items-center gap-2 text-[10px] font-bold text-rose-600 uppercase tracking-wider bg-rose-50 dark:bg-rose-900/10 px-2.5 py-1 rounded-full border border-rose-100 dark:border-rose-800">
         <XCircle size={12} /> Expired Trial
      </div>
    );
    return (
      <div className="flex items-center gap-2 text-[10px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50 dark:bg-amber-900/10 px-2.5 py-1 rounded-full border border-amber-100 dark:border-amber-800">
         <Clock size={12} /> Free Trial
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-32 max-w-full">
       <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print px-4 md:px-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Account Management</h2>
          <p className="text-sm text-slate-500">Manage business accounts, parent-child links, and subscriptions.</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm">
           <div className="px-4 py-1 border-r border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Accounts</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white uppercase">{users.length}</p>
           </div>
           <div className="px-4 py-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System State</p>
              <p className="text-sm font-bold text-emerald-500 uppercase flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Stable
              </p>
           </div>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mx-4 md:mx-0">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search accounts by company, email, or ID..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm placeholder:text-slate-400 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mx-4 md:mx-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4">Account Details</th>
                <th className="px-6 py-4">Subscription Status</th>
                <th className="px-6 py-4">Parent Account</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center font-bold text-sm">
                        {user.companyName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{user.companyName}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(user)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <LinkIcon size={12} className={user.parentId ? 'text-indigo-500' : 'text-slate-200'} />
                       <span className={`text-[10px] font-mono ${user.parentId ? 'text-slate-600 dark:text-slate-400 font-bold' : 'text-slate-300 italic'}`}>
                        {user.parentId || 'Unlinked'}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => setLinkingId(user.id)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                        title="Link Parent Account"
                      >
                        <LinkIcon size={16} />
                      </button>
                      <button 
                        disabled={updatingId === user.id}
                        onClick={() => onUpdatePlan(user.id, user.isSubscribed ? 'revoke' : 'monthly')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 flex items-center gap-2 ${user.isSubscribed ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                      >
                        {user.isSubscribed ? <ShieldAlert size={14} /> : <CheckCircle2 size={14} />}
                        {user.isSubscribed ? 'Revoke Pro' : 'Approve Pro'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                 <tr>
                    <td colSpan={4} className="py-20 text-center">
                       <p className="text-sm text-slate-400">No accounts found matching your search</p>
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {linkingId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Account Linking</h3>
                <p className="text-xs text-slate-500 mt-0.5">Assign parent account to this entity</p>
              </div>
              <button 
                onClick={() => setLinkingId(null)} 
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800 flex gap-4">
                 <ShieldCheck size={20} className="text-indigo-600 shrink-0" />
                 <p className="text-xs text-indigo-900 dark:text-indigo-300 leading-relaxed font-medium">Linking an account to a parent converts them into a staff member. This grants them access to shared inventory and resources.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Select Parent Account</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  value={targetParentId}
                  onChange={e => setTargetParentId(e.target.value)}
                >
                  <option value="">Select a host account...</option>
                  {admins.filter(a => a.id !== linkingId).map(a => (
                    <option key={a.id} value={a.id}>{a.companyName} ({a.name})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                   onClick={() => setLinkingId(null)} 
                   className="flex-1 px-4 py-2.5 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                   Cancel
                </button>
                <button 
                   onClick={() => handleLink(linkingId)} 
                   className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 text-sm"
                >
                   Confirm Link
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
