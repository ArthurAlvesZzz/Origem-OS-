import { useState, useEffect } from 'react';
import { useRepositories } from '../../repositories/RepositoryProvider';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';

export function CalendarTab() {
  const { crmRepo } = useRepositories();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => { loadEvents(); }, []);

  async function loadEvents() {
    try {
      const data = await crmRepo.getCalendarEvents();
      setEvents(data || []);
    } finally {
      setLoading(false);
    }
  }

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  if (loading) return <div className="p-8 text-center text-zinc-500">Carregando calendário...</div>;

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-medium text-zinc-100 capitalize">
            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </h2>
          <p className="text-sm text-zinc-400 mt-1">Calendário de Entregas & Eventos B2B</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth}><ChevronLeft size={16} /></Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Hoje</Button>
          <Button variant="outline" size="sm" onClick={nextMonth}><ChevronRight size={16} /></Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-zinc-800 rounded-xl overflow-hidden border border-zinc-800">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="bg-zinc-950/80 p-3 text-center text-xs font-semibold text-zinc-500">
            {day}
          </div>
        ))}
        
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-zinc-900/30 p-2 min-h-[100px]" />
        ))}
        
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const isToday = new Date().toDateString() === dayDate.toDateString();
          
          const dayEvents = events.filter(e => {
             const evDate = new Date(e.startAt);
             return evDate.getFullYear() === currentDate.getFullYear() &&
                    evDate.getMonth() === currentDate.getMonth() &&
                    evDate.getDate() === day;
          });

          return (
            <div key={day} className={`bg-zinc-950 p-2 min-h-[100px] border-t border-zinc-800 hover:bg-zinc-900/50 transition-colors ${isToday ? 'ring-1 ring-inset ring-amber-500/50' : ''}`}>
              <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-2 ${isToday ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400'}`}>
                {day}
              </div>
              <div className="space-y-1">
                {dayEvents.map(ev => (
                  <div key={ev.id} className="text-[10px] px-1.5 py-1 rounded bg-zinc-800 text-zinc-300 truncate border border-zinc-700/50 font-medium">
                    {ev.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
