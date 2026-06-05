import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, PackageX, Clock, AlertCircle, ChevronRight, FileText, Factory, Loader2, Rocket, Settings, Store, CheckCircle2, TrendingUp, MessageSquare, DollarSign, Calendar, ListTodo, Plus, BrainCircuit } from 'lucide-react';
import { MetricCard } from '../components/ui/MetricCard';
import { PageHeader } from '../components/ui/PageHeader';
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
      <div className="flex items-center justify-center h-[calc(100vh-120px)] text-amber-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-500/10 rounded-xl max-w-lg mx-auto mt-20 border border-red-500/20">
        <AlertCircle className="w-10 h-10 mx-auto mb-3" />
        <p className="font-medium">{error || 'Não foi possível carregar os dados.'}</p>
        <button onClick={loadData} className="mt-4 px-6 py-2 bg-red-500 text-zinc-950 font-medium rounded hover:bg-red-600 transition-colors">Tentar novamente</button>
      </div>
    );
  }

  if (isOnboarding) {
     return (
       <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6 mt-10">
         <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center shadow-xl">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
               <Rocket size={32} />
            </div>
            <h2 className="text-3xl font-heading font-semibold text-zinc-50 mb-3">Bem-vindo ao GestaoOS!</h2>
            <p className="text-zinc-400 text-sm max-w-md mx-auto mb-8">O seu Command Center está quase pronto. Finalize as 3 configurações básicas para começar a faturar.</p>

            <div className="flex flex-col gap-3 text-left">
               <button onClick={() => completeStep('config')} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl hover:border-amber-500/50 hover:bg-zinc-900 transition-all flex items-center gap-4 group">
                  <div className="bg-zinc-900 p-3 rounded-lg text-zinc-400 group-hover:text-amber-500 group-hover:bg-amber-500/10 transition-colors">
                     <Settings size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-zinc-50 mb-0.5">Perfil da Empresa</h4>
                    <p className="text-xs text-zinc-400">Nome, CNPJ e logo oficial.</p>
                  </div>
                  <ChevronRight size={18} className="text-zinc-600 group-hover:text-amber-500 transition-colors" />
               </button>
               
               <button onClick={() => completeStep('catalogo')} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl hover:border-amber-500/50 hover:bg-zinc-900 transition-all flex items-center gap-4 group">
                  <div className="bg-zinc-900 p-3 rounded-lg text-zinc-400 group-hover:text-amber-500 group-hover:bg-amber-500/10 transition-colors">
                     <PackageX size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-zinc-50 mb-0.5">Primeiro Produto</h4>
                    <p className="text-xs text-zinc-400">Cadastre o seu carro-chefe.</p>
                  </div>
                  <ChevronRight size={18} className="text-zinc-600 group-hover:text-amber-500 transition-colors" />
               </button>

               <button onClick={() => completeStep('digital_menu')} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl hover:border-amber-500/50 hover:bg-zinc-900 transition-all flex items-center gap-4 group">
                  <div className="bg-zinc-900 p-3 rounded-lg text-zinc-400 group-hover:text-amber-500 group-hover:bg-amber-500/10 transition-colors">
                     <Store size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-zinc-50 mb-0.5">Cardápio Digital</h4>
                    <p className="text-xs text-zinc-400">Prepare sua vitrine para clientes.</p>
                  </div>
                  <ChevronRight size={18} className="text-zinc-600 group-hover:text-amber-500 transition-colors" />
               </button>
            </div>
            
            <div className="mt-8">
               <button onClick={() => setIsOnboarding(false)} className="text-xs text-zinc-500 hover:text-zinc-400 underline underline-offset-4">Pular onboarding e ir para o Dashboard</button>
            </div>
         </div>
       </div>
     );
  }

  // Quick Action Buttons
  const quickActions = [
    { label: 'Novo Pedido PDV', icon: Store, action: () => window.dispatchEvent(new CustomEvent('navigate', { detail: 'comercial' })) },
    { label: 'Nova Encomenda', icon: Calendar, action: () => window.dispatchEvent(new CustomEvent('navigate', { detail: 'crm' })) },
    { label: 'Lançar Despesa', icon: DollarSign, action: () => window.dispatchEvent(new CustomEvent('navigate', { detail: 'financeiro' })) },
    { label: 'Ajuste Estoque', icon: PackageX, action: () => window.dispatchEvent(new CustomEvent('navigate', { detail: 'estoque' })) },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Dynamic Greeting */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
           <h2 className="text-2xl font-heading font-semibold text-zinc-100 mt-2 tracking-tight">O que você precisa saber hoje</h2>
           <p className="text-sm text-zinc-400 mt-1">Resumo diário da sua operação, financeiro e próximos passos.</p>
        </div>
        <div className="flex gap-2 relative">
          <span className="hidden md:inline-flex absolute -top-8 -right-2 bg-amber-500 text-amber-950 font-bold text-[10px] px-2 py-0.5 rounded-full rotate-3 shadow-lg">Ações Rápidas</span>
          {quickActions.map((action, idx) => (
             <button key={idx} onClick={action.action} className="flex flex-col items-center justify-center bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800 transition-colors rounded-xl p-3 w-20 h-20 group">
                <action.icon size={20} className="text-zinc-400 group-hover:text-amber-500 mb-2 transition-colors" />
                <span className="text-[10px] font-medium text-zinc-300 text-center leading-tight">{action.label}</span>
             </button>
          ))}
        </div>
      </div>

      {/* Metric Cards - Command Center Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          title="Faturamento Mensal"
          value={`R$ ${(summary.faturamentoMes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend={`${summary.faturamentoMes >= summary.metaFaturamento ? '+' : ''}${((summary.faturamentoMes / summary.metaFaturamento) * 100).toFixed(1)}%`}
          trendUp={summary.faturamentoMes >= summary.metaFaturamento}
          subtitle={`Meta: R$ ${summary.metaFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
        />

        <MetricCard 
          title="Margem de Lucro"
          value={`R$ ${summary.lucroEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend={`${summary.margemBruta.toFixed(1)}%`}
          trendUp={summary.margemBruta > 30}
          subtitle="Margem Bruta (Est.)"
        />

        <MetricCard 
          title="Contas a Receber"
          value={<span className="text-amber-400">R$ {summary.contasReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
          trend=""
          trendUp={false}
          subtitle="Atrasados / A vencer"
        />

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl shadow-sm relative overflow-hidden group hover:border-zinc-700 transition-colors cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'estoque' }))}>
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <PackageX size={64} className="text-zinc-50" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="text-sm font-medium text-zinc-400 mb-1 leading-none">Estoque Crítico</div>
              <div className="text-2xl font-heading font-semibold text-zinc-50">{summary.estoqueCritico} itens</div>
            </div>
            <div className="mt-3">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${summary.estoqueCritico > 0 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                {summary.estoqueCritico > 0 ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-0.5 animate-pulse"></span>
                    Requer Compras
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5"></span>
                    Estabilizado
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1 & 2: Main Flow & Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
              <div>
                <h3 className="font-heading font-semibold text-zinc-50 flex items-center gap-2">Fluxo de Caixa Acumulado <TrendingUp size={16} className="text-zinc-500"/></h3>
                <p className="text-sm text-zinc-400">Recebido x Previsto (Mês Atual)</p>
              </div>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#8E7A68' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#8E7A68' }}
                    tickFormatter={(val) => `R$ ${val/1000}k`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#26221E' }}
                    contentStyle={{ backgroundColor: '#181512', borderRadius: '8px', border: '1px solid #3B342E', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                    labelStyle={{ fontWeight: 600, color: '#FAF9F7', marginBottom: '4px' }}
                    itemStyle={{ color: '#D8D0C9' }}
                  />
                  <Bar dataKey="recebido" name="Recebido" fill="#C59868" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="previsto" name="Previsto a Receber" fill="#3B342E" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
               <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 mb-4"><MessageSquare size={16} className="text-amber-500" /> Conversas CRM Pendentes</h3>
               <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                     <span className="text-zinc-400">Mensagens não lidas</span>
                     <span className="font-semibold text-zinc-100">12</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                     <span className="text-zinc-400">Orçamentos parados</span>
                     <span className="font-semibold text-amber-500">3</span>
                  </div>
                  <div className="pt-2">
                     <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'crm' }))} className="text-xs font-medium text-amber-500 hover:text-amber-400 hover:underline underline-offset-4">Abrir Inbox Completa &rarr;</button>
                  </div>
               </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
               <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 mb-4"><ListTodo size={16} className="text-amber-500" /> Tarefas da Produção</h3>
               <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                     <span className="text-zinc-400">Bolo Casamento Ex.</span>
                     <span className="text-xs bg-red-500/10 text-red-500 px-2 rounded-full font-semibold">Atrasado</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                     <span className="text-zinc-400">Torra Semanal 5kg</span>
                     <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 rounded-full font-semibold">No Prazo</span>
                  </div>
                  <div className="pt-2">
                     <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'producao' }))} className="text-xs font-medium text-amber-500 hover:text-amber-400 hover:underline underline-offset-4">Ver Painel de Produção &rarr;</button>
                  </div>
               </div>
            </div>
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
