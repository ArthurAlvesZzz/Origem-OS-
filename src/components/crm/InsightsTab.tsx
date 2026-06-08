import { useState } from 'react';
import { useRepositories } from '../../repositories/RepositoryProvider';
import { useToast } from '../../components/ui/Toast';

export function InsightsTab() {
  const { success, error: toastError, info } = useToast();
  const { crmRepo } = useRepositories();
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [customerId, setCustomerId] = useState('');

  async function handleRecalculate() {
    setLoading(true);
    await crmRepo.recalculateCustomerScores();
    setLoading(false);
    success('Reprocessamento em lote concluído.');
  }

  async function loadInsight() {
    if(!customerId) return;
    setLoading(true);
    const data = await crmRepo.getCustomerInsights(customerId);
    setInsight(data);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex justify-between items-center">
         <div>
            <h2 className="text-lg font-medium text-zinc-100">Score & Recompra (Motor)</h2>
            <p className="text-sm text-zinc-400">Motor de análise de frequência e risco de churn.</p>
         </div>
         <button onClick={handleRecalculate} disabled={loading} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2 font-medium text-sm rounded transition-colors disabled:opacity-50">
            {loading ? 'Processando...' : 'Recalcular Base'}
         </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-4">
         <h3 className="font-medium text-zinc-100">Consultar Insight Individual</h3>
         <div className="flex gap-2">
           <input 
              className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 flex-1" 
              placeholder="Digite o ID do cliente (ex: test_123)"
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
           />
           <button onClick={loadInsight} disabled={loading || !customerId} className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-medium px-4 py-2 text-sm rounded disabled:opacity-50 transition-colors">
              Analisar
           </button>
         </div>

         {insight && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
               <div className="p-4 bg-zinc-950 border border-zinc-800 rounded">
                 <div className="text-xs text-zinc-500 uppercase font-medium mb-1">Risco de Churn</div>
                 <div className={`text-xl font-medium ${insight.riskOfChurn ? 'text-red-500' : 'text-emerald-500'}`}>{insight.riskOfChurn ? 'ALTO' : 'BAIXO'}</div>
               </div>
               <div className="p-4 bg-zinc-950 border border-zinc-800 rounded">
                 <div className="text-xs text-zinc-500 uppercase font-medium mb-1">Frequência (Dias)</div>
                 <div className="text-xl font-medium text-zinc-100">{insight.purchaseFrequency > 0 ? insight.purchaseFrequency.toFixed(1) : '-'}</div>
               </div>
               <div className="p-4 bg-zinc-950 border border-zinc-800 rounded">
                 <div className="text-xs text-zinc-500 uppercase font-medium mb-1">Pedidos Ativos</div>
                 <div className="text-xl font-medium text-zinc-100">{insight.orderCount}</div>
               </div>
               <div className="p-4 bg-zinc-950 border border-zinc-800 rounded">
                 <div className="text-xs text-zinc-500 uppercase font-medium mb-1">NPS</div>
                 <div className="text-xl font-medium text-zinc-100">{insight.npsScore || 'N/A'}</div>
               </div>
            </div>
         )}
      </div>
    </div>
  )
}
