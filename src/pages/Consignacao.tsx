import { formatBRL } from '../lib/format';
import { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Plus, Search, Map } from 'lucide-react';
import { NewConsignmentDrawer } from '../components/consignments/NewConsignmentDrawer';
import { SettlementDrawer } from '../components/consignments/SettlementDrawer';
import { Consignment } from '../domain/types';
import { useRepositories } from '../repositories/RepositoryProvider';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Input } from '../components/ui/Input';
import { Pagination } from '../components/ui/Pagination';

export function Consignacao() {
  const [isNewDrawerOpen, setIsNewDrawerOpen] = useState(false);
  const [settleConsignment, setSettleConsignment] = useState<Consignment | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const { consignmentRepo } = useRepositories();
  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    consignmentRepo.getConsignments()
      .then(setConsignments)
      .finally(() => setLoading(false));
  }, [consignmentRepo, refreshKey]);

  const handleComplete = () => {
    setIsNewDrawerOpen(false);
    setSettleConsignment(null);
    setRefreshKey(prev => prev + 1);
  };

  const filteredConsignments = consignments.filter(c => 
    c.partnerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredConsignments.length / itemsPerPage);
  const paginatedConsignments = filteredConsignments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col animate-in fade-in duration-500" key={refreshKey}>
      <PageHeader 
        title="Consignação Lite" breadcrumbs={[{label: "Dashboard", href: "#/"}, {label: "Consignação Lite"}]} 
        description="Controle simples de envios e acertos mensais em parceiros." 
        action={
          <Button 
            onClick={() => setIsNewDrawerOpen(true)}
            variant="flow"
            className="flex items-center gap-2"
          >
            <Plus size={16} /> Nova Remessa
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input 
            icon={<Search size={18} className="text-zinc-500" />}
            placeholder="Buscar parceiro..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardContent className="p-0 flex-1 flex flex-col">
          {loading ? (
             <div className="flex-1 flex flex-col p-6 space-y-4">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg bg-zinc-900/50" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg bg-zinc-900/50" />
             </div>
          ) : (
             <div className="overflow-x-auto flex-1">
               <table className="w-full text-left text-sm text-zinc-300">
                 <thead className="text-[10px] uppercase font-bold bg-zinc-950/50 text-zinc-500 border-b border-zinc-800/80 tracking-wider">
                   <tr>
                     <th className="px-6 py-4">Parceiro Referência</th>
                     <th className="px-6 py-4">Data Vencimento</th>
                     <th className="px-6 py-4 text-right">Qtd. Total Enviada</th>
                     <th className="px-6 py-4 text-right">Faturamento Ideal (R$)</th>
                     <th className="px-6 py-4 text-right">Captura Atual</th>
                     <th className="px-6 py-4">Status Ciclo</th>
                     <th className="px-6 py-4 text-right">Ação Rápida</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-800/50">
                   {paginatedConsignments.map((c: Consignment) => {
                     const totalSent = c.items.reduce((acc, i) => acc + i.qtySent, 0);
                     const isClosed = c.status === 'Fechada';
                     
                     let variant: any = 'info';
                     if (c.status === 'Fechada') variant = 'success';
                     else if (c.status === 'Vencendo' || c.status === 'Vencida') variant = 'error';
                     else if (c.status === 'Parcial') variant = 'warning';

                     return (
                       <tr key={c.id} className="hover:bg-zinc-900 transition-colors group">
                         <td className="px-6 py-4 font-semibold text-zinc-100 group-hover:text-amber-400 transition-colors">{c.partnerName}</td>
                         <td className="px-6 py-4 text-xs font-mono text-zinc-400">{new Date(c.dueDate).toLocaleDateString('pt-BR')}</td>
                         <td className="px-6 py-4 text-right font-mono text-zinc-300">{totalSent} un</td>
                         <td className="px-6 py-4 text-right font-mono text-zinc-50 tracking-tight">{formatBRL(c.expectedTotal)}</td>
                         <td className="px-6 py-4 text-right font-mono text-emerald-500 tracking-tight">{formatBRL(c.soldTotal)}</td>
                         <td className="px-6 py-4">
                           <StatusBadge status={c.status} variant={variant} />
                         </td>
                         <td className="px-6 py-4 text-right">
                           {!isClosed ? (
                             <Button 
                               variant="explore"
                               size="sm"
                               onClick={() => setSettleConsignment(c)}
                               className="text-xs font-semibold px-4"
                             >
                               Lançar Acerto
                             </Button>
                           ) : (
                             <span className="text-emerald-500 font-bold text-xs uppercase tracking-wider flex justify-end items-center gap-1.5 opacity-80">Finalizado</span>
                           )}
                         </td>
                       </tr>
                     );
                   })}
                   {consignments.length === 0 && (
                     <tr>
                       <td colSpan={7} className="p-0 border-none">
                         <div className="py-16 flex items-center justify-center">
                           <EmptyState
                             icon={<Map size={32} className="text-zinc-600" />}
                             title="Nenhuma remessa encontrada"
                             description="As suas remessas ativas de consignação aparecerão por aqui."
                           />
                         </div>
                       </td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
          )}
        </CardContent>
        {filteredConsignments.length > 0 && !loading && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredConsignments.length}
          />
        )}
      </Card>

      {isNewDrawerOpen && (
        <NewConsignmentDrawer onClose={() => setIsNewDrawerOpen(false)} onComplete={handleComplete} />
      )}

      {settleConsignment && (
        <SettlementDrawer 
          consignment={settleConsignment} 
          onClose={() => setSettleConsignment(null)} 
          onComplete={handleComplete} 
        />
      )}
    </div>
  );
}
