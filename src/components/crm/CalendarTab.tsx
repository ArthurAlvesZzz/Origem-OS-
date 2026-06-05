import { useState, useEffect } from 'react';
import { useRepositories } from '../../repositories/RepositoryProvider';

export function CalendarTab() {
  const { crmRepo } = useRepositories();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadEvents(); }, []);

  async function loadEvents() {
    try {
      const data = await crmRepo.getCalendarEvents();
      setEvents(data || []);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Carregando calendário...</div>;

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <h2 className="text-lg font-medium text-zinc-100">Calendário de Produção & Entregas</h2>
        <p className="text-sm text-zinc-400 mb-4">Veja as datas das encomendas, reuniões B2B e degutações.</p>
        
        <div className="space-y-3">
          {events.length === 0 ? <p className="text-sm text-zinc-500">Nenhum evento agendado.</p> : events.map(ev => (
             <div key={ev.id} className="flex gap-4 p-3 bg-zinc-950 border border-zinc-700/50 rounded-lg">
                <div className="w-16 bg-zinc-800 rounded flex flex-col items-center justify-center py-2 text-zinc-100 font-medium">
                  <span className="text-xs text-amber-500">{new Date(ev.startAt).toLocaleString('pt-BR', { month: 'short' }).toUpperCase()}</span>
                  <span className="text-xl">{new Date(ev.startAt).getDate()}</span>
                </div>
                <div>
                   <h3 className="font-medium text-zinc-100">{ev.title}</h3>
                   <div className="text-xs px-2 py-0.5 rounded-full border border-zinc-700 w-max text-zinc-400 mt-1">{ev.type}</div>
                </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  )
}
