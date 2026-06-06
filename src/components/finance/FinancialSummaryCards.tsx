import { formatBRL } from '../../lib/format';
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      <div className="bg-zinc-950 border border-zinc-800/80 hover:border-emerald-500/30 p-6 rounded-xl relative overflow-hidden group transition-all duration-300 shadow-sm">
         <div className="absolute -right-4 -top-4 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500"></div>
         <div className="flex items-center justify-between mb-5 relative z-10">
            <div className="flex items-center gap-2.5">
               <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg shadow-sm"><DollarSign size={18} /></div>
               <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Caixa Atual</span>
            </div>
         </div>
         <div className="text-3xl font-heading font-semibold text-zinc-50 relative z-10 tracking-tight">{formatBRL(summary.saldoEstimado)}</div>
         <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 mt-3 flex items-center gap-1.5 relative z-10"><TrendingUp size={14}/> Dinheiro Realizado</div>
      </div>
      
      <div className="bg-zinc-950 border border-zinc-800/80 hover:border-sky-500/30 p-6 rounded-xl relative overflow-hidden group transition-all duration-300 shadow-sm">
         <div className="absolute -right-4 -top-4 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-all duration-500"></div>
         <div className="flex items-center justify-between mb-5 relative z-10">
            <div className="flex items-center gap-2.5">
               <div className="p-2 bg-sky-500/10 border border-sky-500/20 text-sky-500 rounded-lg shadow-sm"><ArrowUpRight size={18} /></div>
               <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">A Receber</span>
            </div>
         </div>
         <div className="text-3xl font-heading font-semibold text-zinc-50 relative z-10 tracking-tight">{formatBRL(summary.receitaPendente)}</div>
         <div className="text-[11px] font-bold uppercase tracking-wider text-sky-500 mt-3 flex items-center gap-1.5 relative z-10">Previsto Futuro</div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800/80 hover:border-red-500/30 p-6 rounded-xl relative overflow-hidden group transition-all duration-300 shadow-sm">
         <div className="absolute -right-4 -top-4 w-32 h-32 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-all duration-500"></div>
         <div className="flex items-center justify-between mb-5 relative z-10">
            <div className="flex items-center gap-2.5">
               <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg shadow-sm"><ArrowDownRight size={18} /></div>
               <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Contas a Pagar</span>
            </div>
         </div>
         <div className="text-3xl font-heading font-semibold text-zinc-50 relative z-10 tracking-tight">{formatBRL(summary.contasAPagar)}</div>
         <div className="text-[11px] font-bold uppercase tracking-wider text-red-500 mt-3 flex items-center gap-1.5 relative z-10"><TrendingDown size={14} /> Comprometido</div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800/80 hover:border-amber-500/30 p-6 rounded-xl relative overflow-hidden group transition-all duration-300 shadow-sm">
         <div className="absolute -right-4 -top-4 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-500"></div>
         <div className="flex items-center justify-between mb-5 relative z-10">
            <div className="flex items-center gap-2.5">
               <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg shadow-sm"><Briefcase size={18} /></div>
               <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Despesas</span>
            </div>
         </div>
         <div className="text-3xl font-heading font-semibold text-zinc-50 relative z-10 tracking-tight">{formatBRL(summary.despesasPagas)}</div>
         <div className="text-[11px] font-bold uppercase tracking-wider text-amber-500 mt-3 flex items-center gap-1.5 relative z-10">Acumulado Mes</div>
      </div>
    </div>
  );
}
