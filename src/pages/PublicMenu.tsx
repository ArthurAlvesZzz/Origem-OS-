import { formatBRL } from '../lib/format';
import React, { useState, useEffect } from 'react';
import { useRepositories } from '../repositories/RepositoryProvider';
import { DigitalMenuCategory, DigitalMenuConfig, DigitalMenuOrderPayload } from '../domain/digitalMenu';
import { Store, ShoppingBag, ArrowLeft, Clock, MapPin, Check, QrCode, Coffee, X } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

export function PublicMenu({ slug }: { slug: string }) {
  const { success, error: toastError, info } = useToast();
  const { digitalMenuRepo } = useRepositories();
  const [config, setConfig] = useState<DigitalMenuConfig | null>(null);
  const [categories, setCategories] = useState<DigitalMenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [cart, setCart] = useState<{ id: string, name: string, price: number, qty: number, options: any[], optionsTotal: number, uid: string }[]>([]);
  const [checkoutStep, setCheckoutStep] = useState<'menu' | 'cart' | 'checkout' | 'success'>('menu');
  const [orderSummary, setOrderSummary] = useState<{ id: string, trackingNumber?: string, qrcode?: string, checkoutUrl?: string, total: number } | null>(null);

  // Form info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryZone, setDeliveryZone] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('mercadopago');

  const [orderStatus, setOrderStatus] = useState<string>('received');
  
  // Modals
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [itemModifiers, setItemModifiers] = useState<Record<string, any[]>>({});
  const [itemNotes, setItemNotes] = useState(''); 
  
  // Active Category state
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');

  const mapStatus = (st: string) => {
    switch (st) {
      case 'received': return 'Recebido';
      case 'preparing': return 'Em Preparo';
      case 'ready': return 'Pronto (Liberado)';
      case 'out_for_delivery': return 'Saiu para Entrega';
      case 'delivered': return 'Concluído';
      case 'canceled': return 'Cancelado';
      default: return st;
    }
  };

  useEffect(() => {
    digitalMenuRepo.getPublicMenu(slug).then(res => {
      if (res) {
        setConfig(res.config);
        setCategories(res.categories);
        if (res.categories.length > 0) setActiveCategoryId(res.categories[0].id);
        setPaymentMethod(res.config.paymentProvider || 'manual_pix');
        
        if (res.config.deliveryZonesJson) {
            try {
                const zones = JSON.parse(res.config.deliveryZonesJson);
                const activeZone = zones.find((z:any) => z.active);
                if (activeZone) setDeliveryZone(activeZone.name);
            } catch(e) {}
        }
      }
      
      const searchParams = new URLSearchParams(window.location.search);
      const checkoutStatus = searchParams.get('checkout');
      const orderIdParam = searchParams.get('order');
      
      if (checkoutStatus && orderIdParam) {
        setCheckoutStep('success');
        setOrderSummary({ 
          id: orderIdParam, 
          trackingNumber: orderIdParam, 
          total: 0 // Will be updated by status checker
        });
        if (checkoutStatus === 'failure') {
           setOrderStatus('canceled');
        }
      }
      
      setLoading(false);
    });
  }, [slug]);

  const openItemModal = (item: any) => {
    setSelectedItem(item);
    setItemModifiers({});
    setItemNotes('');
  };

  const toggleModifier = (group: any, option: any) => {
      setItemModifiers(prev => {
          let selected = prev[group.id] || [];
          const isSelected = selected.some(o => o.id === option.id);
          
          if (group.maxSelections === 1) {
              return { ...prev, [group.id]: [option] };
          }
          
          if (isSelected) {
              selected = selected.filter(o => o.id !== option.id);
          } else if (selected.length < group.maxSelections) {
              selected = [...selected, option];
          }
          
          return { ...prev, [group.id]: selected };
      });
  };

  const confirmItemAdd = () => {
      if (!selectedItem) return;
      
      // Validation
      if (selectedItem.modifierGroups) {
          for (const group of selectedItem.modifierGroups) {
              const selected = itemModifiers[group.id] || [];
              if (selected.length < group.minSelections) {
                  toastError(`Selecione no mínimo ${group.minSelections} em "${group.name}".`);
                  return;
              }
          }
      }

      let flatOptions: any[] = [];
      Object.values(itemModifiers).forEach(opts => flatOptions = [...flatOptions, ...opts]);
      
      const optionsTotal = flatOptions.reduce((acc, opt) => acc + (opt.price || 0), 0);
      const uid = Date.now().toString();

      setCart([...cart, { 
          id: selectedItem.id, 
          name: selectedItem.name, 
          price: selectedItem.price, 
          qty: 1, 
          options: flatOptions, 
          optionsTotal, 
          uid 
      }]);
      
      setSelectedItem(null);
  };

  const removeFromCart = (uid: string) => {
    setCart(cart.filter(c => c.uid !== uid));
  };

  const cartTotal = cart.reduce((acc, curr) => acc + ((curr.price + curr.optionsTotal) * curr.qty), 0);
  
  let currentDeliveryFee = config?.deliveryFee || 0;
  if (deliveryMethod === 'delivery' && deliveryZone && config?.deliveryZonesJson) {
      try {
          const zones = JSON.parse(config.deliveryZonesJson);
          const matched = zones.find((z:any)=>z.name === deliveryZone && z.active);
          if (matched) currentDeliveryFee = matched.fee;
      } catch(e) {}
  }
  
  const finalTotal = cartTotal + (deliveryMethod === 'delivery' ? currentDeliveryFee : 0);

  const placeOrder = async () => {
    if (!customerName.trim()) {
      toastError('Informe seu nome para continuar.');
      return;
    }
    setLoading(true);
    try {
      const payload: DigitalMenuOrderPayload = {
        customerName,
        customerPhone,
        deliveryMethod,
        paymentMethod,
        deliveryZone: deliveryMethod === 'delivery' ? deliveryZone : undefined,
        notes: deliveryMethod === 'delivery' ? `Endereço: ${customerAddress}` : '',
        items: cart.map(c => ({ 
           itemId: c.id, 
           qty: c.qty,
           modifiers: c.options.map((o:any)=>({ id: o.id, name: o.name, price: o.price, groupId: o.groupId }))
        }))
      };
      
      const res = await digitalMenuRepo.createPublicOrder(slug, payload);
      setOrderSummary({ 
        id: res.orderId, 
        trackingNumber: res.trackingNumber || res.orderId,
        qrcode: res.pixQrCode, 
        checkoutUrl: res.checkoutUrl, 
        total: res.total 
      });
      
      if (res.checkoutUrl) {
         // Se tiver checkoutUrl, já manda o cliente pra lá e o retorno processará sucesso
         window.location.href = res.checkoutUrl;
         return;
      }
      
      setCheckoutStep('success');
      setCart([]);
    } catch(e) {
      toastError('Erro ao criar pedido.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval: any;
    if (checkoutStep === 'success' && orderSummary && orderSummary.trackingNumber) {
      interval = setInterval(async () => {
        try {
          const res = await digitalMenuRepo.getPublicOrder(slug, orderSummary.trackingNumber!);
          if (res) {
            setOrderStatus(res.status);
            setOrderSummary(prev => prev ? { ...prev, total: res.total } : null);
          }
        } catch (e) {
            // ignore
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [checkoutStep, orderSummary, slug, digitalMenuRepo]);

  if (loading && checkoutStep === 'menu') {
    return <div className="min-h-screen flex items-center justify-center bg-[#100C08] text-[#C59868] font-mono uppercase tracking-widest text-xs">Montando cardápio...</div>;
  }

  if (!config) {
    return <div className="min-h-screen flex items-center justify-center bg-[#100C08] text-red-500 font-mono uppercase tracking-widest">Cardápio não encontrado.</div>;
  }

  return (
    <div className="min-h-screen bg-[#100C08] text-zinc-50 font-sans selection:bg-[#C59868]/30">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#100C08]/90 backdrop-blur-md border-b border-white/5 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {checkoutStep !== 'menu' && checkoutStep !== 'success' && (
            <button onClick={() => setCheckoutStep(checkoutStep === 'checkout' ? 'cart' : 'menu')} className="p-2 -ml-2 text-zinc-400 hover:text-zinc-100">
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="font-heading font-semibold text-lg text-zinc-50 tracking-tight leading-tight">{config.publicName}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <span className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm ${config.isOpen ? 'bg-[#528F65]/20 text-[#528F65]' : 'bg-[#AF4D4D]/20 text-[#AF4D4D]'}`}>
                {config.isOpen ? 'Aberto' : 'Fechado'}
              </span>
              {config.estimatedPrepMinutes > 0 && (
                <span className="flex items-center gap-1 text-xs text-zinc-500">
                  <Clock size={12} /> ~{config.estimatedPrepMinutes} min
                </span>
              )}
            </div>
          </div>
        </div>
        
        {checkoutStep === 'menu' && (
           <button 
             onClick={() => setCart([])} 
             className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 relative"
           >
             <Store size={18} />
           </button>
        )}
      </header>

      <main className="max-w-2xl mx-auto pb-32">
        {checkoutStep === 'menu' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {config.description && (
              <div className="p-4 bg-zinc-900/50 border-b border-zinc-800">
                 <p className="text-sm text-zinc-400 leading-relaxed max-w-prose">
                   {config.description}
                 </p>
              </div>
            )}

            {/* Horizontal Categories Row */}
            <div className="sticky top-[73px] z-30 bg-[#100C08]/90 backdrop-blur-md pt-4 pb-3 px-4 border-b border-zinc-800/80">
               <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                 {categories.filter(c => c.items && c.items.length > 0).map(cat => (
                   <button
                     key={cat.id}
                     onClick={() => {
                        setActiveCategoryId(cat.id);
                        document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                     }}
                     className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-colors shrink-0 ${activeCategoryId === cat.id ? 'bg-[#C59868] text-[#100C08]' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200'}`}
                   >
                     {cat.name}
                   </button>
                 ))}
               </div>
            </div>

            <div className="p-4 space-y-8 mt-2">
              {categories.map(cat => cat.items && cat.items.length > 0 && (
                <div key={cat.id} id={`cat-${cat.id}`} className="space-y-4 pt-4 shrink-0">
                  <h2 className="text-xl font-heading font-medium text-zinc-100">{cat.name}</h2>
                  <div className="grid gap-4">
                    {cat.items.map((item: any) => (
                      <div key={item.id} className="flex flex-row bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden transition-transform active:scale-[0.98]">
                        <div className="w-28 h-28 bg-gradient-to-tr from-[#1a1410] to-[#2a2018] shrink-0 border-r border-zinc-800 flex flex-col items-center justify-center relative overflow-hidden">
                           <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#C59868] to-transparent"></div>
                           <ShoppingBag size={24} className="text-[#C59868]/30 mb-1" />
                           <span className="text-[8px] uppercase tracking-widest text-[#C59868]/50 font-bold z-10">COFCOF</span>
                        </div>
                        <div className="flex-1 p-4 flex flex-col justify-center">
                          <h3 className="font-medium text-zinc-100 mb-1 leading-snug">{item.name}</h3>
                          {item.description && <p className="text-xs text-zinc-500 mb-3 line-clamp-2 leading-relaxed">{item.description}</p>}
                          <div className="mt-auto flex items-center justify-between">
                            <span className="font-mono font-medium text-[#C59868]">{formatBRL(item.price)}</span>
                            {config.isOpen || config.allowOrdersOutsideHours ? (
                              <button 
                                onClick={() => openItemModal(item)}
                                className="bg-[#C59868] text-[#100C08] px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#b08558] transition-colors shadow-sm"
                              >
                                Add
                              </button>
                            ) : (
                              <span className="text-[10px] text-[#AF4D4D] bg-[#AF4D4D]/10 px-2 py-1 rounded-full uppercase tracking-wider font-semibold">Fechado</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {checkoutStep === 'cart' && (
          <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-2xl font-heading font-medium">Seu Pedido</h2>
            {cart.length === 0 ? (
               <div className="py-12 text-center bg-zinc-900 border border-zinc-800 rounded-2xl">
                 <ShoppingBag size={48} className="mx-auto text-zinc-700 mb-4" />
                 <p className="text-zinc-500 font-medium">Seu carrinho está vazio</p>
               </div>
            ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
                  {cart.map(c => (
                    <div key={c.uid} className="p-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 flex items-center justify-center bg-zinc-800 rounded-lg text-xs font-bold text-zinc-100 border border-zinc-700">{c.qty}x</div>
                          <div>
                              <span className="text-sm font-medium">{c.name}</span>
                              {c.options && c.options.length > 0 && (
                                  <div className="text-[11px] text-zinc-500 mt-0.5">
                                      {c.options.map(o => o.name).join(', ')}
                                  </div>
                              )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-sm font-mono text-[#C59868] font-medium">{formatBRL(((c.price + (c.optionsTotal||0)) * c.qty))}</span>
                          <button onClick={() => removeFromCart(c.uid)} className="text-[10px] text-[#AF4D4D] uppercase font-bold tracking-wider hover:opacity-80">Remover</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="p-4 bg-zinc-950/50 flex justify-between items-center font-medium">
                    <span className="text-zinc-400 text-sm">Subtotal</span>
                    <span className="font-mono text-zinc-100">{formatBRL(cartTotal)}</span>
                  </div>
                </div>
            )}

            <Button 
              disabled={cart.length === 0}
              onClick={() => setCheckoutStep('checkout')}
              className="w-full py-6 bg-[#C59868] hover:bg-[#b08558] text-[#100C08] font-bold tracking-widest uppercase"
            >
              Confirmar e Avançar
            </Button>
          </div>
        )}

        {checkoutStep === 'checkout' && (
          <div className="p-4 space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
            
            <div className="space-y-4">
              <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Identificação</h3>
              <Input 
                placeholder="Seu nome completo" 
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
              />
              <Input 
                type="tel" 
                placeholder="Seu telefone / WhatsApp" 
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Entrega ou Retirada?</h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setDeliveryMethod('pickup')}
                  className={`flex flex-col items-center justify-center gap-2 p-5 rounded-xl border transition-all ${deliveryMethod === 'pickup' ? 'bg-[#C59868]/10 border-[#C59868]/50 text-[#C59868]' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                >
                  <MapPin size={24} />
                  <span className="font-bold text-xs uppercase tracking-wider">Na Loja</span>
                </button>
                <button 
                  onClick={() => setDeliveryMethod('delivery')}
                  className={`flex flex-col items-center justify-center gap-2 p-5 rounded-xl border transition-all ${deliveryMethod === 'delivery' ? 'bg-[#C59868]/10 border-[#C59868]/50 text-[#C59868]' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                >
                  <ShoppingBag size={24} />
                  <span className="font-bold text-xs uppercase tracking-wider">Entrega</span>
                </button>
              </div>
              
              {deliveryMethod === 'delivery' && (
                <div className="space-y-3 pt-2">
                  <Input 
                    placeholder="Endereço completo (Rua, Número, Bairro, CEP)" 
                    value={customerAddress}
                    onChange={e => setCustomerAddress(e.target.value)}
                  />
                  
                  {config.deliveryZonesJson && (
                      <div className="relative">
                          <Select 
                            value={deliveryZone} 
                            onChange={(e) => setDeliveryZone(e.target.value)}
                          >
                             <option value="" disabled>Selecione seu bairro ou área</option>
                             {(()=>{
                                 try {
                                     const zones = JSON.parse(config.deliveryZonesJson);
                                     return zones.filter((z:any)=>z.active).map((z:any) => (
                                         <option key={z.name} value={z.name}>{z.name} - {formatBRL(z.fee)}</option>
                                     ));
                                 } catch(e) { return null; }
                             })()}
                          </Select>
                      </div>
                  )}
                  
                  <p className="text-[10px] text-zinc-500 italic">Adicional de entrega será calculado na fatura.</p>
                </div>
              )}
            </div>

            <div className="space-y-4 border-t border-zinc-900 py-6">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 font-medium">Subtotal</span>
                <span className="text-zinc-100">{formatBRL(cartTotal)}</span>
              </div>
              {deliveryMethod === 'delivery' && currentDeliveryFee > 0 && (
                 <div className="flex justify-between text-sm">
                   <span className="text-zinc-500 font-medium">Taxa de Entrega</span>
                   <span className="text-zinc-100">{formatBRL((currentDeliveryFee))}</span>
                 </div>
              )}
              <div className="flex justify-between items-center pt-4 mt-2 border-t border-zinc-900">
                <span className="text-lg font-medium text-zinc-100">Total</span>
                <span className="text-xl text-[#C59868] font-mono font-bold">{formatBRL(finalTotal)}</span>
              </div>
            </div>

            <Button 
              onClick={placeOrder}
              disabled={loading}
              className="w-full py-6 bg-[#C59868] hover:bg-[#b08558] text-[#100C08] font-bold tracking-widest uppercase"
            >
              {loading ? 'Processando...' : (paymentMethod === 'mercadopago' ? 'Pagar via Mercado Pago' : 'Finalizar Pedido')}
            </Button>
          </div>
        )}

        {checkoutStep === 'success' && orderSummary && (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-6 mt-10 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-[#528F65]/20 text-[#528F65] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(82,143,101,0.2)]">
              <Check size={40} className="stroke-[2.5]" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-heading font-medium text-zinc-50">Pedido Confirmado</h2>
              <p className="text-zinc-400 text-sm">Número do pedido: <span className="font-mono text-zinc-300">#{orderSummary.id.split('-').pop()}</span></p>
              
              <div className="bg-zinc-900/80 rounded-xl p-4 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between border border-zinc-800 mt-6 gap-2">
                <span className="text-zinc-400 font-medium text-xs uppercase tracking-wider">Status Atual</span>
                <span className="text-[#C59868] font-bold tracking-widest uppercase bg-[#C59868]/10 px-4 py-1.5 rounded-full text-xs">{mapStatus(orderStatus)}</span>
              </div>
            </div>

            {orderSummary.qrcode && (
              <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 w-full max-w-sm mt-6 shadow-xl">
                <p className="text-[10px] font-bold uppercase tracking-widest border-l-2 border-[#C59868] pl-3 text-left mb-6 text-zinc-500 flex items-center h-4">Aguardando PIX</p>
                <div className="bg-white p-4 rounded-xl flex items-center justify-center aspect-square text-zinc-900 mb-6">
                  <QrCode size={140} className="text-zinc-950" />
                </div>
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(orderSummary.qrcode!);
                    toastError("Chave Copiada!");
                  }}
                  className="w-full"
                >
                  PIX Copia e Cola
                </Button>
              </div>
            )}

            <button 
              onClick={() => {
                setCheckoutStep('menu');
                setOrderSummary(null);
                setCart([]);
              }}
              className="mt-8 text-zinc-500 hover:text-zinc-300 text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Voltar ao Cardápio
            </button>
          </div>
        )}
      </main>

      {/* Floating Cart Button */}
      {checkoutStep === 'menu' && cart.length > 0 && (
         <div className="fixed bottom-6 left-0 right-0 px-4 md:max-w-2xl md:mx-auto z-40 animate-in slide-in-from-bottom-10 fade-in duration-300">
           <button 
             onClick={() => setCheckoutStep('cart')}
             className="w-full flex items-center justify-between bg-[#C59868] hover:bg-[#b08558] text-[#100C08] px-6 py-4 rounded-full shadow-[0_10px_30px_-10px_rgba(197,152,104,0.5)] active:scale-95 transition-all outline-none"
           >
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-[#100C08]/20 flex items-center justify-center font-bold text-sm">
                 {cart.reduce((a,c) => a + c.qty, 0)}
               </div>
               <span className="font-bold uppercase tracking-wider text-xs">Ver Carrinho</span>
             </div>
             <span className="font-mono font-bold tracking-tight text-base">
               {formatBRL(cartTotal)}
             </span>
           </button>
         </div>
      )}

      {/* Item Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
           <div className="bg-zinc-950 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] border border-zinc-800 shadow-2xl relative">
             <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-black/50 backdrop-blur-md rounded-full text-zinc-300 hover:text-white border border-white/10">
               <X size={16} />
             </button>

             <div className="w-full h-48 bg-gradient-to-tr from-[#1a1410] to-[#2a2018] shrink-0 border-b border-zinc-800 flex items-center justify-center relative">
                 <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#C59868] to-transparent"></div>
                 <Coffee size={40} className="text-[#C59868]/30 mb-2" />
                 <span className="text-[10px] uppercase tracking-widest text-[#C59868]/50 font-bold z-10 block mt-2">Destaque do Cardápio</span>
             </div>
             
             <div className="p-6 pb-2 shrink-0">
                 <h2 className="text-2xl font-heading font-medium text-zinc-100">{selectedItem.name}</h2>
                 {selectedItem.description && (
                     <p className="text-zinc-500 text-sm mt-3 leading-relaxed">{selectedItem.description}</p>
                 )}
                 <div className="font-mono text-xl text-[#C59868] font-bold mt-4">{formatBRL(selectedItem.price)}</div>
             </div>

             <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8 custom-scrollbar">
                 {selectedItem.modifierGroups && selectedItem.modifierGroups.length > 0 && selectedItem.modifierGroups.map((group: any) => (
                     <div key={group.id} className="space-y-4">
                         <div className="flex justify-between items-baseline mb-3">
                             <h3 className="font-medium text-zinc-200 text-sm uppercase tracking-wider">{group.name}</h3>
                             <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border border-zinc-800 text-zinc-400 bg-zinc-900/50">
                                 {group.minSelections > 0 ? `Obg (mín ${group.minSelections})` : 'Opcional'}
                             </span>
                         </div>
                         <div className="space-y-2">
                             {group.options.map((opt: any) => {
                                 const isSelected = (itemModifiers[group.id] || []).some((o:any) => o.id === opt.id);
                                 return (
                                     <label key={opt.id} className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-[#C59868]/10 border-[#C59868]/50 shadow-sm' : 'bg-[#100C08] border-zinc-800 hover:border-zinc-700'}`}>
                                         <div className="flex items-center gap-3">
                                             <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${isSelected ? 'bg-[#C59868] border-[#C59868] text-[#100C08]' : 'border-zinc-700 bg-zinc-900'}`}>
                                                 {isSelected && <Check size={14} strokeWidth={3} />}
                                             </div>
                                             <input type="checkbox" className="hidden" checked={isSelected} onChange={() => toggleModifier(group, opt)} />
                                             <span className={`text-sm ${isSelected ? 'text-zinc-100 font-medium' : 'text-zinc-400'}`}>{opt.name}</span>
                                         </div>
                                         {opt.price > 0 && <span className={`text-xs font-mono font-medium ${isSelected ? 'text-[#C59868]' : 'text-zinc-500'}`}>+{formatBRL(opt.price)}</span>}
                                     </label>
                                 );
                             })}
                         </div>
                     </div>
                 ))}

                 <div className="space-y-3 pt-4 border-t border-zinc-800/80">
                     <h3 className="font-medium text-zinc-200 text-sm uppercase tracking-wider">Alguma observação?</h3>
                     <Textarea 
                         value={itemNotes}
                         onChange={e => setItemNotes(e.target.value)}
                         placeholder="Ex: Tirar cebola, ponto da carne..."
                         className="h-24 resize-none"
                     />
                 </div>
             </div>

             <div className="p-6 bg-zinc-950 border-t border-zinc-800 shrink-0">
                 <Button 
                     onClick={confirmItemAdd}
                     className="w-full py-6 bg-[#C59868] hover:bg-[#b08558] text-[#100C08] font-bold tracking-widest uppercase flex justify-between px-6 items-center"
                 >
                     <span>Adicionar ao Pedido</span>
                     <span className="font-mono bg-[#100C08]/10 px-3 py-1 rounded text-sm">
                         {formatBRL((selectedItem.price + (Object.values(itemModifiers).flat() as any[]).reduce((sum:number, o:any) => sum + (o.price || 0), 0)))}
                     </span>
                 </Button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
