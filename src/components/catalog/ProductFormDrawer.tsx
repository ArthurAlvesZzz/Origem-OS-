import { useState, useMemo } from 'react';
import { Save, Package } from 'lucide-react';
import { Product } from '../../domain/types';
import { calculateProductMargin } from '../../domain/products';
import { useRepositories } from '../../repositories/RepositoryProvider';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../ui/ConfirmDialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface ProductFormDrawerProps {
  onClose: () => void;
  onComplete: () => void;
  product?: Product;
}

export function ProductFormDrawer({ onClose, onComplete, product }: ProductFormDrawerProps) {
  const { success, error: toastError, info } = useToast();
  const { productRepo } = useRepositories();
  const { confirm } = useConfirm();
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || 'Café Torrado',
    sku: product?.sku || '',
    unit: product?.unit || 'un',
    price: product?.price?.toString() || '',
    cost: product?.cost?.toString() || '',
    minStock: product?.minStock?.toString() || '10',
    active: product !== undefined ? product.active : true
  });
  
  const [isSaving, setIsSaving] = useState(false);

  const priceNum = parseFloat(formData.price) || 0;
  const costNum = parseFloat(formData.cost) || 0;
  
  const marginStr = useMemo(() => {
    const margin = calculateProductMargin(priceNum, costNum);
    return margin.toFixed(1);
  }, [priceNum, costNum]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (priceNum <= 0) {
        toastError('O preço de venda deve ser maior que zero.');
        return;
      }

      if (product && product.active && !formData.active) {
          const proceed = await confirm({
              title: 'Inativar Produto',
              description: 'Tem certeza que deseja inativar este produto? Ele não aparecerá mais para vendas e movimentos de estoque.',
              confirmText: 'Sim, Inativar',
              isDestructive: true
          });
          if (!proceed) return;
      }
      
      setIsSaving(true);
      
      const payload: Omit<Product, 'id'> = {
        name: formData.name,
        category: formData.category,
        sku: formData.sku,
        unit: formData.unit,
        price: priceNum,
        cost: costNum,
        stock: product ? product.stock : 0,
        minStock: parseInt(formData.minStock, 10) || 0,
        score: product ? product.score : 0,
        active: formData.active
      };

      if (product) {
        await productRepo.updateProduct(product.id, payload);
      } else {
        await productRepo.createProduct(payload);
      }

      onComplete();
    } catch (err: any) {
      console.error(err);
      toastError(err.message);
      setIsSaving(false);
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title={product ? 'Editar Produto' : 'Novo Produto'}
      icon={<Package size={20} />}
      size="md"
      footer={
        <Button 
          variant="conclusive"
          size="lg"
          onClick={handleSubmit}
          disabled={isSaving}
          isLoading={isSaving}
          className="w-full gap-2 text-[15px]"
        >
          {!isSaving && <Save size={20} />}
          Salvar Produto
        </Button>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={formData.active} 
              onChange={e => setFormData({ ...formData, active: e.target.checked })}
              className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/20"
            />
            <span className="text-sm font-medium text-zinc-300">Produto Ativo</span>
          </label>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Nome do Produto</label>
            <Input 
              type="text" 
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Cerrado Natural 250g"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">SKU</label>
              <Input 
                type="text" 
                required
                value={formData.sku}
                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                className="uppercase font-mono" 
                placeholder="EX-PROD-250"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Categoria</label>
              <Select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Café Torrado">Café Torrado</option>
                <option value="Insumo">Insumo</option>
                <option value="Acessório">Acessório</option>
                <option value="Embalagem">Embalagem</option>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Unidade</label>
              <Select
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
              >
                <option value="un">Unidade (un)</option>
                <option value="kg">Quilo (kg)</option>
                <option value="g">Grama (g)</option>
                <option value="l">Litro (l)</option>
              </Select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Estoque Mínimo</label>
              <Input 
                type="number" 
                required
                min="0"
                value={formData.minStock}
                onChange={e => setFormData({ ...formData, minStock: e.target.value })}
                className="tabular-nums" 
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-800/50 space-y-4">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-300">Precificação</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Custo (R$)</label>
              <Input 
                type="number" 
                step="0.01"
                min="0"
                required
                value={formData.cost}
                onChange={e => setFormData({ ...formData, cost: e.target.value })}
                className="tabular-nums font-mono text-lg" 
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Preço Venda (R$)</label>
              <Input 
                type="number" 
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                className="tabular-nums font-mono text-lg text-emerald-400" 
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Margem Estimada</span>
            <span className={`text-xl font-mono tracking-tighter font-bold ${parseFloat(marginStr) > 30 ? 'text-emerald-400' : parseFloat(marginStr) > 10 ? 'text-amber-400' : 'text-red-400'}`}>
              {marginStr}%
            </span>
          </div>
        </div>
      </form>
    </Drawer>
  );
}
