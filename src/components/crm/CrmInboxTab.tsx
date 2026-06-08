import React, { useState } from 'react';
import { CrmConversationRecord, CrmMessageRecord } from '../../repositories/interfaces/ICrmRepository';
import { MessageSquare, Users, CheckCircle2, Send, Phone } from 'lucide-react';
import { ICrmRepository } from '../../repositories/interfaces/ICrmRepository';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface CrmInboxTabProps {
    conversations: CrmConversationRecord[];
    crmRepo: ICrmRepository;
    onRefresh: () => void;
}

export function CrmInboxTab({ conversations, crmRepo, onRefresh }: CrmInboxTabProps) {
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
        onRefresh();
    };

    const handleResolve = async (id: string) => {
        await crmRepo.resolveConversation(id);
        setSelectedConversationId(null);
        onRefresh();
    };

    const filteredConvs = conversations.filter(c => inboxStatusFilter === 'all' || c.status === inboxStatusFilter);
    const selectedConvObj = conversations.find(c => c.id === selectedConversationId);

    return (
        <div className="bg-[#100C08] border border-zinc-800 rounded-xl overflow-hidden flex min-h-[500px] h-[600px]">
            <div className="w-1/3 border-r border-zinc-800 flex flex-col">
                <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center">
                    <h3 className="font-heading font-medium text-zinc-100 flex items-center gap-2">
                        <MessageSquare size={16} className="text-[#C59868]" /> Caixa de Entrada
                    </h3>
                    <div className="w-32">
                        <Select
                            value={inboxStatusFilter} 
                            onChange={e => setInboxStatusFilter(e.target.value)}
                        >
                            <option value="all">Todas</option>
                            <option value="open">Ativas</option>
                            <option value="resolved">Resolvidas</option>
                        </Select>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {filteredConvs.length === 0 ? (
                        <div className="text-zinc-500 text-xs italic text-center mt-4">Caixa vazia.</div>
                    ) : filteredConvs.map(c => (
                        <div key={c.id} onClick={() => loadMessages(c.id)} className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedConversationId === c.id ? 'bg-[#C59868]/10 border-[#C59868]/30 border' : 'bg-zinc-900/50 hover:bg-zinc-900 border-transparent border'}`}>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-zinc-100 flex items-center gap-2">
                                    {(c as any).customerName || (c.customerId ? 'Cliente' : 'Desconhecido')}
                                </span>
                                {c.unreadCount ? <span className="bg-[#C59868] text-[#100C08] text-[10px] px-1.5 py-0.5 rounded-sm font-bold">{c.unreadCount}</span> : null}
                            </div>
                            <div className="flex justify-between items-end">
                                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{c.channel.replace('whatsapp_', 'WA ')}</div>
                                <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">
                                    {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleDateString() : ''}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="flex-1 flex flex-col bg-zinc-950/30">
                {selectedConversationId ? (
                    <>
                        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
                            <h3 className="text-zinc-100 font-medium flex items-center gap-2">
                                {(selectedConvObj as any)?.customerName || 'Chat'}
                                {selectedConvObj?.status === 'resolved' && <span className="text-[9px] bg-[#528F65]/20 text-[#528F65] px-2 py-0.5 rounded-sm uppercase tracking-widest font-bold">Resolvido</span>}
                            </h3>
                            <div className="flex gap-2">
                                {selectedConvObj?.status !== 'resolved' && (
                                    <Button 
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleResolve(selectedConversationId)} 
                                        className="text-[10px] font-bold tracking-widest bg-[#528F65]/10 hover:bg-[#528F65]/20 text-[#528F65] border-transparent transition-colors flex items-center gap-1 uppercase"
                                    >
                                        <CheckCircle2 size={14}/> Resolver
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                            {messages.length === 0 && <div className="text-zinc-500 text-xs text-center mt-10">Inicie a conversa...</div>}
                            {messages.map(m => (
                                <div key={m.id} className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] rounded-2xl p-4 text-sm ${m.direction === 'outbound' ? 'bg-[#C59868] text-[#100C08] rounded-tr-sm' : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-sm'}`}>
                                        {m.body}
                                        <div className={`text-[10px] mt-2 ${m.direction === 'outbound' ? 'text-[#100C08]/60' : 'text-zinc-500'} text-right w-full flex justify-end gap-1 font-mono uppercase tracking-widest font-bold`}>
                                            {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            {m.direction === 'outbound' && <span className="uppercase ml-2">[{m.deliveryStatus}]</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex gap-3 relative items-center">
                            <Input 
                                type="text" 
                                value={newMessage} 
                                onChange={e => setNewMessage(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                placeholder={selectedConvObj?.status === 'resolved' ? "Chat fechado. Digite para reabrir..." : "Digite uma mensagem..."}
                                className="flex-1"
                            />
                            <Button 
                                variant="conclusive"
                                onClick={handleSendMessage} 
                                className="h-10 px-4"
                            >
                                <Send size={16} />
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="m-auto flex flex-col items-center justify-center text-zinc-500">
                        <MessageSquare size={32} className="mb-4 opacity-50" />
                        <p className="text-sm font-medium">Selecione uma conversa ao lado.</p>
                    </div>
                )}
            </div>
            
            {/* Customer 360 Mini Drawer - inside the tab */}
            {selectedConversationId && selectedConvObj && (
                <div className="w-[30%] border-l border-zinc-800 flex flex-col bg-zinc-950/80">
                    <div className="p-4 border-b border-zinc-800">
                        <h3 className="font-heading font-medium text-zinc-100">Atendimento 360</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-zinc-800 mb-3 flex items-center justify-center text-2xl font-heading text-[#C59868] shadow-inner">
                                {((selectedConvObj as any).customerName?.[0] || 'C').toUpperCase()}
                            </div>
                            <h4 className="text-sm font-medium text-zinc-100 mb-1">{(selectedConvObj as any).customerName || 'Cliente'}</h4>
                            <p className="text-[10px] uppercase tracking-widest text-[#C59868] font-bold flex items-center gap-1"><Phone size={10} /> {selectedConvObj.channel.replace('whatsapp_', 'App ')}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
