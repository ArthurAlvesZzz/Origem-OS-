import { formatBRL } from '../../lib/format';
import { Trash2, Minus, Plus } from 'lucide-react';
import { OrderItem } from '../../domain/types';

interface SaleCartProps {
  items: OrderItem[];
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
}

export function SaleCart({ items, onUpdateQty, onRemoveItem }: SaleCartProps) {
  if (items.length === 0) {
    return (
      <div className="py-12 bg-zinc-950/50 border border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center space-y-2">
        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 mb-2">
          <Trash2 size={18} />
        </div>
        <p className="text-sm font-medium text-zinc-400">O carrinho está vazio</p>
        <p className="text-xs text-zinc-500 max-w-[200px] text-center">Pesquise e selecione produtos acima para inclui-los na venda.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map(item => (
        <li key={item.productId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-zinc-950 border border-zinc-800/80 hover:border-amber-500/30 transition-colors rounded-xl group animate-in slide-in-from-left-2 duration-300">
          <div className="flex-1">
            <div className="font-medium text-sm text-zinc-100 group-hover:text-amber-500 transition-colors">{item.name}</div>
            <div className="text-xs font-mono text-zinc-500 mt-1">{formatBRL(item.unitPrice)} cada</div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto">
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
              <button 
                onClick={() => onUpdateQty(item.productId, -1)}
                className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 rounded-md transition-colors"
                title="Diminuir quantidade"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center text-sm font-medium font-mono focus:outline-none bg-transparent tabular-nums text-zinc-100">
                {item.qty}
              </span>
              <button 
                onClick={() => onUpdateQty(item.productId, 1)}
                className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 rounded-md transition-colors"
                title="Aumentar quantidade"
              >
                <Plus size={14} />
              </button>
            </div>
            
            <div className="flex items-center gap-5">
              <div className="text-sm font-semibold font-mono text-zinc-100 w-24 text-right">
                {formatBRL((item.qty * item.unitPrice))}
              </div>
              <button 
                onClick={() => onRemoveItem(item.productId)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                title="Remover item"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
