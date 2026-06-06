import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h2 className="text-2xl md:text-3xl font-heading font-semibold text-zinc-50 tracking-tight">{title}</h2>
        {description && <p className="text-sm text-zinc-400 mt-1.5 max-w-xl leading-relaxed">{description}</p>}
      </div>
      {action && (
        <div className="flex-shrink-0 flex items-center gap-3">
          {action}
        </div>
      )}
    </div>
  );
}
