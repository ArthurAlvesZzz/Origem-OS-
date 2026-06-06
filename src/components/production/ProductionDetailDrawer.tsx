import { formatBRL } from '../../lib/format';
import { Beaker, Factory, FileText, ClipboardList } from 'lucide-react';
import { ProductionBatch } from '../../domain/types';
import { Drawer } from '../ui/Drawer';

interface ProductionDetailDrawerProps {
  onClose: () => void;
  batch: ProductionBatch;
}

export function ProductionDetailDrawer({ onClose, batch }: ProductionDetailDrawerProps) {
  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title="Ficha Técnica de Produção"
      icon={<ClipboardList size={20} />}
      subtitle={`${batch.code} • ${new Date(batch.date).toLocaleDateString('pt-BR')}`}
      size="md"
    >
      <div className="space-y-6">
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
           <div className="flex justify-between items-start mb-6">
              <div>
                 <div className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-1">Produto Final</div>
                 <div className="text-lg font-medium text-zinc-50">{batch.finalProductName}</div>
              </div>
              <div className="text-right">
                 <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Quantidade</div>
                 <div className="text-lg font-medium text-zinc-100">{batch.finalQty} un</div>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4 border-t border-zinc-800/50 pt-4">
              <div>
                 <div className="text-xs text-zinc-500 mb-1">Peso Inicial (Insumos)</div>
                 <div className="font-medium text-zinc-300">{batch.initialWeight} kg</div>
              </div>
              <div>
                 <div className="text-xs text-zinc-500 mb-1">Peso Final (Torrado)</div>
                 <div className="font-medium text-zinc-300">{batch.finalWeight} kg</div>
              </div>
              <div>
                 <div className="text-xs text-zinc-500 mb-1">Quebra / Perda</div>
                 <div className="font-medium text-red-400">{batch.lossPercent.toFixed(1)}%</div>
              </div>
              <div>
                 <div className="text-xs text-zinc-500 mb-1">Rendimento Volumétrico</div>
                 <div className="font-medium text-emerald-400">{batch.yieldPercent.toFixed(1)}%</div>
              </div>
           </div>
        </div>

        <div>
           <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Custos Diretos (CPV)</h3>
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <tbody className="divide-y divide-zinc-800">
                  {/* Insumos */}
                  <tr>
                    <td className="p-3 text-zinc-400 bg-zinc-900/50" colSpan={2}><Factory size={14} className="inline mr-2"/> Insumos</td>
                  </tr>
                  {batch.inputs.map(i => (
                    <tr key={i.productId}>
                      <td className="p-3 text-zinc-300 pl-8">{i.name} ({i.qty})</td>
                      <td className="p-3 text-right text-zinc-300">{formatBRL((i.qty * i.unitCost))}</td>
                    </tr>
                  ))}
                  {/* Extras */}
                  {batch.extraCosts.length > 0 && (
                    <tr>
                      <td className="p-3 text-zinc-400 bg-zinc-900/50" colSpan={2}><Beaker size={14} className="inline mr-2"/> Custos Extras</td>
                    </tr>
                  )}
                  {batch.extraCosts.map((e, idx) => (
                    <tr key={idx}>
                      <td className="p-3 text-zinc-300 pl-8">{e.description}</td>
                      <td className="p-3 text-right text-zinc-300">{formatBRL(e.amount)}</td>
                    </tr>
                  ))}
                  {/* Labor */}
                  <tr>
                    <td className="p-3 text-zinc-400 bg-zinc-900/50" colSpan={2}><FileText size={14} className="inline mr-2"/> Mão de Obra</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-zinc-300 pl-8">{batch.hours}h de trabalho</td>
                    <td className="p-3 text-right text-zinc-300">{formatBRL(batch.totalLaborCost)}</td>
                  </tr>
                </tbody>
                <tfoot className="bg-zinc-950 font-medium">
                  <tr>
                    <td className="p-3 text-zinc-400">Custo Total de Produção</td>
                    <td className="p-3 text-right text-amber-400">{formatBRL(batch.totalCost)}</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-emerald-400 font-semibold border-t border-zinc-800">Custo Unitário</td>
                    <td className="p-3 text-right text-emerald-400 font-semibold border-t border-zinc-800">{formatBRL(batch.unitCost)}</td>
                  </tr>
                </tfoot>
              </table>
           </div>
        </div>

        {batch.notes && (
           <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl text-sm">
              <strong>Observações:</strong> {batch.notes}
           </div>
        )}

      </div>
    </Drawer>
  );
}
