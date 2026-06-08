import { formatBRL } from '../../lib/format';
import { useState, useEffect } from 'react';
import { Check, Plus, Trash2, Factory, Flame } from 'lucide-react';
import { calculateProductionCosts } from '../../domain/production';
import { ProductionStatus, ProductionExtraCost, Product } from '../../domain/types';
import { useRepositories } from '../../repositories/RepositoryProvider';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { motion } from 'motion/react';
import { useConfirm } from '../ui/ConfirmDialog';
import { useToast } from '../ui/Toast';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';

interface ProductionBatchDrawerProps {
  onClose: () => void;
  onComplete: () => void;
}

export function ProductionBatchDrawer({ onClose, onComplete }: ProductionBatchDrawerProps) {
  const [status, setStatus] = useState<ProductionStatus>('Em Produção');
  const [finalProductId, setFinalProductId] = useState('');
  const [finalQty, setFinalQty] = useState('');
  const [initialWeight, setInitialWeight] = useState('');
  const [finalWeight, setFinalWeight] = useState('');
  const [hours, setHours] = useState('');
  const [laborCostPerHour, setLaborCostPerHour] = useState('25');
  const [responsible, setResponsible] = useState('Mestre de Torra');
  const [notes, setNotes] = useState('');
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [inputs, setInputs] = useState<{ productId: string; name: string; qty: number; unitCost: number }[]>([]);
  const [inputId, setInputId] = useState('');
  const [inputQty, setInputQty] = useState('');

  const [extraCosts, setExtraCosts] = useState<ProductionExtraCost[]>([]);
  const [extraDesc, setExtraDesc] = useState('');
  const [extraAmount, setExtraAmount] = useState('');

  const { productRepo, productionRepo, inventoryRepo, settingsRepo } = useRepositories();
  const [productsData, setProductsData] = useState<(Product & { currentStock: number })[]>([]);

  const { confirm } = useConfirm();
  const { error, success } = useToast();

  useEffect(() => {
    settingsRepo.getProductionRules().then(rules => {
      setLaborCostPerHour(rules.defaultHourCost ? rules.defaultHourCost.toString() : '25');
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
  }, [productRepo, inventoryRepo, settingsRepo]);

  const availableProducts = productsData.filter(p => p.category !== 'Insumo');
  const insumos = productsData.filter(p => p.category === 'Insumo');

  const selectedInput = insumos.find(p => p.id === inputId);

  const handleAddInput = () => {
    if (!selectedInput) return;
    const q = parseFloat(inputQty);
    if (!q || q <= 0) return;
    
    setInputs(prev => {
      const existing = prev.find(i => i.productId === selectedInput.id);
      if (existing) {
        return prev.map(i => i.productId === selectedInput.id ? { ...i, qty: i.qty + q } : i);
      }
      return [...prev, { productId: selectedInput.id, name: selectedInput.name, qty: q, unitCost: selectedInput.cost }];
    });
    setInputId('');
    setInputQty('');
  };

  const handleAddExtra = () => {
    const amt = parseFloat(extraAmount);
    if (!extraDesc || !amt || amt <= 0) return;
    setExtraCosts(prev => [...prev, { description: extraDesc, amount: amt }]);
    setExtraDesc('');
    setExtraAmount('');
  };

  const handleFinalize = async () => {
    if (!finalProductId) { error('Selecione o produto final.'); return; }
    if (inputs.length === 0) { error('Adicione pelo menos um insumo.'); return; }

    const qtyFinalNum = parseFloat(finalQty) || 0;
    const initialNum = parseFloat(initialWeight) || 0;
    const finalWNum = parseFloat(finalWeight) || 0;
    const hNum = parseFloat(hours) || 0;
    const laborHNum = parseFloat(laborCostPerHour) || 0;

    if (status === 'Concluído' && finalWNum > initialNum) {
       const proceed = await confirm({
         title: 'Atenção ao Peso',
         description: 'Peso final está MAIOR que peso inicial. Deseja continuar?',
         confirmText: 'Continuar',
         cancelText: 'Cancelar'
       });
       if (!proceed) return;
    }

    const warnings: string[] = [];
    for (const input of inputs) {
      const p = insumos.find(x => x.id === input.productId);
      if (p && p.currentStock < input.qty) {
        warnings.push(`O insumo ${p.name} excederá o estoque (Disponível: ${p.currentStock}, Necessário: ${input.qty}).`);
      }
    }

    if (warnings.length > 0) {
      const proceed = await confirm({
        title: 'Estoque insuficiente',
        description: warnings.join('\n') + '\n\nDeseja realizar a produção mesmo assim? O estoque ficará negativo.',
        confirmText: 'Sim, Finalizar',
        cancelText: 'Cancelar'
      });
      if (!proceed) return;
    }

    setIsFinalizing(true);

    try {
      const pFinal = availableProducts.find(p => p.id === finalProductId);
      await (productionRepo as any).createProductionBatch({
        finalProductId: pFinal!.id,
        finalProductName: pFinal!.name,
        expectedDate: new Date().toISOString(),
        initialWeight: initialNum,
        finalWeight: finalWNum,
        finalQty: qtyFinalNum,
        inputs: inputs.map(i => ({ productId: i.productId, name: i.name, qty: i.qty, unitCost: i.unitCost })),
        extraCosts,
        estimatedHours: hNum,
        laborCostPerHour: laborHNum,
        status,
        responsible,
        notes
      });
      
      setIsSuccess(true);
    } catch (err: any) {
      console.error(err);
      error(err.message);
      setIsFinalizing(false);
    }
  };

  const { totalCost, unitCost } = calculateProductionCosts(inputs, extraCosts, parseFloat(hours) || 0, parseFloat(laborCostPerHour) || 0, parseFloat(finalQty) || 0);

  const yieldPercentage = (parseFloat(initialWeight) && parseFloat(finalWeight)) 
    ? ((parseFloat(finalWeight) / parseFloat(initialWeight)) * 100).toFixed(1)
    : '0.0';

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title="Nova Produção"
      icon={<Factory size={20} />}
      subtitle="Torra, Blend e Envase manual."
      size="lg"
      footer={
        !isSuccess ? (
          <div className="w-full flex justify-between items-center">
             <div>
               <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Custo Total Projetado</div>
               <div className="text-2xl font-heading font-semibold text-amber-500">
                 {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCost)}
               </div>
               {parseFloat(finalQty) > 0 && unitCost > 0 && (
                 <div className="text-xs text-zinc-500 font-mono mt-0.5">
                   {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(unitCost)} / un
                 </div>
               )}
             </div>
            <Button 
              variant="conclusive"
              size="lg"
              onClick={handleFinalize}
              disabled={isFinalizing}
              isLoading={isFinalizing}
              className="gap-2 px-8"
            >
              {!isFinalizing && <Check size={20} />}
              Salvar Lote
            </Button>
          </div>
        ) : (
          <Button variant="primary" size="lg" onClick={onComplete} className="w-full">
            Fechar
          </Button>
        )
      }
    >
      {!isSuccess ? (
        <div className="space-y-8">
          <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
            {(['Rascunho', 'Em Produção', 'Concluído'] as ProductionStatus[]).map(s => (
              <button
                key={s} onClick={() => setStatus(s)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${status === s ? 'bg-zinc-800 text-amber-500 shadow-sm border border-zinc-700/50' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {s}
              </button>
            ))}
          </div>

          <section className="space-y-4 bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/50">
             <div className="flex items-center gap-2 text-amber-500 mb-2">
               <Factory size={16} />
               <h3 className="text-xs font-bold uppercase tracking-widest">1. Produto Desejado</h3>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Produto Final</label>
                  <Select value={finalProductId} onChange={e => setFinalProductId(e.target.value)}>
                    <option value="" disabled>Selecione...</option>
                    {availableProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Quantidade Produzida ({availableProducts.find(p => p.id === finalProductId)?.unit || 'un'})</label>
                  <Input type="number" value={finalQty} onChange={e => setFinalQty(e.target.value)} className="text-amber-400 font-mono text-lg tabular-nums" placeholder="0" />
                </div>
             </div>
          </section>

          <section className="space-y-4 bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/50">
             <div className="flex items-center gap-2 text-amber-500 mb-2">
               <Flame size={16} />
               <h3 className="text-xs font-bold uppercase tracking-widest">2. Insumos (Café Cru, Embalagens)</h3>
             </div>
             <div className="flex flex-col sm:flex-row items-end gap-3">
               <div className="flex-1 w-full">
                 <Select value={inputId} onChange={e => setInputId(e.target.value)}>
                    <option value="" disabled>Buscar insumo...</option>
                    {insumos.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Est. {p.currentStock})</option>
                    ))}
                 </Select>
               </div>
               <div className="w-full sm:w-28 relative">
                 <Input type="number" placeholder="Qtd" value={inputQty} onChange={e => setInputQty(e.target.value)} className="font-mono tabular-nums pr-8" />
                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">{selectedInput?.unit || 'un'}</span>
               </div>
               <Button variant="secondary" onClick={handleAddInput} type="button" className="w-full sm:w-auto h-[46px] gap-2">
                 <Plus size={16}/> Incluir
               </Button>
             </div>
             
             <div className="space-y-2 mt-4">
               {inputs.map(i => (
                  <div key={i.productId} className="flex justify-between items-center bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl text-sm group transition-colors hover:border-zinc-700">
                    <span className="text-zinc-200 font-medium">{i.name}</span>
                    <div className="flex gap-4 items-center">
                      <span className="text-zinc-400 font-mono bg-zinc-900 px-2 py-1 rounded">{i.qty} {availableProducts.find(p=>p.id===i.productId)?.unit}</span>
                      <button onClick={() => setInputs(prev => prev.filter(x => x.productId !== i.productId))} className="text-zinc-600 hover:text-red-400 transition-colors">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>
               ))}
               {inputs.length === 0 && (
                 <div className="text-center py-6 text-zinc-600 text-sm border border-dashed border-zinc-800 rounded-xl">
                   Nenhum insumo adicionado.
                 </div>
               )}
             </div>
          </section>

          <section className="grid grid-cols-2 gap-4">
             <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/50">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Peso Verde Inicial (kg)</label>
                <Input type="number" value={initialWeight} onChange={e => setInitialWeight(e.target.value)} className="font-mono tabular-nums text-lg" placeholder="12.0" />
             </div>
             <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/50 relative overflow-hidden">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Peso Final Torrado (kg)</label>
                <Input type="number" value={finalWeight} onChange={e => setFinalWeight(e.target.value)} className="text-amber-400 font-mono tabular-nums text-lg" placeholder="10.2" />
                
                {parseFloat(finalWeight) > 0 && parseFloat(initialWeight) > 0 && (
                  <div className="absolute top-4 right-4 bg-amber-500/10 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    Yield {yieldPercentage}%
                  </div>
                )}
             </div>
          </section>

          <section className="space-y-4 bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/50">
             <h3 className="text-[11px] font-bold uppercase tracking-widest text-amber-500 mb-2">3. Mão de Obra e Custos Extras</h3>
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Tempo (Horas)</label>
                  <Input type="number" value={hours} onChange={e => setHours(e.target.value)} className="font-mono tabular-nums" placeholder="Ex: 2.5" />
               </div>
               <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Custo da Hora (R$)</label>
                  <Input type="number" value={laborCostPerHour} onChange={e => setLaborCostPerHour(e.target.value)} className="font-mono tabular-nums" placeholder="Ex: 25.00" />
               </div>
             </div>

             <div className="flex items-end gap-3 mt-4">
               <div className="flex-1 w-full">
                 <Input type="text" placeholder="Ex: Gás, Perfil de torra extra..." value={extraDesc} onChange={e => setExtraDesc(e.target.value)} />
               </div>
               <div className="w-24 relative">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">R$</span>
                 <Input type="number" value={extraAmount} onChange={e => setExtraAmount(e.target.value)} className="font-mono tabular-nums pl-8" />
               </div>
               <Button variant="secondary" onClick={handleAddExtra} type="button" className="h-[46px]"><Plus size={16}/></Button>
             </div>
             <div className="space-y-2 mt-4">
               {extraCosts.map((e, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-zinc-950/80 border border-zinc-800 p-3 rounded-xl text-sm">
                    <span className="text-zinc-300">{e.description}</span>
                    <div className="flex gap-4 items-center">
                      <span className="text-zinc-400 font-mono">{formatBRL(e.amount)}</span>
                      <button onClick={() => setExtraCosts(prev => prev.filter((_, i) => i !== idx))} className="text-zinc-600 hover:text-red-400 transition-colors"><Trash2 size={14}/></button>
                    </div>
                  </div>
               ))}
             </div>
          </section>

          <section>
            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Observações do Mestre Torrador</label>
            <Textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              rows={3} 
              placeholder="Notas sensoriais, curva de torra, umidade, tempo extra de resfriamento..." 
            />
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
          <h3 className="text-2xl font-heading font-semibold text-zinc-100 mb-2">Lote Registrado</h3>
          <p className="text-zinc-400 max-w-sm">
            O lote foi salvo com status de {status}. Os custos foram apurados com sucesso.
          </p>
        </motion.div>
      )}
    </Drawer>
  );
}
