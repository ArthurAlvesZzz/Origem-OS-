import React, { useState, useEffect } from 'react';
import { useRepositories } from '../repositories/RepositoryProvider';
import { DigitalMenuCategory, DigitalMenuConfig, DigitalMenuItem } from '../domain/digitalMenu';
import { Order } from '../domain/types';
import { PageHeader } from '../components/ui/PageHeader';
import { QrCode, Link as LinkIcon, Plus, Store, Check, Target, Settings, Layers, Package, ShoppingBag } from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';

export function DigitalMenu() {
  const { digitalMenuRepo } = useRepositories();
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'items' | 'orders' | 'settings'>('overview');
  const [config, setConfig] = useState<DigitalMenuConfig | null>(null);
  const [categories, setCategories] = useState<DigitalMenuCategory[]>([]);
  const [items, setItems] = useState<DigitalMenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [mpStatus, setMpStatus] = useState<{ connected: boolean; status?: string; mode?: string; publicKey?: string } | null>(null);

  // Modifiers
  const [modifierModalOpen, setModifierModalOpen] = useState(false);
  const [activeItemForMod, setActiveItemForMod] = useState<DigitalMenuItem | null>(null);
  const [activeItemMods, setActiveItemMods] = useState<any[]>([]);
  const [loadingMods, setLoadingMods] = useState(false);

  useEffect(() => {
    loadData();
    checkMpStatus();
  }, []);

  const openModifierModal = async (item: DigitalMenuItem) => {
      setActiveItemForMod(item);
      setModifierModalOpen(true);
      setLoadingMods(true);
      try {
          const mods = await digitalMenuRepo.getModifiers(item.id);
          setActiveItemMods(mods);
      } catch(e) {} finally {
          setLoadingMods(false);
      }
  };

  const addModifierGroup = async () => {
       if (!activeItemForMod) return;
       const grpName = prompt('Nome do Grupo (ex: Escolha a Carne, Adicionais)');
       if (!grpName) return;
       try {
           await digitalMenuRepo.createModifierGroup({
               tenantId: activeItemForMod.tenantId,
               itemId: activeItemForMod.id,
               name: grpName,
               minSelections: 0,
               maxSelections: 1,
               active: true,
               order: 1
           });
           const mods = await digitalMenuRepo.getModifiers(activeItemForMod.id);
           setActiveItemMods(mods);
       } catch(e) { alert('Erro'); }
  };

  const addModifierOption = async (groupId: string) => {
       if (!activeItemForMod) return;
       const optName = prompt('Nome da Opção (ex: Ponto da Carne, Bacon)');
       if (!optName) return;
       const optPrice = parseFloat(prompt('Preço (ex: 2.50) - 0 para grátis', '0') || '0');
       try {
           await digitalMenuRepo.createModifierOption({
               tenantId: activeItemForMod.tenantId,
               groupId,
               name: optName,
               price: optPrice,
               active: true,
               order: 1
           });
           const mods = await digitalMenuRepo.getModifiers(activeItemForMod.id);
           setActiveItemMods(mods);
       } catch(e) { alert('Erro'); }
  };

  const checkMpStatus = async () => {
    try {
      const res = await fetch('/api/payments/mercadopago/status', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('AUTH_TOKEN')}` }
      });
      const data = await res.json();
      if (data.connected !== undefined) setMpStatus(data);
    } catch(e) {}
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [_config, _cats, _items, _orders] = await Promise.all([
        digitalMenuRepo.getConfig(),
        digitalMenuRepo.getCategories(),
        digitalMenuRepo.getItems(),
        digitalMenuRepo.getOrders()
      ]);
      setConfig(_config);
      setCategories(_cats);
      setItems(_items);
      setOrders(_orders);
    } catch (e) {
      console.error('Failed to load digital menu data', e);
    } finally {
      setLoading(false);
    }
  };

  const updateConfigStatus = async (isOpen: boolean) => {
    if (!config) return;
    const updated = await digitalMenuRepo.updateConfig({ isOpen });
    setConfig(updated);
  };

  const copyLink = () => {
    if (!config?.slug) return;
    const url = `${window.location.origin}/menu/${config.slug}`;
    navigator.clipboard.writeText(url);
    alert('Link copiado: ' + url);
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Carregando Cardápio Digital...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cardápio Digital"
        description="Gerencie seu cardápio público e pedidos online"
        action={
          <button 
            onClick={() => window.open(`/menu/${config?.slug || 'demo'}`, '_blank')}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-50 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Store size={18} />
            Ver Cardápio
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex bg-zinc-900 overflow-x-auto p-1 border border-zinc-800/50 rounded-xl max-w-fit">
         {[
           { id: 'overview', label: 'Visão Geral', icon: Target },
           { id: 'categories', label: 'Categorias', icon: Layers },
           { id: 'items', label: 'Itens', icon: Package },
           { id: 'orders', label: 'Pedidos', icon: ShoppingBag },
           { id: 'settings', label: 'Configurações', icon: Settings },
         ].map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
               activeTab === tab.id
                 ? 'bg-zinc-800 text-amber-500 shadow-sm'
                 : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
             }`}
           >
             <tab.icon size={16} />
             {tab.label}
           </button>
         ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden">
               <div className="relative z-10 flex flex-col items-start gap-4">
                 <div className="flex items-center gap-3">
                   <div className={`w-3 h-3 rounded-full ${config?.isOpen ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                   <h3 className="text-xl font-heading font-medium text-zinc-50">{config?.publicName || 'Cardápio Digital'}</h3>
                 </div>
                 
                 <p className="text-zinc-400 text-sm max-w-md">
                   Seu cardápio está {config?.isOpen ? 'aberto para receber pedidos' : 'fechado temporariamente'}. 
                   Compartilhe o link abaixo com seus clientes.
                 </p>
                 
                 <div className="flex items-center gap-2 w-full max-w-sm mt-2">
                   <div className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-300 px-3 py-2 rounded-lg font-mono text-sm truncate">
                     {window.location.host}/menu/{config?.slug || 'demo'}
                   </div>
                   <button onClick={copyLink} className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors">
                     <LinkIcon size={18} />
                   </button>
                 </div>

                 <div className="flex gap-3 mt-4">
                   <button 
                     onClick={() => updateConfigStatus(!config?.isOpen)}
                     className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                       config?.isOpen 
                         ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' 
                         : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                     }`}
                   >
                     {config?.isOpen ? 'Pausar Pedidos' : 'Abrir Cardápio'}
                   </button>
                 </div>
               </div>
            </div>
          </div>

          <div className="space-y-4">
             <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
               <h3 className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-4">Métricas Hoje</h3>
               <div className="space-y-4">
                 <div className="flex justify-between items-center">
                   <span className="text-zinc-300 text-sm">Pedidos Totais</span>
                   <span className="text-zinc-50 font-medium">{orders.length}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-zinc-300 text-sm">Faturamento</span>
                   <span className="text-amber-500 font-medium font-mono">
                     R$ {orders.reduce((acc, o) => acc + o.total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                   </span>
                 </div>
               </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
                <h3 className="font-medium text-zinc-50 flex items-center gap-2 text-lg">
                    <ShoppingBag size={20} className="text-amber-500" />
                    Kitchen Display System (KDS)
                </h3>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {['received', 'preparing', 'ready', 'out_for_delivery'].map(status => {
                    const colOrders = orders.filter(o => o.status === status);
                    const titles: Record<string, string> = {
                        'received': 'Análise (Novos)',
                        'preparing': 'Produção Cozinha',
                        'ready': 'Despacho Balcão',
                        'out_for_delivery': 'Transporte'
                    };
                    const titleColors: Record<string, string> = {
                        'received': 'text-sky-500 border-sky-500/20 bg-sky-500/10',
                        'preparing': 'text-amber-500 border-amber-500/20 bg-amber-500/10',
                        'ready': 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10',
                        'out_for_delivery': 'text-violet-400 border-violet-400/20 bg-violet-400/10'
                    };

                    return (
                        <div key={status} className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-4 min-w-[340px] max-w-[340px] shrink-0 flex flex-col h-[70vh]">
                            <div className={`px-4 py-2 border rounded-xl mb-4 flex justify-between items-center ${titleColors[status]}`}>
                                <h4 className="font-bold text-sm tracking-wide uppercase">{titles[status]}</h4>
                                <span className="bg-zinc-950/50 text-zinc-300 font-mono text-xs px-2 py-0.5 rounded-md">{colOrders.length}</span>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-zinc-700">
                                {colOrders.length === 0 ? (
                                    <div className="text-xs text-zinc-600 font-medium text-center py-10 border-2 border-dashed border-zinc-800/50 rounded-xl">Nenhum ticket aqui</div>
                                ) : (
                                    colOrders.map(order => (
                                        <div key={order.id} className="bg-zinc-950 border border-zinc-800 hover:border-amber-500/50 group rounded-xl p-4 shadow-sm flex flex-col gap-3 transition-colors relative overflow-hidden">
                                           <div className="absolute top-0 left-0 w-1 h-full bg-zinc-800 group-hover:bg-amber-500 transition-colors"></div>
                                            <div className="flex justify-between items-start pl-2">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                       <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">TICKET</span>
                                                       <span className="text-xs font-mono font-bold text-amber-500">#{(order as any).trackingNumber || order.id.substring(0,6)}</span>
                                                    </div>
                                                    <div className="font-heading font-medium text-zinc-100 text-lg">{order.customer || 'Balcão Expresso'}</div>
                                                    <div className="text-xs text-zinc-500 flex items-center gap-2 mt-1">
                                                       <span>{new Date(order.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                       <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                                                       <span className="font-mono text-emerald-500">R$ {order.total.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2 mt-1 mx-2">
                                                {/* Itens do pedido (virão na modelagem completa, por hora exibimos qtd) */}
                                                <div className="text-sm font-medium text-zinc-300">
                                                    {(order as any).itemsDetails ? (order as any).itemsDetails.map((i:any, j:number) => (
                                                        <div key={j} className="mb-2 last:mb-0">
                                                           <div className="flex gap-2">
                                                              <div className="font-mono text-amber-500">{i.qty}x</div>
                                                              <div className="text-zinc-100">{i.name}</div>
                                                           </div>
                                                           {i.modifiers && i.modifiers.length > 0 && (
                                                              <div className="text-xs text-zinc-500 pl-6 mt-1 border-l-2 border-zinc-700/50 ml-1.5 flex flex-wrap gap-1">
                                                                 {i.modifiers.map((m:any, idx:number) => (
                                                                    <span key={idx} className="bg-zinc-800/80 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">{m.name}</span>
                                                                 ))}
                                                              </div>
                                                           )}
                                                        </div>
                                                    )) : <div className="text-zinc-400 p-2 text-center text-xs">{order.items} Itens (Sem detalhe)</div>}
                                                </div>
                                                {(order as any).notes && (
                                                    <div className="mt-2 text-xs font-medium text-red-400 bg-red-400/10 p-2.5 rounded-lg border border-red-500/20 uppercase tracking-wide">
                                                        OBS: {(order as any).notes}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-zinc-800/50 mx-2">
                                                {status === 'received' && (
                                                    <button onClick={() => digitalMenuRepo.updateOrderStatus(order.id, 'preparing').then(loadData)} className="col-span-2 bg-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-amber-950 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">Aceitar Pedido</button>
                                                )}
                                                {status === 'preparing' && (
                                                    <button onClick={() => digitalMenuRepo.updateOrderStatus(order.id, 'ready').then(loadData)} className="col-span-2 bg-sky-500/20 text-sky-500 hover:bg-sky-500 hover:text-sky-950 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">Pronto p/ Despacho</button>
                                                )}
                                                {status === 'ready' && (
                                                    <button onClick={() => digitalMenuRepo.updateOrderStatus(order.id, 'out_for_delivery').then(loadData)} className="col-span-2 bg-violet-500/20 text-violet-400 hover:bg-violet-500 hover:text-violet-950 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">Saiu p/ Entrega</button>
                                                )}
                                                {status === 'out_for_delivery' && (
                                                    <button onClick={() => digitalMenuRepo.updateOrderStatus(order.id, 'delivered').then(loadData)} className="col-span-2 bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-emerald-950 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">Pedido Concluído</button>
                                                )}
                                                
                                                <div className="col-span-2 flex justify-between mt-1">
                                                   <button 
                                                       onClick={() => window.open(`https://wa.me/?text=Olá ${order.customer}, seu pedido ${(order as any).trackingNumber} está em status: ${titles[status]}.`, '_blank')}
                                                       className="flex-1 flex justify-center items-center gap-1.5 p-1.5 hover:bg-emerald-500/10 text-emerald-500 rounded-lg transition-colors title='Notificar WhatsApp'"
                                                   >
                                                       <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.666.598 1.216.774 1.391.858.174.086.275.072.376-.043.1-.115.433-.505.549-.683.116-.173.231-.145.39-.087s1.011.477 1.184.562c.173.089.289.132.332.204.043.072.043.419-.101.824z"/></svg>
                                                       <span className="text-[10px] font-bold">WhatsApp</span>
                                                   </button>
                                                   <button onClick={() => window.print()} className="flex-1 flex justify-center items-center gap-1.5 p-1.5 hover:bg-zinc-800 text-zinc-400 rounded-lg transition-colors title='Imprimir Comanda'">
                                                       <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                                       <span className="text-[10px] font-bold">Imprimir</span>
                                                   </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* Style isolada para a impressão de comanda para ocultar elementos não necessários */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    body * { visibility: hidden; }
                    .print-comanda, .print-comanda * { visibility: visible; }
                    .print-comanda { position: absolute; left: 0; top: 0; width: 80mm; font-family: monospace; font-size: 12px; }
                }
            `}} />
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden p-6">
          <h3 className="font-medium text-zinc-50 mb-4">Categorias do Cardápio</h3>
          <p className="text-zinc-400 text-sm mb-6">Cadastre as categorias para organizar seu cardápio (ex: Bebidas, Lanches)</p>
          <div className="divide-y divide-zinc-800">
            {categories.map(c => (
              <div key={c.id} className="py-3 flex justify-between items-center text-sm">
                <span className="text-zinc-300 font-medium">{c.name}</span>
                <span className="text-zinc-500 text-xs px-2 py-1 bg-zinc-800 rounded">{c.active ? 'Ativa' : 'Inativa'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'items' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden p-6">
          <h3 className="font-medium text-zinc-50 mb-4">Itens do Cardápio</h3>
          <p className="text-zinc-400 text-sm mb-6">Produtos disponíveis para venda online.</p>
          <div className="divide-y divide-zinc-800">
            {items.map(i => (
              <div key={i.id} className="py-3 flex justify-between items-center text-sm">
                <div className="flex flex-col">
                  <span className="text-zinc-300 font-medium">{i.name}</span>
                  <span className="text-zinc-500 text-xs">R$ {i.price.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-zinc-500 text-xs px-2 py-1 bg-zinc-800 rounded">{i.active ? 'Ativo' : 'Inativo'}</span>
                    <button onClick={() => openModifierModal(i)} className="text-xs text-amber-500 hover:text-amber-400 font-medium border border-amber-500/30 px-3 py-1.5 rounded-lg transition-colors bg-amber-500/10">
                        Adicionais/Opções
                    </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden p-6">
          <h3 className="font-medium text-zinc-50 mb-4">Configurações Base</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Nome Público</label>
                <input type="text" value={config?.publicName || ''} onChange={(e) => setConfig(prev => prev ? {...prev, publicName: e.target.value} : null)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 text-sm focus:border-amber-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Taxa Entrega Padrão (R$)</label>
                  <input type="number" step="0.01" value={config?.deliveryFee || 0} onChange={(e) => setConfig(prev => prev ? {...prev, deliveryFee: parseFloat(e.target.value)} : null)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 text-sm focus:border-amber-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Pedido Min (R$)</label>
                  <input type="number" step="0.01" value={config?.minimumOrder || 0} onChange={(e) => setConfig(prev => prev ? {...prev, minimumOrder: parseFloat(e.target.value)} : null)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 text-sm focus:border-amber-500 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Preparo (min)</label>
                  <input type="number" value={config?.estimatedPrepMinutes || 0} onChange={(e) => setConfig(prev => prev ? {...prev, estimatedPrepMinutes: parseInt(e.target.value, 10)} : null)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 text-sm focus:border-amber-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Modo Offline / Teste</label>
                  <label className="flex items-center gap-2 mt-2 w-full text-zinc-300 text-sm cursor-pointer">
                    <input type="checkbox" checked={config?.allowOrdersOutsideHours || false} onChange={e => setConfig(prev => prev ? {...prev, allowOrdersOutsideHours: e.target.checked} : null)} className="rounded border-zinc-700 bg-zinc-900 focus:ring-amber-500" />
                    <span>Habilitar testes mesmo fechado</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Áreas de Entrega (JSON Avançado)</label>
                <textarea 
                  value={config?.deliveryZonesJson || ''} 
                  onChange={(e) => setConfig(prev => prev ? {...prev, deliveryZonesJson: e.target.value} : null)} 
                  placeholder='[{"name": "Centro", "fee": 5.0, "active": true}]'
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 font-mono text-xs focus:border-amber-500 focus:outline-none h-24 resize-none" 
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Provedor de Pagamento</label>
                <select value={config?.paymentProvider || 'manual_pix'} onChange={(e) => setConfig(prev => prev ? {...prev, paymentProvider: e.target.value} : null)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 text-sm focus:border-amber-500 focus:outline-none">
                  <option value="manual_pix">PIX Manual / Offline</option>
                  <option value="mercadopago">Mercado Pago (Checkout Pro)</option>
                </select>
              </div>
              
              {(!config?.paymentProvider || config.paymentProvider === 'manual_pix') ? (
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Chave PIX Manual</label>
                  <input type="text" value={config?.pixKeyManual || ''} onChange={(e) => setConfig(prev => prev ? {...prev, pixKeyManual: e.target.value} : null)} placeholder="ex: CNPJ, Email ou Celular" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 text-sm focus:border-amber-500 focus:outline-none" />
                  <p className="text-[10px] text-zinc-500 mt-1">Esta chave será exibida para o cliente copiar e colar. A baixa é manual.</p>
                </div>
              ) : (
                <div className="p-4 bg-zinc-950 border border-amber-900/30 rounded-lg">
                  <p className="text-sm text-zinc-300 mb-2 font-medium flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div> Mercago Pago Checkout Pro
                  </p>
                  
                  {mpStatus?.status === 'not_configured' || mpStatus?.status === 'disconnected' ? (
                    <div className="mt-2 space-y-3">
                      <p className="text-xs text-zinc-400">Conta não conectada. Permite receber cartões e PIX dinâmico.</p>
                      <button 
                         onClick={async () => {
                           try {
                             const res = await fetch('/api/payments/mercadopago/connect-url', { headers: { 'Authorization': `Bearer ${localStorage.getItem('AUTH_TOKEN')}` }});
                             const data = await res.json();
                             if (data.url) window.location.href = data.url;
                             else if (data.error) alert(`Erro: ${data.message || data.error}`);
                           } catch(e) { alert('Erro ao iniciar conexão.'); }
                         }}
                         className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                      >
                         Conectar Integrador
                      </button>
                    </div>
                  ) : mpStatus?.status === 'missing_encryption_key' ? (
                     <div className="mt-2 space-y-3">
                        <p className="text-xs text-red-400 font-medium tracking-wide uppercase">Falha de Segurança no Servidor</p>
                        <p className="text-xs text-zinc-400">A chave de criptografia de pagamentos não está configurada no servidor. Por segurança, a integração Mercado Pago está desabilitada.</p>
                     </div>
                  ) : mpStatus?.connected ? (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-emerald-500 font-medium tracking-wide uppercase">
                        Conectado ({mpStatus.mode}) 
                        {mpStatus.status === 'token_expiring' && <span className="text-amber-500 ml-2">⚠️ Expirando</span>}
                        {mpStatus.status === 'expired' && <span className="text-red-500 ml-2">⚠️ Expirado</span>}
                      </p>
                      <button 
                        onClick={() => {
                          fetch('/api/payments/mercadopago/disconnect', { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('AUTH_TOKEN')}` }})
                            .then(() => checkMpStatus());
                        }}
                        className="text-xs text-red-400 underline hover:text-red-300"
                      >
                        Desconectar Conta
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2"><p className="text-xs text-zinc-500">Carregando status...</p></div>
                  )}
                </div>
              )}
              
              <div className="pt-4 border-t border-zinc-800">
                <button 
                  onClick={() => config && digitalMenuRepo.updateConfig(config).then(res => alert('Salvo!'))}
                  className="bg-amber-600 hover:bg-amber-500 text-amber-50 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                >
                  Salvar Configurações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modifier Modal */}
      {modifierModalOpen && activeItemForMod && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4">
              <div className="bg-zinc-900 w-full max-w-2xl rounded-2xl border border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
                      <div>
                          <h2 className="text-xl font-heading font-medium text-zinc-50">Adicionais: {activeItemForMod.name}</h2>
                          <p className="text-sm text-zinc-400 mt-1">Configure os modificadores para este item (ex: ponto da carne, acompanhamentos).</p>
                      </div>
                      <button onClick={() => setModifierModalOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-5 bg-zinc-950/50">
                      {loadingMods ? (
                          <div className="text-sm text-amber-500 flex justify-center py-8">Carregando grupos...</div>
                      ) : (
                          <div className="space-y-6">
                              {activeItemMods.length === 0 ? (
                                  <div className="text-center py-10 border border-dashed border-zinc-700 rounded-xl bg-zinc-900/50">
                                      <p className="text-sm text-zinc-400 mb-4">Nenhum adicional configurado para este item.</p>
                                      <button onClick={addModifierGroup} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2">
                                          <Plus size={16} /> Criar Primeiro Grupo
                                      </button>
                                  </div>
                              ) : (
                                  <>
                                      {activeItemMods.map(group => (
                                          <div key={group.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                                              <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-800/30">
                                                  <div>
                                                      <h3 className="font-medium text-zinc-100">{group.name}</h3>
                                                      <p className="text-[11px] text-zinc-400 uppercase tracking-widest mt-1">Mínimo: {group.minSelections} | Máximo: {group.maxSelections}</p>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                      <button 
                                                          className="text-xs px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"
                                                          onClick={async () => {
                                                              if(confirm('Remover grupo e todas opções?')) {
                                                                  await digitalMenuRepo.deleteModifierGroup(group.id);
                                                                  setActiveItemMods(await digitalMenuRepo.getModifiers(activeItemForMod.id));
                                                              }
                                                          }}
                                                      >Remover</button>
                                                  </div>
                                              </div>
                                              <div className="p-4 space-y-2">
                                                  {group.options && group.options.map((opt:any) => (
                                                      <div key={opt.id} className="flex justify-between items-center bg-zinc-950 py-2 px-3 rounded-lg border border-zinc-800/50">
                                                          <span className="text-sm text-zinc-300">{opt.name}</span>
                                                          <div className="flex items-center gap-4">
                                                              <span className="text-xs font-mono text-zinc-500">R$ {opt.price.toFixed(2)}</span>
                                                              <button onClick={async () => {
                                                                  await digitalMenuRepo.deleteModifierOption(opt.id);
                                                                  setActiveItemMods(await digitalMenuRepo.getModifiers(activeItemForMod.id));
                                                              }} className="text-xs text-red-500 hover:text-red-400">Excluir</button>
                                                          </div>
                                                      </div>
                                                  ))}
                                                  <button onClick={() => addModifierOption(group.id)} className="w-full mt-2 py-2 border border-dashed border-zinc-700 hover:border-amber-500 hover:text-amber-500 text-zinc-500 rounded-lg text-sm transition-colors flex justify-center items-center gap-2">
                                                      <Plus size={16} /> Adicionar Opção
                                                  </button>
                                              </div>
                                          </div>
                                      ))}
                                      
                                      <button onClick={addModifierGroup} className="w-full py-4 border border-zinc-800 hover:border-amber-500 hover:bg-amber-500/5 text-zinc-400 hover:text-amber-500 rounded-xl text-sm transition-colors flex justify-center items-center gap-2 font-medium">
                                          <Plus size={18} /> Novo Grupo de Adicionais
                                      </button>
                                  </>
                              )}
                          </div>
                      )}
                  </div>
                  <div className="p-5 border-t border-zinc-800 flex justify-end">
                      <button onClick={() => setModifierModalOpen(false)} className="bg-amber-600 hover:bg-amber-500 text-amber-50 px-6 py-2 rounded-lg font-medium text-sm transition-colors">
                          Fechar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
