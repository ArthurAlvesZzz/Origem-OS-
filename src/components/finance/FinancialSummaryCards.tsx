import { useState, useEffect } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Briefcase } from 'lucide-react';
import { useRepositories } from '../../repositories/RepositoryProvider';
import { FinancialSummaryData } from '../../repositories/interfaces/IFinancialRepository';

export function FinancialSummaryCards({ refreshKey }: { refreshKey?: number }) {
  const { financialRepo } = useRepositories();
  const [summary, setSummary] = useState<FinancialSummaryData | null>(null);

  useEffect(() => {
    financialRepo.calculateFinancialSummary().then(setSummary);
  }, [financialRepo, refreshKey]);

  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/30 p-5 rounded-2xl relative overflow-hidden group transition-all">
         <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
         <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
               <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><DollarSign size={16} /></div>
               <span className="text-sm font-medium text-zinc-400">Caixa Atual</span>
            </div>
         </div>
         <div className="text-3xl font-heading font-semibold text-zinc-50 relative z-10 tracking-tight">R$ {summary.saldoEstimado.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
         <div className="text-xs font-medium text-emerald-500 mt-2 flex items-center gap-1 relative z-10"><TrendingUp size={12}/> Dinheiro Realizado</div>
      </div>
      
      <div className="bg-zinc-900 border border-zinc-800 hover:border-sky-500/30 p-5 rounded-2xl relative overflow-hidden group transition-all">
         <div className="absolute -right-4 -top-4 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl group-hover:bg-sky-500/20 transition-all"></div>
         <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
               <div className="p-2 bg-sky-500/10 text-sky-500 rounded-lg"><ArrowUpRight size={16} /></div>
               <span className="text-sm font-medium text-zinc-400">A Receber</span>
            </div>
         </div>
         <div className="text-3xl font-heading font-semibold text-zinc-50 relative z-10 tracking-tight">R$ {summary.receitaPendente.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
         <div className="text-xs font-medium text-sky-500 mt-2 flex items-center gap-1 relative z-10">Previsto Futuro</div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 hover:border-red-500/30 p-5 rounded-2xl relative overflow-hidden group transition-all">
         <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
         <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
               <div className="p-2 bg-red-500/10 text-red-500 rounded-lg"><ArrowDownRight size={16} /></div>
               <span className="text-sm font-medium text-zinc-400">Contas a Pagar</span>
            </div>
         </div>
         <div className="text-3xl font-heading font-semibold text-zinc-50 relative z-10 tracking-tight">R$ {summary.contasAPagar.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
         <div className="text-xs font-medium text-red-500 mt-2 flex items-center gap-1 relative z-10"><TrendingDown size={12} /> Comprometido</div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700/50 p-5 rounded-2xl relative overflow-hidden group transition-all">
         <div className="absolute -right-4 -top-4 w-24 h-24 bg-zinc-700/10 rounded-full blur-2xl group-hover:bg-zinc-700/20 transition-all"></div>
         <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
               <div className="p-2 bg-zinc-800 text-zinc-400 rounded-lg"><Briefcase size={16} /></div>
               <span className="text-sm font-medium text-zinc-400">Total Despesas Pagas</span>
            </div>
         </div>
         <div className="text-3xl font-heading font-semibold text-zinc-50 relative z-10 tracking-tight">R$ {summary.despesasPagas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
         <div className="text-xs font-medium text-zinc-500 mt-2 flex items-center gap-1 relative z-10">Acumulado Mes</div>
      </div>
    </div>
  );
}
