import { useState, createContext, useContext, ReactNode, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<{ resolve: (value: boolean) => void } | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolver({ resolve });
    });
  }, []);

  const handleClose = (value: boolean) => {
    setIsOpen(false);
    if (resolver) {
      resolver.resolve(value);
      setResolver(null);
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {isOpen && options && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
              onClick={() => handleClose(false)}
            />
            <div className="fixed inset-0 z-[201] flex flex-col items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl w-full max-w-md pointer-events-auto"
              >
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${options.isDestructive ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                    <AlertTriangle size={24} />
                  </div>
                  <div className="flex-1 mt-1">
                    <h3 className="text-lg font-heading font-medium text-zinc-50">{options.title}</h3>
                    <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{options.description}</p>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-8">
                  <Button variant="ghost" onClick={() => handleClose(false)}>
                    {options.cancelText || 'Cancelar'}
                  </Button>
                  <Button 
                    variant={options.isDestructive ? 'danger' : 'primary'}
                    onClick={() => handleClose(true)}
                  >
                    {options.confirmText || 'Confirmar'}
                  </Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within ConfirmProvider');
  return context;
}
