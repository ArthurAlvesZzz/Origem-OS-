import React, { useState } from 'react';
import { Phone, Calendar, CheckCircle2, XCircle, Clock, Link as LinkIcon, Edit2, History, Briefcase } from 'lucide-react';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { useToast } from '../ui/Toast';
import { useConfirm } from '../ui/ConfirmDialog';

interface CrmDealDrawerProps {
    deal: any; // We can type it properly, but CrmDealRecord can come from ICrmRepository
    onClose: () => void;
    onStatusChange: (dealId: string, newStatus: string) => Promise<void>;
}

export function CrmDealDrawer({ deal, onClose, onStatusChange }: CrmDealDrawerProps) {
    const [actionLoading, setActionLoading] = useState(false);
    const { success, error } = useToast();
    const { confirm } = useConfirm();

    // Render early return correctly keeping Hooks above
    if (!deal) return null;

    let customData: any = {};
    try { if (deal.customDataJson) customData = JSON.parse(deal.customDataJson); } catch (e) {}

    const handleAction = async (status: string) => {
        if (status === 'lost') {
            const proceed = await confirm({
                title: 'Marcar como Perdido',
                description: 'Tem certeza que deseja marcar este negócio como perdido? Essa ação encerrará o ciclo.',
                confirmText: 'Sim, Marcar como Perdido',
                isDestructive: true
            });
            if (!proceed) return;
        }

        setActionLoading(true);
        try {
            await onStatusChange(deal.id, status);
            success('Status do negócio atualizado com sucesso.');
            onClose();
        } catch (err: any) {
            error(err.message || 'Falha ao atualizar status do negócio.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleWhatsApp = () => {
        const phone = customData.phone || deal.customer?.phone;
        if (!phone) {
            error('Número de telefone não encontrado.');
            return;
        }
        window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=Olá, estou entrando em contato referente à ${deal.title}.`, '_blank');
    };

    return (
        <Drawer
            isOpen={true}
            onClose={onClose}
            title="Detalhes do Negócio"
            icon={<Briefcase size={20} />}
            size="md"
            footer={
                <div className="flex w-full gap-3">
                    {deal.status !== 'won' && (
                        <Button 
                            className="flex-1 text-[13px]"
                            variant="primary"
                            disabled={actionLoading}
                            isLoading={actionLoading && deal.status === 'won'}
                            onClick={() => handleAction('won')}
                        >
                            <CheckCircle2 size={16} /> Ganho
                        </Button>
                    )}
                    {deal.status !== 'lost' && (
                        <Button 
                            variant="danger"
                            className="flex-1 text-[13px]"
                            disabled={actionLoading}
                            isLoading={actionLoading && deal.status === 'lost'}
                            onClick={() => handleAction('lost')}
                        >
                            <XCircle size={16} /> Perdido
                        </Button>
                    )}
                </div>
            }
        >
            <div className="space-y-6">
                {/* Header Info */}
                <div>
                    <div className="flex justify-between items-start mb-2">
                         <h3 className="text-xl font-heading font-medium text-zinc-100">{deal.title}</h3>
                         <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-sm
                            ${deal.status === 'open' ? 'bg-amber-500/10 text-amber-500' : deal.status === 'won' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            {deal.status}
                         </span>
                    </div>
                    <div className="text-2xl font-mono font-medium text-amber-500 mb-4">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.value)}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3 pb-6 border-b border-zinc-900">
                    <Button variant="explore" className="w-full text-xs" onClick={handleWhatsApp}>
                        <Phone size={14} /> WhatsApp
                    </Button>
                    <Button variant="outline" className="w-full text-xs" title="Disponível com integração API" disabled>
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
                            <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                            <p className="text-sm text-zinc-200">Negócio criado</p>
                            <p className="text-[10px] text-zinc-500 mt-1">{new Date(deal.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="relative">
                            <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-700 border-2 border-zinc-950"></span>
                            <p className="text-sm text-zinc-200">Próximo: Follow-up agendado</p>
                        </div>
                    </div>
                </div>
            </div>
        </Drawer>
    );
}
