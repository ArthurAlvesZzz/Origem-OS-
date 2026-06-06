import { formatBRL } from '../../lib/format';
import { Search, Plus, Package } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Product } from '../../domain/types';
import { useRepositories } from '../../repositories/RepositoryProvider';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface ProductSearchProps {
  onSelectProduct: (product: Product) => void;
}

export function ProductSearch({ onSelectProduct }: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { productRepo } = useRepositories();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    productRepo.getProducts().then(setProducts);
  }, [productRepo]);

  const filteredProducts = searchTerm.trim() 
    ? products.filter(p => 
        p.active && (
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : [];

  return (
    <div className="space-y-3">
      <Input 
        icon={<Search className="text-zinc-500" size={18} />}
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        placeholder="Buscar produto por nome ou SKU..." 
      />

      {searchTerm && (
        <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          {filteredProducts.length > 0 ? (
            <ul className="divide-y divide-zinc-800/50 max-h-60 overflow-y-auto custom-scrollbar">
              {filteredProducts.map(p => (
                <li key={p.id} className="p-3 hover:bg-zinc-900 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg border border-zinc-800 bg-zinc-900 group-hover:border-amber-500/30 flex items-center justify-center text-zinc-500 group-hover:text-amber-500 transition-colors overflow-hidden shrink-0">
                      {(p as any).imageUrl ? (
                        <img src={(p as any).imageUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={20} />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm text-zinc-100 group-hover:text-amber-500 transition-colors">{p.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">{p.sku}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${p.stock > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>Estq: {p.stock}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium font-mono text-zinc-300">{formatBRL(p.price)}</div>
                    <Button 
                      onClick={() => onSelectProduct(p)}
                      variant="secondary"
                      size="sm"
                      className="w-8 h-8 p-0"
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6 text-center text-sm font-medium text-zinc-500">
              Nenhum produto encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
