import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, PackageX, Clock, AlertCircle, ChevronRight, FileText, Factory, Loader2, Rocket, Settings, Store, CheckCircle2, TrendingUp, MessageSquare, DollarSign, Calendar, ListTodo, Plus, BrainCircuit } from 'lucide-react';
import { MetricCard } from '../components/ui/MetricCard';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { useRepositories } from '../repositories/RepositoryProvider';
import { DashboardSummary, DashboardAlert, DashboardActivity, DashboardInsight } from '../domain/types';
import { AlertsAndInsights } from '../components/dashboard/AlertsAndInsights';

const revenueData = [
  { name: '1', recebido: 1200, previsto: 1500 },
  { name: '5', recebido: 2100, previsto: 2400 },
  { name: '10', recebido: 3400, previsto: 3400 },
  { name: '15', recebido: 4800, previsto: 5200 },
  { name: '20', recebido: 5900, previsto: 7000 },
  { name: '25', recebido: 8000, previsto: 9100 },
  { name: '30', recebido: 12500, previsto: 14000 },
];

export function Dashboard() {
  const { dashboardRepo, settingsRepo } = useRepositories();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [insights, setInsights] = useState<DashboardInsight[]>([]);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [dashboardRepo, settingsRepo]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sum, alts, ins, modules] = await Promise.all([
        dashboardRepo.getSummary(),
        dashboardRepo.getAlerts(),
        dashboardRepo.getInsights ? dashboardRepo.getInsights() : Promise.resolve([]),
        settingsRepo.getModuleFlags()
      ]);
      setSummary(sum);
      setAlerts(alts);
      setInsights(ins);
      
      const profile = await settingsRepo.getProfile();
      if (!profile.name || profile.name === 'Minha Empresa' || profile.name === 'COFCOF.CO') {
         setIsOnboarding(true);
      } else {
         setIsOnboarding(false);
      }
      
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  };

  const onNavigateAndDispatch = (page: string, payload?: any) => {
      window.dispatchEvent(new CustomEvent('navigate', { detail: page }));
  };

  const completeStep = (step: string) => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: step }));
  };

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto space-y-8 p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-3">
             <Skeleton className="h-9 w-24" />
             <Skeleton className="h-9 w-24" />
             <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
           <Skeleton className="h-72 lg:col-span-2 w-full" />
           <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <Card className="max-w-lg mx-auto mt-20 border-red-500/20 bg-red-500/5 text-center">
        <CardContent className="pt-10 pb-8 flex flex-col items-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-red-500 mb-2">Erro ao carregar Dashboard</h3>
          <p className="text-zinc-400 mb-6">{error || 'Verifique sua conexão ou configuração.'}</p>
          <Button variant="danger" onClick={loadData}>Tentar Novamente</Button>
        </CardContent>
      </Card>
    );
  }

  if (isOnboarding) {
     return (
       <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6 mt-10">
         <Card className="p-8 text-center shadow-xl border-amber-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(245,158,11,0.1)] relative z-10">
               <Rocket size={32} />
            </div>
            <h2 className="text-3xl font-heading font-semibold text-zinc-50 mb-3 relative z-10">Bem-vindo ao GestaoOS!</h2>
            <p className="text-zinc-400 text-sm max-w-md mx-auto mb-8 relative z-10">O seu Command Center está quase pronto. Finalize as configurações básicas para decolar.</p>

            <div className="flex flex-col gap-3 text-left relative z-10">
               <button onClick={() => completeStep('config')} className="bg-zinc-950/80 backdrop-blur border border-zinc-800 p-4 rounded-xl hover:border-amber-500/50 hover:bg-zinc-900 transition-all flex items-center gap-4 group">
                  <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-zinc-400 group-hover:text-amber-500 group-hover:bg-amber-500/10 group-hover:border-amber-500/20 transition-colors">
                     <Settings size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-zinc-50 mb-0.5 group-hover:text-amber-400 transition-colors">Perfil da Empresa</h4>
                    <p className="text-xs text-zinc-400">Nome, CNPJ e logo oficial.</p>
                  </div>
                  <ChevronRight size={18} className="text-zinc-600 group-hover:translate-x-1 group-hover:text-amber-500 transition-all" />
               </button>
               
               <button onClick={() => completeStep('catalogo')} className="bg-zinc-950/80 backdrop-blur border border-zinc-800 p-4 rounded-xl hover:border-amber-500/50 hover:bg-zinc-900 transition-all flex items-center gap-4 group">
                  <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-zinc-400 group-hover:text-amber-500 group-hover:bg-amber-500/10 group-hover:border-amber-500/20 transition-colors">
                     <PackageX size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-zinc-50 mb-0.5 group-hover:text-amber-400 transition-colors">Primeiro Produto</h4>
                    <p className="text-xs text-zinc-400">Cadastre o seu carro-chefe.</p>
                  </div>
                  <ChevronRight size={18} className="text-zinc-600 group-hover:translate-x-1 group-hover:text-amber-500 transition-all" />
               </button>

               <button onClick={() => completeStep('digital_menu')} className="bg-zinc-950/80 backdrop-blur border border-zinc-800 p-4 rounded-xl hover:border-amber-500/50 hover:bg-zinc-900 transition-all flex items-center gap-4 group">
                  <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-zinc-400 group-hover:text-amber-500 group-hover:bg-amber-500/10 group-hover:border-amber-500/20 transition-colors">
                     <Store size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-zinc-50 mb-0.5 group-hover:text-amber-400 transition-colors">Cardápio Digital</h4>
                    <p className="text-xs text-zinc-400">Prepare sua vitrine para clientes.</p>
                  </div>
                  <ChevronRight size={18} className="text-zinc-600 group-hover:translate-x-1 group-hover:text-amber-500 transition-all" />
               </button>
            </div>
            
            <div className="mt-8 relative z-10">
               <button onClick={() => setIsOnboarding(false)} className="text-xs text-zinc-500 hover:text-zinc-300 font-medium transition-colors">Pular onboarding e ir para o Dashboard</button>
            </div>
         </Card>
       </div>
     );
  }

  // Quick Action Buttons
  const quickActions = [
    { label: 'Novo Pedido', icon: Store, action: () => window.dispatchEvent(new CustomEvent('navigate', { detail: 'comercial' })) },
    { label: 'Despesa', icon: DollarSign, action: () => window.dispatchEvent(new CustomEvent('navigate', { detail: 'financeiro' })) },
    { label: 'Estoque', icon: PackageX, action: () => window.dispatchEvent(new CustomEvent('navigate', { detail: 'estoque' })) },
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Dynamic Greeting */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h2 className="text-3xl font-heading font-semibold text-zinc-50 tracking-tight">Command Center</h2>
           <p className="text-sm text-zinc-400 mt-2 max-w-xl">Resumo diário da sua operação, saúde financeira e próximos passos.</p>
        </div>
        <div className="flex gap-3">
          {quickActions.map((action, idx) => (
             <Button key={idx} variant="outline" size="sm" onClick={action.action} className="gap-2">
                <action.icon size={16} />
                <span className="hidden sm:inline">{action.label}</span>
             </Button>
          ))}
        </div>
      </div>

      {/* Metric Cards - Command Center Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard 
          title="Faturamento (Mês)"
          value={`R$ ${(summary.faturamentoMes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend={`${summary.faturamentoMes >= summary.metaFaturamento ? '+' : ''}${((summary.faturamentoMes / summary.metaFaturamento) * 100).toFixed(1)}%`}
          trendUp={summary.faturamentoMes >= summary.metaFaturamento}
          subtitle={`Meta: R$ ${summary.metaFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
        />

        <MetricCard 
          title="Margem Bruta Est."
          value={`R$ ${summary.lucroEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend={`${summary.margemBruta.toFixed(1)}%`}
          trendUp={summary.margemBruta > 30}
          subtitle="Projeção Atual"
        />

        <MetricCard 
          title="Contas a Receber"
          value={<span className="text-amber-500">R$ {summary.contasReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
          trend=""
          trendUp={false}
          subtitle="Ativos Vencendo"
        />

        <Card className="p-5 flex flex-col justify-between group hover:border-red-500/30 cursor-pointer overflow-hidden relative" onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'estoque' }))}>
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-all group-hover:scale-110">
            <PackageX size={80} />
          </div>
          <div className="relative z-10">
            <div className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Estoque Crítico</div>
            <div className="text-2xl lg:text-3xl font-heading font-semibold text-zinc-50 tracking-tight transition-transform group-hover:scale-[1.02] origin-left">
              {summary.estoqueCritico} <span className="text-base text-zinc-500 font-normal">itens</span>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800">
              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider border ${summary.estoqueCritico > 0 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                {summary.estoqueCritico > 0 ? (
                  <><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Alerta</>
                ) : (
                  <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Estável</>
                )}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1 & 2: Main Flow & Chart */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2">
              <div>
                <CardTitle className="flex items-center gap-2">Fluxo de Caixa <TrendingUp size={16} className="text-zinc-500"/></CardTitle>
                <p className="text-sm text-zinc-400 mt-1">Recebido x Previsto (Mês Atual)</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#71717A' }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#71717A' }}
                      tickFormatter={(val) => `R$ ${val/1000}k`}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(244, 244, 245, 0.05)' }}
                      contentStyle={{ backgroundColor: '#09090b', borderRadius: '8px', border: '1px solid #27272a', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                      labelStyle={{ fontWeight: 600, color: '#fafafa', marginBottom: '4px' }}
                      itemStyle={{ color: '#a1a1aa' }}
                    />
                    <Bar dataKey="recebido" name="Recebido" fill="#C59868" radius={[4, 4, 0, 0]} barSize={24} />
                    <Bar dataKey="previsto" name="Previsto a Receber" fill="#27272a" stroke="#100C08" strokeWidth={1} radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
               <CardHeader className="pb-3">
                 <CardTitle className="flex items-center gap-2 text-base text-zinc-100"><MessageSquare size={16} className="text-amber-500" /> Conversas Pendentes</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                       <span className="text-zinc-400">Mensagens não lidas</span>
                       <span className="font-mono text-zinc-100">12</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                       <span className="text-zinc-400">Orçamentos parados</span>
                       <span className="font-mono font-medium text-amber-500">3</span>
                    </div>
                    <div className="pt-4 mt-2 border-t border-zinc-800">
                       <Button variant="ghost" size="sm" className="w-full text-xs text-amber-500" onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'crm' }))}>Abrir Inbox Completa &rarr;</Button>
                    </div>
                 </div>
               </CardContent>
            </Card>

            <Card>
               <CardHeader className="pb-3">
                 <CardTitle className="flex items-center gap-2 text-base text-zinc-100"><ListTodo size={16} className="text-amber-500" /> Tarefas de Produção</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                       <span className="text-zinc-400 truncate pr-2">Bolo Casamento Ex.</span>
                       <span className="text-[10px] uppercase tracking-wider bg-red-500/10 text-red-500 px-2 flex-shrink-0 py-0.5 rounded border border-red-500/20 font-bold">Atrasado</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                       <span className="text-zinc-400 truncate pr-2">Torra Semanal 5kg</span>
                       <span className="text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex-shrink-0 px-2 py-0.5 rounded font-bold">No Prazo</span>
                    </div>
                    <div className="pt-4 mt-2 border-t border-zinc-800">
                       <Button variant="ghost" size="sm" className="w-full text-xs text-amber-500" onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'producao' }))}>Acessar Painel &rarr;</Button>
                    </div>
                 </div>
               </CardContent>
            </Card>
          </div>
        </div>

        {/* Col 3: Action Center & Alerts */}
        <div className="space-y-6">
          <AlertsAndInsights alerts={alerts} insights={insights} onNavigate={onNavigateAndDispatch} />
        </div>

      </div>
    </div>
  );
}
