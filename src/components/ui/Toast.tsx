import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toast: (payload: Omit<Toast, 'id'>) => void;
  success: (message: string, action?: Toast['action']) => void;
  error: (message: string, action?: Toast['action']) => void;
  info: (message: string, action?: Toast['action']) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (payload: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...payload, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider
      value={{
        toast: addToast,
        success: (msg, action) => addToast({ type: 'success', message: msg, action }),
        error: (msg, action) => addToast({ type: 'error', message: msg, action }),
        info: (msg, action) => addToast({ type: 'info', message: msg, action }),
      }}
    >
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose, isHovered]);

  const icons = {
    success: <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />,
    error: <AlertCircle size={20} className="text-red-500 flex-shrink-0" />,
    info: <Info size={20} className="text-blue-500 flex-shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500/30',
    error: 'border-red-500/30',
    info: 'border-blue-500/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative flex items-center gap-3 px-4 py-3 bg-zinc-900 border rounded-2xl shadow-xl pointer-events-auto overflow-hidden group min-w-[320px] max-w-sm",
        borders[toast.type]
      )}
    >
      {icons[toast.type]}
      <p className="text-sm font-medium text-zinc-100 flex-1">{toast.message}</p>
      
      {toast.action && (
        <button
          onClick={() => {
            toast.action!.onClick();
            onClose();
          }}
          className="text-xs font-semibold px-2 border-l border-zinc-800 hover:text-amber-500 transition-colors"
        >
          {toast.action.label}
        </button>
      )}

      <button 
        onClick={onClose} 
        className="text-zinc-500 hover:text-zinc-300 transition-opacity"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
