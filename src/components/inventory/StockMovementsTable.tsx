import { useState, useEffect } from 'react';
import { ArrowDownToLine, ArrowUpToLine, Settings2, Ban, History } from 'lucide-react';
import { MovementType, StockMovement } from '../../domain/types';
import { useRepositories } from '../../repositories/RepositoryProvider';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';

export function StockMovementsTable() {
  const { inventoryRepo } = useRepositories();
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);

  useEffect(() => {
    inventoryRepo.getMovements().then(setStockMovements);
  }, [inventoryRepo]);

  const getIconAndColor = (type: MovementType) => {
    switch (type) {
      case 'Entrada': return { Icon: ArrowDownToLine, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' };
      case 'Saída': return { Icon: ArrowUpToLine, color: 'text-sky-500', bg: 'bg-sky-500/10 border-sky-500/20' };
      case 'Perda': return { Icon: Ban, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' };
      case 'Ajuste': return { Icon: Settings2, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' };
      default: return { Icon: Settings2, color: 'text-zinc-500', bg: 'bg-zinc-800 border-zinc-700' };
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="text-xs uppercase bg-zinc-950/50 text-zinc-500 border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4 font-medium">Data</th>
              <th className="px-6 py-4 font-medium">Tipo</th>
              <th className="px-6 py-4 font-medium">Produto</th>
              <th className="px-6 py-4 font-medium text-right">Qtd</th>
              <th className="px-6 py-4 font-medium">Motivo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {stockMovements.slice(0, 50).map((m) => {
              const { Icon, color, bg } = getIconAndColor(m.type);
              return (
                <tr key={m.id} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-zinc-400 font-mono text-xs uppercase tracking-wider">{new Date(m.date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 border rounded text-[10px] uppercase font-bold tracking-wider ${bg} ${color}`}>
                      <Icon size={12} />
                      {m.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-100 group-hover:text-amber-500 transition-colors">{m.product}</td>
                  <td className={`px-6 py-4 text-right font-medium tabular-nums ${m.qty > 0 ? 'text-emerald-500' : m.qty < 0 ? 'text-red-500' : 'text-zinc-500'}`}>
                    {m.qty > 0 ? '+' : ''}{m.qty}
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-xs">{m.reason}</td>
                </tr>
              );
            })}
            
            {stockMovements.length === 0 && (
              <tr>
                <td colSpan={5} className="p-0">
                  <EmptyState
                    icon={<History size={24} />}
                    title="Nenhuma movimentação"
                    description="O histórico de entradas, saídas e perdas aparecerá aqui."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
