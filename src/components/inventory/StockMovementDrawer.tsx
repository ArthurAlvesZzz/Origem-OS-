import { useState, useEffect } from 'react';
import { Check, ArrowRightLeft } from 'lucide-react';
import { MovementType, Product } from '../../domain/types';
import { useRepositories } from '../../repositories/RepositoryProvider';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../ui/ConfirmDialog';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { motion } from 'motion/react';

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
  const [isSuccess, setIsSuccess] = useState(false);

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

  const { confirm } = useConfirm();

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
      
      if (type === 'Perda') {
         const proceed = await confirm({
             title: 'Registrar Perda',
             description: `Confirma a perda de ${q} ${selectedProduct.unit} de ${selectedProduct.name}? O estoque será reduzido.`,
             confirmText: 'Registrar Perda',
             isDestructive: true
         });
         if (!proceed) return;
      }

      if (type === 'Ajuste') {
         const diff = q - selectedProduct.currentStock;
         const proceed = await confirm({
             title: 'Ajuste de Estoque',
             description: `Isso fará um ajuste de ${diff} ${selectedProduct.unit}. Confirma?`,
             confirmText: 'Confirmar Ajuste'
         });
         if (!proceed) return;
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

      setIsSuccess(true);
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
        !isSuccess ? (
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
        ) : (
          <Button variant="primary" size="lg" onClick={onComplete} className="w-full">
            Fechar
          </Button>
        )
      }
    >
      {!isSuccess ? (
        <form id="movement-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
            {(['Entrada', 'Ajuste', 'Perda'] as MovementType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  type === t 
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_10px_rgba(197,152,104,0.1)]' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Produto</label>
            <Select 
              required
              value={productId}
              onChange={e => setProductId(e.target.value)}
            >
              <option value="" disabled>Selecione um produto</option>
              {productsData.map(p => (
                <option key={p.id} value={p.id}>{p.name} (Saldo: {p.currentStock} {p.unit})</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                {type === 'Ajuste' ? 'Novo Saldo Final' : 'Quantidade'}
              </label>
              <Input 
                type="number" 
                required
                min="0"
                step="0.01"
                value={qty}
                onChange={e => setQty(e.target.value)}
                className="font-mono text-lg tabular-nums" 
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Unidade</label>
              <Input 
                type="text" 
                disabled
                value={selectedProduct?.unit || '-'}
                className="cursor-not-allowed text-zinc-500" 
              />
            </div>
          </div>

          {selectedProduct && type === 'Ajuste' && qty && (
            <div className="bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-xl text-sm text-zinc-400">
              O estoque mudará de <span className="font-semibold text-zinc-200">{selectedProduct.currentStock}</span> para <span className="font-semibold text-amber-500">{qty}</span>.
              Diferença: <span className="font-medium text-zinc-300">{parseFloat(qty) - selectedProduct.currentStock}</span>.
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Motivo / Observação</label>
            <Textarea 
              rows={3}
              required
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ex: Torra lote #10, Quebra na embalagem..."
              className="resize-none"
            />
          </div>

        </form>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center p-8 text-center"
        >
          <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mb-6 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
              <Check size={48} strokeWidth={1.5} />
            </motion.div>
          </div>
          <h3 className="text-2xl font-heading font-semibold text-zinc-100 mb-2">Movimentação Salva</h3>
          <p className="text-zinc-400 max-w-sm">
            O estoque físico e o histórico foram ajustados.
          </p>
        </motion.div>
      )}
    </Drawer>
  );
}
