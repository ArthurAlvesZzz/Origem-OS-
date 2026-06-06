import { formatBRL } from '../../lib/format';
import { useState, useEffect } from 'react';
import { useRepositories } from '../../repositories/RepositoryProvider';

export function SpecialOrdersTab() {
  const { crmRepo } = useRepositories();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ customerId: '', eventDate: '', theme: '', flavor: '', guestCount: 10, totalAmount: 0 });

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    try {
      const data = await crmRepo.getSpecialOrders();
      setOrders(data || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await crmRepo.createSpecialOrder({...formData, status: 'requested'});
    setShowForm(false);
    loadOrders();
  }

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div>
          <h2 className="text-lg font-medium text-zinc-100">Encomendas Especiais (Bolo / Coffee Break)</h2>
          <p className="text-sm text-zinc-400">Gestão de orçamentos e pedidos sob demanda.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-amber-500 text-zinc-950 font-medium px-4 py-2 rounded text-sm hover:bg-amber-600">
          Novo Orçamento
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-4">
           <h3 className="text-zinc-100 font-medium">Cadastrar Orçamento</h3>
           <div className="grid grid-cols-2 gap-4">
             <div><label className="text-xs text-zinc-400 block mb-1">ID Cliente (simulado)</label><input onChange={e => setFormData({...formData, customerId: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-sm" placeholder="Ex: cust_123" required/></div>
             <div><label className="text-xs text-zinc-400 block mb-1">Data Evento</label><input type="date" onChange={e => setFormData({...formData, eventDate: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-sm" required/></div>
             <div><label className="text-xs text-zinc-400 block mb-1">Tema / Tipo</label><input onChange={e => setFormData({...formData, theme: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-sm" placeholder="Ex: Bolo Casamento" required/></div>
             <div><label className="text-xs text-zinc-400 block mb-1">Sabor / Massa</label><input onChange={e => setFormData({...formData, flavor: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-sm" placeholder="Ex: Red Velvet"/></div>
             <div><label className="text-xs text-zinc-400 block mb-1">Convidados</label><input type="number" onChange={e => setFormData({...formData, guestCount: Number(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-sm" required/></div>
             <div><label className="text-xs text-zinc-400 block mb-1">Valor Total (R$)</label><input type="number" onChange={e => setFormData({...formData, totalAmount: Number(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-sm" /></div>
           </div>
           <button type="submit" className="bg-amber-500 text-zinc-950 px-4 py-2 rounded text-sm font-medium">Salvar Pedido</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map(order => (
          <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
             <div className="flex justify-between items-start mb-2">
                <div className="font-medium text-zinc-100">{order.theme || 'Sem Tema'}</div>
                <div className="text-xs border border-amber-500/30 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">{order.status}</div>
             </div>
             <div className="text-sm text-zinc-400 mb-4">{order.guestCount} Convidados • Sabor: {order.flavor || 'N/A'}</div>
             <div className="flex justify-between text-xs text-zinc-500">
                <span>Data: {order.eventDate ? new Date(order.eventDate).toLocaleDateString() : 'N/A'}</span>
                {order.totalAmount && <span>{formatBRL(order.totalAmount)}</span>}
             </div>
          </div>
        ))}
        {orders.length === 0 && <div className="col-span-3 text-center text-zinc-500 py-8">Nenhuma encomenda registrada.</div>}
      </div>
    </div>
  )
}
