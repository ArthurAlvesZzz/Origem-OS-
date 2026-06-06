import { formatBRL } from '../../lib/format';
import { calculateOrderTotals } from '../../domain/orders';
import { OrderItem } from '../../domain/types';

interface SaleSummaryProps {
  items: OrderItem[];
}

export function SaleSummary({ items }: SaleSummaryProps) {
  const { subtotal, totalDiscount, total, marginPercent, margin } = calculateOrderTotals(items);

  return (
    <div className="bg-zinc-950 border border-zinc-800/80 shadow-inner rounded-xl p-6">
      
      <div className="space-y-4 text-sm">
        <div className="flex justify-between text-zinc-400">
          <span>Subtotal Itens</span>
          <span className="font-mono text-zinc-300">{formatBRL(subtotal)}</span>
        </div>
        
        {totalDiscount > 0 && (
          <div className="flex justify-between text-emerald-500">
            <span>(+) Descontos Aplicados</span>
            <span className="font-mono font-medium">- {formatBRL(totalDiscount)}</span>
          </div>
        )}
        
        <div className="pt-4 border-t border-zinc-800/80 flex justify-between items-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Total a Pagar</span>
          <span className="text-3xl font-heading font-semibold tracking-tight text-amber-500">
            {formatBRL(total)}
          </span>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-zinc-800/80 bg-zinc-900/50 -mx-6 -mb-6 p-6 rounded-b-xl flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1">Métricas Executivas</div>
          <div className="text-xs text-zinc-400">Lucro Estimado: <span className="font-medium font-mono text-zinc-300">{formatBRL(margin)}</span></div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1">Margem Operacional</div>
          <div className={`text-sm font-bold ${marginPercent >= 35 ? 'text-emerald-500' : marginPercent > 15 ? 'text-amber-500' : 'text-red-500'}`}>
            {marginPercent.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}
