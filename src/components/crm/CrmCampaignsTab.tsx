import React, { useState, useEffect } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { CrmCampaignRecord } from '../../repositories/interfaces/ICrmRepository';
import { ICrmRepository } from '../../repositories/interfaces/ICrmRepository';
import { Button } from '../ui/Button';
import { useConfirm } from '../ui/ConfirmDialog';
import { useToast } from '../ui/Toast';

interface CrmCampaignsTabProps {
    crmRepo: ICrmRepository;
}

export function CrmCampaignsTab({ crmRepo }: CrmCampaignsTabProps) {
    const [campaigns, setCampaigns] = useState<CrmCampaignRecord[]>([]);
    const [newCampaignName, setNewCampaignName] = useState('');
    const { confirm } = useConfirm();
    const { success, error } = useToast();

    const loadData = async () => {
        const c = await crmRepo.getCampaigns();
        setCampaigns(c);
    };

    useEffect(() => {
        loadData();
    }, [crmRepo]);
    
    const handleLaunchCampaign = async (id: string, currentStatus: string) => {
        if (currentStatus !== 'draft') return;
        const proceed = await confirm({
            title: 'Iniciar Campanha',
            description: 'Deseja iniciar o disparo desta campanha para todos os clientes com opt-in?',
            confirmText: 'Sim, Iniciar'
        });
        if (!proceed) return;
        try {
            await crmRepo.launchCampaign(id);
            success("Campanha iniciada. As mensagens foram enviadas para a fila.");
            loadData();
        } catch(e) {
            error("Erro ao iniciar campanha");
        }
    };
    
    const handleCreateCampaign = async () => {
        if (!newCampaignName) return;
        try {
            await crmRepo.createCampaign({ name: newCampaignName, channel: 'whatsapp' });
            setNewCampaignName('');
            success('Campanha criada com sucesso');
            loadData();
        } catch(e) {
            error("Erro ao criar campanha");
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-[#100C08] border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
                <input 
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 flex-1 focus:border-[#C59868] outline-none transition-colors" 
                    placeholder="Nome da nova campanha (ex: Assinantes Nov/25)..." 
                    value={newCampaignName}
                    onChange={e => setNewCampaignName(e.target.value)}
                />
                <Button onClick={handleCreateCampaign} className="bg-[#C59868] hover:bg-[#b08558] text-[#100C08] px-6 font-bold uppercase tracking-widest text-[10px]">
                    Criar Campanha
                </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map(c => (
                    <div key={c.id} className="bg-[#100C08] border border-zinc-800 rounded-xl p-5 shadow-sm hover:border-[#C59868]/30 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                             <h3 className="font-heading font-medium text-zinc-100">{c.name}</h3>
                             <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-sm tracking-widest ${c.status === 'completed' ? 'bg-[#528F65]/10 text-[#528F65]' : 'bg-[#C59868]/10 text-[#C59868]'}`}>{c.status}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-6">
                             <MessageSquare size={12} className="text-[#C59868]"/> {c.channel.replace('whatsapp_', 'Whatsapp ')}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mb-6 bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/50">
                             <div className="text-center border-r border-zinc-800/50">
                                 <div className="text-xl font-mono text-zinc-300">{c.sentCount}</div>
                                 <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Enviadas</div>
                             </div>
                             <div className="text-center">
                                 <div className="text-xl font-mono text-[#528F65]">{c.deliveredCount}</div>
                                 <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Entregues</div>
                             </div>
                        </div>
                        
                        <div className="flex justify-between gap-3 pt-4 border-t border-zinc-800/50">
                             <button disabled title="Disponível com integração API" className="px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-zinc-400 bg-zinc-900 border border-transparent rounded transition-colors disabled:opacity-50 cursor-not-allowed">Editar</button>
                             <button onClick={() => handleLaunchCampaign(c.id, c.status)} disabled={c.status !== 'draft'} className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-[#C59868]/10 text-[#C59868] hover:bg-[#C59868] hover:text-[#100C08] rounded transition-colors disabled:opacity-30 flex items-center gap-2">
                                 <Send size={12} /> Disparar
                             </button>
                        </div>
                    </div>
                ))}
            </div>
            {campaigns.length === 0 && <div className="col-span-3 text-center text-zinc-500 py-12 text-sm">Nenhuma campanha cadastrada.</div>}
        </div>
    );
}
