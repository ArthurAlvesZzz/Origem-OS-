import React, { useState } from 'react';
import { useRepositories } from '../../../repositories/RepositoryProvider';
import { GreenCoffeeLotRecord } from '../../../repositories/interfaces/IAdvancedProductionRepository';
import { Save, Sprout } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import { Drawer } from '../../ui/Drawer';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';

interface GreenLotDrawerProps {
  onClose: () => void;
  onSuccess: () => void;
  lotId?: string; // If editing
}

export function GreenLotDrawer({ onClose, onSuccess, lotId }: GreenLotDrawerProps) {
  const { success, error: toastError, info } = useToast();
  const { advancedProductionRepo } = useRepositories();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<GreenCoffeeLotRecord>>({
    name: '', origin: '', variety: '', processing: '', harvest: '', supplier: '',
    costPerKg: 0, stockKg: 0, status: 'available'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (lotId) {
        await advancedProductionRepo.updateGreenLot(lotId, formData);
      } else {
        await advancedProductionRepo.createGreenLot(formData);
      }
      onSuccess();
    } catch (err) {
      toastError('Erro ao salvar lote de grão verde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title={lotId ? 'Editar Lote Verde' : 'Novo Lote de Grão Verde'}
      subtitle="Insira os dados do café cru."
      icon={<Sprout size={20} />}
      size="sm"
      footer={
        <Button 
          type="submit" 
          form="green-lot-form" 
          variant="conclusive" 
          size="lg" 
          isLoading={loading} 
          disabled={loading}
          className="w-full gap-2 text-[15px]"
        >
          {!loading && <Save size={18} />}
          Salvar Lote
        </Button>
      }
    >
      <form id="green-lot-form" onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Nome do Lote / Identificação *</label>
          <Input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Mundo Novo Seca 24"/>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Origem/Fazenda</label>
            <Input type="text" value={formData.origin} onChange={e => setFormData({ ...formData, origin: e.target.value })} />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Fornecedor</label>
            <Input type="text" value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Variedade</label>
            <Input type="text" value={formData.variety} onChange={e => setFormData({ ...formData, variety: e.target.value })} placeholder="Ex: Catuaí" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Processo</label>
            <Input type="text" value={formData.processing} onChange={e => setFormData({ ...formData, processing: e.target.value })} placeholder="Ex: Natural" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Safra</label>
            <Input type="text" value={formData.harvest} onChange={e => setFormData({ ...formData, harvest: e.target.value })} placeholder="Ex: 24/25" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Custo por Kg (R$)</label>
            <Input type="number" step="0.01" min="0" required value={formData.costPerKg || ''} onChange={e => setFormData({ ...formData, costPerKg: parseFloat(e.target.value) })} />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Estoque Inicial (Kg)</label>
            <Input type="number" step="0.1" min="0" required value={formData.stockKg || ''} onChange={e => setFormData({ ...formData, stockKg: parseFloat(e.target.value) })} />
          </div>
        </div>
        
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Status</label>
          <Select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
            <option value="available">Disponível</option>
            <option value="blocked">Bloqueado</option>
          </Select>
        </div>
      </form>
    </Drawer>
  );
}
