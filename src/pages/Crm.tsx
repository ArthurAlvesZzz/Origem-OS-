import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { useRepositories } from '../repositories/RepositoryProvider';
import { 
  CrmPipelineRecord, CrmDealRecord, CrmConversationRecord
} from '../repositories/interfaces/ICrmRepository';
import { CrmMetricsHeader } from '../components/crm/CrmMetricsHeader';
import { CrmPipelineTab } from '../components/crm/CrmPipelineTab';
import { CrmInboxTab } from '../components/crm/CrmInboxTab';
import { CrmCampaignsTab } from '../components/crm/CrmCampaignsTab';
import { CrmQueueTab } from '../components/crm/CrmQueueTab';
import { CrmAutomationsTab } from '../components/crm/CrmAutomationsTab';
import { CrmChannelsTab } from '../components/crm/CrmChannelsTab';
import { SpecialOrdersTab } from '../components/crm/SpecialOrdersTab';
import { CalendarTab } from '../components/crm/CalendarTab';
import { LoyaltyTab } from '../components/crm/LoyaltyTab';
import { ReputationTab } from '../components/crm/ReputationTab';
import { InsightsTab } from '../components/crm/InsightsTab';

export function Crm() {
    const { crmRepo } = useRepositories();
    const [activeTab, setActiveTab] = useState('pipeline');
    const [activePipelineId, setActivePipelineId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [pipelines, setPipelines] = useState<CrmPipelineRecord[]>([]);
    const [deals, setDeals] = useState<CrmDealRecord[]>([]);
    const [conversations, setConversations] = useState<CrmConversationRecord[]>([]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Metrics and basic setup
            const p = await crmRepo.getPipelines();
            setPipelines(p);
            const targetPipelineId = activePipelineId || (p.length > 0 ? p[0].id : null);
            if (targetPipelineId) {
                if (!activePipelineId) setActivePipelineId(targetPipelineId);
                const d = await crmRepo.getDeals(targetPipelineId);
                setDeals(d);
            }
            
            const c = await crmRepo.getConversations();
            setConversations(c);
            
        } catch (e) {
            console.warn("Erro ao carregar dados do CRM", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activePipelineId, activeTab]); 

    const handleStatusChange = async (dealId: string, status: string) => {
        await crmRepo.updateDeal(dealId, { status });
        fetchData();
    };

    const metrics = {
        openDealsCount: deals.filter(d => d.status === 'open').length,
        pipelineValue: deals.filter(d => d.status === 'open').reduce((sum, d) => sum + d.value, 0),
        unreadInbox: conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
        lateFollowUps: Math.floor(Math.random() * 3) // mock for visual
    };

    return (
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6">
            <PageHeader 
                title="Gestão & Relacionamento" 
                description="CRM de vendas, atendimento omnichannel, campanhas e fidelidade." 
            />

            <CrmMetricsHeader {...metrics} />

            {/* Pill Navigation (grouped) */}
            <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2 pt-2 snap-x">
                <div className="flex gap-2 bg-zinc-950 border border-zinc-800 p-1.5 rounded-full shrink-0 snap-start">
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center px-4 border-r border-zinc-800/50">Vendas</span>
                    <button onClick={() => setActiveTab('pipeline')} className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'pipeline' ? 'bg-[#C59868] text-[#100C08]' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}`}>Pipeline</button>
                    <button onClick={() => setActiveTab('special_orders')} className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'special_orders' ? 'bg-[#C59868] text-[#100C08]' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}`}>Encomendas</button>
                </div>
                
                <div className="flex gap-2 bg-zinc-950 border border-zinc-800 p-1.5 rounded-full shrink-0 snap-start">
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center px-4 border-r border-zinc-800/50">Comunicação</span>
                    <button onClick={() => setActiveTab('inbox')} className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'inbox' ? 'bg-[#C59868] text-[#100C08]' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}`}>
                        Inbox {metrics.unreadInbox > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-zinc-950"></span>}
                    </button>
                    <button onClick={() => setActiveTab('campaigns')} className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'campaigns' ? 'bg-[#C59868] text-[#100C08]' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}`}>Campanhas</button>
                    <button onClick={() => setActiveTab('queue')} className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'queue' ? 'bg-[#C59868] text-[#100C08]' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}`}>Fila de Disparo</button>
                    <button onClick={() => setActiveTab('channels')} className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'channels' ? 'bg-[#C59868] text-[#100C08]' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}`}>Canais & Portais</button>
                </div>

                <div className="flex gap-2 bg-zinc-950 border border-zinc-800 p-1.5 rounded-full shrink-0 snap-start">
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center px-4 border-r border-zinc-800/50">Inteligência</span>
                    <button onClick={() => setActiveTab('calendar')} className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'calendar' ? 'bg-[#C59868] text-[#100C08]' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}`}>Agenda</button>
                    <button onClick={() => setActiveTab('loyalty')} className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'loyalty' ? 'bg-[#C59868] text-[#100C08]' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}`}>Fidelidade</button>
                    <button onClick={() => setActiveTab('reputation')} className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'reputation' ? 'bg-[#C59868] text-[#100C08]' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}`}>Avaliações</button>
                    <button onClick={() => setActiveTab('insights')} className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'insights' ? 'bg-[#C59868] text-[#100C08]' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}`}>Insights IA</button>
                </div>

                <div className="flex gap-2 bg-zinc-950 border border-zinc-800 p-1.5 rounded-full shrink-0 snap-start">
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center px-4 border-r border-zinc-800/50">Sistema</span>
                    <button onClick={() => setActiveTab('automations')} className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'automations' ? 'bg-[#C59868] text-[#100C08]' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}`}>Automações</button>
                </div>
            </div>

            <div className="min-h-[500px] mt-6">
                {activeTab === 'pipeline' && (
                    <CrmPipelineTab 
                        pipelines={pipelines} 
                        activePipelineId={activePipelineId} 
                        setActivePipelineId={setActivePipelineId} 
                        deals={deals} 
                        onStatusChange={handleStatusChange} 
                    />
                )}
                {activeTab === 'inbox' && (
                    <CrmInboxTab 
                        conversations={conversations} 
                        crmRepo={crmRepo} 
                        onRefresh={fetchData} 
                    />
                )}
                {activeTab === 'campaigns' && <CrmCampaignsTab crmRepo={crmRepo} />}
                {activeTab === 'queue' && <CrmQueueTab crmRepo={crmRepo} />}
                {activeTab === 'automations' && <CrmAutomationsTab crmRepo={crmRepo} />}
                {activeTab === 'channels' && <CrmChannelsTab crmRepo={crmRepo} />}
                
                {/* Outras tabs importadas já existentes */}
                {activeTab === 'special_orders' && <SpecialOrdersTab />}
                {activeTab === 'calendar' && <CalendarTab />}
                {activeTab === 'loyalty' && <LoyaltyTab />}
                {activeTab === 'reputation' && <ReputationTab />}
                {activeTab === 'insights' && <InsightsTab />}
            </div>
        </div>
    );
}
