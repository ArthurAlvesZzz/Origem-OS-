import { useState, useEffect } from 'react';
import { useRepositories } from '../../repositories/RepositoryProvider';
import { useToast } from '../../components/ui/Toast';

export function LoyaltyTab() {
  const { success, error: toastError, info } = useToast();
  const { crmRepo } = useRepositories();
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadProgram(); }, []);

  async function loadProgram() {
    try {
      const data = await crmRepo.getLoyaltyProgram();
      setProgram(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(active: boolean) {
     const data = await crmRepo.updateLoyaltyProgram({ active });
     setProgram(data);
  }

  if (loading) return <div>Carregando Fidelidade...</div>;

  return (
    <div className="space-y-4">
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-medium text-zinc-100">Clube de Fidelidade</h2>
            <p className="text-sm text-zinc-400">Regras de pontos e recompensas</p>
          </div>
          <button onClick={() => handleUpdate(!program?.active)} className={`px-4 py-2 rounded text-sm font-medium ${program?.active ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'}`}>
            {program?.active ? 'Pausar Programa' : 'Ativar Programa'}
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-zinc-950 p-4 border border-zinc-800 rounded flex flex-col gap-1">
             <span className="text-zinc-500 text-xs uppercase font-medium">Pontos por Reais</span>
             <span className="text-2xl text-amber-500 font-mono">{program?.pointsPerCurrency || 1} <span className="text-zinc-500 text-sm">pts / R$ 1</span></span>
           </div>
           <div className="bg-zinc-950 p-4 border border-zinc-800 rounded flex flex-col gap-1">
             <span className="text-zinc-500 text-xs uppercase font-medium">Recompensa Prata</span>
             <span className="text-xl text-zinc-100">{program?.rewardThresholdSilver || 500} pts</span>
             <span className="text-xs text-zinc-500">Ex: Café Especial + Torrada</span>
           </div>
        </div>
      </div>
      
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
         <h3 className="font-medium text-zinc-100 mb-2">Simular Pontuação Manual</h3>
         <div className="flex gap-2">
            <input className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 flex-1" placeholder="ID Cliente (ex: cust_1)" id="loyCustomer" />
            <input className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 w-32" type="number" placeholder="Pontos" id="loyPoints" />
            <button className="bg-amber-500 text-zinc-950 font-medium px-4 rounded text-sm" onClick={async () => {
                const c = (document.getElementById('loyCustomer') as HTMLInputElement).value;
                const p = Number((document.getElementById('loyPoints') as HTMLInputElement).value);
                if(c && p) {
                   await crmRepo.adjustLoyaltyPoints(c, p, 'Bônus manual');
                   success('Pontos creditados com sucesso (simulação na UI)!');
                }
            }}>Investir</button>
         </div>
      </div>
    </div>
  )
}
