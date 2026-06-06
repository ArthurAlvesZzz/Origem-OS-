import { useState, useEffect } from 'react';
import { Check, ArrowRightLeft } from 'lucide-react';
import { MovementType, Product } from '../../domain/types';
import { useRepositories } from '../../repositories/RepositoryProvider';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { useToast } from '../../components/ui/Toast';

interface StockMovementDrawerProps {
  onClose: () => void;
  onComplete: () => void;
  initialType?: MovementType;
}

export function StockMovementDrawer({ onClose, onComplete, initialType = 'Entrada' }: StockMovementDrawerProps) {
  const { success, error: toastError, info } = useToast();
  const [type, setType] = useState<MovementType>(initialType);
  const [productId, setProductId] = useState<string>('');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { productRepo, inventoryRepo } = useRepositories();
  const [productsData, setProductsData] = useState<(Product & { currentStock: number })[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const prods = await productRepo.getProducts();
      const withStock = await Promise.all(
        prods.filter(p => p.active).map(async p => ({
          ...p,
          currentStock: await inventoryRepo.calculateCurrentStock(p.id)
        }))
      );
      setProductsData(withStock);
    };
    fetchData();
  }, [productRepo, inventoryRepo]);

  const selectedProduct = productsData.find(p => p.id === productId);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (!selectedProduct) {
        toastError('Selecione um produto.');
        return;
      }

      const q = parseFloat(qty);
      if (isNaN(q)) {
        toastError('Quantidade inválida.');
        return;
      }
      
      setIsSaving(true);

      if (type === 'Entrada') {
        await inventoryRepo.createStockEntry(productId, selectedProduct.name, q, reason || 'Entrada manual');
      } else if (type === 'Perda') {
        await inventoryRepo.createStockLoss(productId, selectedProduct.name, q, reason || 'Perda registrada');
      } else if (type === 'Ajuste') {
        await inventoryRepo.createStockAdjustment(productId, selectedProduct.name, q, reason || 'Ajuste de estoque');
      } else if (type === 'Saída') {
        toastError('Para saídas normais de venda, utilize o PDV.'); // Block raw saídas to encourage PDV
        setIsSaving(false);
        return;
      }

      success('Movimentação registrada com sucesso!');
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
      title="Nova Movimentação"
      icon={<ArrowRightLeft size={20} />}
      size="sm"
      footer={
        <Button 
          variant="conclusive"
          size="lg"
          onClick={handleSubmit}
          disabled={isSaving}
          isLoading={isSaving}
          className="w-full gap-2 text-[15px]"
        >
          {!isSaving && <Check size={20} />}
          Confirmar Movimentação
        </Button>
      }
    >
      <form id="movement-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
          {(['Entrada', 'Ajuste', 'Perda'] as MovementType[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                type === t 
                  ? 'bg-zinc-800 text-zinc-50 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1.5">Produto</label>
          <select 
            required
            value={productId}
            onChange={e => setProductId(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-700"
          >
            <option value="" disabled>Selecione um produto</option>
            {productsData.map(p => (
              <option key={p.id} value={p.id}>{p.name} (Saldo: {p.currentStock} {p.unit})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              {type === 'Ajuste' ? 'Novo Saldo Final' : 'Quantidade'}
            </label>
            <input 
              type="number" 
              required
              min="0"
              step="0.01"
              value={qty}
              onChange={e => setQty(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-700 tabular-nums" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Unidade</label>
            <input 
              type="text" 
              disabled
              value={selectedProduct?.unit || '-'}
              className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-500 rounded-lg px-4 py-2.5 cursor-not-allowed" 
            />
          </div>
        </div>

        {selectedProduct && type === 'Ajuste' && qty && (
          <div className="bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-lg text-sm text-zinc-400">
            O estoque mudará de <span className="font-medium text-zinc-300">{selectedProduct.currentStock}</span> para <span className="font-medium text-zinc-300">{qty}</span>.
            Diferença: <span className="font-medium text-zinc-300">{parseFloat(qty) - selectedProduct.currentStock}</span>.
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1.5">Motivo / Observação</label>
          <textarea 
            rows={3}
            required
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Ex: Torra lote #10, Quebra na embalagem..."
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-700 resize-none"
          />
        </div>

      </form>
    </Drawer>
  );
}
