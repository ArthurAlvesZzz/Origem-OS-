import { useState, useEffect } from 'react';
import { ShoppingBag, CreditCard, Check, Plus } from 'lucide-react';
import { ProductSearch } from './ProductSearch';
import { SaleCart } from './SaleCart';
import { PaymentSelector } from './PaymentSelector';
import { SaleSummary } from './SaleSummary';
import { Product, OrderItem, OrderStatus } from '../../domain/types';
import { calculateOrderTotals } from '../../domain/orders';
import { useRepositories } from '../../repositories/RepositoryProvider';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { motion, AnimatePresence } from 'motion/react';
import { useConfirm } from '../ui/ConfirmDialog';
import { useToast } from '../ui/Toast';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';

interface NewSaleDrawerProps {
  onClose: () => void;
  onComplete: () => void;
}

export function NewSaleDrawer({ onClose, onComplete }: NewSaleDrawerProps) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [customerId, setCustomerId] = useState<string>('');
  const [method, setMethod] = useState<string>('PIX');
  const [status, setStatus] = useState<OrderStatus>('Pago');
  const [channel, setChannel] = useState<string>('Whatsapp');
  const [dueDate, setDueDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { orderRepo, inventoryRepo, financialRepo, customerRepo, settingsRepo } = useRepositories();
  const [customers, setCustomers] = useState<{id: string, name: string}[]>([]);
  const { confirm } = useConfirm();
  const { error: toastError, success } = useToast();

  useEffect(() => {
    customerRepo.getCustomers().then(all => {
      setCustomers(all.filter(c => c.status !== 'blocked' && c.status !== 'inactive'));
    });
    
    settingsRepo.getBusinessRules().then(rules => {
      if (rules.defaultPaymentMethod) setMethod(rules.defaultPaymentMethod);
      if (rules.defaultSalesChannel) setChannel(rules.defaultSalesChannel);
      
      const defaultDays = rules.defaultB2CPaymentTermsDays || 0;
      const d = new Date();
      d.setDate(d.getDate() + defaultDays);
      setDueDate(d.toISOString().split('T')[0]);
    }).catch(console.error);
  }, [customerRepo, settingsRepo]);

  const handleSelectProduct = (p: Product) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === p.id);
      if (existing) {
        return prev.map(i => i.productId === p.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, {
        productId: p.id,
        name: p.name,
        qty: 1,
        unitPrice: p.price,
        unitCost: p.cost,
        discount: 0
      }];
    });
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setItems(prev => prev.map(i => {
      if (i.productId === productId) {
        const newQty = Math.max(1, i.qty + delta);
        return { ...i, qty: newQty };
      }
      return i;
    }));
  };

  const handleRemoveItem = (productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  };

  const handleFinalize = async () => {
    if (items.length === 0) return;

    const stockWarnings: string[] = [];
    for (const item of items) {
      const currentStock = await inventoryRepo.calculateCurrentStock(item.productId);
      if (currentStock < item.qty) {
        stockWarnings.push(`O produto ${item.name} excederá o estoque (${currentStock} disponíveis).`);
      }
    }

    if (stockWarnings.length > 0) {
      const proceed = await confirm({
        title: 'Aviso de Estoque Negativo',
        description: `${stockWarnings.join('\n')}\n\nDeseja continuar mesmo assim? O estoque ficará negativo.`,
        confirmText: 'Continuar Venda'
      });
      if (!proceed) return;
    }

    setIsFinalizing(true);

    try {
      const customer = customers.find(c => c.id === customerId);
      const { subtotal, totalDiscount, total } = calculateOrderTotals(items);
      
      const newOrder = await orderRepo.createOrder({
        customerId: customer?.id,
        customerName: customer?.name || 'Consumidor Final',
        items,
        subtotal,
        discount: totalDiscount,
        total,
        paymentMethod: method,
        status
      });

      for (const item of items) {
        await inventoryRepo.createStockExit(item.productId, item.name, item.qty, `Venda ${newOrder.id}`);
      }

      if (status === 'Pago') {
        await financialRepo.createTransaction({
          description: `Venda ${newOrder.id}`,
          amount: total,
          date: new Date().toISOString(),
          status: 'Efetivado',
          type: 'Receita',
          category: 'Vendas',
          paymentMethod: method
        });
      } else if (status === 'Pendente' || status === 'Parcial') {
        await financialRepo.createTransaction({
          description: `Recebimento ref ${newOrder.id}`,
          amount: total,
          date: new Date(dueDate).toISOString(),
          status: 'Agendado',
          type: 'Receita',
          category: 'Vendas',
          paymentMethod: method
        });
      }
      
      setIsSuccess(true);
      // Removed auto-close
    } catch (e: any) {
      console.error(e);
      toastError(e.message || 'Erro ao finalizar venda.');
      setIsFinalizing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const resetSale = () => {
    setItems([]);
    setCustomerId('');
    setMethod('PIX');
    setStatus('Pago');
    setIsSuccess(false);
    setIsFinalizing(false);
  };

  const { subtotal, totalDiscount, total } = calculateOrderTotals(items);

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title="Nova Venda (PDV)"
      subtitle="Lançamento de pedido manual e baixa de estoque."
      icon={<ShoppingBag size={20} />}
      size="lg"
      footer={
        !isSuccess ? (
          <div>
            <SaleSummary items={items} />
            <div className="mt-5">
              <Button 
                variant="conclusive"
                size="lg"
                onClick={handleFinalize}
                disabled={items.length === 0}
                isLoading={isFinalizing}
                className="w-full justify-center gap-2"
              >
                {!isFinalizing && <Check size={20} />}
                Confirmar e Receber
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
             <Button variant="outline" size="lg" className="flex-1" onClick={handlePrint}>
                Imprimir Recibo
             </Button>
             <Button variant="primary" size="lg" className="flex-1 gap-2" onClick={resetSale}>
                <Plus size={18} /> Nova Venda
             </Button>
          </div>
        )
      }
    >
      {!isSuccess ? (
        <div className="space-y-6">
          {/* Customer Selection */}
          <section className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 shadow-sm">
            <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Identificação do Cliente</label>
            <Select 
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
            >
              <option value="">👤 Cliente Balcão (Consumidor Final)</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </section>

          {/* Add Product */}
          <section className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 shadow-sm">
            <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Buscar Produtos (SKU ou Nome)</label>
            <ProductSearch onSelectProduct={handleSelectProduct} />
          </section>

          {/* Cart */}
          <section className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800/50">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-300">Itens do Pedido</label>
              <span className="text-[11px] font-mono font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded uppercase tracking-wider">{items.length} itens</span>
            </div>
            <div className="min-h-[100px]">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                  <ShoppingBag size={32} className="mb-3 opacity-20" />
                  <p className="text-sm">Carrinho vazio</p>
                </div>
              ) : (
                <SaleCart items={items} onUpdateQty={handleUpdateQty} onRemoveItem={handleRemoveItem} />
              )}
            </div>
          </section>

          {/* Payment */}
          <AnimatePresence>
            {items.length > 0 && (
              <motion.section 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 shadow-sm space-y-5 overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-2 pb-3 border-b border-zinc-800/50">
                  <CreditCard size={18} className="text-amber-500" />
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-300">Condições de Pagamento</label>
                </div>
                <PaymentSelector 
                  method={method} 
                  status={status} 
                  onChangeMethod={setMethod} 
                  onChangeStatus={setStatus} 
                />
                {status === 'Pendente' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-4 border-t border-zinc-800/50">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-3">Data de Vencimento Previsão</label>
                    <Input 
                      type="date"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                    />
                  </motion.div>
                )}
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center p-8 text-center"
        >
          <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-6 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
              <Check size={48} strokeWidth={1.5} />
            </motion.div>
          </div>
          <h3 className="text-2xl font-heading font-semibold text-zinc-100 mb-2">Venda Registrada</h3>
          <p className="text-zinc-400 max-w-sm">
            Estoque atualizado e lançamento financeiro gerado com sucesso.
          </p>
        </motion.div>
      )}
    </Drawer>
  );
}
