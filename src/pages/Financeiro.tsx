import { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Plus } from 'lucide-react';
import { FinancialSummaryCards } from '../components/finance/FinancialSummaryCards';
import { AccountsReceivableTable } from '../components/finance/AccountsReceivableTable';
import { AccountsPayableTable } from '../components/finance/AccountsPayableTable';
import { SimpleDRE } from '../components/finance/SimpleDRE';
import { CashFlowPanel } from '../components/finance/CashFlowPanel';
import { ExpenseDrawer } from '../components/finance/ExpenseDrawer';
import { PaymentGatewayPanel } from '../components/finance/PaymentGatewayPanel';
import { useRepositories } from '../repositories/RepositoryProvider';
import { FinancialTransaction } from '../domain/types';
import { Button } from '../components/ui/Button';

export function Financeiro() {
  const [activeTab, setActiveTab] = useState<'Visão Geral' | 'Receber' | 'Pagar' | 'Fluxo de Caixa' | 'DRE' | 'Pagamentos Online'>('Visão Geral');
  const [isExpenseDrawerOpen, setIsExpenseDrawerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { financialRepo } = useRepositories();
  const [receivables, setReceivables] = useState<FinancialTransaction[]>([]);
  const [payables, setPayables] = useState<FinancialTransaction[]>([]);

  useEffect(() => {
    financialRepo.getAccountsReceivable().then(setReceivables);
    financialRepo.getAccountsPayable().then(setPayables);
  }, [financialRepo, refreshKey]);

  const handleMarkPaid = async (id: string) => {
    try {
      await financialRepo.markTransactionAsPaid(id);
      setRefreshKey(prev => prev + 1);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleExpenseComplete = () => {
    setIsExpenseDrawerOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500" key={refreshKey}>
      <PageHeader 
        title="Financeiro" 
        description="Gestão de fluxo de caixa, contas a pagar/receber e DRE simplificada." 
        action={
          <Button 
            onClick={() => setIsExpenseDrawerOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} /> Lançar Despesa
          </Button>
        }
      />

      {/* Modern Horizontal Tabs */}
      <div className="flex bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/80 w-fit mb-6 shadow-sm overflow-x-auto custom-scrollbar">
        {(['Visão Geral', 'Receber', 'Pagar', 'Fluxo de Caixa', 'DRE', 'Pagamentos Online'] as const).map(tab => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                isActive 
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              {tab}
            </button>
          )
        })}
      </div>

      <div className="mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'Visão Geral' && (
          <FinancialSummaryCards refreshKey={refreshKey} />
        )}

        {activeTab === 'Receber' && (
          <AccountsReceivableTable receivables={receivables} onMarkPaid={handleMarkPaid} />
        )}

        {activeTab === 'Pagar' && (
          <AccountsPayableTable payables={payables} onMarkPaid={handleMarkPaid} />
        )}

        {activeTab === 'Fluxo de Caixa' && (
          <CashFlowPanel refreshKey={refreshKey} />
        )}

        {activeTab === 'DRE' && (
          <SimpleDRE refreshKey={refreshKey} />
        )}

        {activeTab === 'Pagamentos Online' && (
          <PaymentGatewayPanel />
        )}
      </div>

      {isExpenseDrawerOpen && (
        <ExpenseDrawer onClose={() => setIsExpenseDrawerOpen(false)} onComplete={handleExpenseComplete} />
      )}
    </div>
  );
}
