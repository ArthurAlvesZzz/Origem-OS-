import { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { useRepositories } from '../repositories/RepositoryProvider';
import { 
  CrmPipelineRecord, CrmStageRecord, CrmDealRecord, 
  CrmActivityRecord, CommunicationTemplateRecord, CommunicationQueueRecord,
  CrmConversationRecord, CrmChannelConnectionRecord, CrmMessageRecord,
  CrmCampaignRecord, CrmAutomationRecord
} from '../repositories/interfaces/ICrmRepository';
import { SpecialOrdersTab } from '../components/crm/SpecialOrdersTab';
import { CalendarTab } from '../components/crm/CalendarTab';
import { LoyaltyTab } from '../components/crm/LoyaltyTab';
import { ReputationTab } from '../components/crm/ReputationTab';
import { InsightsTab } from '../components/crm/InsightsTab';
import QRCode from 'react-qr-code';
import { Users, Kanban, History, MessageSquare, Send, CheckCircle2, QrCode, Megaphone, Zap, Calendar, Heart, Star, BrainCircuit, Cake, DollarSign, Clock } from 'lucide-react';

export function Crm() {
  const { crmRepo } = useRepositories();
  const [activeTab, setActiveTab] = useState<'pipeline' | 'activities' | 'campaigns' | 'automations' | 'queue' | 'inbox' | 'channels' | 'special_orders' | 'calendar' | 'loyalty' | 'reputation' | 'insights'>('pipeline');
  const [activePipelineId, setActivePipelineId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [pipelines, setPipelines] = useState<CrmPipelineRecord[]>([]);
  const [deals, setDeals] = useState<CrmDealRecord[]>([]);
  const [activities, setActivities] = useState<CrmActivityRecord[]>([]);
  const [templates, setTemplates] = useState<CommunicationTemplateRecord[]>([]);
  const [queues, setQueues] = useState<CommunicationQueueRecord[]>([]);
  const [conversations, setConversations] = useState<CrmConversationRecord[]>([]);
  const [channels, setChannels] = useState<CrmChannelConnectionRecord[]>([]);
  const [campaigns, setCampaigns] = useState<CrmCampaignRecord[]>([]);
  const [automations, setAutomations] = useState<CrmAutomationRecord[]>([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'pipeline') {
         const p = await crmRepo.getPipelines();
         setPipelines(p);
         const targetPipelineId = activePipelineId || (p.length > 0 ? p[0].id : null);
         if (targetPipelineId) {
           if (!activePipelineId) setActivePipelineId(targetPipelineId);
           const d = await crmRepo.getDeals(targetPipelineId);
           setDeals(d);
         }
      }
      if (activeTab === 'activities') {
         const a = await crmRepo.getActivities();
         setActivities(a);
      }
      if (activeTab === 'campaigns') {
         const c = await crmRepo.getCampaigns();
         setCampaigns(c);
         const t = await crmRepo.getTemplates();
         setTemplates(t);
      }
      if (activeTab === 'automations') {
         const a = await crmRepo.getAutomations();
         setAutomations(a);
      }
      if (activeTab === 'queue') {
         const q = await crmRepo.getCommunications();
         setQueues(q);
      }
      if (activeTab === 'inbox') {
         const c = await crmRepo.getConversations();
         setConversations(c);
      }
      if (activeTab === 'channels') {
         const ch = await crmRepo.getChannelConnections();
         setChannels(ch);
      }
    } catch (e) {
      console.warn("Erro ao carregar dados do CRM", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateSend = async (id: string, recipient: string, body: string) => {
    try {
      await crmRepo.markCommunicationSimulated(id);
      
      // WhatsApp link fallback logic simulation
      alert(`Mensagem simulada enviada com sucesso no sistema.\nNa vida real, usaria a API do provider.\nSe quiser abrir o WhatsApp agora, acesse: https://wa.me/${recipient.replace(/\D/g, '')}?text=${encodeURIComponent(body)}`);
      
      fetchData();
    } catch(e) {
      alert("Erro ao simular");
    }
  };

  const renderPipeline = () => {
    if (pipelines.length === 0) return <div className="text-zinc-500">Nenhum funil configurado.</div>;
    const p = pipelines.find(pipe => pipe.id === activePipelineId) || pipelines[0];
    const stages = p.stages || [];

    return (
      <div className="flex flex-col h-full gap-4 mt-4">
        <div className="flex gap-2 pos-relative bg-zinc-900 border border-zinc-800 p-1.5 rounded-xl w-fit">
          {pipelines.map(pipe => (
            <button 
              key={pipe.id}
              onClick={() => setActivePipelineId(pipe.id)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activePipelineId === pipe.id ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              {pipe.name}
            </button>
          ))}
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar flex-1 items-start">
          {stages.map(stage => (
            <div key={stage.id} className="min-w-[320px] w-[320px] flex flex-col shrink-0 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-zinc-800/60 bg-zinc-900/80 flex items-center justify-between">
                 <h3 className="font-heading font-semibold text-zinc-100 flex items-center gap-2 text-sm uppercase tracking-wider">
                   <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                   {stage.name}
                 </h3>
                 <span className="text-xs font-bold text-zinc-400 bg-zinc-800 px-2.5 py-0.5 rounded-full">
                   {deals.filter(d => d.stageId === stage.id).length}
                 </span>
              </div>
              
              <div className="p-3 flex flex-col gap-3 min-h-[400px]">
                 {deals.filter(d => d.stageId === stage.id).map(deal => {
                   let customData: any = {};
                   try { if (deal.customDataJson) customData = JSON.parse(deal.customDataJson); } catch (e) {}

                   return (
                   <div key={deal.id} className="bg-zinc-950 border border-zinc-800/80 hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.05)] rounded-xl p-4 cursor-pointer transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-semibold text-zinc-100 line-clamp-2 leading-tight group-hover:text-amber-400 transition-colors">{deal.title}</div>
                      </div>
                      
                      {deal.value > 0 && (
                        <div className="text-sm font-bold text-emerald-500 mb-3 flex items-center gap-1">
                          <DollarSign size={14} className="text-emerald-500/70"/> {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(deal.value)}
                        </div>
                      )}
                      
                      {customData && Object.keys(customData).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {customData.eventDate && <span className="text-[10px] uppercase font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md flex items-center gap-1"><Calendar size={10} /> {new Date(customData.eventDate).toLocaleDateString()}</span>}
                          {customData.flavor && <span className="text-[10px] uppercase font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-md">Sab: {customData.flavor}</span>}
                          {customData.deliveryTime && <span className="text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1"><Clock size={10} /> {customData.deliveryTime}</span>}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                         <span className={`text-[9px] uppercase tracking-widest px-2 py-1 rounded font-black
                           ${deal.status === 'open' ? 'bg-amber-500/10 text-amber-500' : deal.status === 'won' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}
                         `}>
                            {deal.status}
                         </span>
                         <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                           {new Date(deal.createdAt).toLocaleDateString()}
                         </span>
                      </div>
                   </div>
                 )})}
                 
                 {deals.filter(d => d.stageId === stage.id).length === 0 && (
                   <div className="text-center text-zinc-600/50 font-medium text-xs py-12 border-2 border-dashed border-zinc-800/50 rounded-xl">
                     Nenhum lead nesta etapa
                   </div>
                 )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderQueue = () => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider bg-zinc-900/50">
             <th className="p-4 font-medium">Data</th>
             <th className="p-4 font-medium">Destinatário</th>
             <th className="p-4 font-medium">Canal</th>
             <th className="p-4 font-medium">Status / Provider</th>
             <th className="p-4 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {queues.length === 0 && (
            <tr>
              <td colSpan={5} className="py-12">
                 <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800 mb-4">
                      <MessageSquare className="text-zinc-500" size={20} />
                    </div>
                    <p className="text-sm font-medium text-zinc-300">Nenhuma mensagem na fila</p>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm">Suas campanhas e interações por email ou WhatsApp aparecerão aqui.</p>
                 </div>
              </td>
            </tr>
          )}
          {queues.map(q => (
            <tr key={q.id} className="hover:bg-zinc-800/20 transition-colors group">
              <td className="p-4 text-zinc-400 text-sm">{new Date(q.createdAt).toLocaleDateString()}</td>
              <td className="p-4">
                 <div className="font-medium text-zinc-100">{q.recipient}</div>
                 <div className="text-xs text-zinc-500 truncate max-w-[200px] mt-1">{q.renderedBody}</div>
              </td>
              <td className="p-4">
                 <span className="flex items-center gap-1 text-xs text-zinc-300">
                    <MessageSquare size={14} className="text-zinc-500"/> {q.channel}
                 </span>
              </td>
              <td className="p-4">
                 <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${q.status === 'sent' || q.status === 'simulated' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : q.status === 'draft' || q.status === 'queued' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                      {q.status}
                    </span>
                    <span className="text-[10px] text-zinc-500">via {q.provider}</span>
                 </div>
              </td>
              <td className="p-4 text-right">
                 {q.status === 'draft' && (
                    <button onClick={() => handleSimulateSend(q.id, q.recipient, q.renderedBody)} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-amber-950 font-medium text-xs rounded transition-colors ml-auto">
                      <Send size={14} /> Simular
                    </button>
                 )}
                 {q.status === 'simulated' && (
                    <span className="text-xs text-emerald-500 flex items-center justify-end gap-1"><CheckCircle2 size={14} /> Resolvido</span>
                 )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CrmMessageRecord[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [inboxStatusFilter, setInboxStatusFilter] = useState<string>('open');

  const loadMessages = async (id: string) => {
    setSelectedConversationId(id);
    const msgs = await crmRepo.getMessages(id);
    setMessages(msgs);
  };

  const handleSendMessage = async () => {
    if (!selectedConversationId || !newMessage.trim()) return;
    const msg = await crmRepo.sendMessage(selectedConversationId, { body: newMessage, direction: 'outbound' });
    setMessages([...messages, msg]);
    setNewMessage('');
    // refresh convs to update last message
    const c = await crmRepo.getConversations();
    setConversations(c);
  };

  const handleResolve = async (id: string) => {
    await crmRepo.resolveConversation(id);
    setSelectedConversationId(null);
    const c = await crmRepo.getConversations();
    setConversations(c);
  };

  const filteredConvs = conversations.filter(c => inboxStatusFilter === 'all' || c.status === inboxStatusFilter);
  const selectedConvObj = conversations.find(c => c.id === selectedConversationId);

  const renderInbox = () => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex min-h-[500px] h-[600px]">
       <div className="w-1/3 border-r border-zinc-800 flex flex-col">
         <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center">
            <h3 className="font-heading font-medium text-white">Conversas ({filteredConvs.length})</h3>
            <select 
              value={inboxStatusFilter} 
              onChange={e => setInboxStatusFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-300 p-1"
            >
              <option value="all">Todas</option>
              <option value="open">Abertas</option>
              <option value="resolved">Resolvidas</option>
              <option value="archived">Arquivadas</option>
            </select>
         </div>
         <div className="flex-1 overflow-y-auto p-4 space-y-2">
           {filteredConvs.length === 0 ? (
              <div className="text-zinc-500 text-xs italic text-center mt-4">Nenhuma conversa encontrada.</div>
           ) : filteredConvs.map(c => (
              <div key={c.id} onClick={() => loadMessages(c.id)} className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedConversationId === c.id ? 'bg-amber-500/10 border-amber-500/30 border' : 'bg-zinc-800/50 hover:bg-zinc-800 border-transparent border'}`}>
                 <div className="flex justify-between items-center mb-1">
                   <span className="text-sm font-medium text-zinc-100 flex items-center gap-2">
                     <Users size={14}/>
                     {(c as any).customer?.name ? (c as any).customer.name : (c.customerId ? 'Cliente' : 'Desconhecido')}
                     <span className="text-[9px] uppercase bg-zinc-700 text-zinc-300 px-1.5 rounded">{c.channel}</span>
                   </span>
                   {c.unreadCount ? <span className="bg-amber-500 text-amber-950 text-[10px] px-1.5 rounded-full font-bold">{c.unreadCount}</span> : null}
                 </div>
                 <div className="flex justify-between items-end">
                    <div className="text-xs text-zinc-500">Última: {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleDateString() : 'N/A'}</div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400">{c.status}</span>
                 </div>
              </div>
           ))}
         </div>
       </div>
       <div className="flex-1 flex flex-col bg-zinc-950/30">
          {selectedConversationId ? (
            <>
              <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
                 <h3 className="text-white font-medium flex items-center gap-2">
                    Bate-papo 
                    {selectedConvObj?.status === 'resolved' && <span className="text-[10px] bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded uppercase">Resolvido</span>}
                 </h3>
                 <div className="flex gap-2">
                    <button onClick={() => alert("Criar Deal a partir desta conversa na Fase 7")} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded transition-colors flex items-center gap-1">Criar Deal</button>
                    <button onClick={() => alert("Criar Lembrete em construção")} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded transition-colors flex items-center gap-1">Lembrete</button>
                    {selectedConvObj?.status !== 'resolved' && (
                       <button onClick={() => handleResolve(selectedConversationId)} className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 px-3 py-1.5 rounded transition-colors flex items-center gap-1"><CheckCircle2 size={14}/> Resolver</button>
                    )}
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 {messages.length === 0 && <div className="text-zinc-500 text-xs italic text-center mt-10">Nenhuma mensagem registrada.</div>}
                 {messages.map(m => (
                    <div key={m.id} className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[70%] rounded-lg p-3 text-sm ${m.direction === 'outbound' ? 'bg-amber-500 text-amber-950' : 'bg-zinc-800 text-zinc-100'}`}>
                          {m.body}
                          <div className={`text-[10px] mt-1 ${m.direction === 'outbound' ? 'text-amber-950/70' : 'text-zinc-500'} text-right w-full flex justify-end gap-1`}>
                             {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                             {m.direction === 'outbound' && <span className="uppercase mx-1 font-medium">{m.deliveryStatus}</span>}
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
              <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
                 <div className="flex gap-2 relative">
                   {/* Simples Composer */}
                   <input 
                     type="text" 
                     value={newMessage} 
                     onChange={e => setNewMessage(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                     placeholder={selectedConvObj?.status === 'resolved' ? "Conversa resolvida. Digite para reabrir..." : "Digite uma mensagem..."}
                     className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                   />
                   <select className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-2 cursor-pointer outline-none hover:bg-zinc-700 transition" onChange={e => {
                     setNewMessage(e.target.value);
                     e.target.value = "";
                   }}>
                      <option value="">USAR TEMPLATE</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.body}>{t.name}</option>
                      ))}
                   </select>
                   <button onClick={handleSendMessage} className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-medium px-4 py-2 rounded-lg flex items-center justify-center transition-colors">
                     <Send size={16} />
                   </button>
                 </div>
              </div>
            </>
          ) : (
            <div className="m-auto flex flex-col items-center justify-center text-zinc-500">
              <MessageSquare size={32} className="mb-4 opacity-50" />
              <p>Selecione uma conversa para ver as mensagens.</p>
            </div>
          )}
       </div>
       {selectedConversationId && selectedConvObj && (
         <div className="w-[30%] border-l border-zinc-800 flex flex-col bg-zinc-950">
            <div className="p-4 border-b border-zinc-800">
               <h3 className="font-heading font-medium text-white">Customer 360</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
               <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 mb-2 flex items-center justify-center text-xl font-medium text-amber-500">
                    {((selectedConvObj as any).customer?.name?.[0] || 'C').toUpperCase()}
                  </div>
                  <h4 className="text-sm font-medium text-white mb-1">{(selectedConvObj as any).customer?.name || 'Cliente Não Identificado'}</h4>
                  <p className="text-xs text-zinc-400 mb-4 flex items-center gap-1">Canal Principal: <span className="uppercase text-amber-500">{selectedConvObj.channel}</span></p>
                  
                  {(selectedConvObj as any).customer && (
                    <div className="space-y-2 pt-4 border-t border-zinc-800 text-xs">
                       <div className="flex justify-between items-center text-zinc-500">
                          <span>Opt-in WA</span>
                          <span className={`font-medium ${(selectedConvObj as any).customer.whatsappOptIn ? 'text-emerald-500' : 'text-red-500'}`}>
                             {(selectedConvObj as any).customer.whatsappOptIn ? 'Sim' : 'Não'}
                          </span>
                       </div>
                       <div className="flex justify-between items-center text-zinc-500">
                          <span>SCORE</span>
                          <span className="font-medium text-amber-500">{(selectedConvObj as any).customer.score || 0} pts</span>
                       </div>
                    </div>
                  )}
               </div>
               
               <div>
                  <h4 className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide">Deals Ativos</h4>
                  {deals.filter(d => d.customerId === selectedConvObj.customerId).length === 0 ? (
                    <div className="text-xs text-zinc-500 italic p-4 text-center bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                       Nenhum deal vinculado.
                    </div>
                  ) : (
                    deals.filter(d => d.customerId === selectedConvObj.customerId).map(d => (
                       <div key={d.id} className="bg-zinc-900 border border-zinc-800 p-2 rounded text-xs text-zinc-300 mb-2">
                          <div className="font-medium text-white">{d.title}</div>
                          <div className="text-amber-500 mt-1 uppercase text-[10px]">{d.status}</div>
                       </div>
                    ))
                  )}
               </div>
            </div>
         </div>
       )}
    </div>
  );

  const renderChannels = () => (
    <div className="space-y-8">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {channels.map(ch => (
            <div key={ch.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <Users size={18} className="text-zinc-400" />
                  </div>
                  <div>
                     <h3 className="font-medium text-zinc-100">{ch.provider}</h3>
                     <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${ch.status === 'connected' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{ch.status}</span>
                  </div>
               </div>
               <p className="text-xs text-zinc-400 mb-4 h-8 text-balance">Módulo conector oficial para disparo e atendimento.</p>
               <button className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium rounded transition-colors">Configurar credenciais</button>
            </div>
          ))}
       </div>

       <div>
          <h3 className="font-heading font-medium text-white mb-4 flex items-center gap-2 border-b border-zinc-800 pb-2">
            <QrCode size={18} />
            Acessos & QR Codes (Inteligentes)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* WhatsApp Portal */}
             <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col items-center text-center">
                <div className="bg-white p-3 rounded-xl mb-4 w-fit">
                   <QRCode value="https://wa.me/5511999999999?text=Ol%C3%A1%21%20Gostaria%20de%20atendimento." size={120} />
                </div>
                <h4 className="text-zinc-100 font-medium mb-1">WhatsApp Fale Conosco</h4>
                <p className="text-xs text-zinc-500 mb-4 h-12 text-balance">Escaneie para iniciar uma conversa rastreada via WhatsApp Web/App.</p>
             </div>

             {/* Customer Portal */}
             <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col items-center text-center">
                <div className="bg-white p-3 rounded-xl mb-4 w-fit">
                   <QRCode value={`${window.location.origin}/portal/login`} size={120} />
                </div>
                <h4 className="text-zinc-100 font-medium mb-1">Portal do Cliente (B2B/B2C)</h4>
                <p className="text-xs text-zinc-500 mb-4 h-12 text-balance">Acesso via OTP (SMS/WhatsApp) para clientes verificarem histórico.</p>
             </div>
          </div>
       </div>
    </div>
  );

  const [newCampaignName, setNewCampaignName] = useState('');
  
  const handleLaunchCampaign = async (id: string, currentStatus: string) => {
     if (currentStatus !== 'draft') return;
     if (!confirm("Iniciar disparo da campanha para clientes com opt-in?")) return;
     try {
       await crmRepo.launchCampaign(id);
       alert("Campanha iniciada. As mensagens foram enviadas para a fila.");
       fetchData();
     } catch(e) {
       alert("Erro ao iniciar campanha");
     }
  };
  
  const handleCreateCampaign = async () => {
     if (!newCampaignName) return;
     try {
       await crmRepo.createCampaign({ name: newCampaignName, channel: 'whatsapp' });
       setNewCampaignName('');
       fetchData();
     } catch(e) {
       alert("Erro ao criar campanha");
     }
  };

  const renderCampaigns = () => (
    <div className="space-y-6">
       <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
          <input 
             className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 flex-1 focus:border-amber-500 outline-none" 
             placeholder="Nome da nova campanha..." 
             value={newCampaignName}
             onChange={e => setNewCampaignName(e.target.value)}
          />
          <button onClick={handleCreateCampaign} className="bg-amber-500 hover:bg-amber-600 text-amber-950 px-4 py-2 font-medium text-sm rounded transition-colors">Criar Campanha</button>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map(c => (
            <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
               <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-zinc-100">{c.name}</h3>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${c.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{c.status}</span>
               </div>
               <div className="flex items-center gap-2 text-xs text-zinc-500 mb-4">
                  <MessageSquare size={12} /> {c.channel}
               </div>
               
               <div className="grid grid-cols-2 gap-2 mb-4 bg-zinc-950 p-3 rounded-lg border border-zinc-800/50">
                  <div className="text-center">
                    <div className="text-xl font-mono text-zinc-300">{c.sentCount}</div>
                    <div className="text-[10px] text-zinc-500 uppercase">Enviadas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-mono text-emerald-500">{c.deliveredCount}</div>
                    <div className="text-[10px] text-zinc-500 uppercase">Entregues</div>
                  </div>
               </div>
               
               <div className="flex justify-end gap-2">
                 <button onClick={() => alert("Editar campanha em construção")} disabled={c.status !== 'draft'} className="px-3 py-1.5 text-xs font-medium text-zinc-400 bg-zinc-800 hover:bg-zinc-700 hover:text-zinc-100 rounded transition-colors disabled:opacity-50">Editar</button>
                 <button onClick={() => handleLaunchCampaign(c.id, c.status)} disabled={c.status !== 'draft'} className="px-3 py-1.5 text-xs font-medium bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-amber-950 rounded transition-colors disabled:opacity-30 flex items-center gap-1"><Send size={12} /> Disparar</button>
               </div>
            </div>
          ))}
          {campaigns.length === 0 && <div className="col-span-3 text-center text-zinc-500 py-12">Nenhuma campanha cadastrada</div>}
       </div>
    </div>
  );
  
  const [newAutoName, setNewAutoName] = useState('');
  const handleCreateAutomation = async () => {
     if (!newAutoName) return;
     try {
       await crmRepo.createAutomation({ name: newAutoName, trigger: 'new_lead', actionsJson: '[]', active: true });
       setNewAutoName('');
       fetchData();
     } catch(e) {}
  };

  const renderAutomations = () => (
    <div className="space-y-6">
       <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
          <input 
             className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 flex-1 focus:border-amber-500 outline-none" 
             placeholder="Nome do fluxo automático..." 
             value={newAutoName}
             onChange={e => setNewAutoName(e.target.value)}
          />
          <button onClick={handleCreateAutomation} className="bg-amber-500 hover:bg-amber-600 text-amber-950 px-4 py-2 font-medium text-sm rounded transition-colors">Criar Fluxo</button>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {automations.map(a => (
            <div key={a.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
               <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-zinc-100">{a.name}</h3>
                  <div className="w-8 h-4 bg-emerald-500/20 rounded-full flex items-center px-0.5 justify-end"><div className="w-3 h-3 bg-emerald-500 rounded-full shadow-sm"></div></div>
               </div>
               <div className="text-xs text-zinc-400 mb-4 font-mono">Gatilho: {a.trigger}</div>
               
               <p className="text-xs text-zinc-500 mb-4 h-8 text-balance">Quando o evento alvo ocorrer, o sistema executará as ações programadas silenciosamente.</p>
               
               <div className="flex justify-end gap-2">
                 <button onClick={() => alert("Editor de flows em construção")} className="px-3 py-1.5 text-xs font-medium text-zinc-400 bg-zinc-800 hover:bg-zinc-700 hover:text-zinc-100 rounded transition-colors">Configurar Triggers & Ações</button>
               </div>
            </div>
          ))}
          {automations.length === 0 && <div className="col-span-3 text-center text-zinc-500 py-12">Nenhum fluxo automático cadastrado</div>}
       </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <PageHeader 
        title="CRM & Automações" 
        description="Gestão de leads, follow-ups de vendas, pagamentos pendentes e fila de comunicação." 
      />

      <div className="flex overflow-x-auto pb-2 border-b border-zinc-800 gap-6 custom-scrollbar">
        <button onClick={() => setActiveTab('pipeline')} className={`flex items-center gap-2 pb-3 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'pipeline' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
           <Kanban size={16} /> Pipeline de Vendas
           {activeTab === 'pipeline' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />}
        </button>
        <button onClick={() => setActiveTab('special_orders')} className={`flex items-center gap-2 pb-3 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'special_orders' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
           <Cake size={16} /> Encomendas
           {activeTab === 'special_orders' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />}
        </button>
        <button onClick={() => setActiveTab('calendar')} className={`flex items-center gap-2 pb-3 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'calendar' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
           <Calendar size={16} /> Calendário
           {activeTab === 'calendar' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />}
        </button>
        <button onClick={() => setActiveTab('loyalty')} className={`flex items-center gap-2 pb-3 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'loyalty' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
           <Heart size={16} /> Fidelidade
           {activeTab === 'loyalty' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />}
        </button>
        <button onClick={() => setActiveTab('reputation')} className={`flex items-center gap-2 pb-3 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'reputation' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
           <Star size={16} /> Reputação/Tickets
           {activeTab === 'reputation' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />}
        </button>
        <button onClick={() => setActiveTab('insights')} className={`flex items-center gap-2 pb-3 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'insights' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
           <BrainCircuit size={16} /> Insights de Cliente
           {activeTab === 'insights' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />}
        </button>
        <button onClick={() => setActiveTab('inbox')} className={`flex items-center gap-2 pb-3 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'inbox' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
           <MessageSquare size={16} /> Omnichannel Inbox
           {activeTab === 'inbox' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />}
        </button>
        <button onClick={() => setActiveTab('campaigns')} className={`flex items-center gap-2 pb-3 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'campaigns' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
           <Megaphone size={16} /> Campanhas
           {activeTab === 'campaigns' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />}
        </button>
        <button onClick={() => setActiveTab('automations')} className={`flex items-center gap-2 pb-3 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'automations' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
           <Zap size={16} /> Automações Reativas
           {activeTab === 'automations' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />}
        </button>
        <button onClick={() => setActiveTab('queue')} className={`flex items-center gap-2 pb-3 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'queue' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
           <Send size={16} /> Fila Diária
           {activeTab === 'queue' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />}
        </button>
        <button onClick={() => setActiveTab('channels')} className={`flex items-center gap-2 pb-3 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'channels' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
           <Users size={16} /> Ajustes Omnichannel
           {activeTab === 'channels' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />}
        </button>
      </div>

      <div className="min-h-[400px]">
         {activeTab === 'pipeline' && renderPipeline()}
         {activeTab === 'special_orders' && <SpecialOrdersTab />}
         {activeTab === 'calendar' && <CalendarTab />}
         {activeTab === 'loyalty' && <LoyaltyTab />}
         {activeTab === 'reputation' && <ReputationTab />}
         {activeTab === 'insights' && <InsightsTab />}
         {activeTab === 'queue' && renderQueue()}
         {activeTab === 'inbox' && renderInbox()}
         {activeTab === 'campaigns' && renderCampaigns()}
         {activeTab === 'automations' && renderAutomations()}
         {activeTab === 'channels' && renderChannels()}
      </div>

    </div>
  );
}
