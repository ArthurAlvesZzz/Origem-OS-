import { type ReactNode, useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, Factory, 
  Wallet, Users, FileText, Settings, Bell, Plus, Coffee, Briefcase, Layers, Server, Search, MessageSquare, Menu, PanelLeftClose, PanelLeftOpen, ShoppingBag
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Page } from '../../App';
import { CommandPalette } from './CommandPalette';
import { BRAND } from '../../lib/brand';
import { useRepositories } from '../../repositories/RepositoryProvider';
import { motion, AnimatePresence } from 'motion/react';

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
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Collapse state & Persistence
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('gestaoos_sidebar_collapsed') === 'true';
  });

  const { actualType } = useRepositories();
  
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

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      if (w >= 768 && w < 1024) {
        setIsCollapsed(true);
      } else if (w >= 1024) {
        const userPref = localStorage.getItem('gestaoos_sidebar_collapsed');
        if (userPref === 'false') setIsCollapsed(false);
      }
    };
    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-collapse logic for dense pages
  useEffect(() => {
    const densePages = ['comercial', 'producao', 'estoque', 'crm', 'b2bcatalog', 'relatorios'];
    const simplePages = ['dashboard', 'config', 'conexao'];

    const userPreference = localStorage.getItem('gestaoos_sidebar_collapsed');
    
    // Only auto-adjust if the user hasn't explicitly set a preference, or we can just enforce it 
    // depending on the page if that's what makes the most sense. Let's make the auto-behavior a gentler default.
    if (!userPreference) {
      if (densePages.includes(currentPage)) {
        setIsCollapsed(true);
      } else if (simplePages.includes(currentPage)) {
        setIsCollapsed(false);
      }
    }
  }, [currentPage]);

  const toggleSidebar = () => {
    const newVal = !isCollapsed;
    setIsCollapsed(newVal);
    localStorage.setItem('gestaoos_sidebar_collapsed', String(newVal));
  };

  const mobileNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'digital_menu', label: 'Cardápio', icon: Layers },
    { id: 'crm', label: 'CRM', icon: MessageSquare },
    { id: 'financeiro', label: 'Finanças', icon: Wallet },
    { id: 'cmd', label: 'Menu', icon: Menu }, 
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
      <motion.aside 
        initial={false}
        animate={{ width: isCollapsed ? 72 : 256 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden md:flex flex-col fixed inset-y-0 left-0 bg-zinc-950 border-r border-zinc-900 border-opacity-50 z-50 overflow-hidden"
      >
        <div className="h-16 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2 text-zinc-50 overflow-hidden">
            <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-700 border border-amber-600/50 rounded-lg shadow-md drop-shadow-md shrink-0 ring-1 ring-amber-500/20 px-0.5">
              <span className="text-amber-950 font-heading font-black text-lg leading-none tracking-tighter">O</span>
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-heading font-bold text-xl tracking-tight text-white whitespace-nowrap ml-1"
                >
                  Origem<span className="text-amber-500 font-light">OS</span>
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-6 custom-scrollbar">
          {navGroups.map((group) => (
            <div key={group.name} className="flex flex-col">
              {!isCollapsed ? (
                <div className="px-3 mb-2 text-[11px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                  {group.name}
                </div>
              ) : (
                <div className="w-full border-t border-zinc-900/50 my-2" />
              )}
              <div className="space-y-1">
                {group.items.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => onNavigate(id as Page)}
                    title={isCollapsed ? label : undefined}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 relative overflow-hidden group",
                      isCollapsed && "justify-center px-0",
                      currentPage === id 
                        ? "bg-zinc-800/80 text-zinc-100 shadow-sm border border-zinc-700/30 font-medium" 
                        : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200"
                    )}
                  >
                    {currentPage === id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 shadow-[0_0_8px_rgba(197,152,104,0.5)] rounded-r flex-shrink-0" />}
                    <Icon size={isCollapsed ? 20 : 16} className={cn("transition-colors flex-shrink-0 z-10", currentPage === id ? "text-amber-500" : "text-zinc-500 group-hover:text-zinc-400")} />
                    {!isCollapsed && <span className="z-10 whitespace-nowrap">{label}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-3 border-t border-zinc-900 shrink-0">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-900/50 transition-colors cursor-pointer group" title={isCollapsed ? BRAND.tenantName : undefined}>
            <div className="w-8 h-8 shrink-0 rounded-full bg-[#100C08] border border-[#C59868]/30 flex items-center justify-center text-xs font-bold text-[#C59868] shadow-sm">
              CO
            </div>
            {!isCollapsed && (
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-sm font-medium text-zinc-100 leading-tight whitespace-nowrap">{BRAND.tenantName}</span>
                <span className="text-[10px] uppercase tracking-wider text-[#C59868] font-semibold whitespace-nowrap">Premium</span>
              </div>
            )}
          </div>
          
          <div className="mt-2 pt-2 border-t border-zinc-900/50 flex justify-center">
             <button 
                onClick={toggleSidebar}
                className="w-full flex justify-center items-center p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded-lg transition-colors"
                title={isCollapsed ? "Expandir Sidebar" : "Recolher Sidebar"}
             >
                {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
             </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <motion.main 
         initial={false}
         animate={{ paddingLeft: isMobile ? 0 : (isCollapsed ? 72 : 256) }}
         transition={{ type: "spring", stiffness: 300, damping: 30 }}
         className="flex-1 flex flex-col min-h-screen pb-16 md:pb-0 relative"
      >
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

            <div className="flex items-center gap-3 relative">
              <button 
                 onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                 className="relative w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-full transition-colors border border-transparent hover:border-zinc-800">
                <Bell size={18} className="stroke-[2]" />
                <span className="absolute top-2.5 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-zinc-950"></span>
              </button>
              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute top-full right-32 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col"
                  >
                    <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                      <h3 className="font-semibold text-sm text-zinc-100">Notificações</h3>
                      <button className="text-[10px] uppercase font-bold tracking-widest text-amber-500 hover:text-amber-400 transition-colors">Marcar Lidas</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-1">
                      <div className="p-3 bg-zinc-800/30 hover:bg-zinc-800/80 rounded-lg cursor-pointer transition-colors">
                        <p className="text-xs font-semibold text-zinc-200 mb-1">Estoque Crítico</p>
                        <p className="text-xs text-zinc-400">Café Especial 250g abaixo do mínimo (Restam 5 un).</p>
                        <p className="text-[10px] text-zinc-500 mt-2">Há 10 min</p>
                      </div>
                      <div className="p-3 hover:bg-zinc-800/80 rounded-lg cursor-pointer transition-colors">
                        <p className="text-xs font-semibold text-zinc-200 mb-1">Nova Venda Processada</p>
                        <p className="text-xs text-zinc-400">Pedido #9983 finalizado com sucesso no PDV.</p>
                        <p className="text-[10px] text-zinc-500 mt-2">Há 1h</p>
                      </div>
                      <div className="p-3 hover:bg-zinc-800/80 rounded-lg cursor-pointer transition-colors">
                        <p className="text-xs font-semibold text-zinc-200 mb-1">Fechamento de Acerto</p>
                        <p className="text-xs text-zinc-400">Empório Vila confirmou acerto de consignação R$ 940,00.</p>
                        <p className="text-[10px] text-zinc-500 mt-2">Há 2h</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                 onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
                 className="hidden md:flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-amber-950 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors shadow-[0_0_15px_rgba(197,152,104,0.2)] hover:shadow-[0_0_20px_rgba(197,152,104,0.4)]"
              >
                <Plus size={16} className="stroke-[3]" />
                Nova Ação
              </button>
              
              <AnimatePresence>
                {isQuickActionOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col p-2 space-y-1"
                  >
                    <button onClick={() => { setIsQuickActionOpen(false); setIsCommandPaletteOpen(true); }} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-300 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors w-full text-left">
                      <ShoppingBag size={16} /> Nova Venda (PDV)
                    </button>
                    <button onClick={() => { setIsQuickActionOpen(false); setIsCommandPaletteOpen(true); }} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-300 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors w-full text-left">
                      <Briefcase size={16} /> Acerto Consignado
                    </button>
                    <div className="w-full border-t border-zinc-800 my-1" />
                    <button onClick={() => { setIsQuickActionOpen(false); onNavigate('producao'); }} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-300 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors w-full text-left">
                      <Factory size={16} /> Produção / Torra
                    </button>
                    <button onClick={() => { setIsQuickActionOpen(false); onNavigate('financeiro'); }} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-300 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors w-full text-left">
                      <Wallet size={16} /> Lançamento Financeiro
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-x-hidden p-4 md:p-8">
            {children}
          </div>
        </motion.main>

        {/* Global Status Indicator (Bottom Right) */}
        <div 
          onClick={() => onNavigate('conexao')}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-3 py-1.5 bg-zinc-900/90 border border-zinc-800/80 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md cursor-pointer hover:bg-zinc-800 hover:border-zinc-700 transition-all group shrink-0"
          title="Verificar Conexão e Banco de Dados"
        >
          <div className={cn(
            "w-2 h-2 rounded-full",
            actualType === 'mock' 
              ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" 
              : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"
          )} />
          <span className="text-[11px] font-mono tracking-widest font-semibold uppercase text-zinc-400 group-hover:text-zinc-200">
            {actualType === 'mock' ? 'Mock' : 'Live'}
          </span>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-900 z-50 px-2 pb-safe-bottom pt-2 pb-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-around">
            {mobileNavItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  if (id === 'cmd') setIsCommandPaletteOpen(true);
                  else onNavigate(id as Page);
                }}
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

