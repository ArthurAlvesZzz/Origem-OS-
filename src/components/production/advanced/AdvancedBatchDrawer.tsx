import React, { useState, useEffect } from 'react';
import { useRepositories } from '../../../repositories/RepositoryProvider';
import { ProductionRecipeRecord, RoastProfileRecord, GreenCoffeeLotRecord } from '../../../repositories/interfaces/IAdvancedProductionRepository';
import { Save, AlertTriangle, ArrowRight, CheckCircle2, Factory } from 'lucide-react';
import { Drawer } from '../../ui/Drawer';
import { Button } from '../../ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { Select } from '../../ui/Select';
import { Input } from '../../ui/Input';

interface AdvancedBatchDrawerProps {
  onClose: () => void;
  onSuccess: () => void;
  initialProductId?: string;
  initialQuantity?: number;
}

type BatchStep = 'planning' | 'reservation' | 'roasting' | 'completion';

export function AdvancedBatchDrawer({ onClose, onSuccess, initialProductId, initialQuantity }: AdvancedBatchDrawerProps) {
  const { success, error: toastError, info } = useToast();
  const { advancedProductionRepo } = useRepositories();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<BatchStep>('planning');
  
  const [recipes, setRecipes] = useState<ProductionRecipeRecord[]>([]);
  const [profiles, setProfiles] = useState<RoastProfileRecord[]>([]);
  const [greenLots, setGreenLots] = useState<GreenCoffeeLotRecord[]>([]);

  // Planning state
  const [productId, setProductId] = useState(initialProductId || '');
  const [plannedQty, setPlannedQty] = useState(initialQuantity || 1);
  const [recipeId, setRecipeId] = useState('');
  const [profileId, setProfileId] = useState('');
  const [masterRoaster, setMasterRoaster] = useState('');
  
  // Reservation state
  const [selectedLots, setSelectedLots] = useState<Record<string, string>>({}); // recipeInputId -> greenLotId

  // Completion state
  const [finalWeight, setFinalWeight] = useState<number>();
  const [packagedQty, setPackagedQty] = useState<number>();

  useEffect(() => {
    advancedProductionRepo.getRecipes().then(setRecipes);
    advancedProductionRepo.getRoastProfiles().then(setProfiles);
    advancedProductionRepo.getGreenLots().then(setGreenLots);
  }, [advancedProductionRepo]);

  const selectedRecipe = recipes.find(r => r.id === recipeId);
  const selectedProfile = profiles.find(p => p.id === profileId);

  // Auto-select recipe based on productId
  useEffect(() => {
    if (productId && !recipeId) {
      const match = recipes.find(r => r.productId === productId);
      if (match) setRecipeId(match.id);
    }
  }, [productId, recipeId, recipes]);

  const handleNext = () => {
    if (step === 'planning') {
      if (!recipeId) return toastError('Selecione uma receita.');
      if (plannedQty <= 0) return toastError('Quantidade deve ser maior que 0.');
      
      // Auto assign lots if possible
      const newSelected: Record<string, string> = { ...selectedLots };
      selectedRecipe?.inputs?.forEach(input => {
        if (!newSelected[input.id]) {
           newSelected[input.id] = input.greenLotId || '';
        }
      });
      setSelectedLots(newSelected);
      setStep('reservation');
    } else if (step === 'reservation') {
      // Validate reservations
      const allSelected = selectedRecipe?.inputs?.every(i => selectedLots[i.id]);
      if (!allSelected) return toastError('Selecione o lote de origem para todos os insumos.');
      setStep('roasting');
    } else if (step === 'roasting') {
      setStep('completion');
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      if (!finalWeight || finalWeight <= 0) {
         toastError('Informe o peso final obtido.');
         setLoading(false);
         return;
      }

      // Convert from step state to standard API call
      // Since it's a simplification, we will call advanced API
      await advancedProductionRepo.createBatchFromDemand({
         productId,
         plannedQuantity: plannedQty,
         recipeId,
         roastProfileId: profileId,
         masterRoasterId: masterRoaster,
         inputs: selectedRecipe?.inputs?.map(i => ({
            greenLotId: selectedLots[i.id],
            weightToUse: plannedQty * (i.percent || 0), // Base calc
         })) || [],
         finalWeight: finalWeight,
         packagedQuantity: packagedQty || plannedQty
      });
      onSuccess();
    } catch (e) {
      toastError('Erro ao concluir.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title="Nova Ordem de Produção"
      icon={<Factory size={20} />}
      subtitle="Fluxo guiado de torra e reserva."
      size="md"
      footer={
        <div className="flex w-full gap-3">
          <Button type="button" variant="outline" size="lg" onClick={onClose} className="px-6 text-[15px]">Cancelar</Button>
          <Button 
            type="button" 
            variant="conclusive"
            size="lg"
            onClick={handleNext} 
            disabled={loading} 
            isLoading={loading}
            className="flex-1 gap-2 text-[15px]"
          >
            {step === 'completion' ? <><CheckCircle2 size={18} /> Concluir Produção</> : <>Próxima Etapa <ArrowRight size={18} /></>}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stepper Header */}
        <div className="flex bg-zinc-900 px-6 py-3 border border-zinc-800 overflow-x-auto no-scrollbar gap-2 rounded-xl mb-6">
           <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap ${step === 'planning' ? 'bg-amber-500/20 text-amber-500' : 'text-zinc-500'}`}>
              <span className="w-5 h-5 rounded-full bg-zinc-950 flex items-center justify-center border border-current">1</span> Planejamento
           </div>
           <div className="text-zinc-700 flex items-center">-</div>
           <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap ${step === 'reservation' ? 'bg-amber-500/20 text-amber-500' : 'text-zinc-500'}`}>
              <span className="w-5 h-5 rounded-full bg-zinc-950 flex items-center justify-center border border-current">2</span> Insumos
           </div>
           <div className="text-zinc-700 flex items-center">-</div>
           <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap ${step === 'roasting' ? 'bg-amber-500/20 text-amber-500' : 'text-zinc-500'}`}>
              <span className="w-5 h-5 rounded-full bg-zinc-950 flex items-center justify-center border border-current">3</span> Torra
           </div>
           <div className="text-zinc-700 flex items-center">-</div>
           <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap ${step === 'completion' ? 'bg-amber-500/20 text-amber-500' : 'text-zinc-500'}`}>
              <span className="w-5 h-5 rounded-full bg-zinc-950 flex items-center justify-center border border-current">4</span> Conclusão
           </div>
        </div>

        {step === 'planning' && (
           <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
             <div>
               <label className="block text-sm font-medium text-zinc-300 mb-1">Produto (SKU) *</label>
               <Input type="text" required value={productId} onChange={e => setProductId(e.target.value)} placeholder="Ex: SKU-CAFE-01"/>
             </div>
             
             <div>
               <label className="block text-sm font-medium text-zinc-300 mb-1">Quantidade Planejada (Kg) *</label>
               <Input type="number" min="0.1" step="0.1" required value={plannedQty} onChange={e => setPlannedQty(parseFloat(e.target.value) || 0)} className="tabular-nums" />
             </div>

             <div>
               <label className="block text-sm font-medium text-zinc-300 mb-1">Ficha Técnica / Receita *</label>
               <Select required value={recipeId} onChange={e => setRecipeId(e.target.value)}>
                  <option value="" disabled>Selecione a Receita</option>
                  {recipes.map(r => <option key={r.id} value={r.id}>{r.name} (Rend. {(r.targetYield*100).toFixed(0)}%)</option>)}
               </Select>
               {!recipeId && recipes.length > 0 && <p className="text-xs text-amber-500 mt-1 flex gap-1"><AlertTriangle size={14}/> Nenhuma receita selecionada.</p>}
             </div>

             <div>
               <label className="block text-sm font-medium text-zinc-300 mb-1">Perfil de Torra Prometido</label>
               <Select value={profileId} onChange={e => setProfileId(e.target.value)}>
                  <option value="">(Opcional) Selecione Perfil</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.name} ({p.roastLevel})</option>)}
               </Select>
             </div>

             <div>
               <label className="block text-sm font-medium text-zinc-300 mb-1">Mestre de Torra</label>
               <Input type="text" value={masterRoaster} onChange={e => setMasterRoaster(e.target.value)} placeholder="Nome do responsável"/>
             </div>
           </div>
        )}

        {step === 'reservation' && selectedRecipe && (
           <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-sm">
                 <div className="text-zinc-400 mb-2">Para produzir <strong className="text-zinc-100">{plannedQty}kg</strong> de {productId}, você precisará de:</div>
                 <div className="font-medium text-amber-500 tabular-nums">{((plannedQty) / (selectedRecipe.targetYield || 1)).toFixed(2)}kg de insumos verdes (Rend. {(selectedRecipe.targetYield*100).toFixed(0)}%)</div>
              </div>

              <div className="space-y-4">
                 <h4 className="text-[11px] font-bold uppercase tracking-widest text-zinc-300">Alocação do Blend</h4>
                 {selectedRecipe.inputs?.map(input => {
                    const requiredKg = (plannedQty / (selectedRecipe.targetYield || 1)) * (input.percent || 0.0);
                    return (
                       <div key={input.id} className="border border-zinc-800 p-4 rounded-xl bg-zinc-900/50">
                          <div className="flex justify-between text-xs text-zinc-400 mb-3 font-mono">
                             <span>Blend: {(input.percent * 100).toFixed(0)}%</span>
                             <span>Necessário: <strong className="text-zinc-100">{requiredKg.toFixed(2)}kg</strong></span>
                          </div>
                          <Select value={selectedLots[input.id] || ''} onChange={e => setSelectedLots({...selectedLots, [input.id]: e.target.value})}>
                             <option value="" disabled>Selecione o Lote Fonte...</option>
                             {greenLots.map(l => (
                                <option key={l.id} value={l.id} disabled={l.stockKg < requiredKg}>{l.name} - Est: {l.stockKg.toFixed(1)}kg</option>
                             ))}
                          </Select>
                       </div>
                    );
                 })}
              </div>
           </div>
        )}

        {step === 'roasting' && (
           <div className="space-y-6 animate-in fade-in slide-in-from-right-4 text-center py-8">
              <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                 <ArrowRight size={32} />
              </div>
              <h3 className="text-lg font-medium text-white">Pronto para iniciar?</h3>
              <p className="text-zinc-400 text-sm">A reserva de lotes verdes será confirmada.<br/>Mova para a próxima etapa apenas quando a torra estiver concluída.</p>
           </div>
        )}

        {step === 'completion' && (
           <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
             <div>
               <label className="block text-sm font-medium text-zinc-300 mb-1">Peso Final Obtido (Kg) *</label>
               <Input type="number" min="0" step="0.01" required value={finalWeight || ''} onChange={e => setFinalWeight(parseFloat(e.target.value))} className="text-xl font-bold tabular-nums" placeholder="Ex: 8.5"/>
             </div>

             <div>
               <label className="block text-sm font-medium text-zinc-300 mb-1">Unidades Embaladas</label>
               <Input type="number" min="0" value={packagedQty || ''} onChange={e => setPackagedQty(parseInt(e.target.value))} placeholder="Ex: 34 pacotes de 250g"/>
             </div>

             {finalWeight && selectedRecipe && (
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-sm space-y-2 mt-4">
                   <div className="flex justify-between">
                      <span className="text-zinc-400">Rendimento Real:</span>
                      <span className={`font-medium ${ (finalWeight / (plannedQty / selectedRecipe.targetYield)) < selectedRecipe.targetYield ? 'text-red-400' : 'text-emerald-400'}`}>
                         {((finalWeight / (plannedQty / selectedRecipe.targetYield)) * 100).toFixed(1)}%
                      </span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-zinc-400">Rendimento Alvo:</span>
                      <span className="font-medium text-zinc-300">{(selectedRecipe.targetYield * 100).toFixed(1)}%</span>
                   </div>
                </div>
             )}
           </div>
        )}

      </div>
    </Drawer>
  );
}
