import React, { useState } from 'react';
import { CrmPipelineRecord, CrmDealRecord } from '../../repositories/interfaces/ICrmRepository';
import { DollarSign, Calendar, Clock, Plus } from 'lucide-react';
import { CrmDealDrawer } from './CrmDealDrawer';

interface CrmPipelineTabProps {
    pipelines: CrmPipelineRecord[];
    activePipelineId: string | null;
    setActivePipelineId: (id: string) => void;
    deals: CrmDealRecord[];
    onStatusChange: (dealId: string, status: string) => Promise<void>;
}

export function CrmPipelineTab({ pipelines, activePipelineId, setActivePipelineId, deals, onStatusChange }: CrmPipelineTabProps) {
    const [selectedDeal, setSelectedDeal] = useState<CrmDealRecord | null>(null);

    if (pipelines.length === 0) return <div className="text-zinc-500 py-12 text-center text-sm">Nenhum funil configurado.</div>;
    const p = pipelines.find(pipe => pipe.id === activePipelineId) || pipelines[0];
    const stages = p.stages || [];

    return (
        <div className="flex flex-col h-full gap-4 mt-2">
            <div className="flex gap-2 bg-zinc-900 border border-zinc-800 p-1.5 rounded-full w-fit">
                {pipelines.map(pipe => (
                    <button 
                        key={pipe.id}
                        onClick={() => setActivePipelineId(pipe.id)}
                        className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs uppercase tracking-widest font-bold transition-all ${
                            activePipelineId === pipe.id ? 'bg-[#C59868] text-[#100C08] shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        {pipe.name}
                    </button>
                ))}
            </div>

            <div className="flex flex-1 gap-4 overflow-x-auto pb-4 custom-scrollbar items-start mt-4">
                {stages.map(stage => {
                    const stageDeals = deals.filter(d => d.stageId === stage.id);
                    return (
                    <div key={stage.id} className="min-w-[320px] w-[320px] flex flex-col shrink-0 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-zinc-800/60 bg-zinc-900/80 flex items-center justify-between">
                             <h3 className="font-heading font-medium text-zinc-100 flex items-center gap-2 text-sm uppercase tracking-wider">
                                 <div className="w-2 h-2 rounded-full bg-[#C59868] shadow-[0_0_8px_rgba(197,152,104,0.5)]"></div>
                                 {stage.name}
                             </h3>
                             <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
                                 {stageDeals.length}
                             </span>
                        </div>
                        
                        <div className="p-3 flex flex-col gap-3 min-h-[400px]">
                            {stageDeals.map(deal => {
                                let customData: any = {};
                                try { if (deal.customDataJson) customData = JSON.parse(deal.customDataJson); } catch (e) {}

                                return (
                                <div key={deal.id} onClick={() => setSelectedDeal(deal)} className="bg-zinc-950 border border-zinc-800/80 hover:border-[#C59868]/50 hover:shadow-[0_0_15px_rgba(197,152,104,0.05)] rounded-xl p-4 cursor-pointer transition-all group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-sm font-medium text-zinc-100 line-clamp-2 leading-tight group-hover:text-[#C59868] transition-colors">{deal.title}</div>
                                    </div>
                                    
                                    {deal.value > 0 && (
                                        <div className="text-sm font-mono font-bold text-[#C59868] mb-3 flex items-center gap-1">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(deal.value)}
                                        </div>
                                    )}
                                    
                                    {customData && Object.keys(customData).length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-4">
                                            {customData.eventDate && <span className="text-[9px] uppercase font-bold bg-[#C59868]/10 text-[#C59868] border border-[#C59868]/20 px-2 py-0.5 rounded flex items-center gap-1"><Calendar size={10} /> {new Date(customData.eventDate).toLocaleDateString()}</span>}
                                            {customData.flavor && <span className="text-[9px] uppercase font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded">Sab: {customData.flavor}</span>}
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 mt-auto">
                                         <span className={`text-[9px] uppercase tracking-widest px-2 py-1 rounded font-bold
                                             ${deal.status === 'open' ? 'bg-[#C59868]/10 text-[#C59868]' : deal.status === 'won' ? 'bg-[#528F65]/10 text-[#528F65]' : 'bg-[#AF4D4D]/10 text-[#AF4D4D]'}
                                         `}>
                                             {deal.status}
                                         </span>
                                         <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                                             {new Date(deal.createdAt).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}
                                         </span>
                                    </div>
                                </div>
                                );
                            })}
                            
                            {stageDeals.length === 0 && (
                                <div className="text-center text-zinc-600/50 font-medium text-xs py-12 border-2 border-dashed border-zinc-800/50 rounded-xl">
                                    Nenhum card na etapa
                                </div>
                            )}

                            <button className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#C59868]/70 hover:text-[#C59868] hover:bg-[#C59868]/10 py-3 rounded-lg transition-colors border border-dashed border-transparent hover:border-[#C59868]/30">
                                <Plus size={12} /> Novo Negócio
                            </button>
                        </div>
                    </div>
                )})}
            </div>
            {selectedDeal && (
                <CrmDealDrawer 
                    deal={selectedDeal} 
                    onClose={() => setSelectedDeal(null)} 
                    onStatusChange={onStatusChange}
                />
            )}
        </div>
    );
}
