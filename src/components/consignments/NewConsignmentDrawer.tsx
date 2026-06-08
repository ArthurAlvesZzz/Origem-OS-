import { formatBRL } from '../../lib/format';
import { useState, useEffect } from 'react';
import { X, Check, Truck } from 'lucide-react';
import { Product } from '../../domain/types';
import { useRepositories } from '../../repositories/RepositoryProvider';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { useConfirm } from '../ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { motion } from 'motion/react';

interface NewConsignmentDrawerProps {
  onClose: () => void;
  onComplete: () => void;
}

export function NewConsignmentDrawer({ onClose, onComplete }: NewConsignmentDrawerProps) {
  const { success, error: toastError, info } = useToast();
  const [partnerId, setPartnerId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<{ productId: string; name: string; qtySent: number; unitPrice: number; unitCost: number }[]>([]);
  
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('');
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { productRepo, consignmentRepo, inventoryRepo, settingsRepo } = useRepositories();
  const [partners, setPartners] = useState<{id: string, name: string, defaultTermDays?: number}[]>([]);
  const [productsData, setProductsData] = useState<(Product & { currentStock: number })[]>([]);
  
  const { confirm } = useConfirm();

  useEffect(() => {
    consignmentRepo.getPartners().then(setPartners);

    settingsRepo.getBusinessRules().then(rules => {
      const defaultDays = rules.defaultConsignmentSettleDays || 15;
      const d = new Date();
      d.setDate(d.getDate() + defaultDays);
      setDueDate(d.toISOString().split('T')[0]);
    }).catch(console.error);
    
    const fetchProducts = async () => {
      const prods = await productRepo.getProducts();
      const withStock = await Promise.all(
        prods.filter(p => p.active).map(async p => ({
          ...p,
          currentStock: await inventoryRepo.calculateCurrentStock(p.id)
        }))
      );
      setProductsData(withStock);
    };
    fetchProducts();
  }, [consignmentRepo, productRepo, inventoryRepo, settingsRepo]);

  const selectedProduct = productsData.find(p => p.id === productId);

  const handleAddItem = async () => {
    if (!selectedProduct) return;
    const q = parseFloat(qty);
    if (isNaN(q) || q <= 0) return;

    if (q > selectedProduct.currentStock) {
      const proceed = await confirm({
        title: 'Estoque insuficiente',
        description: `Cuidado: O produto ${selectedProduct.name} tem apenas ${selectedProduct.currentStock} disponíveis. Deseja adicionar mesmo assim? O estoque ficará negativo.`,
        confirmText: 'Adicionar',
        cancelText: 'Cancelar'
      });
      if (!proceed) return;
    }

    setItems(prev => {
      const existing = prev.find(i => i.productId === selectedProduct.id);
      if (existing) {
        return prev.map(i => i.productId === selectedProduct.id ? { ...i, qtySent: i.qtySent + q } : i);
      }
      return [...prev, {
        productId: selectedProduct.id,
        name: selectedProduct.name,
        qtySent: q,
        unitPrice: selectedProduct.price,
        unitCost: selectedProduct.cost
      }];
    });

    setProductId('');
    setQty('');
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(i => i.productId !== id));
  };

  const handlePartnerSelect = (e: any) => {
    const id = e.target.value;
    setPartnerId(id);
    const partner = partners.find(p => p.id === id);
    if (partner) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + (partner.defaultTermDays || 30));
      setDueDate(defaultDate.toISOString().slice(0, 10));
    }
  };

  const handleFinalize = async () => {
    if (!partnerId) {
      toastError('Selecione um parceiro.');
      return;
    }
    if (!dueDate) {
      toastError('Informe a data de vencimento.');
      return;
    }
    if (items.length === 0) {
      toastError('Adicione pelo menos um produto na remessa.');
      return;
    }

    setIsFinalizing(true);

    try {
      const partner = partners.find(p => p.id === partnerId);
      await consignmentRepo.createConsignment({
        partnerId: partnerId,
        partnerName: partner?.name || 'Desconhecido',
        date: new Date().toISOString(),
        expectedReturnDate: dueDate,
        totalValue,
        items: items.map(i => ({
          productId: i.productId,
          name: i.name,
          sentQty: i.qtySent,
          unitPrice: i.unitPrice,
          unitCost: i.unitCost
        }))
      });
      
      setIsSuccess(true);
    } catch (err: any) {
      console.error(err);
      toastError(err.message);
      setIsFinalizing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const resetState = () => {
    setItems([]);
    setPartnerId('');
    setProductId('');
    setQty('');
    setIsSuccess(false);
    setIsFinalizing(false);
  };

  const totalValue = items.reduce((acc, item) => acc + (item.qtySent * item.unitPrice), 0);

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title="Nova Remessa em Consignação"
      icon={<Truck size={20} />}
      size="md"
      footer={
        !isSuccess ? (
          <div className="w-full">
            <div className="flex justify-between items-center mb-4 bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-inner">
              <span className="text-sm text-zinc-400 font-medium">Total Potencial (Estimado)</span>
              <span className="text-2xl font-heading font-semibold text-emerald-400">{formatBRL(totalValue)}</span>
            </div>
            <Button 
              variant="conclusive"
              size="lg"
              onClick={handleFinalize}
              disabled={items.length === 0 || !partnerId || isFinalizing}
              isLoading={isFinalizing}
              className="w-full gap-2 text-[15px]"
            >
              {!isFinalizing && <Check size={20} />}
              Gerar Consignação
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
             <Button variant="outline" size="lg" className="flex-1" onClick={handlePrint}>
                Imprimir Remessa
             </Button>
             <Button variant="primary" size="lg" className="flex-1 gap-2" onClick={onComplete}>
                Concluir
             </Button>
          </div>
        )
      }
    >
      {!isSuccess ? (
        <div className="space-y-8">
          <section className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Parceiro (Local B2B)</label>
              <Select 
                value={partnerId}
                onChange={handlePartnerSelect}
              >
                <option value="" disabled>Selecione o parceiro</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Prazo: {p.defaultTermDays}d)</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Data Limite de Acerto</label>
              <Input 
                type="date" 
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </section>

          <section className="pt-6 border-t border-zinc-800/50">
            <h3 className="font-heading font-medium text-zinc-100 mb-4">Itens da Remessa</h3>
            
            <div className="flex gap-3 items-end mb-4 bg-zinc-900/50 p-4 border border-zinc-800 rounded-2xl">
              <div className="flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Produto</label>
                <Select 
                  value={productId}
                  onChange={e => setProductId(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {productsData.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Disp: {p.currentStock})</option>
                  ))}
                </Select>
              </div>
              <div className="w-24">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Qtd</label>
                <Input 
                  type="number" 
                  min="0"
                  step="1"
                  value={qty}
                  onChange={e => setQty(e.target.value)}
                />
              </div>
              <Button 
                variant="secondary"
                onClick={handleAddItem}
                className="mb-0 h-[42px]"
              >
                Incluir
              </Button>
            </div>

            {items.length > 0 ? (
              <ul className="space-y-2 mt-4">
                {items.map(item => (
                  <li key={item.productId} className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-3 rounded-xl transition-all hover:border-zinc-700">
                    <div>
                      <span className="font-medium font-heading text-zinc-100">{item.name}</span>
                      <div className="text-zinc-500 text-xs font-mono uppercase tracking-widest">{formatBRL(item.unitPrice)} / un</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="tabular-nums font-semibold text-amber-500">{item.qtySent} un</span>
                      <button onClick={() => handleRemoveItem(item.productId)} className="text-zinc-500 hover:text-red-400 p-2 rounded-lg hover:bg-zinc-800 transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-8 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
                <span className="text-sm font-medium text-zinc-500">Nenhum produto na remessa.</span>
              </div>
            )}
          </section>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center p-8 text-center"
        >
          <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 mb-6 shadow-[0_0_40px_rgba(197,152,104,0.2)]">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
              <Check size={48} strokeWidth={1.5} />
            </motion.div>
          </div>
          <h3 className="text-2xl font-heading font-semibold text-zinc-100 mb-2">Remessa Gerada</h3>
          <p className="text-zinc-400 max-w-sm">
            Consignação registrada com sucesso. O estoque foi deduzido.
          </p>
        </motion.div>
      )}
    </Drawer>
  );
}

