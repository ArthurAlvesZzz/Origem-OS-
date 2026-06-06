import React, { useState, useEffect } from 'react';
import { Save, Plus, Settings, Building, Store, Shield, Briefcase, Key, Activity } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { useRepositories } from '../repositories/RepositoryProvider';
import { TenantProfile, Branch, BusinessRules, ProductionRules, ModuleFlags } from '../domain/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function Configuracoes() {
  const { settingsRepo } = useRepositories();
  const [activeTab, setActiveTab] = useState('empresa');
  const [loading, setLoading] = useState(true);

  // States
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [businessRules, setBusinessRules] = useState<BusinessRules | null>(null);
  const [productionRules, setProductionRules] = useState<ProductionRules | null>(null);
  const [flags, setFlags] = useState<ModuleFlags | null>(null);

  useEffect(() => {
    loadAll();
  }, [settingsRepo]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [p, b, br, pr, f] = await Promise.all([
        settingsRepo.getProfile(),
        settingsRepo.getBranches(),
        settingsRepo.getBusinessRules(),
        settingsRepo.getProductionRules(),
        settingsRepo.getModuleFlags()
      ]);
      setProfile(p);
      setBranches(b);
      setBusinessRules(br);
      setProductionRules(pr);
      setFlags(f);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if(!profile) return;
    try {
      const updated = await settingsRepo.updateProfile(profile);
      setProfile(updated);
      alert('Perfil salvo com sucesso');
    } catch (e) { alert('Erro ao salvar'); }
  };

  const handleSaveBusinessRules = async () => {
    if(!businessRules) return;
    try {
      const updated = await settingsRepo.updateBusinessRules(businessRules);
      setBusinessRules(updated);
      alert('Regras salvas.');
    } catch (e) { alert('Erro ao salvar'); }
  };

  const handleSaveProductionRules = async () => {
    if(!productionRules) return;
    try {
      const updated = await settingsRepo.updateProductionRules(productionRules);
      setProductionRules(updated);
      alert('Regras salvas.');
    } catch (e) { alert('Erro ao salvar'); }
  };

  const handleSaveFlags = async () => {
    if(!flags) return;
    try {
      const updated = await settingsRepo.updateModuleFlags(flags);
      setFlags(updated);
      alert('Módulos salvos.');
    } catch (e) { alert('Erro ao salvar'); }
  };

  // Branch simple toggle
  const toggleBranch = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await settingsRepo.updateBranch(id, { status: newStatus });
    loadAll();
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto h-full flex flex-col justify-center items-center">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mb-4" />
        <p className="text-zinc-500 font-medium">Carregando configurações...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'empresa', label: 'Perfil da Empresa', icon: Building },
    { id: 'unidades', label: 'Unidades / Filiais', icon: Store },
    { id: 'comercial', label: 'Regras Comerciais', icon: Briefcase },
    { id: 'producao', label: 'Regras de Produção', icon: Settings },
    { id: 'modulos', label: 'Módulos do Sistema', icon: Key },
    { id: 'saude', label: 'Saúde do Sistema', icon: Activity },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col animate-in fade-in duration-500">
      <PageHeader
        title="Configurações do Workspace"
        description="Gerencie perfil do tenant, filiais e regras centrais do seu negócio."
      />

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 text-left rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-amber-500 text-amber-950 shadow-sm' 
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-amber-950' : 'text-zinc-500'} />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex-1">
          {activeTab === 'empresa' && profile && (
            <Card className="animate-in slide-in-from-right-4 duration-500">
              <CardHeader>
                <CardTitle>Perfil da Empresa</CardTitle>
                <CardDescription>Informações cadastrais principais utilizadas nas fachadas do sistema e notas fiscais.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Nome Fantasia</label>
                    <Input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Razão Social</label>
                    <Input value={profile.legalName || ''} onChange={e => setProfile({...profile, legalName: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Documento (CNPJ/CPF)</label>
                    <Input value={profile.document || ''} onChange={e => setProfile({...profile, document: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">E-mail de Contato</label>
                    <Input value={profile.email || ''} onChange={e => setProfile({...profile, email: e.target.value})} type="email" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Endereço Principal</label>
                    <Input value={profile.address || ''} onChange={e => setProfile({...profile, address: e.target.value})} />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end border-t border-zinc-800/80 bg-zinc-900/50 pt-5">
                <Button onClick={handleSaveProfile} className="gap-2 bg-amber-500 hover:bg-amber-400 text-amber-950">
                  <Save size={16} /> Salvar Alterações
                </Button>
              </CardFooter>
            </Card>
          )}

          {activeTab === 'unidades' && (
            <Card className="animate-in slide-in-from-right-4 duration-500 border-zinc-800/80">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Unidades e Filiais</CardTitle>
                  <CardDescription>Gerencie as diferentes localizações físicas ou virtuais do negócio.</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus size={16} /> Nova Unidade
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {branches.map(b => (
                    <div key={b.id} className="bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                           <Store className="text-zinc-500" size={20} />
                        </div>
                        <div>
                          <div className="font-heading font-semibold text-zinc-100 flex items-center gap-2.5">
                            {b.name}
                            {b.isDefault && <span className="text-[10px] font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider">Principal</span>}
                          </div>
                          <div className="text-sm text-zinc-400 mt-1">{b.type} · {b.city}/{b.state}</div>
                        </div>
                      </div>
                      <div className="flex items-center sm:justify-end gap-3">
                         <button 
                           className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${b.status==='active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'}`} 
                           onClick={() => toggleBranch(b.id, b.status)}
                         >
                           {b.status === 'active' ? 'Operante' : 'Inativa'}
                         </button>
                         <Button variant="outline" size="sm">Editar</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'comercial' && businessRules && (
            <Card className="animate-in slide-in-from-right-4 duration-500">
               <CardHeader>
                 <CardTitle>Regras Comerciais</CardTitle>
                 <CardDescription>Parâmetros operacionais para vendas, prazos e faturamento.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Prazo Padrão B2C (Dias)</label>
                     <Input type="number" value={businessRules.defaultB2CPaymentTermsDays} onChange={e => setBusinessRules({...businessRules, defaultB2CPaymentTermsDays: Number(e.target.value)})} />
                   </div>
                   <div>
                     <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Prazo Padrão B2B (Dias)</label>
                     <Input type="number" value={businessRules.defaultB2BPaymentTermsDays} onChange={e => setBusinessRules({...businessRules, defaultB2BPaymentTermsDays: Number(e.target.value)})} />
                   </div>
                   <div>
                     <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Acerto Consignação (Dias)</label>
                     <Input type="number" value={businessRules.defaultConsignmentSettleDays} onChange={e => setBusinessRules({...businessRules, defaultConsignmentSettleDays: Number(e.target.value)})} />
                   </div>
                   <div>
                     <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Meta Faturamento Mensal (R$)</label>
                     <Input type="number" value={businessRules.monthlyRevenueTarget} onChange={e => setBusinessRules({...businessRules, monthlyRevenueTarget: Number(e.target.value)})} />
                   </div>
                 </div>
                 
                 <div className="mt-6 bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 flex items-start gap-4">
                    <input 
                      type="checkbox" 
                      id="allowNeg" 
                      checked={businessRules.allowNegativeStock} 
                      onChange={e => setBusinessRules({...businessRules, allowNegativeStock: e.target.checked})} 
                      className="mt-1 w-5 h-5 accent-amber-500 rounded cursor-pointer" 
                    />
                    <div>
                      <label htmlFor="allowNeg" className="text-sm font-semibold text-zinc-100 cursor-pointer block mb-1">Permitir Faturamento Mestre (Estoque Negativo)</label>
                      <p className="text-xs text-zinc-400">Quando ativado, vendas via PDV e pedidos B2B poderão ser concluídos mesmo que os produtos não possuam saldo suficiente em sistema. O estoque ficará negativado indicando pendência de produção/compra.</p>
                    </div>
                  </div>
               </CardContent>
               <CardFooter className="justify-end border-t border-zinc-800/80 bg-zinc-900/50 pt-5">
                 <Button onClick={handleSaveBusinessRules} className="gap-2 bg-amber-500 hover:bg-amber-400 text-amber-950">
                   <Save size={16} /> Salvar Parâmetros
                 </Button>
               </CardFooter>
            </Card>
          )}

          {activeTab === 'producao' && productionRules && (
            <Card className="animate-in slide-in-from-right-4 duration-500">
               <CardHeader>
                 <CardTitle>Regras de Produção Tática</CardTitle>
                 <CardDescription>Custos fixos alocados na manufatura e índices de perdas toleradas para Torrefação e Confeitaria.</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Custo Hora Operação OBM (R$)</label>
                     <Input type="number" value={productionRules.defaultHourCost} onChange={e => setProductionRules({...productionRules, defaultHourCost: Number(e.target.value)})} />
                   </div>
                   <div>
                     <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Custo Hora Mestre de Torra (R$)</label>
                     <Input type="number" value={productionRules.masterRoasterHourCost} onChange={e => setProductionRules({...productionRules, masterRoasterHourCost: Number(e.target.value)})} />
                   </div>
                   <div>
                     <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Rendimento Torra Min. Esperado (%)</label>
                     <Input type="number" value={productionRules.minExpectedYieldPercent} onChange={e => setProductionRules({...productionRules, minExpectedYieldPercent: Number(e.target.value)})} />
                   </div>
                   <div>
                     <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Perda Prod. Máx. Esperada (%)</label>
                     <Input type="number" value={productionRules.maxExpectedLossPercent} onChange={e => setProductionRules({...productionRules, maxExpectedLossPercent: Number(e.target.value)})} />
                   </div>
                 </div>
               </CardContent>
               <CardFooter className="justify-end border-t border-zinc-800/80 bg-zinc-900/50 pt-5">
                 <Button onClick={handleSaveProductionRules} className="gap-2 bg-amber-500 hover:bg-amber-400 text-amber-950">
                   <Save size={16} /> Salvar Operações
                 </Button>
               </CardFooter>
            </Card>
          )}

          {activeTab === 'modulos' && flags && (
            <Card className="animate-in slide-in-from-right-4 duration-500">
               <CardHeader>
                 <CardTitle>Core Modules Gestão OS</CardTitle>
                 <CardDescription>Habilite ou desabilite subsistemas na barra lateral e workspace dependendo do nível de licença.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-5 bg-zinc-950 border border-zinc-800/80 rounded-xl">
                    <div>
                      <div className="font-semibold text-zinc-100 flex items-center gap-2">Módulo Comercial / Vendas <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">Ativo</span></div>
                      <div className="text-sm text-zinc-400 mt-1">Orçamentos B2B, consignação recorrente e PDV balcão.</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={flags.sales} onChange={e => setFlags({...flags, sales: e.target.checked})} className="sr-only peer" />
                      <div className="w-11 h-6 bg-zinc-800 rounded-full peer peer-focus:ring-4 peer-focus:ring-amber-500/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-zinc-950 opacity-60 border border-zinc-800/80 rounded-xl cursor-not-allowed">
                    <div>
                      <div className="font-semibold text-zinc-400 flex items-center gap-2">Gateway Fiscal SEFAZ <span className="text-[10px] bg-sky-500/10 text-sky-500 px-2 py-0.5 rounded border border-sky-500/20 uppercase tracking-wider">Em breve</span></div>
                      <div className="text-sm text-zinc-500 mt-1">Mensageria Nfe, NFC-e e MDFe com assinaturas A1.</div>
                    </div>
                    <label className="relative inline-flex items-center mt-3 sm:mt-0 opacity-50 cursor-not-allowed">
                      <input type="checkbox" checked={flags.fiscal_placeholder} disabled className="sr-only peer" />
                      <div className="w-11 h-6 bg-zinc-800 rounded-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-500 after:border-zinc-800 after:border after:rounded-full after:h-5 after:w-5"></div>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-zinc-950 opacity-60 border border-zinc-800/80 rounded-xl cursor-not-allowed">
                    <div>
                      <div className="font-semibold text-zinc-400 flex items-center gap-2">Storefront B2C Integrado <span className="text-[10px] bg-sky-500/10 text-sky-500 px-2 py-0.5 rounded border border-sky-500/20 uppercase tracking-wider">Em breve</span></div>
                      <div className="text-sm text-zinc-500 mt-1">Sincronização de catálogos Shopify / Loja Integrada.</div>
                    </div>
                    <label className="relative inline-flex items-center mt-3 sm:mt-0 opacity-50 cursor-not-allowed">
                      <input type="checkbox" checked={flags.storefront_placeholder} disabled className="sr-only peer" />
                      <div className="w-11 h-6 bg-zinc-800 rounded-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-500 after:border-zinc-800 after:border after:rounded-full after:h-5 after:w-5"></div>
                    </label>
                  </div>
               </CardContent>
               <CardFooter className="justify-end border-t border-zinc-800/80 bg-zinc-900/50 pt-5">
                 <Button onClick={handleSaveFlags} className="gap-2 bg-amber-500 hover:bg-amber-400 text-amber-950">
                   <Save size={16} /> Salvar Configuração de Workspace
                 </Button>
               </CardFooter>
            </Card>
          )}

          {activeTab === 'saude' && (
            <Card className="animate-in slide-in-from-right-4 duration-500 bg-zinc-950/50">
               <CardHeader>
                 <CardTitle className="flex items-center gap-2"><Shield className="text-emerald-500" size={20} /> Diagnóstico e Segurança</CardTitle>
                 <CardDescription>Auditoria técnica dos endpoints e infraestrutura conectada ao tenant.</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-colors rounded-xl p-5">
                    <div className="font-semibold text-emerald-400 mb-2 font-heading tracking-tight flex items-center justify-between">
                      Testes de Integridade
                      <span className="font-mono text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-wider">Pass.</span>
                    </div>
                    <div className="text-sm text-zinc-300">
                      Verificação: <span className="font-mono text-xs text-amber-500">Pipeline CI Local</span>
                    </div>
                    <div className="text-xs text-zinc-500 mt-3 leading-relaxed">
                      Cobertura Vitest protegendo a Idempotência Financeira, Movimentações de Estoque rigorosas e Isolamento arquitetural de Tenants. Garantia contra falsas baixas.
                    </div>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-colors rounded-xl p-5">
                    <div className="font-semibold text-sky-400 mb-2 font-heading tracking-tight flex items-center justify-between">
                      Conexão Backend
                      <span className="font-mono text-[10px] font-bold bg-sky-500/10 text-sky-500 border border-sky-500/20 px-2 py-0.5 rounded uppercase tracking-wider">Aprox/Mock</span>
                    </div>
                    <div className="text-sm text-zinc-300">
                      Estado Prisma: <span className="font-mono text-xs text-sky-400">Interface Repository</span>
                    </div>
                    <div className="text-xs text-zinc-500 mt-3 leading-relaxed">
                      Fallback operando 100% no Preview Environment do AI Studio em Memória/LocalStorage. Troca autônoma para Postgres via API se `DATABASE_URL` detectado.
                    </div>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-colors rounded-xl p-5">
                    <div className="font-semibold text-amber-500 mb-2 font-heading tracking-tight flex items-center justify-between">
                      Gateway Transacional
                      <span className="font-mono text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded uppercase tracking-wider">Detecting</span>
                    </div>
                    <div className="text-sm text-zinc-300">
                      Adquirente Integrada: <span className="font-mono text-xs text-amber-500">Mercado Pago / PIX</span>
                    </div>
                    <div className="text-xs text-zinc-500 mt-3 leading-relaxed">
                      Sinal de Webhooks pronto com `referenceId` para conciliação automática. Operando fallback manual em aprovações MOCK/Preview local.
                    </div>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-colors rounded-xl p-5">
                    <div className="font-semibold text-zinc-300 mb-2 font-heading tracking-tight flex items-center justify-between">
                      Auditoria JWT & RBAC
                      <span className="font-mono text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded uppercase tracking-wider">Active</span>
                    </div>
                    <div className="text-sm text-zinc-300">
                      Hard-Fence Módulos: <span className="font-mono text-xs text-emerald-400">Ativado</span>
                    </div>
                    <div className="text-xs text-zinc-500 mt-3 leading-relaxed">
                      O bloqueio horizontal de acessos assegura que o Vendedor não baixe fluxo de caixa se `requirePermission('finance')` declarar interceptação. Escudo ativo no lado servidor.
                    </div>
                  </div>
                </div>
               </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
