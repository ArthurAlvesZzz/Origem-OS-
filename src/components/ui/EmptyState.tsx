import { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex flex-col items-center justify-center p-12 text-center bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl", className)}
    >
      <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-5 shadow-[0_0_15px_rgba(197,152,104,0.1)]">
        {icon}
      </div>
      <h3 className="text-zinc-50 font-heading font-medium text-lg mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 mb-6 max-w-sm leading-relaxed">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  );
}
