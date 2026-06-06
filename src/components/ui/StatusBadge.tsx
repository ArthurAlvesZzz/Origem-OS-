import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  className?: string;
}

export function StatusBadge({ status, variant = 'default', className }: StatusBadgeProps) {
  const variants = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    default: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  };

  const dots = {
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    error: 'bg-red-400',
    info: 'bg-blue-400',
    default: 'bg-zinc-400',
  };

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border", variants[variant], className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", dots[variant])} />
      {status}
    </span>
  );
}
