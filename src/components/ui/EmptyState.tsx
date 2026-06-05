import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl">
      <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-500 mb-4">
        {icon}
      </div>
      <h3 className="text-zinc-100 font-medium mb-1">{title}</h3>
      <p className="text-sm text-zinc-400 mb-6 max-w-sm">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
