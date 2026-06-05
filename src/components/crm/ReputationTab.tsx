import { useState, useEffect } from 'react';
import { useRepositories } from '../../repositories/RepositoryProvider';

export function ReputationTab() {
  const { crmRepo } = useRepositories();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const fbData = await crmRepo.getFeedback();
      const tktData = await crmRepo.getTickets();
      setFeedbacks(fbData || []);
      setTickets(tktData || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve(id: string) {
     await crmRepo.resolveTicket(id, 'Resolvido via painel');
     loadData();
  }

  if (loading) return <div>Carregando NPS e Tickets...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-4">
        <h2 className="text-lg font-medium text-zinc-100">Avaliações (NPS)</h2>
        <div className="space-y-3">
          {feedbacks.length === 0 ? <p className="text-sm text-zinc-500">Nenhum feedback recebido ainda.</p> : feedbacks.map((fb: any) => (
            <div key={fb.id} className="p-3 bg-zinc-950 border border-zinc-800 rounded flex items-center justify-between">
              <div>
                 <div className="text-sm font-medium text-zinc-100">Cliente {fb.customerId}</div>
                 {fb.comment && <div className="text-xs text-zinc-400 mt-1">"{fb.comment}"</div>}
              </div>
              <div className={`text-lg font-bold ${fb.score >= 9 ? 'text-emerald-500' : fb.score >= 7 ? 'text-amber-500' : 'text-red-500'}`}>
                 {fb.score}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-4">
        <h2 className="text-lg font-medium text-zinc-100">Service Tickets (Problemas)</h2>
        <div className="space-y-3">
          {tickets.length === 0 ? <p className="text-sm text-zinc-500">Nenhum ticket aberto.</p> : tickets.map((tkt: any) => (
             <div key={tkt.id} className="p-3 bg-zinc-950 border border-zinc-800 rounded flex flex-col gap-2">
                 <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-zinc-100">{tkt.category}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${tkt.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{tkt.status}</span>
                 </div>
                 <div className="text-xs text-zinc-500">Cliente: {tkt.customerId}</div>
                 {tkt.status !== 'resolved' && (
                    <button onClick={() => handleResolve(tkt.id)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs px-3 py-1.5 rounded transition-colors self-end">
                       Marcar Resolvido
                    </button>
                 )}
             </div>
          ))}
        </div>
      </div>
    </div>
  )
}
