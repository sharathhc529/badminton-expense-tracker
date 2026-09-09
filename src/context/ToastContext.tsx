import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, FileSpreadsheet } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'sheets_sync';
  title: string;
  description?: string;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
    const newToast: ToastMessage = { ...toast, id };
    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss after 10 seconds (user can also close early via the X button)
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 10000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-sm w-full px-4 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start space-x-3 p-3.5 rounded-2xl shadow-2xl border transition-all duration-300 transform translate-y-0 backdrop-blur-md ${
              toast.type === 'sheets_sync'
                ? 'bg-slate-900/95 border-emerald-500/60 text-white shadow-emerald-500/20'
                : toast.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500 text-white shadow-emerald-500/20'
                : toast.type === 'error'
                ? 'bg-slate-900/95 border-rose-500 text-white shadow-rose-500/20'
                : 'bg-slate-900/95 border-slate-700 text-slate-200'
            }`}
          >
            <div className="p-1 rounded-lg shrink-0 mt-0.5">
              {toast.type === 'sheets_sync' ? (
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              ) : toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              ) : (
                <Info className="w-5 h-5 text-teal-400" />
              )}
            </div>

            <div className="flex-1 space-y-0.5 pr-2">
              <h4 className="text-xs font-bold text-white">{toast.title}</h4>
              {toast.description && <p className="text-[11px] text-slate-300">{toast.description}</p>}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
