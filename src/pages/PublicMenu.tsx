import React, { useState, useEffect } from 'react';
import { useRepositories } from '../repositories/RepositoryProvider';
import { DigitalMenuCategory, DigitalMenuConfig, DigitalMenuOrderPayload } from '../domain/digitalMenu';
import { Store, ShoppingBag, ArrowLeft, Clock, MapPin, Check, QrCode } from 'lucide-react';

export function PublicMenu({ slug }: { slug: string }) {
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
                  alert(`Selecione no mínimo ${group.minSelections} em "${group.name}".`);
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
      alert('Informe seu nome para continuar.');
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
      alert('Erro ao criar pedido.');
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
    return <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-amber-500">Montando cardápio...</div>;
  }

  if (!config) {
    return <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-red-400">Cardápio não encontrado ou indisponível.</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-900/80 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {checkoutStep !== 'menu' && checkoutStep !== 'success' && (
            <button onClick={() => setCheckoutStep(checkoutStep === 'checkout' ? 'cart' : 'menu')} className="p-2 -ml-2 text-zinc-400 hover:text-zinc-100">
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="font-heading font-semibold text-lg text-zinc-50 tracking-tight leading-tight">{config.publicName}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <span className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm ${config.isOpen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
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
             className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-400 relative"
           >
             <Store size={20} />
           </button>
        )}
      </header>

      <main className="max-w-2xl mx-auto pb-32">
        {checkoutStep === 'menu' && (
          <div className="p-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {config.description && (
              <p className="text-sm text-zinc-400 leading-relaxed border-l-2 border-amber-500/50 pl-3">
                {config.description}
              </p>
            )}

            <div className="space-y-8">
              {categories.map(cat => cat.items && cat.items.length > 0 && (
                <div key={cat.id} className="space-y-4">
                  <h2 className="text-xl font-heading font-medium text-zinc-100 sticky top-16 bg-zinc-950/95 py-2 z-30">{cat.name}</h2>
                  <div className="grid gap-3">
                    {cat.items.map((item: any) => (
                      <div key={item.id} className="flex bg-zinc-900 border border-zinc-800 rounded-2xl p-4 gap-4 transition-transform active:scale-[0.98]">
                        <div className="flex-1 flex flex-col justify-center">
                          <h3 className="font-medium text-zinc-100 mb-1">{item.name}</h3>
                          {item.description && <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{item.description}</p>}
                          <div className="mt-auto flex items-center justify-between">
                            <span className="font-mono font-medium text-amber-500">R$ {item.price.toFixed(2)}</span>
                            {config.isOpen || config.allowOrdersOutsideHours ? (
                              <button 
                                onClick={() => openItemModal(item)}
                                className="bg-zinc-800 text-zinc-300 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
                              >
                                Adicionar
                              </button>
                            ) : (
                              <span className="text-xs text-red-400 bg-red-500/10 px-3 py-1 rounded-full uppercase tracking-wider font-semibold">Fechado</span>
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
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
              {cart.map(c => (
                <div key={c.uid} className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center bg-zinc-800 rounded-md text-xs font-medium text-zinc-300">{c.qty}x</div>
                      <div>
                          <span className="text-sm font-medium">{c.name}</span>
                          {c.options && c.options.length > 0 && (
                              <div className="text-[11px] text-zinc-500 mt-0.5">
                                  {c.options.map(o => o.name).join(', ')}
                              </div>
                          )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-mono text-amber-500">R$ {((c.price + (c.optionsTotal||0)) * c.qty).toFixed(2)}</span>
                      <button onClick={() => removeFromCart(c.uid)} className="text-xs text-red-400 uppercase font-medium">Remover</button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="p-4 bg-zinc-950/50 flex justify-between items-center font-medium">
                <span className="text-zinc-400 text-sm">Subtotal</span>
                <span className="font-mono">R$ {cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={() => setCheckoutStep('checkout')}
              className="w-full bg-amber-600 hover:bg-amber-500 text-amber-50 py-4 rounded-xl font-medium tracking-wide shadow-[0_0_20px_-5px_rgba(217,177,133,0.3)] transition-all"
            >
              Confirmar e Avançar
            </button>
          </div>
        )}

        {checkoutStep === 'checkout' && (
          <div className="p-4 space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Identificação</h3>
              <input 
                type="text" 
                placeholder="Seu nome completo" 
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all" 
              />
              <input 
                type="tel" 
                placeholder="Seu telefone / WhatsApp" 
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all" 
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Entrega ou Retirada?</h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setDeliveryMethod('pickup')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${deliveryMethod === 'pickup' ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                >
                  <MapPin size={24} />
                  <span className="font-medium text-sm">Retirar na Loja</span>
                </button>
                <button 
                  onClick={() => setDeliveryMethod('delivery')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${deliveryMethod === 'delivery' ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                >
                  <ShoppingBag size={24} />
                  <span className="font-medium text-sm">Entrega</span>
                </button>
              </div>
              
              {deliveryMethod === 'delivery' && (
                <div className="space-y-3 pt-2">
                  <input 
                    type="text" 
                    placeholder="Endereço completo (Rua, Número, Bairro, CEP)" 
                    value={customerAddress}
                    onChange={e => setCustomerAddress(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all" 
                  />
                  
                  {config.deliveryZonesJson && (
                      <select 
                        value={deliveryZone} 
                        onChange={(e) => setDeliveryZone(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-zinc-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all appearance-none"
                      >
                         <option value="" disabled>Selecione seu bairro ou área</option>
                         {(()=>{
                             try {
                                 const zones = JSON.parse(config.deliveryZonesJson);
                                 return zones.filter((z:any)=>z.active).map((z:any) => (
                                     <option key={z.name} value={z.name}>{z.name} - R$ {z.fee.toFixed(2)}</option>
                                 ));
                             } catch(e) { return null; }
                         })()}
                      </select>
                  )}
                  
                  <p className="text-xs text-zinc-500">Adicional de entrega será calculado na fatura.</p>
                </div>
              )}
            </div>

            <div className="space-y-4 border-t border-zinc-900 py-6">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Subtotal</span>
                <span>R$ {cartTotal.toFixed(2)}</span>
              </div>
              {deliveryMethod === 'delivery' && (
                 <div className="flex justify-between text-sm">
                   <span className="text-zinc-400">Taxa de Entrega</span>
                   <span>R$ {(currentDeliveryFee).toFixed(2)}</span>
                 </div>
              )}
              <div className="flex justify-between text-lg font-medium pt-2 border-t border-zinc-900">
                <span>Total</span>
                <span className="text-amber-500 font-mono">R$ {finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={placeOrder}
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-amber-50 py-4 rounded-xl font-medium tracking-wide shadow-lg transition-all"
            >
              {loading ? 'Processando...' : (paymentMethod === 'mercadopago' ? 'Pagar online via Mercado Pago' : 'Finalizar Pedido')}
            </button>
          </div>
        )}

        {checkoutStep === 'success' && orderSummary && (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-6 mt-10 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center">
              <Check size={40} className="stroke-[2.5]" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-heading font-medium text-zinc-50">Pedido Confirmado!</h2>
              <p className="text-zinc-400">Número do pedido: <span className="font-mono text-zinc-300">#{orderSummary.id.split('-').pop()}</span></p>
              
              <div className="bg-zinc-800/50 rounded-xl p-4 flex items-center justify-between border border-zinc-700 mt-4">
                <span className="text-zinc-300 font-medium">Status Atual:</span>
                <span className="text-amber-500 font-medium tracking-wide uppercase">{mapStatus(orderStatus)}</span>
              </div>
            </div>

            {orderSummary.qrcode && (
              <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 w-full max-w-sm mt-6">
                <p className="text-sm border-l-2 border-amber-500 pl-2 text-left mb-4">Aguardando Pagamento</p>
                <div className="bg-white p-4 rounded-xl flex items-center justify-center aspect-square text-zinc-900 mb-4">
                  <QrCode size={120} className="text-zinc-900" />
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(orderSummary.qrcode!);
                    alert("Chave Copiada!");
                  }}
                  className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors"
                >
                  PIX Copia e Cola
                </button>
              </div>
            )}

            <button 
              onClick={() => {
                setCheckoutStep('menu');
                setOrderSummary(null);
                setCart([]);
              }}
              className="mt-8 text-amber-500 hover:text-amber-400 text-sm font-medium"
            >
              Fazer novo pedido
            </button>
          </div>
        )}
      </main>

      {/* Floating Cart Button */}
      {checkoutStep === 'menu' && cart.length > 0 && (
         <div className="fixed bottom-6 left-0 right-0 px-4 z-40 animate-in slide-in-from-bottom-10 fade-in duration-300">
           <button 
             onClick={() => setCheckoutStep('cart')}
             className="w-full flex items-center justify-between bg-amber-600 text-amber-50 px-6 py-4 rounded-2xl shadow-[0_10px_30px_-10px_rgba(217,177,133,0.5)] active:scale-95 transition-all"
           >
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-amber-700/50 flex items-center justify-center font-medium text-sm">
                 {cart.reduce((a,c) => a + c.qty, 0)}
               </div>
               <span className="font-medium tracking-wide">Ver Carrinho</span>
             </div>
             <span className="font-mono font-semibold tracking-tight">
               R$ {cartTotal.toFixed(2)}
             </span>
           </button>
         </div>
      )}

      {/* Item Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-950/80 p-4 sm:p-0">
           <div className="bg-zinc-900 w-full sm:max-w-md rounded-3xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[90vh] border border-zinc-800 animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-200">
             
             <div className="p-5 border-b border-zinc-800 flex items-center justify-between shrink-0">
                 <h2 className="text-xl font-heading font-medium text-zinc-100 truncate">{selectedItem.name}</h2>
                 <button onClick={() => setSelectedItem(null)} className="p-2 text-zinc-500 hover:text-zinc-300">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
             </div>

             <div className="flex-1 overflow-y-auto p-5 space-y-6">
                 {selectedItem.description && (
                     <p className="text-zinc-400 text-sm leading-relaxed">{selectedItem.description}</p>
                 )}
                 <div className="font-mono text-amber-500">R$ {selectedItem.price.toFixed(2)} Base</div>

                 {selectedItem.modifierGroups && selectedItem.modifierGroups.length > 0 && selectedItem.modifierGroups.map((group: any) => (
                     <div key={group.id} className="space-y-3 pt-6 border-t border-zinc-800">
                         <div className="flex justify-between items-baseline mb-2">
                             <h3 className="font-medium text-zinc-200">{group.name}</h3>
                             <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">
                                 {group.minSelections > 0 ? `Obrigatório (mín. ${group.minSelections})` : 'Opcional'}
                             </span>
                         </div>
                         <div className="space-y-2">
                             {group.options.map((opt: any) => {
                                 const isSelected = (itemModifiers[group.id] || []).some((o:any) => o.id === opt.id);
                                 return (
                                     <label key={opt.id} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${isSelected ? 'bg-amber-500/10 border-amber-500/50' : 'bg-zinc-950 border-zinc-800'}`}>
                                         <div className="flex items-center gap-3">
                                             <div className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected ? 'bg-amber-500 border-amber-500 text-zinc-950' : 'border-zinc-700'}`}>
                                                 {isSelected && <Check size={14} strokeWidth={3} />}
                                             </div>
                                             <input type="checkbox" className="hidden" checked={isSelected} onChange={() => toggleModifier(group, opt)} />
                                             <span className={`text-sm ${isSelected ? 'text-zinc-100 font-medium' : 'text-zinc-300'}`}>{opt.name}</span>
                                         </div>
                                         {opt.price > 0 && <span className="text-xs font-mono text-zinc-400">+R$ {opt.price.toFixed(2)}</span>}
                                     </label>
                                 );
                             })}
                         </div>
                     </div>
                 ))}

                 <div className="pt-6 border-t border-zinc-800 space-y-3">
                     <h3 className="font-medium text-zinc-200">Alguma observação?</h3>
                     <textarea 
                         value={itemNotes}
                         onChange={e => setItemNotes(e.target.value)}
                         placeholder="Ex: Tirar cebola, ponto da carne..."
                         className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 resize-none h-20"
                     />
                 </div>
             </div>

             <div className="p-5 border-t border-zinc-800 shrink-0">
                 <button 
                     onClick={confirmItemAdd}
                     className="w-full bg-amber-600 hover:bg-amber-500 text-amber-50 py-3.5 rounded-xl font-medium tracking-wide shadow-lg transition-colors flex justify-between px-6 items-center"
                 >
                     <span>Adicionar</span>
                     <span className="font-mono">
                         R$ {(selectedItem.price + (Object.values(itemModifiers).flat() as any[]).reduce((sum:number, o:any) => sum + (o.price || 0), 0)).toFixed(2)}
                     </span>
                 </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
