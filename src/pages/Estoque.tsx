import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Search, Plus, ArrowDownToLine, ArrowUpToLine, Settings2, PackageSearch, Download } from 'lucide-react';
import { Pagination } from '../components/ui/Pagination';
import { useState, useEffect } from 'react';
import { StockMovementDrawer } from '../components/inventory/StockMovementDrawer';
import { StockMovementsTable } from '../components/inventory/StockMovementsTable';
import { MovementType, Product } from '../domain/types';
import { useRepositories } from '../repositories/RepositoryProvider';
import { exportToCSV } from '../lib/export';
import { Skeleton } from '../components/ui/Skeleton';

export function Estoque() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [initialType, setInitialType] = useState<MovementType>('Entrada');
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;


  const { productRepo, inventoryRepo } = useRepositories();
  const [productsData, setProductsData] = useState<(Product & { currentStock: number })[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const prods = await productRepo.getProducts();
      const withStock = await Promise.all(
        prods.map(async p => ({
          ...p,
          currentStock: await inventoryRepo.calculateCurrentStock(p.id)
        }))
      );
      setProductsData(withStock);
      setLoading(false);
    };
    fetchData();
  }, [productRepo, inventoryRepo, refreshKey]);

  const handleOpenNew = (type: MovementType) => {
    setInitialType(type);
    setIsDrawerOpen(true);
  };

  const handleComplete = () => {
    setIsDrawerOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  const filteredProducts = productsData.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) {
     return (
       <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-96 w-full" />
       </div>
     );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto animate-in fade-in duration-500" key={refreshKey}>
      <PageHeader 
        title="Controle de Estoque" 
        description="Gestão de saldos físicos, inventário e histórico de movimentações." 
        action={
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => handleOpenNew('Entrada')} className="gap-2">
              <ArrowDownToLine size={16} className="text-emerald-500" /> <span className="hidden sm:inline">Entrada</span>
            </Button>
            <Button variant="secondary" onClick={() => handleOpenNew('Perda')} className="gap-2">
              <ArrowUpToLine size={16} className="text-red-500" /> <span className="hidden sm:inline">Perda</span>
            </Button>
            <Button variant="flow" onClick={() => handleOpenNew('Ajuste')} className="gap-2">
              <Settings2 size={16} className="transition-transform group-hover:rotate-180 duration-500" /> Ajuste Geral
            </Button>
          </div>
        }
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6 relative z-10 w-full sm:w-auto">
        <div className="flex-1 w-full max-w-xl">
          <Input 
            icon={<Search size={18} className="text-zinc-500" />}
            placeholder="Buscar item ou SKU em estoque..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2 sm:w-auto w-full justify-center" onClick={() => exportToCSV(filteredProducts, 'estoque', [
          { key: 'sku', label: 'SKU' },
          { key: 'name', label: 'Produto' },
          { key: 'category', label: 'Categoria' },
          { key: 'currentStock', label: 'Saldo Atual' },
          { key: 'minStock', label: 'Estoque Mín.' }
        ])}>
          <Download size={16} className="text-zinc-500" /> Exportar CSV
        </Button>
      </div>

      <Card className="mb-8 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="text-xs uppercase bg-zinc-950/50 text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">Item do Catálogo</th>
                <th className="px-6 py-4 font-medium text-right">Saldo Atual</th>
                <th className="px-6 py-4 font-medium text-right">Min. Seguro</th>
                <th className="px-6 py-4 font-medium pl-8">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {paginatedProducts.map((p) => {
                const isLow = p.currentStock <= p.minStock;
                return (
                  <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-100 group-hover:text-amber-500 transition-colors">{p.name}</div>
                      <div className="font-mono text-zinc-500 text-xs mt-1 uppercase tracking-wider">{p.sku}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-medium ${isLow ? 'text-red-400' : 'text-zinc-50'}`}>{p.currentStock}</span> <span className="text-zinc-500 text-xs ml-1">{p.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-500">
                      {p.minStock} <span className="text-xs ml-1">{p.unit}</span>
                    </td>
                    <td className="px-6 py-4 pl-8">
                      {p.active ? (
                        <StatusBadge 
                          status={isLow ? 'Estoque Baixo' : 'Estável'} 
                          variant={isLow ? 'error' : 'success'} 
                        />
                      ) : (
                        <StatusBadge status="Inativo" variant="warning" />
                      )}
                    </td>
                  </tr>
                );
              })}
              
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-0 border-none">
                    <div className="py-16 flex items-center justify-center">
                    <EmptyState
                      icon={<PackageSearch size={32} className="text-zinc-600" />}
                      title="Nenhum produto rastreado"
                      description="Adicione produtos no painel de Catálogo para começar a rastrear o estoque em tempo real."
                    />
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredProducts.length > 0 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredProducts.length}
          />
        )}
      </Card>

      <div className="mb-2">
         <h3 className="text-lg font-heading font-semibold text-zinc-50">Últimas Movimentações</h3>
      </div>
      <StockMovementsTable />

      {isDrawerOpen && (
        <StockMovementDrawer
          onClose={() => setIsDrawerOpen(false)}
          onComplete={handleComplete}
          initialType={initialType}
        />
      )}
    </div>
  );
}
