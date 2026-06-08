import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SpinnerProps {
  size?: number;
  className?: string;
  color?: string;
}

export function Spinner({ size = 24, className, color = "text-amber-500" }: SpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center inline-flex", className)} role="status" aria-label="Carregando...">
      <Loader2 size={size} className={cn("animate-spin", color)} />
      <span className="sr-only">Carregando...</span>
    </div>
  );
}
