import React, { useState, useEffect } from 'react';
import { useRepositories } from '../repositories/RepositoryProvider';
import { B2BCatalogItemRecord } from '../repositories/interfaces/IB2BCatalogRepository';
import { Layers, Eye, EyeOff, Edit, Plus, CheckCircle2, Package, Search } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

export function B2BCatalog() {
  const { b2bCatalogRepo, productRepo } = useRepositories();
  const [items, setItems] = useState<B2BCatalogItemRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    setLoading(true);
    try {
      const data = await b2bCatalogRepo.getItems();
      setItems(data);
    } catch(e) {}
    setLoading(false);
  }

  if (loading) {
     return (
       <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-96 w-full" />
       </div>
     );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader 
        title="Catálogo B2B" breadcrumbs={[{label: "Dashboard", href: "#/"}, {label: "Catálogo B2B"}]}
        description="Gerencie produtos, preços B2B e quantidades mínimas."
        action={
          <Button variant="primary" className="flex items-center gap-2">
            <Plus size={16} /> Novo Produto
          </Button>
        }
      />

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        {items.length === 0 ? (
          <EmptyState
            icon={<Package size={24} />}
            title="Nenhum produto no Catálogo B2B"
            description="Adicione produtos e defina tabelas e quantidades mínimas para começar a atender atacadistas."
            action={
              <Button variant="outline" className="mt-4">
                <Plus size={16} className="mr-2" />
                Adicionar Primeiro Produto
              </Button>
            }
          />
        ) : (
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800">
              <tr>
                 <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Produto</th>
                 <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Preço B2B</th>
                 <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">MOQ</th>
                 <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Lead Time</th>
                 <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Status</th>
                 <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-zinc-800/50 transition-colors">
                   <td className="px-6 py-4 whitespace-nowrap font-medium text-white">{item.product?.name || 'Produto Base'}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-amber-500 font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap">{item.moq} un</td>
                   <td className="px-6 py-4 whitespace-nowrap">{item.leadTimeDays} dias</td>
                   <td className="px-6 py-4 whitespace-nowrap">
                      {item.isVisible ? (
                         <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full text-xs font-medium w-fit">
                            <Eye size={12} /> Visível
                         </span>
                      ) : (
                         <span className="flex items-center gap-1.5 text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full text-xs font-medium w-fit">
                            <EyeOff size={12} /> Oculto
                         </span>
                      )}
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button variant="secondary" className="p-2 h-auto" title="Editar">
                         <Edit size={16} />
                      </Button>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
