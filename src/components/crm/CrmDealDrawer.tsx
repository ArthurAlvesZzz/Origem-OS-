import React, { useState } from 'react';
import { X, Phone, Calendar, CheckCircle2, XCircle, Clock, Link as LinkIcon, Edit2, History } from 'lucide-react';
import { Button } from '../ui/Button';

interface CrmDealDrawerProps {
    deal: any; // We can type it properly, but CrmDealRecord can come from ICrmRepository
    onClose: () => void;
    onStatusChange: (dealId: string, newStatus: string) => void;
}

export function CrmDealDrawer({ deal, onClose, onStatusChange }: CrmDealDrawerProps) {
    const [actionLoading, setActionLoading] = useState(false);

    if (!deal) return null;

    let customData: any = {};
    try { if (deal.customDataJson) customData = JSON.parse(deal.customDataJson); } catch (e) {}

    const handleAction = (status: string) => {
        setActionLoading(true);
        setTimeout(() => {
            onStatusChange(deal.id, status);
            setActionLoading(false);
            onClose();
        }, 500);
    };

    const handleWhatsApp = () => {
        const phone = customData.phone || "5511999999999";
        window.open(`https://wa.me/${phone}?text=Olá, estou entrando em contato referente à ${deal.title}.`, '_blank');
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-[#100C08] border-l border-zinc-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/50">
                    <h2 className="font-heading font-medium text-zinc-100 flex items-center gap-2">
                         Detalhes do Negócio
                    </h2>
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-100 bg-zinc-900 rounded-full">
                        <X size={16} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    {/* Header Info */}
                    <div>
                        <div className="flex justify-between items-start mb-2">
                             <h3 className="text-xl font-heading font-medium text-zinc-100">{deal.title}</h3>
                             <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-sm
                                ${deal.status === 'open' ? 'bg-[#C59868]/10 text-[#C59868]' : deal.status === 'won' ? 'bg-[#528F65]/10 text-[#528F65]' : 'bg-[#AF4D4D]/10 text-[#AF4D4D]'}`}>
                                {deal.status}
                             </span>
                        </div>
                        <div className="text-2xl font-mono font-medium text-[#C59868] mb-4">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.value)}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-3 pb-6 border-b border-zinc-900">
                        <Button variant="outline" className="w-full text-xs font-mono tracking-widest uppercase py-3 border-[#C59868]/30 hover:border-[#C59868]/80 text-[#C59868] flex items-center gap-2" onClick={handleWhatsApp}>
                            <Phone size={14} /> WhatsApp
                        </Button>
                        <Button variant="outline" className="w-full text-xs font-mono tracking-widest uppercase py-3 flex items-center gap-2 border-zinc-800 text-zinc-500 cursor-not-allowed hover:bg-transparent" title="Disponível com integração API">
                            <Calendar size={14} /> Agendar
                        </Button>
                    </div>

                    {/* Details section */}
                    <div className="space-y-4">
                         <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                             <Edit2 size={12} /> Informações Adicionais
                         </h4>
                         <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
                             <div className="flex justify-between items-center text-sm">
                                 <span className="text-zinc-500">Cliente ID</span>
                                 <span className="text-zinc-300 font-mono">{deal.customerId || 'Não vinculado'}</span>
                             </div>
                             <div className="flex justify-between items-center text-sm">
                                 <span className="text-zinc-500">Criado em</span>
                                 <span className="text-zinc-300 font-mono">{new Date(deal.createdAt).toLocaleDateString()}</span>
                             </div>
                             {customData && Object.keys(customData).map(key => (
                                <div key={key} className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-500 capitalize">{key}</span>
                                    <span className="text-zinc-300">{customData[key]}</span>
                                </div>
                             ))}
                         </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-4">
                        <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                             <History size={12} /> Timeline
                        </h4>
                        <div className="border-l border-zinc-800 ml-2 pl-4 space-y-6 relative">
                            <div className="relative">
                                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#C59868]"></span>
                                <p className="text-sm text-zinc-200">Negócio criado</p>
                                <p className="text-[10px] text-zinc-500 mt-1">{new Date(deal.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="relative">
                                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-700 border-2 border-[#100C08]"></span>
                                <p className="text-sm text-zinc-200">Próximo: Follow-up agendado</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-zinc-950/80 border-t border-zinc-800 p-6">
                    <div className="flex gap-3">
                        {deal.status !== 'won' && (
                            <Button 
                                className="flex-1 bg-[#528F65] hover:bg-[#528F65]/80 text-[#100C08] font-bold text-xs uppercase tracking-widest py-3 flex items-center gap-2 justify-center"
                                disabled={actionLoading}
                                onClick={() => handleAction('won')}
                            >
                                <CheckCircle2 size={16} /> Ganho
                            </Button>
                        )}
                        {deal.status !== 'lost' && (
                            <Button 
                                variant="outline"
                                className="flex-1 text-[#AF4D4D] border-[#AF4D4D]/30 hover:bg-[#AF4D4D]/10 font-bold text-xs uppercase tracking-widest py-3 flex items-center gap-2 justify-center"
                                disabled={actionLoading}
                                onClick={() => handleAction('lost')}
                            >
                                <XCircle size={16} /> Perdido
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
