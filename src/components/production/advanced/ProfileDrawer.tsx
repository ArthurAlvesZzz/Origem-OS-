import React, { useState, useEffect } from 'react';
import { useRepositories } from '../../../repositories/RepositoryProvider';
import { RoastProfileRecord, ProductionRecipeRecord } from '../../../repositories/interfaces/IAdvancedProductionRepository';
import { Save, Flame } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import { Drawer } from '../../ui/Drawer';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Textarea } from '../../ui/Textarea';

interface ProfileDrawerProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function ProfileDrawer({ onClose, onSuccess }: ProfileDrawerProps) {
  const { success, error: toastError, info } = useToast();
  const { advancedProductionRepo } = useRepositories();
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<ProductionRecipeRecord[]>([]);

  const [formData, setFormData] = useState<Partial<RoastProfileRecord>>({
    name: '', recipeId: '', roastLevel: 'medium', totalTime: 600, notes: '', active: true
  });

  useEffect(() => {
    advancedProductionRepo.getRecipes().then(setRecipes);
  }, [advancedProductionRepo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await advancedProductionRepo.createRoastProfile(formData);
      onSuccess();
    } catch (err) {
      toastError('Erro ao salvar perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title="Novo Perfil de Torra"
      subtitle="Configure o perfil e vincule a receita."
      icon={<Flame size={20} />}
      size="sm"
      footer={
        <Button 
          type="submit" 
          form="profile-form" 
          variant="conclusive" 
          size="lg" 
          disabled={loading} 
          isLoading={loading}
          className="w-full gap-2 text-[15px]"
        >
          {!loading && <Save size={18} />}
          Salvar Perfil
        </Button>
      }
    >
      <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Nome do Perfil *</label>
          <Input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Omni Roast Médio"/>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Receita Associada *</label>
          <Select required value={formData.recipeId} onChange={e => setFormData({ ...formData, recipeId: e.target.value })}>
            <option value="" disabled>Selecione a Receita</option>
            {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Duração (seg)</label>
              <Input type="number" min="0" required value={formData.totalTime} onChange={e => setFormData({ ...formData, totalTime: parseInt(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Ponto de Torra</label>
            <Select value={formData.roastLevel} onChange={e => setFormData({ ...formData, roastLevel: e.target.value })}>
              <option value="light">Clara</option>
              <option value="medium">Média</option>
              <option value="medium-dark">Média-Escura</option>
              <option value="dark">Escura</option>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Observações do Mestre</label>
          <Textarea rows={4} value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Notas de curva, desenvolvimento, RoR..." />
        </div>

      </form>
    </Drawer>
  );
}
