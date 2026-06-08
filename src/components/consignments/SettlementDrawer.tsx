import { useState } from 'react';
import { Check, Scale } from 'lucide-react';
import { Consignment } from '../../domain/types';
import { useRepositories } from '../../repositories/RepositoryProvider';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { motion, AnimatePresence } from 'motion/react';
import { useConfirm } from '../ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';

interface SettlementDrawerProps {
  onClose: () => void;
  onComplete: () => void;
  consignment: Consignment;
}

export function SettlementDrawer({ onClose, onComplete, consignment }: SettlementDrawerProps) {
  const { success, error: toastError, info } = useToast();
  const { consignmentRepo, orderRepo, inventoryRepo, actualType } = useRepositories();
  const { confirm } = useConfirm();

  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // state for settlement inputs
  const [settlements, setSettlements] = useState<Record<string, { qtySold: string; qtyReturned: string; qtyLost: string }>>(() => {
    const init: Record<string, any> = {};
    for (const item of consignment.items) {
      init[item.productId] = { qtySold: '', qtyReturned: '', qtyLost: '' };
    }
    return init;
  });

  const handleChange = (productId: string, field: 'qtySold' | 'qtyReturned' | 'qtyLost', val: string) => {
    setSettlements(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: val
      }
    }));
  };

  const handleFinalize = async (isFinal: boolean) => {
    try {
      const entries = Object.entries(settlements) as [string, { qtySold: string; qtyReturned: string; qtyLost: string }][];
      
      const payload = entries.map(([productId, vals]) => {
        const item = consignment.items.find(i => i.productId === productId);
        return {
          productId,
          name: item?.name || '',
          unitPrice: item?.unitPrice || 0,
          unitCost: item?.unitCost || 0,
          soldQty: parseFloat(vals.qtySold) || 0,
          returnedQty: parseFloat(vals.qtyReturned) || 0,
          lostQty: parseFloat(vals.qtyLost) || 0
        };
      });

      const hasAny = payload.some(p => p.soldQty > 0 || p.returnedQty > 0 || p.lostQty > 0);
      if (!hasAny) {
        toastError('Informe pelo menos uma quantidade para realizar o acerto.');
        return;
      }

      setIsFinalizing(true);
      
      await consignmentRepo.settleConsignment({
        consignmentId: consignment.id,
        items: payload,
        totalSold: payload.reduce((acc, p) => acc + (p.soldQty * p.unitPrice), 0),
        paymentMethod: 'Acerto de Consignação',
        isPaid: true,
        date: new Date().toISOString(),
        status: isFinal ? 'closed' : 'partially_settled'
      });

      if (actualType === 'mock') {
        const soldItems = payload.filter(p => p.soldQty > 0);
        if (soldItems.length > 0) {
          for (const p of soldItems) {
             await inventoryRepo.createMovement({
               productId: p.productId, qty: p.soldQty, type: 'Ajuste',
               reason: `Ajuste Temporário p/ Criação de Pedido Consig ${consignment.id}`
             });
          }
          await orderRepo.createOrder({
            customerName: consignment.partnerName,
            items: soldItems.map(p => ({
               productId: p.productId, name: p.name, qty: p.soldQty, unitPrice: p.unitPrice, unitCost: p.unitCost, discount: 0
            })),
            status: 'Pago',
            paymentMethod: 'Acerto de Consignação',
            subtotal: soldItems.reduce((acc, p) => acc + (p.soldQty * p.unitPrice), 0),
            total: soldItems.reduce((acc, p) => acc + (p.soldQty * p.unitPrice), 0),
            discount: 0
          });
        }
  
        for (const p of payload) {
          if (p.returnedQty > 0) {
            await inventoryRepo.createMovement({
              productId: p.productId, qty: p.returnedQty, type: 'Entrada', reason: `Devolução Consig ${consignment.id}`
            });
          }
          if (p.lostQty > 0) {
            await inventoryRepo.createMovement({
              productId: p.productId, qty: p.lostQty, type: 'Ajuste', reason: `Reposição temp. p/ registro de perda Consig ${consignment.id}`
            });
            await inventoryRepo.createMovement({
              productId: p.productId, qty: -p.lostQty, type: 'Perda', reason: `Perda Consig ${consignment.id}`
            });
          }
        }
      }
      
      setIsSuccess(true);
      // Remove auto-close to let user see confirmation or print
    } catch (e: any) {
      console.error(e);
      toastError(e.message);
      setIsFinalizing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  let typingSaleTotal = 0;
  for (const item of consignment.items) {
    const sold = parseFloat(settlements[item.productId]?.qtySold) || 0;
    typingSaleTotal += sold * item.unitPrice;
  }

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title="Acerto de Consignação"
      subtitle={`${consignment.partnerName} • ${consignment.id}`}
      icon={<Scale size={20} />}
      size="lg"
      footer={
        !isSuccess ? (
          <div className="space-y-5">
            <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 shadow-inner flex justify-between items-center">
              <div>
                <div className="text-zinc-100 font-heading text-sm mb-1">Novo Pedido a Faturar</div>
                <div className="text-xs text-zinc-500">Irá gerar cobrança e baixa.</div>
              </div>
              <div className="text-3xl font-heading font-semibold text-emerald-500">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(typingSaleTotal)}
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button 
                variant="secondary"
                size="lg"
                onClick={() => handleFinalize(false)}
                disabled={isFinalizing}
                className="flex-1"
              >
                Salvar (Parcial)
              </Button>
              <Button 
                variant="conclusive"
                size="lg"
                onClick={async () => {
                  const proceed = await confirm({
                    title: 'Fechar Acerto',
                    description: 'Deseja realmente FECHAR esta consignação? Nenhum acerto adicional poderá ser feito depois.',
                    confirmText: 'Encerrar Consignação',
                    isDestructive: false
                  });
                  if (proceed) handleFinalize(true);
                }}
                disabled={isFinalizing}
                isLoading={isFinalizing}
                className="flex-1 gap-2"
              >
                {!isFinalizing && <Check size={20} />}
                Fechar Acerto
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
             <Button variant="outline" size="lg" className="flex-1" onClick={handlePrint}>
                Imprimir Relatório
             </Button>
             <Button variant="primary" size="lg" className="flex-1 gap-2" onClick={onComplete}>
                Concluir
             </Button>
          </div>
        )
      }
    >
      {!isSuccess ? (
        <div className="space-y-4">
          {consignment.items.map(item => {
            const allocated = item.qtySold + item.qtyReturned + item.qtyLost;
            const unallocated = item.qtySent - allocated;
            const isSettled = unallocated <= 0;

            const soldInput = parseFloat(settlements[item.productId]?.qtySold) || 0;
            const retInput = parseFloat(settlements[item.productId]?.qtyReturned) || 0;
            const lostInput = parseFloat(settlements[item.productId]?.qtyLost) || 0;
            const localAllocated = soldInput + retInput + lostInput;
            const localUnallocated = unallocated - localAllocated;

            return (
              <div key={item.productId} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-6 border-b border-zinc-800/50 pb-4">
                  <div>
                    <div className="font-heading font-medium text-zinc-50 text-lg mb-1">{item.name}</div>
                    <div className="text-xs font-mono text-zinc-500 flex gap-4 uppercase tracking-widest">
                      <span className="flex items-center gap-1">Enviado: <span className="text-zinc-300">{item.qtySent}</span></span>
                      <span className="flex items-center gap-1">Previo: <span className="text-zinc-300">{allocated}</span></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-heading font-semibold text-amber-500">Restante: {localUnallocated} un</div>
                    <div className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice)} / un</div>
                  </div>
                </div>

                {!isSettled ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-zinc-950 border border-emerald-500/20 p-3 rounded-xl transition-colors focus-within:border-emerald-500/50 focus-within:shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Vendido (Cobra)</label>
                      <input 
                        type="number" min="0" max={unallocated}
                        value={settlements[item.productId]?.qtySold}
                        onChange={e => handleChange(item.productId, 'qtySold', e.target.value)}
                        className="w-full bg-transparent text-emerald-400 text-xl font-heading font-semibold placeholder:text-zinc-800 focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                    <div className="bg-zinc-950 border border-sky-500/20 p-3 rounded-xl transition-colors focus-within:border-sky-500/50 focus-within:shadow-[0_0_15px_rgba(14,165,233,0.1)]">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Devolvido (Retorna)</label>
                      <input 
                        type="number" min="0" max={unallocated}
                        value={settlements[item.productId]?.qtyReturned}
                        onChange={e => handleChange(item.productId, 'qtyReturned', e.target.value)}
                        className="w-full bg-transparent text-sky-400 text-xl font-heading font-semibold placeholder:text-zinc-800 focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                    <div className="bg-zinc-950 border border-red-500/20 p-3 rounded-xl transition-colors focus-within:border-red-500/50 focus-within:shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Perda (Baixa)</label>
                      <input 
                        type="number" min="0" max={unallocated}
                        value={settlements[item.productId]?.qtyLost}
                        onChange={e => handleChange(item.productId, 'qtyLost', e.target.value)}
                        className="w-full bg-transparent text-red-500 text-xl font-heading font-semibold placeholder:text-zinc-800 focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 text-emerald-500 text-sm font-semibold p-4 rounded-xl border border-emerald-500/20 text-center flex items-center justify-center gap-2">
                    <Check size={18} /> 100% Acertado
                  </div>
                )}
              </div>
            )
          })}
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
          <h3 className="text-2xl font-heading font-semibold text-zinc-100 mb-2">Acerto Registrado</h3>
          <p className="text-zinc-400 max-w-sm">
            Saldos atualizados, fatura gerada e itens repostos no estoque com sucesso.
          </p>
        </motion.div>
      )}
    </Drawer>
  );
}
