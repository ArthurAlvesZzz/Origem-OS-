import { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Plus, Coffee, Scale, Beaker, Clock, List, FileText, Activity, CheckCircle } from 'lucide-react';
import { Factory } from 'lucide-react';
import { ProductionBatchTable } from '../components/production/ProductionBatchTable';
import { ProductionBatchDrawer } from '../components/production/ProductionBatchDrawer';
import { ProductionDetailDrawer } from '../components/production/ProductionDetailDrawer';
import { ProductionBatch } from '../domain/types';
import { useRepositories } from '../repositories/RepositoryProvider';
import { Skeleton } from '../components/ui/Skeleton';

import { GreenLotsList } from '../components/production/advanced/GreenLotsList';
import { RecipeList } from '../components/production/advanced/RecipeList';
import { ProfileList } from '../components/production/advanced/ProfileList';
import { DemandList } from '../components/production/advanced/DemandList';
import { QualityList } from '../components/production/quality/QualityList';
import { TraceabilityList } from '../components/production/traceability/TraceabilityList';

import { AdvancedBatchDrawer } from '../components/production/advanced/AdvancedBatchDrawer';

type Tab = 'demand' | 'orders' | 'greens' | 'recipes' | 'profiles' | 'quality' | 'traceability';

import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

export function Producao() {
  const { success, error: toastError, info } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [demandInitialProduct, setDemandInitialProduct] = useState<string>();
  const [demandInitialQty, setDemandInitialQty] = useState<number>();
  const [detailBatch, setDetailBatch] = useState<ProductionBatch | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);

  const { productionRepo, advancedProductionRepo } = useRepositories();
  const [batches, setBatches] = useState<ProductionBatch[]>([]);

  useEffect(() => {
    setLoading(true);
    productionRepo.getBatches().then(res => {
        setBatches(res);
        setLoading(false);
    });
  }, [productionRepo, refreshKey]);

  const handleComplete = () => {
    setIsNewOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  // Calculate metrics
  const totalProducedStr = batches.filter(b => b.status === 'Concluído').reduce((acc, b) => acc + b.finalWeight, 0).toFixed(1);
  const avgYieldStr = (batches.filter(b => b.status === 'Concluído' && b.yieldPercent > 0).reduce((acc, b) => acc + b.yieldPercent, 0) / Math.max(1, batches.filter(b => b.status === 'Concluído' && b.yieldPercent > 0).length)).toFixed(1);

  if (loading && activeTab === 'orders') {
     return (
       <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-96 w-full" />
       </div>
     );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto" key={refreshKey}>
      <PageHeader 
        title="Controle de Produção" breadcrumbs={[{label: "Dashboard", href: "#/"}, {label: "Controle de Produção"}]} 
        description="Gestão de grãos verdes, receitas, perfis de torra e custeio." 
        action={
          <Button 
            onClick={() => setIsNewOpen(true)}
            variant="flow"
            className="flex items-center gap-2"
          >
            <Factory size={16} className="transition-transform group-hover:scale-110 duration-300" /> Nova Produção
          </Button>
        }
      />

      <div className="flex bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/80 w-fit mb-6 shadow-sm overflow-x-auto custom-scrollbar">
        <Button variant="ghost" onClick={() => setActiveTab('demand')} className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'demand' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}>
           <Activity size={14} /> Demanda (Sob Demanda)
        </Button>
        <Button variant="ghost" onClick={() => setActiveTab('orders')} className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'orders' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}>
           <List size={14} /> Ordens de Produção
        </Button>
        <Button variant="ghost" onClick={() => setActiveTab('greens')} className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'greens' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}>
           <Coffee size={14} /> Grãos Verdes
        </Button>
        <Button variant="ghost" onClick={() => setActiveTab('recipes')} className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'recipes' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}>
           <FileText size={14} /> Receitas
        </Button>
        <Button variant="ghost" onClick={() => setActiveTab('profiles')} className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'profiles' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}>
           <Beaker size={14} /> Perfis de Torra
        </Button>
        <Button variant="ghost" onClick={() => setActiveTab('quality')} className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'quality' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}>
           <CheckCircle size={14} /> Qualidade (CQ)
        </Button>
        <Button variant="ghost" onClick={() => setActiveTab('traceability')} className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'traceability' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}>
           <Activity size={14} /> Rastreabilidade
        </Button>
      </div>

      {activeTab === 'orders' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
               <div className="flex items-center gap-3 mb-2 text-zinc-400">
                  <Coffee size={18} className="text-amber-400" />
                  <span className="text-sm font-medium">Torrado no Mês</span>
           </div>
           <div className="text-2xl font-semibold text-zinc-50">{totalProducedStr} <span className="text-sm font-normal text-zinc-500">kg</span></div>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
           <div className="flex items-center gap-3 mb-2 text-zinc-400">
              <Scale size={18} className="text-emerald-400" />
              <span className="text-sm font-medium">Rendimento Médio</span>
           </div>
           <div className="text-2xl font-semibold text-zinc-50">{avgYieldStr}%</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
           <div className="flex items-center gap-3 mb-2 text-zinc-400">
              <Beaker size={18} className="text-sky-400" />
              <span className="text-sm font-medium">Lotes Ativos</span>
           </div>
           <div className="text-2xl font-semibold text-zinc-50">{batches.filter(b => b.status === 'Em Produção').length}</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
           <div className="flex items-center gap-3 mb-2 text-zinc-400">
              <Clock size={18} className="text-purple-400" />
              <span className="text-sm font-medium">Total de Lotes</span>
           </div>
           <div className="text-2xl font-semibold text-zinc-50">{batches.length}</div>
        </div>
      </div>

      <ProductionBatchTable 
        batches={batches} 
        onOpenDetail={setDetailBatch} 
        onFinalize={() => {
          toastError('Para testar finalização de um lote "Em Produção", use o botão de Ficha Técnica para visualizar ou crie um novo lote como Concluído.');
        }}
      />
      </>
      )}

      {activeTab === 'greens' && <GreenLotsList />}
      {activeTab === 'recipes' && <RecipeList />}
      {activeTab === 'profiles' && <ProfileList />}
      {activeTab === 'quality' && <QualityList />}
      {activeTab === 'traceability' && <TraceabilityList />}
      {activeTab === 'demand' && <DemandList onProduce={(productId, qty) => {
         setDemandInitialProduct(productId);
         setDemandInitialQty(qty);
         setIsNewOpen(true);
      }} />}

      {isNewOpen && (
        <AdvancedBatchDrawer 
            initialProductId={demandInitialProduct} 
            initialQuantity={demandInitialQty} 
            onClose={() => {
                setIsNewOpen(false);
                setDemandInitialProduct(undefined);
                setDemandInitialQty(undefined);
            }} 
            onSuccess={() => {
                setIsNewOpen(false);
                setDemandInitialProduct(undefined);
                setDemandInitialQty(undefined);
                handleComplete();
            }} 
        />
      )}

      {detailBatch && (
        <ProductionDetailDrawer onClose={() => setDetailBatch(null)} batch={detailBatch} />
      )}

    </div>
  );
}
