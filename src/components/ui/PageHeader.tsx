import { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  breadcrumbs?: Breadcrumb[];
}

export function PageHeader({ title, description, action, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-xs font-medium text-zinc-500 mb-2">
            {breadcrumbs.map((crumb, idx) => (
              <div key={idx} className="flex items-center gap-1">
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-amber-500 transition-colors">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-zinc-300">{crumb.label}</span>
                )}
                {idx < breadcrumbs.length - 1 && <ChevronRight size={12} className="text-zinc-700" />}
              </div>
            ))}
          </nav>
        )}
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
