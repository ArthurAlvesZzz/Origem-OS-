import { Wallet, CreditCard, Landmark, Banknote, Clock } from 'lucide-react';
import { OrderStatus } from '../../domain/types';

interface PaymentSelectorProps {
  method: string;
  status: OrderStatus;
  onChangeMethod: (m: string) => void;
  onChangeStatus: (s: OrderStatus) => void;
}

export function PaymentSelector({ method, status, onChangeMethod, onChangeStatus }: PaymentSelectorProps) {
  const methods = [
    { id: 'PIX', label: 'PIX', icon: Landmark },
    { id: 'Cartão de Crédito', label: 'Crédito', icon: CreditCard },
    { id: 'Cartão de Débito', label: 'Débito', icon: CreditCard },
    { id: 'Dinheiro', label: 'Dinheiro', icon: Banknote },
    { id: 'Boleto 30d', label: 'Boleto', icon: Clock },
    { id: 'A Prazo', label: 'B2B Prazo', icon: Wallet },
  ];

  const statuses = [
    { id: 'Pago' as OrderStatus, label: 'Pago Agora' },
    { id: 'Pendente' as OrderStatus, label: 'Pendente' },
    { id: 'Parcial' as OrderStatus, label: 'Parcial' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Método de Captura</label>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {methods.map(m => {
            const Icon = m.icon;
            const active = method === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onChangeMethod(m.id)}
                className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                  active 
                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-500' 
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                }`}
              >
                <Icon size={16} className={active ? 'text-amber-500' : 'text-zinc-500'} />
                {m.label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Status de Fluxo de Caixa</label>
        <div className="flex bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
          {statuses.map(s => {
            const isActive = status === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onChangeStatus(s.id)}
                className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
                }`}
              >
                {s.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
}
