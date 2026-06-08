import { formatBRL } from '../../lib/format';
import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, MessageSquare, Wallet, Users, Settings, Package, Truck, Activity, Bell } from 'lucide-react';
import { Page } from '../../App';
import { useRepositories } from '../../repositories/RepositoryProvider';

interface NavGroup {
  name: string;
  items: { id: string; label: string; icon: any }[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: Page) => void;
  navGroups: NavGroup[];
}

import { BRAND } from '../../lib/brand';

export function CommandPalette({ isOpen, onClose, onNavigate, navGroups }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { customerRepo, orderRepo, productRepo } = useRepositories();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const fetchResults = async () => {
      try {
        const q = query.toLowerCase();
        let newResults: any[] = [];

        // Search navigation
        navGroups.forEach(group => {
          group.items.forEach(item => {
            if (item.label.toLowerCase().includes(q)) {
              newResults.push({ type: 'nav', id: item.id, label: `Ir para ${item.label}`, icon: item.icon });
            }
          });
        });

        // Search customers
        const customers = await customerRepo.getCustomers();
        const matchedCustomers = customers.filter(c => c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q)).slice(0, 3);
        matchedCustomers.forEach(c => {
           newResults.push({ type: 'customer', id: c.id, label: c.name, subLabel: c.phone || c.email, icon: Users });
        });

        // Search products
        const products = await productRepo.getProducts();
        const matchedProducts = products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 3);
        matchedProducts.forEach(p => {
           newResults.push({ type: 'product', id: p.id, label: p.name, subLabel: p.sku, icon: Package });
        });

        // Search orders
        const orders = await orderRepo.getOrders();
        const matchedOrders = orders.filter(o => o.id.toLowerCase().includes(q)).slice(0, 3);
        matchedOrders.forEach(o => {
           newResults.push({ type: 'order', id: o.id, label: `Pedido #${o.id.substring(0, 6)}`, subLabel: `${formatBRL(o.total)}`, icon: ShoppingCart });
        });

        setResults(newResults);
      } catch (err) {
        console.error('Command palette search error', err);
      }
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [query, customerRepo, orderRepo, productRepo, navGroups]);

  if (!isOpen) return null;

  const handleSelect = (item: any) => {
    if (item.type === 'nav') {
      onNavigate(item.id as Page);
      onClose();
    } else if (item.type === 'customer') {
      onNavigate('clientes');
      onClose();
    } else if (item.type === 'product') {
      onNavigate('estoque');
      onClose();
    } else if (item.type === 'order') {
      onNavigate('comercial');
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (query.length > 0 && results.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => {
          const next = (prev + 1) % results.length;
          resultsRef.current?.children[next]?.scrollIntoView({ block: 'nearest' });
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => {
          const next = (prev - 1 + results.length) % results.length;
          resultsRef.current?.children[next]?.scrollIntoView({ block: 'nearest' });
          return next;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    }
  };

  const handleAction = (action: string) => {
      if (action === 'pdv') {
         onNavigate('comercial');
         setTimeout(() => { window.location.hash = '#nova-venda'; }, 100);
      }
      if (action === 'crm') {
         onNavigate('crm');
      }
      if (action === 'finance') {
         onNavigate('financeiro');
         setTimeout(() => { window.location.hash = '#nova-despesa'; }, 100);
      }
      if (action === 'health') onNavigate('conexao');
      if (action === 'alerts') onNavigate('dashboard');
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-all">
        <div className="flex items-center px-4 border-b border-zinc-800/80">
          <Search size={20} className="text-zinc-500 mr-2" />
          <input 
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none py-5 text-lg font-medium text-zinc-100 placeholder:text-zinc-500"
            placeholder="Buscar pedido, cliente, produto, módulo..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="text-[10px] text-zinc-500 font-mono tracking-widest bg-zinc-800 px-2 py-1 rounded">ESC</div>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-2">
           {query.length > 0 ? (
              <div className="py-2">
                 {results.length === 0 ? (
                    <div className="p-4 text-center text-zinc-500 text-sm">Nenhum resultado encontrado para "{query}"</div>
                 ) : (
                    <div ref={resultsRef} className="space-y-1">
                       {results.map((item, idx) => (
                          <button 
                            key={`${item.type}-${item.id}-${idx}`} 
                            onClick={() => handleSelect(item)} 
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors group text-left ${idx === selectedIndex ? 'bg-zinc-800' : 'hover:bg-zinc-800'}`}
                          >
                             <item.icon size={18} className={`transition-colors ${idx === selectedIndex ? 'text-amber-500' : 'text-zinc-400 group-hover:text-amber-500'}`} />
                             <div className="flex flex-col flex-1">
                                <span className={`text-sm font-medium transition-colors ${idx === selectedIndex ? 'text-amber-500' : 'text-zinc-100 group-hover:text-amber-500'}`}>{item.label}</span>
                                {item.subLabel && <span className="text-xs text-zinc-500">{item.subLabel}</span>}
                             </div>
                             <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">{item.type}</span>
                          </button>
                       ))}
                    </div>
                 )}
              </div>
           ) : (
              <>
                 <div className="px-3 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">Ações Rápidas</div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                    <button onClick={() => handleAction('pdv')} className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-colors group">
                       <ShoppingCart size={16} className="text-zinc-400 group-hover:text-emerald-500" />
                       <div className="flex flex-col text-left">
                          <span className="text-sm font-medium text-zinc-100 group-hover:text-emerald-500">Novo Pedido PDV</span>
                          <span className="text-xs text-zinc-500">Abrir frente de caixa</span>
                       </div>
                    </button>
                    <button onClick={() => handleAction('crm')} className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-colors group">
                       <MessageSquare size={16} className="text-zinc-400 group-hover:text-sky-500" />
                       <div className="flex flex-col text-left">
                          <span className="text-sm font-medium text-zinc-100 group-hover:text-sky-500">Nova Campanha CRM</span>
                          <span className="text-xs text-zinc-500">WhatsApp / SMS em massa</span>
                       </div>
                    </button>
                    <button onClick={() => handleAction('finance')} className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-colors group">
                       <Wallet size={16} className="text-zinc-400 group-hover:text-amber-500" />
                       <div className="flex flex-col text-left">
                          <span className="text-sm font-medium text-zinc-100 group-hover:text-amber-500">Lançar Despesa</span>
                          <span className="text-xs text-zinc-500">Registrar saída financeira</span>
                       </div>
                    </button>
                    <button onClick={() => handleAction('alerts')} className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-colors group">
                       <Bell size={16} className="text-zinc-400 group-hover:text-red-500" />
                       <div className="flex flex-col text-left">
                          <span className="text-sm font-medium text-zinc-100 group-hover:text-red-500">Centro de Alertas</span>
                          <span className="text-xs text-zinc-500">Ver pendências e riscos</span>
                       </div>
                    </button>
                    <button onClick={() => handleAction('health')} className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-colors group">
                       <Activity size={16} className="text-zinc-400 group-hover:text-indigo-500" />
                       <div className="flex flex-col text-left">
                          <span className="text-sm font-medium text-zinc-100 group-hover:text-indigo-500">Saúde do Sistema</span>
                          <span className="text-xs text-zinc-500">Status dos providers e API</span>
                       </div>
                    </button>
                 </div>
                 
                 <div className="px-3 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider border-t border-zinc-800/80 pt-4 mt-2">Navegação Principal</div>
                 
                 <div className="grid grid-cols-2 gap-1 px-2 pb-2">
                    {navGroups.flatMap(g => g.items).map(item => (
                       <button key={item.id} onClick={() => { onNavigate(item.id as Page); onClose(); }} className="flex items-center gap-2 text-left px-3 py-2 hover:bg-zinc-800 rounded-lg text-sm text-zinc-300 hover:text-white transition-colors">
                          <item.icon size={14} className="text-zinc-500" />
                          {item.label}
                       </button>
                    ))}
                 </div>
              </>
           )}
        </div>
        <div className="border-t border-zinc-800/80 bg-zinc-950/50 px-4 py-3 flex justify-between items-center">
            <span className="text-xs text-zinc-500">Gestão OS Premium</span>
            <div className="flex gap-2">
               <span className="text-[10px] font-mono tracking-widest bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">↑↓</span>
               <span className="text-[10px] font-mono tracking-widest bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">ENTER</span>
            </div>
        </div>
      </div>
    </div>
  );
}
