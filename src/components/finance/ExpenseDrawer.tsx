import { useState } from 'react';
import { Check, Receipt, CreditCard, CalendarDays } from 'lucide-react';
import { TransactionStatus } from '../../domain/types';
import { useRepositories } from '../../repositories/RepositoryProvider';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { motion } from 'motion/react';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../ui/ConfirmDialog';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';

interface ExpenseDrawerProps {
  onClose: () => void;
  onComplete: () => void;
}

const CATEGORIES = [
  'Matéria-prima', 'Embalagem', 'Mão de obra', 'Aluguel', 
  'Energia', 'Logística', 'Marketing', 'Impostos', 'Software', 'Outros'
];

export function ExpenseDrawer({ onClose, onComplete }: ExpenseDrawerProps) {
  const { success, error: toastError, info } = useToast();
  const { confirm } = useConfirm();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<TransactionStatus>('Agendado');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { financialRepo } = useRepositories();

  const handleSave = async () => {
    const val = parseFloat(amount);
    if (!description || !val || val <= 0) {
      toastError('Preencha descrição e um valor válido.');
      return;
    }

    const proceed = await confirm({
      title: 'Confirmar Lançamento',
      description: `Lançar despesa de R$ ${val.toFixed(2)} em ${date}?`,
      confirmText: 'Lançar',
    });
    if (!proceed) return;

    setIsFinalizing(true);
    try {
      await financialRepo.createTransaction({
        type: 'Despesa',
        description,
        amount: val,
        date,
        status,
        category,
        paymentMethod
      });

      setIsSuccess(true);
    } catch (e: any) {
      console.error(e);
      toastError('Erro ao salvar despesa');
      setIsFinalizing(false);
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title="Lançar Despesa"
      subtitle="Contas a pagar ou pagas."
      icon={<Receipt size={20} />}
      size="md"
      footer={
        !isSuccess ? (
          <Button 
            variant="conclusive"
            size="lg"
            onClick={handleSave}
            disabled={isFinalizing}
            isLoading={isFinalizing}
            className="w-full gap-2 text-[15px]"
          >
            {!isFinalizing && <Check size={20} />}
            Confirmar Despesa
          </Button>
        ) : (
          <Button variant="primary" size="lg" onClick={onComplete} className="w-full">
            Fechar
          </Button>
        )
      }
    >
      {!isSuccess ? (
        <div className="space-y-6">
          <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setStatus('Agendado')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${status === 'Agendado' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_10px_rgba(197,152,104,0.1)]' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <CalendarDays size={16} /> A Pagar
            </button>
            <button
              onClick={() => setStatus('Efetivado')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${status === 'Efetivado' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Check size={16} /> Já Pago
            </button>
          </div>

          <section className="space-y-5 bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/50">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Descrição da Despesa</label>
              <Input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Fornecedor Caixas, Conta de Luz..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Valor (R$)</label>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="text-red-400 font-mono text-lg" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">{status === 'Agendado' ? 'Vencimento' : 'Data do Pgto'}</label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-800/50">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Categoria</label>
                <Select value={category} onChange={e => setCategory(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Método de Pgto</label>
                <div className="relative">
                  <Select icon={<CreditCard size={14} />} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                    <option value="">(A definir)</option>
                    <option value="PIX">PIX</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Cartão">Cartão</option>
                  </Select>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center p-8 text-center"
        >
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${status === 'Efetivado' ? 'bg-emerald-500/10 text-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.2)]' : 'bg-amber-500/10 text-amber-500 shadow-[0_0_40px_rgba(197,152,104,0.2)]'}`}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
              {status === 'Efetivado' ? <Check size={48} strokeWidth={1.5} /> : <CalendarDays size={48} strokeWidth={1.5} />}
            </motion.div>
          </div>
          <h3 className="text-2xl font-heading font-semibold text-zinc-100 mb-2">Despesa Salva</h3>
          <p className="text-zinc-400 max-w-sm">
            O lançamento foi registrado com sucesso como "{status}".
          </p>
        </motion.div>
      )}
    </Drawer>
  );
}
