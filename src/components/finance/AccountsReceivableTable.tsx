import { formatBRL } from '../../lib/format';
import { CheckCircle2, ArrowDownRight } from 'lucide-react';
import { FinancialTransaction } from '../../domain/types';
import { Card, CardContent } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';

interface AccountsReceivableTableProps {
  receivables: FinancialTransaction[];
  onMarkPaid: (id: string) => void;
}

export function AccountsReceivableTable({ receivables, onMarkPaid }: AccountsReceivableTableProps) {
  return (
    <Card className="mt-6 border-zinc-800/80">
      <CardContent className="p-0">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="text-xs uppercase tracking-wider bg-zinc-950/50 text-zinc-500 border-b border-zinc-800/80">
              <tr>
                <th className="px-6 py-4 font-semibold">Vencimento</th>
                <th className="px-6 py-4 font-semibold">Descrição</th>
                <th className="px-6 py-4 font-semibold">Categoria</th>
                <th className="px-6 py-4 font-semibold text-right">Valor</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {receivables.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-900/50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-zinc-100">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 text-zinc-300 group-hover:text-amber-500 transition-colors">{t.description}</td>
                  <td className="px-6 py-4"><span className="text-[10px] font-semibold tracking-wider text-zinc-400 bg-zinc-800/50 uppercase px-2.5 py-1 rounded-sm">{t.category}</span></td>
                  <td className="px-6 py-4 text-right font-medium font-mono text-emerald-500">{formatBRL(t.amount)}</td>
                  <td className="px-6 py-4">
                     <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${
                        t.status === 'Atrasado' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {t.status}
                      </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      onClick={() => onMarkPaid(t.id)}
                      variant="ghost"
                      size="sm"
                      className="ml-auto text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                      title="Dar Baixa (Receber)"
                    >
                      <CheckCircle2 size={16} className="mr-1.5" /> Baixar
                    </Button>
                  </td>
                </tr>
              ))}
              {receivables.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12">
                    <EmptyState 
                      icon={<ArrowDownRight size={24} />}
                      title="Nenhuma conta a receber pendente"
                      description="Todos os valores a receber de clientes e parceiros já foram quitados ou não há registros no período."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
