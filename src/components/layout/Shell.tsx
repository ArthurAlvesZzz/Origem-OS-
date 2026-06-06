import { type ReactNode, useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, Factory, 
  Wallet, Users, FileText, Settings, Bell, Plus, Coffee, Briefcase, Layers, Server, Search, MessageSquare, Menu, Command
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Page } from '../../App';
import { CommandPalette } from './CommandPalette';

interface ShellProps {
  children: ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navGroups = [
  {
    name: 'Operação',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'comercial', label: 'PDV / Pedidos', icon: ShoppingCart },
      { id: 'digital_menu', label: 'Cardápio Digital', icon: Layers },
      { id: 'producao', label: 'Produção', icon: Factory },
      { id: 'estoque', label: 'Estoque', icon: Package },
    ]
  },
  {
    name: 'Comercial',
    items: [
      { id: 'crm', label: 'CRM / Campanhas', icon: MessageSquare },
      { id: 'clientes', label: 'Clientes', icon: Users },
      { id: 'catalogo', label: 'Catálogo', icon: Briefcase },
      { id: 'b2bcatalog', label: 'Pedidos B2B', icon: Coffee },
      { id: 'consignacao', label: 'Consignação', icon: Briefcase },
    ]
  },
  {
    name: 'Financeiro',
    items: [
      { id: 'financeiro', label: 'Financeiro', icon: Wallet },
      { id: 'assinaturas', label: 'Billing SaaS', icon: Wallet },
      { id: 'fiscal', label: 'Fiscal', icon: FileText },
      { id: 'relatorios', label: 'Relatórios', icon: FileText },
    ]
  },
  {
    name: 'Sistema',
    items: [
      { id: 'rh', label: 'Equipe', icon: Users },
      { id: 'config', label: 'Configurações', icon: Settings },
      { id: 'conexao', label: 'Saúde / Conexão', icon: Server },
    ]
  }
];

export function Shell({ children, currentPage, onNavigate }: ShellProps) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const mobileNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'digital_menu', label: 'Cardápio', icon: Layers },
    { id: 'crm', label: 'CRM', icon: MessageSquare },
    { id: 'financeiro', label: 'Finanças', icon: Wallet },
    { id: 'conexao', label: 'Menu', icon: Menu }, 
  ];

  const getPageTitle = () => {
    if (currentPage === 'rh') return 'Equipe';
    if (currentPage === 'b2bcatalog') return 'Pedidos B2B';
    if (currentPage === 'digital_menu') return 'Cardápio Digital';
    return currentPage.replace('_', ' ');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col md:flex-row text-zinc-50 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 bg-zinc-950 border-r border-zinc-900 border-opacity-50 z-50">
        <div className="h-16 flex items-center px-6">
          <div className="flex items-center gap-2 text-zinc-50">
            <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 rounded shadow-md drop-shadow-md">
              <span className="text-zinc-100 font-heading font-black text-lg leading-none tracking-tighter">G</span>
            </div>
            <span className="font-heading font-bold text-xl tracking-tight text-zinc-100">GestaoOS</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
          {navGroups.map((group) => (
            <div key={group.name}>
              <div className="px-3 mb-2 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">{group.name}</div>
              <div className="space-y-0.5">
                {group.items.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => onNavigate(id as Page)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 relative overflow-hidden group",
                      currentPage === id 
                        ? "bg-zinc-800/80 text-zinc-100 font-semibold shadow-sm border border-zinc-700/30" 
                        : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200"
                    )}
                  >
                    {currentPage === id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] rounded-r flex-shrink-0" />}
                    <Icon size={16} className={cn("transition-colors flex-shrink-0 z-10", currentPage === id ? "text-amber-500" : "text-zinc-500 group-hover:text-zinc-400")} />
                    <span className="z-10">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-zinc-900 flex flex-col gap-2">
          <div className="flex items-center gap-2 px-2 py-1">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
             <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Mock Mode</span>
          </div>
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-zinc-900/50 transition-colors cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-[#100C08] border border-[#C59868]/30 flex items-center justify-center text-xs font-bold text-[#C59868] shadow-sm">
              CO
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-medium text-zinc-100 leading-tight">COFCOF.CO</span>
              <span className="text-[10px] uppercase tracking-wider text-[#C59868] font-semibold">Premium</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen pb-16 md:pb-0 relative">
          {/* App Header */}
          <header className="h-[72px] bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900/50 sticky top-0 z-40 px-6 md:px-8 flex items-center justify-between transition-all">
            <h1 className="text-xl md:text-2xl font-heading font-semibold text-zinc-100 tracking-tight capitalize">
              {getPageTitle()}
            </h1>
            
            <div className="hidden md:flex items-center gap-4 flex-1 max-w-md mx-8">
               <div className="relative w-full cursor-pointer" onClick={() => setIsCommandPaletteOpen(true)}>
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <div className="w-full bg-zinc-900/50 border border-zinc-800/80 text-sm rounded-full pl-10 pr-4 py-2 text-zinc-500 flex justify-between items-center hover:bg-zinc-900 transition-colors">
                     <span>Buscar pedido, cliente...</span>
                     <span className="text-[10px] font-mono tracking-widest bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">⌘K</span>
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                 onClick={() => onNavigate('dashboard')}
                 className="relative w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-full transition-colors border border-transparent hover:border-zinc-800">
                <Bell size={18} className="stroke-[2]" />
                <span className="absolute top-2.5 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-zinc-950"></span>
              </button>
              <button 
                 onClick={() => setIsCommandPaletteOpen(true)}
                 className="hidden md:flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-amber-950 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
              >
                <Plus size={16} className="stroke-[3]" />
                Nova Ação
              </button>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-x-hidden p-4 md:p-8">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-900 z-50 px-2 pb-safe-bottom pt-2 pb-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-around">
            {mobileNavItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onNavigate(id as Page)}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-2 gap-1.5 transition-colors rounded-xl",
                  currentPage === id ? "text-amber-500" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Icon size={22} className={cn("stroke-[1.5]", currentPage === id && "stroke-[2]")} />
                <span className="text-[10px] font-medium tracking-wide">{label}</span>
              </button>
            ))}
          </div>
        </nav>
        
        <CommandPalette 
           isOpen={isCommandPaletteOpen} 
           onClose={() => setIsCommandPaletteOpen(false)} 
           onNavigate={onNavigate} 
           navGroups={navGroups}
        />
      </div>
    );
  }

