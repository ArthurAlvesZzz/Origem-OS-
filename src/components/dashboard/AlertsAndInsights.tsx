import React from 'react';
import { AlertCircle, BrainCircuit, CheckCircle2, Clock, PackageX, FileText, Factory, ChevronRight } from 'lucide-react';
import { DashboardAlert, DashboardInsight } from '../../domain/types';

interface AlertsAndInsightsProps {
  alerts: DashboardAlert[];
  insights: DashboardInsight[];
  onNavigate: (page: string, data?: any) => void;
}

export function AlertsAndInsights({ alerts, insights, onNavigate }: AlertsAndInsightsProps) {
  return (
    <div className="space-y-6">
      {/* Alert Center */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-sm flex flex-col max-h-[400px]">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/30">
          <h3 className="font-heading font-semibold text-zinc-50 flex items-center gap-2"><AlertCircle size={16} className="text-red-500" /> Central de Alertas</h3>
          {alerts.length > 0 && <span className="bg-red-500 text-zinc-50 text-[10px] font-bold px-2 py-0.5 rounded-full">{alerts.length}</span>}
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-zinc-800/50">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center h-full">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-3 border border-emerald-500/20">
                <CheckCircle2 size={24} />
              </div>
              <p className="text-sm font-medium text-zinc-100">Operação nos Trilhos</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-[200px]">Sem alertas críticos. Bom trabalho.</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="p-4 bg-zinc-900 hover:bg-zinc-800/50 transition-colors group">
                <div className="flex gap-3 items-start">
                  <div className={`mt-0.5 p-1.5 rounded-md border shrink-0 ${
                    alert.severity === 'high' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    alert.severity === 'medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}>
                    {alert.type === 'consignacao_vencida' || alert.type === 'conta_vencida' || alert.type === 'crm_atraso' ? <Clock size={14} /> : null}
                    {alert.type === 'estoque_baixo' ? <PackageX size={14} /> : null}
                    {alert.type === 'outro' || alert.type === 'sistema' ? <FileText size={14} /> : null}
                    {alert.type === 'producao_aberta' ? <Factory size={14} /> : null}
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-zinc-100 group-hover:text-zinc-50 transition-colors">{alert.title}</p>
                    <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{alert.message}</p>
                    {alert.actionLabel && alert.actionPayload && (
                       <button onClick={() => onNavigate(alert.actionPayload!.page, alert.actionPayload)} className="mt-2 text-xs font-semibold text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-1 group/btn">
                          {alert.actionLabel}
                          <ChevronRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                       </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {alerts.length > 0 && (
           <div className="p-3 border-t border-zinc-800 bg-zinc-900 text-center">
              <button className="text-xs text-zinc-500 hover:text-zinc-300 font-medium transition-colors">Ver Todos</button>
           </div>
        )}
      </div>

      {/* Insight Engine */}
      <div className="space-y-4">
         <div className="flex items-center gap-2">
            <BrainCircuit size={16} className="text-amber-500" />
            <h3 className="font-heading font-semibold text-zinc-100">Motor de Insights</h3>
         </div>
         {insights.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
               <p className="text-xs text-zinc-500">Aguardando mais dados da operação para gerar insights.</p>
            </div>
         ) : (
            insights.map(insight => (
               <div key={insight.id} className="bg-gradient-to-br from-amber-500/5 to-transparent rounded-xl border border-amber-500/20 p-5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-amber-500/20 transition-all opacity-50"></div>
                  <div className="relative z-10 flex flex-col items-start h-full">
                     <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest mb-3 border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 rounded">Oportunidade</span>
                     <h4 className="text-[15px] font-semibold text-zinc-100 leading-snug">{insight.title}</h4>
                     <p className="text-xs text-zinc-400 mt-2 mb-3 leading-relaxed">{insight.description}</p>
                     
                     <div className="bg-black/20 rounded-md p-2.5 w-full mb-4 border border-white/5">
                        <div className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">Por que estamos sugerindo isso?</div>
                        <p className="text-xs text-zinc-300 italic">"{insight.evidence}"</p>
                     </div>
                     
                     <div className="mt-auto pt-2 flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
                        <div className="flex flex-col">
                           <span className="text-[10px] text-zinc-500 uppercase font-semibold">Impacto Esperado</span>
                           <span className="text-sm font-semibold text-emerald-400">{insight.expectedImpact}</span>
                        </div>
                        <button onClick={() => onNavigate(insight.actionPayload.page, insight.actionPayload)} className="text-xs font-semibold text-zinc-950 bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-lg transition-colors shadow-lg shadow-amber-500/20">
                           {insight.actionLabel}
                        </button>
                     </div>
                  </div>
               </div>
            ))
         )}
      </div>
    </div>
  );
}
