import { formatBRL } from '../lib/format';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { Plus, Search, Edit2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Pagination } from '../components/ui/Pagination';
import { Skeleton } from '../components/ui/Skeleton';
import { useState, useEffect } from 'react';
import { ProductFormDrawer } from '../components/catalog/ProductFormDrawer';
import { Product } from '../domain/types';
import { useRepositories } from '../repositories/RepositoryProvider';

export function Catalogo() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [loading, setLoading] = useState(true);

  const { productRepo } = useRepositories();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setLoading(true);
    productRepo.getProducts().then(prods => {
      setProducts(prods);
      setLoading(false);
    });
  }, [productRepo, refreshKey]);

  const handleOpenNew = () => {
    setSelectedProduct(undefined);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsDrawerOpen(true);
  };

  const handleClose = () => {
    setIsDrawerOpen(false);
    setSelectedProduct(undefined);
  };

  const handleComplete = () => {
    handleClose();
    setRefreshKey(prev => prev + 1);
  };

  const filteredProducts = products.filter(p =>
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
       <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-96 w-full" />
       </div>
     );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto" key={refreshKey}>
      <PageHeader 
        title="Catálogo de Produtos" 
        description="Gerencie seus cafés, insumos e variações." 
        action={
          <Button 
            onClick={handleOpenNew}
            className="flex items-center gap-2"
          >
            <Plus size={16} /> Novo Produto
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 w-full max-w-xl">
          <Input 
            icon={<Search size={18} className="text-zinc-500" />}
            placeholder="Buscar por nome ou SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="text-xs uppercase bg-zinc-950/50 text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">SKU</th>
                <th className="px-6 py-4 font-medium">Nome</th>
                <th className="px-6 py-4 font-medium">Categoria</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Custo Unit.</th>
                <th className="px-6 py-4 font-medium">Preço (Venda)</th>
                <th className="px-6 py-4 font-medium text-right">Margem</th>
                <th className="px-6 py-4 font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {paginatedProducts.map((p) => {
                const margin = p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : 0;
                return (
                  <tr key={p.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-zinc-500 text-xs">{p.sku}</td>
                    <td className="px-6 py-4 font-medium text-zinc-50">{p.name}</td>
                    <td className="px-6 py-4 text-zinc-400">{p.category}</td>
                    <td className="px-6 py-4">
                      {p.active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Ativo</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">Inativo</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{formatBRL(p.cost)}</td>
                    <td className="px-6 py-4 font-medium text-zinc-50">
                      {p.price > 0 ? `${formatBRL(p.price)}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.price > 0 ? (
                        <span className={margin > 40 ? "text-emerald-400 font-medium" : margin > 10 ? "text-amber-400 font-medium" : "text-red-400 font-medium"}>
                          {margin.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="secondary"
                        onClick={() => handleOpenEdit(p)}
                        className="p-2 h-auto"
                        title="Editar Produto"
                      >
                        <Edit2 size={16} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-0">
                    <EmptyState
                      icon={<Search size={24} />}
                      title="Nenhum produto encontrado"
                      description="Seu catálogo está vazio ou a busca não encontrou resultados."
                    />
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
      </div>

      {isDrawerOpen && (
        <ProductFormDrawer
          onClose={handleClose}
          onComplete={handleComplete}
          product={selectedProduct}
        />
      )}
    </div>
  );
}
