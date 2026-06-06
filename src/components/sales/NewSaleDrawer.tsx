import { useState, useEffect } from 'react';
import { X, Check, ShoppingBag, CreditCard } from 'lucide-react';
import { ProductSearch } from './ProductSearch';
import { SaleCart } from './SaleCart';
import { PaymentSelector } from './PaymentSelector';
import { SaleSummary } from './SaleSummary';
import { Product, OrderItem, OrderStatus } from '../../domain/types';
import { calculateOrderTotals } from '../../domain/orders';
import { useRepositories } from '../../repositories/RepositoryProvider';
import { Button } from '../ui/Button';

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
  
  const { orderRepo, inventoryRepo, financialRepo, customerRepo, settingsRepo } = useRepositories();
  const [customers, setCustomers] = useState<{id: string, name: string}[]>([]);

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
      const proceed = window.confirm(`${stockWarnings.join('\n')}\n\nDeseja continuar mesmo assim? O estoque ficará negativo.`);
      if (!proceed) return;
    }

    const customer = customers.find(c => c.id === customerId);
    const { subtotal, totalDiscount, total } = calculateOrderTotals(items);
    
    // Core Domain Call via Repositories
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

    // Apply Stock
    for (const item of items) {
      await inventoryRepo.createStockExit(item.productId, item.name, item.qty, `Venda ${newOrder.id}`);
    }

    // Apply Finance
    if (status === 'Pago') {
      await financialRepo.createTransaction({
        description: `Venda ${newOrder.id}`,
        amount: total,
        date: new Date().toISOString(),
        status: 'Efetivado',
        type: 'Receita',
        category: 'Vendas',
        paymentMethod: method
      }); // Note: for receipts we should use a revenue type! Wait!
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
    
    alert('Venda finalizada com sucesso!');
    onComplete();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity animate-in fade-in duration-300" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-zinc-950 border-l border-zinc-800 shadow-2xl z-[101] flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-heading font-medium text-zinc-50 tracking-tight flex items-center gap-2">
              <ShoppingBag size={20} className="text-amber-500" /> Nova Venda (PDV)
            </h2>
            <p className="text-sm text-zinc-400 mt-1">Lançamento de pedido manual e baixa de estoque contínua.</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Customer Selection */}
          <section className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-5 shadow-sm">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Identificação do Cliente</label>
            <select 
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-50 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors appearance-none"
            >
              <option value="">👤 Cliente Balcão (Consumidor Final)</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </section>

          {/* Add Product */}
          <section className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-5 shadow-sm">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Pesquisa de Produtos</label>
            <ProductSearch onSelectProduct={handleSelectProduct} />
          </section>

          {/* Cart */}
          <section className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800/50">
              <label className="block text-sm font-semibold text-zinc-100">Itens do Pedido</label>
              <span className="text-[11px] font-mono font-medium bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded uppercase tracking-wider">{items.length} itens</span>
            </div>
            <SaleCart items={items} onUpdateQty={handleUpdateQty} onRemoveItem={handleRemoveItem} />
          </section>

          {/* Payment */}
          {items.length > 0 && (
            <section className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-5 shadow-sm space-y-5">
              <div className="flex items-center gap-2 mb-2 pb-3 border-b border-zinc-800/50">
                <CreditCard size={18} className="text-emerald-500" />
                <label className="block text-sm font-semibold text-zinc-100">Condições de Pagamento</label>
              </div>
              <PaymentSelector 
                method={method} 
                status={status} 
                onChangeMethod={setMethod} 
                onChangeStatus={setStatus} 
              />
              {status === 'Pendente' && (
                <div className="pt-4 border-t border-zinc-800/50">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Data de Vencimento Previsão</label>
                  <input 
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-50 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors" 
                  />
                </div>
              )}
            </section>
          )}

        </div>

        {/* Footer Summary & Action */}
        <div className="border-t border-zinc-800/50 bg-zinc-900/80 backdrop-blur-md p-6 sticky bottom-0">
          <SaleSummary items={items} />
          <div className="mt-5">
            <Button 
              onClick={handleFinalize}
              disabled={items.length === 0}
              className="w-full justify-center gap-2 py-6 text-sm bg-amber-500 hover:bg-amber-400 text-amber-950"
            >
              <Check size={20} />
              Concluir Transação PDV
            </Button>
          </div>
        </div>

      </div>
    </>
  );
}
