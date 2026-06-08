import React, { useState, useEffect } from 'react';
import { useRepositories } from '../../../repositories/RepositoryProvider';
import { ProductionRecipeRecord, GreenCoffeeLotRecord } from '../../../repositories/interfaces/IAdvancedProductionRepository';
import { Save, Plus, Trash, BookOpen } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import { Drawer } from '../../ui/Drawer';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';

interface RecipeDrawerProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function RecipeDrawer({ onClose, onSuccess }: RecipeDrawerProps) {
  const { success, error: toastError, info } = useToast();
  const { advancedProductionRepo } = useRepositories();
  const [loading, setLoading] = useState(false);
  const [lots, setLots] = useState<GreenCoffeeLotRecord[]>([]);
  
  const [formData, setFormData] = useState<Partial<ProductionRecipeRecord>>({
    name: '', productId: '', targetYield: 0.85, defaultCostPerHour: 0,
    inputs: [], extras: []
  });

  useEffect(() => {
    advancedProductionRepo.getGreenLots().then(setLots);
  }, [advancedProductionRepo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (formData.inputs?.length === 0) {
        toastError('Adicione pelo menos um grão no blend.');
        return;
      }
      await advancedProductionRepo.createRecipe(formData);
      onSuccess();
    } catch (err) {
      toastError('Erro ao salvar receita.');
    } finally {
      setLoading(false);
    }
  };

  const addInput = () => {
    setFormData(prev => ({
      ...prev,
      inputs: [...(prev.inputs || []), { id: Date.now().toString(), greenLotId: '', percent: 1, estimatedWaste: 0.15 }]
    }));
  };

  const removeInput = (id: string) => {
    setFormData(prev => ({
      ...prev,
      inputs: (prev.inputs || []).filter(i => i.id !== id)
    }));
  };

  const addExtra = () => {
    setFormData(prev => ({
      ...prev,
      extras: [...(prev.extras || []), { id: Date.now().toString(), itemName: '', cost: 0 }]
    }));
  };

  const removeExtra = (id: string) => {
    setFormData(prev => ({
      ...prev,
      extras: (prev.extras || []).filter(i => i.id !== id)
    }));
  };

  // Calculate estimated cost
  // Sum of lots avg costs weighted by percentage / targetYield + fixed extras + hourCost
  const totalBaseYield = formData.targetYield || 1;
  const inputCost = (formData.inputs || []).reduce((acc, input) => {
     const lot = lots.find(l => l.id === input.greenLotId);
     const kgPrice = lot ? lot.costPerKg : 0;
     const costPer1KgInput = kgPrice * (input.percent || 0.0);
     return acc + costPer1KgInput;
  }, 0);
  const rawCostPerKgOut = totalBaseYield > 0 ? (inputCost / totalBaseYield) : 0;
  
  const totalExtras = (formData.extras || []).reduce((acc, ex) => acc + (ex.cost || 0), 0);
  const estimatedCostPerKgOut = rawCostPerKgOut + totalExtras + (formData.defaultCostPerHour || 0);

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title="Nova Receita / Ficha Técnica"
      subtitle="Configure o blend e insumos."
      icon={<BookOpen size={20} />}
      size="md"
      footer={
        <div className="flex flex-col w-full gap-4">
          <div className="flex justify-between items-center bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
             <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Custo Estimado (R$/Kg)</span>
             <span className="text-xl font-mono text-emerald-400 font-bold tracking-tight">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimatedCostPerKgOut)}</span>
          </div>
          <Button 
            type="submit" 
            form="recipe-form" 
            variant="conclusive" 
            size="lg" 
            disabled={loading} 
            isLoading={loading}
            className="w-full gap-2 text-[15px]"
          >
            {!loading && <Save size={18} />}
            Salvar Receita
          </Button>
        </div>
      }
    >
      <form id="recipe-form" onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Nome da Receita *</label>
          <Input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Blend Clássico 500g"/>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">ID Produto (SKU)</label>
              <Input type="text" required value={formData.productId} onChange={e => setFormData({ ...formData, productId: e.target.value })} />
          </div>
          <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Rendimento (%)</label>
              <Input type="number" step="0.01" min="0" max="1" required value={formData.targetYield} onChange={e => setFormData({ ...formData, targetYield: parseFloat(e.target.value) })} />
          </div>
        </div>

        <div className="border border-zinc-800 p-5 rounded-xl bg-zinc-900/40">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-zinc-300">Grãos Verdes (Blend)</h4>
              <Button type="button" variant="ghost" size="sm" onClick={addInput} className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 gap-1 h-8 text-[11px]">
                  <Plus size={14}/> Adicionar Grão
              </Button>
            </div>
            
            <div className="space-y-3">
              {(!formData.inputs || formData.inputs.length === 0) && (
                <div className="text-xs text-zinc-500 p-4 border border-dashed border-zinc-800 rounded-lg text-center">Nenhum grão verde adicionado.</div>
              )}
              {formData.inputs?.map((input, index) => (
                <div key={input.id} className="flex gap-2 items-start">
                    <Select value={input.greenLotId} onChange={e => {
                      const newInputs = [...(formData.inputs || [])];
                      newInputs[index].greenLotId = e.target.value;
                      setFormData({ ...formData, inputs: newInputs });
                    }} className="flex-1">
                      <option value="" disabled>Selecione o Lote</option>
                      {lots.map(l => <option key={l.id} value={l.id}>{l.name} ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(l.costPerKg)}/kg)</option>)}
                    </Select>
                    
                    <div className="w-24">
                      <Input type="number" step="0.01" value={input.percent} onChange={e => {
                        const newInputs = [...(formData.inputs || [])];
                        newInputs[index].percent = parseFloat(e.target.value) || 0;
                        setFormData({ ...formData, inputs: newInputs });
                      }} placeholder="Kg p/ 1kg" className="font-mono text-sm tabular-nums text-center" />
                    </div>

                    <Button type="button" variant="danger" size="icon" onClick={() => removeInput(input.id)} className="shrink-0 h-11 w-11 mt-0">
                      <Trash size={16} />
                    </Button>
                </div>
              ))}
            </div>
        </div>

        <div className="border border-zinc-800 p-5 rounded-xl bg-zinc-900/40">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-zinc-300">Custos Extras Por Kg</h4>
              <Button type="button" variant="ghost" size="sm" onClick={addExtra} className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 gap-1 h-8 text-[11px]">
                  <Plus size={14}/> Add Extra
              </Button>
            </div>
            
            <div className="space-y-3">
              {(!formData.extras || formData.extras.length === 0) && (
                <div className="text-xs text-zinc-500 p-4 border border-dashed border-zinc-800 rounded-lg text-center">Nenhum custo extra mapeado.</div>
              )}
              {formData.extras?.map((extra, index) => (
                <div key={extra.id} className="flex gap-2 items-center">
                    <Input type="text" value={extra.itemName} onChange={e => {
                      const newExtras = [...(formData.extras || [])];
                      newExtras[index].itemName = e.target.value;
                      setFormData({ ...formData, extras: newExtras });
                    }} placeholder="Embalagem, Energia..." className="flex-1" />
                    
                    <div className="w-28 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">R$</span>
                      <Input type="number" step="0.01" value={extra.cost} onChange={e => {
                        const newExtras = [...(formData.extras || [])];
                        newExtras[index].cost = parseFloat(e.target.value) || 0;
                        setFormData({ ...formData, extras: newExtras });
                      }} className="pl-8 font-mono tabular-nums text-sm" />
                    </div>

                    <Button type="button" variant="danger" size="icon" onClick={() => removeExtra(extra.id)} className="shrink-0 h-11 w-11 mt-0">
                      <Trash size={16} />
                    </Button>
                </div>
              ))}
            </div>
            
            <div className="mt-5 pt-5 border-t border-zinc-800/50 flex items-center justify-between">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Mão de Obra Fixo / H (R$)</label>
              <div className="w-28 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">R$</span>
                <Input type="number" step="0.01" value={formData.defaultCostPerHour} onChange={e => setFormData({ ...formData, defaultCostPerHour: parseFloat(e.target.value) || 0 })} className="pl-8 font-mono tabular-nums text-sm" />
              </div>
            </div>
        </div>

      </form>
    </Drawer>
  );
}
