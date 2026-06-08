import { formatBRL } from '../lib/format';
import React, { useState, useEffect } from 'react';
import { useRepositories } from '../repositories/RepositoryProvider';
import { safeFetch } from '../repositories/api/apiClient';
import { DigitalMenuCategory, DigitalMenuConfig, DigitalMenuItem } from '../domain/digitalMenu';
import { Order } from '../domain/types';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Drawer } from '../components/ui/Drawer';
import { QrCode, Link as LinkIcon, Plus, Store, Target, Settings, Layers, Package, ShoppingBag, Edit, Copy } from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useConfirm } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';

export function DigitalMenu() {
  const { digitalMenuRepo } = useRepositories();
  const { confirm } = useConfirm();
  const { success, error } = useToast();
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

  const [promptData, setPromptData] = useState<{
    isOpen: boolean;
    type: 'group' | 'option';
    groupId?: string;
    value1: string;
    value2: string;
  }>({
    isOpen: false,
    type: 'group',
    value1: '',
    value2: ''
  });

  const onConfirmPrompt = async () => {
    if (!activeItemForMod) return;
    try {
      if (promptData.type === 'group') {
        if (!promptData.value1) return;
        await digitalMenuRepo.createModifierGroup({
          tenantId: activeItemForMod.tenantId,
          itemId: activeItemForMod.id,
          name: promptData.value1,
          minSelections: 0,
          maxSelections: 1,
          active: true,
          order: 1
        });
        const mods = await digitalMenuRepo.getModifiers(activeItemForMod.id);
        setActiveItemMods(mods);
        success('Grupo adicionado');
      } else if (promptData.type === 'option' && promptData.groupId) {
        if (!promptData.value1) return;
        const optPrice = parseFloat(promptData.value2 || '0');
        await digitalMenuRepo.createModifierOption({
          tenantId: activeItemForMod.tenantId,
          groupId: promptData.groupId,
          name: promptData.value1,
          price: optPrice,
          active: true,
          order: 1
        });
        const mods = await digitalMenuRepo.getModifiers(activeItemForMod.id);
        setActiveItemMods(mods);
        success('Opção adicionada');
      }
      setPromptData({ isOpen: false, type: 'group', value1: '', value2: '' });
    } catch(e) {
      error('Erro ao salvar');
    }
  };

  const addModifierGroup = () => {
       if (!activeItemForMod) return;
       setPromptData({ isOpen: true, type: 'group', value1: '', value2: '' });
  };

  const addModifierOption = (groupId: string) => {
       if (!activeItemForMod) return;
       setPromptData({ isOpen: true, type: 'option', groupId, value1: '', value2: '' });
  };

  const checkMpStatus = async () => {
    try {
      const res = await safeFetch('/api/payments/mercadopago/status');
      if (res.connected !== undefined) setMpStatus(res);
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
    success('Link copiado: ' + url);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Skeleton className="h-[400px]" />
           <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500 p-4 md:p-8">
      <PageHeader
        title="Cardápio Digital & B2C" breadcrumbs={[{label: "Dashboard", href: "#/"}, {label: "Cardápio Digital & B2C"}]}
        description="Gerencie seu cardápio público, vendas online e recepcionamento via KDS."
        action={
          <Button 
            onClick={() => window.open(`/menu/${config?.slug || 'demo'}`, '_blank')}
            variant="outline"
            className="gap-2 border-zinc-700 bg-zinc-900 shadow-lg"
          >
            <Store size={16} className="text-amber-500" />
            Visitar Loja
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/80 w-full md:w-fit mb-6 shadow-sm overflow-x-auto custom-scrollbar">
         {[
           { id: 'overview', label: 'Visão Geral', icon: Target },
           { id: 'orders', label: 'KDS', icon: ShoppingBag },
           { id: 'categories', label: 'Categorias', icon: Layers },
           { id: 'items', label: 'Produtos', icon: Package },
           { id: 'settings', label: 'Ajustes', icon: Settings },
         ].map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all flex flex-none items-center gap-2 ${
               activeTab === tab.id
                 ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                 : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
             }`}
           >
             <tab.icon size={14} />
             {tab.label}
           </button>
         ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl relative overflow-hidden shadow-xl shadow-black/20">
               <div className="absolute top-0 right-0 p-32 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
               <div className="relative z-10 flex flex-col items-start gap-5">
                 <div className="flex items-center gap-3">
                   <div className={`w-3 h-3 rounded-full ${config?.isOpen ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]' : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]'} animate-pulse`}></div>
                   <h3 className="text-2xl font-heading font-medium text-zinc-50 tracking-tight">{config?.publicName || 'Seu Cardápio'}</h3>
                 </div>
                 
                 <p className="text-zinc-400 text-sm max-w-md leading-relaxed">
                   Seu cardápio está {config?.isOpen ? <strong className="text-emerald-400 font-medium">ABERTO</strong> : <strong className="text-red-400 font-medium">FECHADO</strong>}. {config?.isOpen ? 'Compartilhe o link abaixo com seus clientes para receber pedidos.' : 'Ative para começar a receber novos pedidos online.'}
                 </p>
                 
                 <div className="flex items-center gap-2 w-full max-w-md mt-2 relative">
                   <input
                     readOnly
                     value={`${window.location.host}/menu/${config?.slug || 'demo'}`}
                     className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-300 px-4 py-2.5 rounded-xl font-mono text-xs tracking-wide truncate focus:outline-none focus:border-zinc-700"
                   />
                   <Button variant="secondary" onClick={copyLink} className="p-2.5 aspect-square">
                     <Copy size={16} className="text-zinc-400" />
                   </Button>
                 </div>

                 <div className="flex gap-3 mt-4">
                    <Button 
                      variant={config?.isOpen ? "outline" : "primary"}
                      onClick={() => updateConfigStatus(!config?.isOpen)}
                    >
                      {config?.isOpen ? 'Pausar Recebimentos' : 'Abrir Cardápio'}
                    </Button>
                 </div>
               </div>
            </div>
          </div>

          <div className="space-y-4">
             <Card>
               <CardContent className="p-6">
                 <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-5">Métricas de Vendas (Hoje)</h3>
                 <div className="space-y-5">
                   <div className="flex justify-between items-center group">
                     <span className="text-zinc-500 font-medium text-sm group-hover:text-zinc-300 transition-colors">Tickets Processados</span>
                     <span className="text-zinc-50 font-medium text-lg bg-zinc-800 px-3 py-1 rounded-lg">{orders.length}</span>
                   </div>
                   <div className="flex justify-between items-center group">
                     <span className="text-zinc-500 font-medium text-sm group-hover:text-zinc-300 transition-colors">Faturamento Web</span>
                     <span className="text-amber-500 font-medium font-mono text-xl">
                       {formatBRL(orders.reduce((acc, o) => acc + o.total, 0))}
                     </span>
                   </div>
                 </div>
               </CardContent>
             </Card>
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
                                                       <span className="font-mono text-emerald-500">{formatBRL(order.total)}</span>
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
        <Card>
          <div className="p-6">
            <h3 className="font-heading font-medium text-zinc-50 text-lg mb-1">Classificação do Cardápio</h3>
            <p className="text-zinc-400 text-sm mb-6">Cadastre e organize as categorias do seu catálogo público de vendas (ex: Bebidas Frias, Lanches Quentes).</p>
            <div className="divide-y divide-zinc-800/50 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/20">
              {categories.map(c => (
                <div key={c.id} className="p-4 flex justify-between items-center text-sm hover:bg-zinc-800/30 transition-colors group">
                  <span className="text-zinc-300 font-medium group-hover:text-zinc-50 transition-colors">{c.name}</span>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={c.active ? 'Ativa' : 'Oculta'} variant={c.active ? 'success' : 'default'} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'items' && (
        <Card>
          <div className="p-6">
            <h3 className="font-heading font-medium text-zinc-50 text-lg mb-1">Catálogo de Produtos</h3>
            <p className="text-zinc-400 text-sm mb-6">Gerencie preços, disponibilidade e atributos configuráveis para venda online.</p>
            <div className="divide-y divide-zinc-800/50 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/20">
              {items.map(i => (
                <div key={i.id} className="p-4 flex justify-between items-center text-sm hover:bg-zinc-800/30 transition-colors group">
                  <div className="flex flex-col">
                    <span className="text-zinc-300 font-medium group-hover:text-zinc-50 transition-colors">{i.name}</span>
                    <span className="text-amber-500 font-mono text-xs mt-1">{formatBRL(i.price)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                      <StatusBadge status={i.active ? 'Listado' : 'Oculto'} variant={i.active ? 'success' : 'default'} />
                      <Button variant="outline" size="sm" onClick={() => openModifierModal(i)} className="text-amber-500 hover:text-amber-400 py-1 px-3 border-amber-500/20 bg-amber-500/5 h-auto">
                          Configurar Adicionais
                      </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'settings' && (
        <Card>
          <div className="p-6">
            <h3 className="font-heading font-medium text-zinc-50 text-lg mb-6">Parametrização do Cardápio</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[1000px]">
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Nome Público da Loja</label>
                  <Input 
                    value={config?.publicName || ''} 
                    onChange={(e) => setConfig(prev => prev ? {...prev, publicName: e.target.value} : null)}
                    placeholder="Ex: Cofcof.co - Centro" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Taxa Entrega Padrão</label>
                    <Input 
                       type="number" step="0.01" 
                       value={config?.deliveryFee || 0} 
                       onChange={(e) => setConfig(prev => prev ? {...prev, deliveryFee: parseFloat(e.target.value)} : null)} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Pedido Minímo</label>
                    <Input 
                       type="number" step="0.01" 
                       value={config?.minimumOrder || 0} 
                       onChange={(e) => setConfig(prev => prev ? {...prev, minimumOrder: parseFloat(e.target.value)} : null)} 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Preparo Est. (min)</label>
                    <Input 
                       type="number" 
                       value={config?.estimatedPrepMinutes || 0} 
                       onChange={(e) => setConfig(prev => prev ? {...prev, estimatedPrepMinutes: parseInt(e.target.value, 10)} : null)} 
                    />
                  </div>
                  <div className="pt-6">
                    <label className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-zinc-800/30 transition-colors">
                      <div className="relative">
                        <input type="checkbox" className="sr-only" checked={config?.allowOrdersOutsideHours || false} onChange={e => setConfig(prev => prev ? {...prev, allowOrdersOutsideHours: e.target.checked} : null)} />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${config?.allowOrdersOutsideHours ? 'bg-amber-500' : 'bg-zinc-700'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${config?.allowOrdersOutsideHours ? 'transform translate-x-4' : ''}`}></div>
                      </div>
                      <span className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100">Modo Teste/Offline</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Áreas de Entrega (JSON)</label>
                  <Textarea 
                    value={config?.deliveryZonesJson || ''} 
                    onChange={(e) => setConfig(prev => prev ? {...prev, deliveryZonesJson: e.target.value} : null)} 
                    placeholder='[{"name": "Centro", "fee": 5.0, "active": true}]'
                    className="w-full text-xs h-32 resize-none" 
                  />
                </div>
              </div>

              <div className="space-y-5">
                <div className="bg-zinc-950/50 p-5 rounded-2xl border border-zinc-800">
                  <h4 className="text-sm font-medium text-zinc-100 mb-4 flex items-center gap-2"><Store size={16} className="text-amber-500" /> Gateway de Pagamento</h4>
                  <div className="mb-4">
                    <Select value={config?.paymentProvider || 'manual_pix'} onChange={(e) => setConfig(prev => prev ? {...prev, paymentProvider: e.target.value} : null)}>
                      <option value="manual_pix">PIX Manual (Validação Humana)</option>
                      <option value="mercadopago">Mercado Pago (Cartão & PIX Dinâmico)</option>
                    </Select>
                  </div>
                  
                  {(!config?.paymentProvider || config.paymentProvider === 'manual_pix') ? (
                    <div className="pt-2 border-t border-zinc-800">
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 mt-2">Chave PIX Loja</label>
                      <Input 
                        value={config?.pixKeyManual || ''} 
                        onChange={(e) => setConfig(prev => prev ? {...prev, pixKeyManual: e.target.value} : null)} 
                        placeholder="Insira o CPF/CNPJ, E-mail ou Celular" 
                      />
                      <p className="text-[10px] text-zinc-500 mt-2 font-medium leading-relaxed">Instrução: Os clientes verão esta chave no fim do checkout e necessitarão enviar comprovante manualmente.</p>
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-zinc-800">
                      {mpStatus?.status === 'not_configured' || mpStatus?.status === 'disconnected' ? (
                        <div className="space-y-3">
                          <p className="text-xs text-zinc-400 leading-relaxed font-medium">A conta financeira não está conectada. O checkout Mercado Pago está pausado no storefront.</p>
                          <Button 
                             onClick={async () => {
                               try {
                                 const data = await safeFetch('/api/payments/mercadopago/connect-url');
                                 if (data.url) window.location.href = data.url;
                                 else if (data.error) error(`Erro: ${data.message || data.error}`);
                               } catch(e) { error('Erro ao iniciar conexão.'); }
                             }}
                             className="w-full justify-center bg-[#009EE3] hover:bg-[#008ACB] text-white"
                          >
                             Conectar Mercado Pago
                          </Button>
                        </div>
                      ) : mpStatus?.status === 'missing_encryption_key' ? (
                         <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl space-y-2">
                            <p className="text-xs text-red-400 font-bold tracking-wide uppercase flex items-center gap-2">⚠️ Risco de Segurança Acionado</p>
                            <p className="text-[11px] text-red-300/80 leading-relaxed">Variável de criptografia de cofre ausente no backend. Para mitigar riscos vazamentos a integração transacional financeira foi automaticamente bloqueada.</p>
                         </div>
                      ) : mpStatus?.connected ? (
                        <div className="bg-[#009EE3]/10 border border-[#009EE3]/20 p-4 rounded-xl space-y-3 mt-2">
                          <div className="flex items-center justify-between">
                             <p className="text-xs text-[#009EE3] font-bold tracking-wide uppercase flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-[#009EE3] animate-pulse"></div> Conectado Seguro
                             </p>
                             <span className="text-[10px] bg-[#009EE3]/20 text-[#009EE3] px-2 py-0.5 rounded font-mono uppercase">{mpStatus.mode}</span>
                          </div>
                          
                          {mpStatus.status === 'token_expiring' && <p className="text-[11px] text-amber-500 font-medium">⚠️ A credencial irá expirar em breve, favor re-autenticar.</p>}
                          {mpStatus.status === 'expired' && <p className="text-[11px] text-red-500 font-medium">⚠️ A credencial expirou. Risco de falha no checkout.</p>}
                          
                          <button 
                            onClick={() => {
                              safeFetch('/api/payments/mercadopago/disconnect', { method: 'POST' })
                                .then(() => {
                                  checkMpStatus();
                                  success('Autenticação revogada');
                                })
                                .catch(e => error('Erro ao desconectar'));
                            }}
                            className="text-[10px] text-red-400/80 hover:text-red-400 font-medium underline uppercase mt-2 pt-2 border-t border-[#009EE3]/20 w-full text-left"
                          >
                            Revogar Autorização de Acesso (Desconectar)
                          </button>
                        </div>
                      ) : (
                        <div className="py-2"><p className="text-xs text-zinc-500">Autenticando cofre...</p></div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="pt-6 flex justify-end">
                  <Button 
                    onClick={() => config && digitalMenuRepo.updateConfig(config).then(res => success('Alterações salvas!'))}
                    className="w-full sm:w-auto"
                  >
                    Publicar Alterações
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Drawer 
        isOpen={modifierModalOpen} 
        onClose={() => setModifierModalOpen(false)} 
        title={activeItemForMod ? `Adicionais: ${activeItemForMod.name}` : 'Adicionais'}
      >
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-900/50 custom-scrollbar">
          {loadingMods ? (
            <div className="text-sm text-amber-500 flex justify-center py-8 font-medium animate-pulse">Autenticando repositório...</div>
          ) : (
            <div className="space-y-6">
              {activeItemMods.length === 0 ? (
                <div className="text-center py-12 px-6 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-950/50">
                  <p className="text-sm text-zinc-400 mb-6 font-medium">Nenhuma matriz de configuração definida.</p>
                  <Button onClick={addModifierGroup} className="gap-2 shadow-lg shadow-amber-500/10">
                    <Plus size={16} /> Inicializar Novo Grupo
                  </Button>
                </div>
              ) : (
                <>
                  {activeItemMods.map(group => (
                    <div key={group.id} className="bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
                      <div className="flex items-center justify-between p-4 border-b border-zinc-800/50 bg-zinc-900/30">
                        <div>
                          <h3 className="font-semibold text-zinc-100">{group.name}</h3>
                          <p className="text-[10px] text-zinc-500 font-mono tracking-widest mt-1 uppercase">Limites: Min {group.minSelections} - Max {group.maxSelections}</p>
                        </div>
                        <Button 
                          variant="danger" size="sm"
                          onClick={async () => {
                            const proceed = await confirm({
                              title: 'Atenção',
                              description: 'Operação destrutiva: Remover grupo de modificado?',
                              confirmText: 'Sim, Remover',
                              isDestructive: true
                            });
                            if(proceed) {
                              await digitalMenuRepo.deleteModifierGroup(group.id);
                              setActiveItemMods(await digitalMenuRepo.getModifiers(activeItemForMod!.id));
                            }
                          }}
                        >Dropar Grupo</Button>
                      </div>
                      <div className="p-4 space-y-3">
                        {group.options && group.options.map((opt:any) => (
                          <div key={opt.id} className="flex justify-between items-center bg-zinc-900/50 py-2.5 px-4 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
                            <span className="text-sm font-medium text-zinc-300">{opt.name}</span>
                            <div className="flex items-center gap-6">
                              <span className="text-xs font-mono font-medium text-amber-500">{formatBRL(opt.price)}</span>
                              <Button 
                                variant="outline" size="sm" 
                                className="h-6 text-[10px] px-2 text-red-500 border-red-500/20 hover:bg-red-500/10"
                                onClick={async () => {
                                  await digitalMenuRepo.deleteModifierOption(opt.id);
                                  setActiveItemMods(await digitalMenuRepo.getModifiers(activeItemForMod!.id));
                                }} 
                              >
                                Del
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button 
                          variant="outline" 
                          onClick={() => addModifierOption(group.id)} 
                          className="w-full mt-3 py-3 border border-dashed border-zinc-800 hover:border-amber-500 text-zinc-500 hover:text-amber-500 rounded-xl text-sm transition-colors flex justify-center items-center gap-2 font-medium bg-zinc-950/20 hover:bg-amber-500/5"
                        >
                          <Plus size={16} /> Incluir Opção
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    variant="outline"
                    onClick={addModifierGroup} 
                    className="w-full py-4 border border-zinc-800 hover:border-amber-500 hover:bg-amber-500/5 text-zinc-400 hover:text-amber-500 rounded-xl text-sm transition-colors flex justify-center items-center gap-2 font-medium shadow-sm"
                  >
                    <Plus size={18} /> Alocar Novo Grupo
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
        <div className="p-6 border-t border-zinc-800/50 bg-zinc-950 flex justify-end">
          <Button variant="primary" onClick={() => setModifierModalOpen(false)}>
            Concluído
          </Button>
        </div>
      </Drawer>

      {promptData.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
             <h3 className="text-lg font-medium text-white mb-4">
                {promptData.type === 'group' ? 'Novo Grupo' : 'Nova Opção'}
             </h3>
             <div className="space-y-4">
               <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Nome {promptData.type === 'group' ? 'do Grupo (ex: Adicionais)' : 'da Opção (ex: Bacon)'}</label>
                  <input autoFocus type="text" value={promptData.value1} onChange={e => setPromptData({...promptData, value1: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
               </div>
               {promptData.type === 'option' && (
                 <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Preço (0 para grátis)</label>
                    <input type="number" step="0.01" value={promptData.value2} onChange={e => setPromptData({...promptData, value2: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
                 </div>
               )}
               <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" onClick={() => setPromptData({ isOpen: false, type: 'group', value1: '', value2: '' })}>Cancelar</Button>
                  <Button variant="primary" onClick={onConfirmPrompt}>Salvar</Button>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
