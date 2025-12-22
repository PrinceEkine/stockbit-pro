
import React from 'react';
import { AppNotification } from '../types';
import { Bell, X, AlertTriangle, ShoppingCart, Info, Check } from 'lucide-react';

interface NotificationPanelProps {
  notifications: AppNotification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onClear: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onClose, onMarkRead, onClear }) => {
  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'low_stock': return <AlertTriangle className="text-amber-500" size={16} />;
      case 'sale': return <ShoppingCart className="text-emerald-500" size={16} />;
      default: return <Info className="text-indigo-500" size={16} />;
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden flex flex-col max-h-[500px] animate-in slide-in-from-top-2">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Bell size={18} /> Notifications
        </h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={onClear}
            className="text-xs text-indigo-600 font-semibold hover:text-indigo-700"
            data-tooltip="Remove all history"
          >
            Clear All
          </button>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600" data-tooltip="Close panel">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Bell size={32} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">No new notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {notifications.map((note) => (
              <div 
                key={note.id} 
                className={`p-4 flex gap-3 hover:bg-slate-50 transition-colors relative group cursor-pointer ${!note.read ? 'bg-indigo-50/30' : ''}`}
                onClick={() => onMarkRead(note.id)}
                data-tooltip={note.read ? "Notification read" : "Mark as read"}
              >
                <div className="mt-1 shrink-0">{getIcon(note.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`text-sm font-bold truncate ${!note.read ? 'text-slate-900' : 'text-slate-600'}`}>
                      {note.title}
                    </p>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(note.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {note.message}
                  </p>
                </div>
                {!note.read && (
                  <div className="w-2 h-2 rounded-full bg-indigo-600 absolute top-4 right-2 shadow-sm"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400">Recent alerts based on your inventory activity</p>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
