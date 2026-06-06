import { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Card, CardContent } from './Card';

interface MetricCardProps {
  title: string;
  value: string | ReactNode;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
  className?: string;
}

export function MetricCard({ title, value, trend, trendUp, subtitle, className }: MetricCardProps) {
  return (
    <Card className={cn("p-5 flex flex-col justify-between group hover:border-amber-500/30 transition-colors", className)}>
      <div>
        <div className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">{title}</div>
        <div className="flex items-end justify-between">
          <div className="text-2xl lg:text-3xl font-heading font-semibold text-zinc-50 tracking-tight transition-transform group-hover:scale-[1.02] origin-left">{value}</div>
          {trend && (
            <div className={cn("text-xs font-bold px-2 py-1 rounded-md mb-1", trendUp ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20")}>
              {trendUp ? '↑' : '↓'} {trend}
            </div>
          )}
        </div>
      </div>
      {subtitle && (
        <div className="mt-4 pt-3 border-t border-zinc-800 text-[11px] font-medium text-zinc-500 uppercase tracking-widest">{subtitle}</div>
      )}
    </Card>
  );
}
