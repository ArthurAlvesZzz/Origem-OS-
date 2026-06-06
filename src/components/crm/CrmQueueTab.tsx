import React, { useState } from 'react';
import { Send, MessageSquare, CheckCircle2 } from 'lucide-react';
import { CommunicationQueueRecord } from '../../repositories/interfaces/ICrmRepository';
import { ICrmRepository } from '../../repositories/interfaces/ICrmRepository';
import { useToast } from '../../components/ui/Toast';

interface CrmQueueTabProps {
    crmRepo: ICrmRepository;
}

export function CrmQueueTab({ crmRepo }: CrmQueueTabProps) {
  const { success, error: toastError, info } = useToast();
    const [queues, setQueues] = useState<CommunicationQueueRecord[]>([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        crmRepo.getCommunications().then(q => {
            setQueues(q);
            setLoading(false);
        });
    }, [crmRepo]);

    const handleSimulateSend = async (id: string, recipient: string, body: string) => {
        try {
            await crmRepo.markCommunicationSimulated(id);
            success(`Mensagem simulada enviada com sucesso no sistema.\nNa vida real, usaria a API do provider.\nSe quiser abrir o WhatsApp agora, acesse: https://wa.me/${recipient.replace(/\D/g, '')}?text=${encodeURIComponent(body)}`);
            const q = await crmRepo.getCommunications();
            setQueues(q);
        } catch(e) {
            toastError("Erro ao simular");
        }
    };

    if (loading) return null;

    return (
        <div className="bg-[#100C08] border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] font-bold uppercase tracking-widest bg-zinc-900/50">
                        <th className="p-4">Data</th>
                        <th className="p-4">Destinatário</th>
                        <th className="p-4">Canal</th>
                        <th className="p-4">Status / Provider</th>
                        <th className="p-4 text-right">Ações</th>
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
                                    <p className="text-xs text-zinc-500 mt-1 max-w-sm">Suas campanhas e interações aparecerão aqui.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                    {queues.map(q => (
                        <tr key={q.id} className="hover:bg-zinc-900/50 transition-colors group">
                            <td className="p-4 text-zinc-400 text-sm font-mono">{new Date(q.createdAt).toLocaleDateString()}</td>
                            <td className="p-4">
                                <div className="font-medium text-zinc-100 text-sm">{q.recipient}</div>
                                <div className="text-xs text-zinc-500 truncate max-w-[200px] mt-1">{q.renderedBody}</div>
                            </td>
                            <td className="p-4">
                                <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                                    <MessageSquare size={12} className="text-[#C59868]" /> {q.channel}
                                </span>
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-sm text-[9px] uppercase font-bold tracking-widest border ${q.status === 'sent' || q.status === 'simulated' ? 'bg-[#528F65]/10 text-[#528F65] border-[#528F65]/20' : q.status === 'draft' || q.status === 'queued' ? 'bg-[#C59868]/10 text-[#C59868] border-[#C59868]/20' : 'bg-[#AF4D4D]/10 text-[#AF4D4D] border-[#AF4D4D]/20'}`}>
                                        {q.status}
                                    </span>
                                    <span className="text-[10px] font-mono text-zinc-500">via {q.provider}</span>
                                </div>
                            </td>
                            <td className="p-4 text-right">
                                {q.status === 'draft' && (
                                    <button onClick={() => handleSimulateSend(q.id, q.recipient, q.renderedBody)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C59868]/10 text-[#C59868] hover:bg-[#C59868] hover:text-[#100C08] font-bold text-[10px] uppercase tracking-widest rounded transition-colors ml-auto">
                                        <Send size={12} /> Simular
                                    </button>
                                )}
                                {q.status === 'simulated' && (
                                    <span className="text-[10px] font-bold tracking-widest uppercase text-[#528F65] flex items-center justify-end gap-1"><CheckCircle2 size={12} /> Resolvido</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
