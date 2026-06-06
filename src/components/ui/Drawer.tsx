import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
  footer?: ReactNode;
}

const sizes = {
  sm: 'md:w-[440px]',
  md: 'md:w-[560px]',
  lg: 'md:w-[680px]',
  xl: 'md:w-[800px]',
};

export function Drawer({ isOpen, onClose, title, subtitle, icon, size = 'md', children, footer }: DrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = 'auto';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
            className={cn(
              "fixed inset-y-0 right-0 w-full bg-zinc-950 border-l border-zinc-800 shadow-2xl z-[101] flex flex-col",
              sizes[size]
            )}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                {icon && (
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(197,152,104,0.15)]">
                    {icon}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-heading font-medium text-zinc-50 tracking-tight">{title}</h2>
                  {subtitle && <p className="text-sm text-zinc-400 mt-0.5">{subtitle}</p>}
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="border-t border-zinc-800/50 bg-zinc-900/80 backdrop-blur-xl p-6 sticky bottom-0 z-20">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
