import React, { useState, useEffect } from 'react';
import { useRepositories } from '../repositories/RepositoryProvider';
import { FileText, Download, Printer, Filter, XCircle, FileBarChart2 } from 'lucide-react';
import { GeneratedDocument } from '../domain/types';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useConfirm } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';

export function Relatorios() {
  const { reportsRepo, settingsRepo } = useRepositories();
  const { confirm } = useConfirm();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState('vendas');
  const [loading, setLoading] = useState(false);
  
  // Data
  const [salesData, setSalesData] = useState<any>(null);
  const [financeData, setFinanceData] = useState<any>(null);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  
  // Configs
  const [currency, setCurrency] = useState('BRL');

  useEffect(() => {
    settingsRepo.getProfile().then(p => {
      if(p.currency) setCurrency(p.currency);
    }).catch(console.error);
    
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if(activeTab === 'vendas') {
        const res = await reportsRepo.getSalesReports({});
        setSalesData(res);
      } else if (activeTab === 'financeiro') {
        const res = await reportsRepo.getFinanceReports({});
        setFinanceData(res);
      } else if (activeTab === 'documentos') {
        const res = await reportsRepo.getDocuments();
        setDocuments(res);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(val);
  };

  const handleGenerateDoc = async (type: string, title: string, snapshotJson: any) => {
    try {
      const proceed = await confirm({
        title: 'Gerar Documento',
        description: `Gerar documento auxiliar impresso de ${title}?`,
        confirmText: 'Gerar Documento'
      });
      if (proceed) {
        await reportsRepo.generateDocument({
          type,
          title,
          snapshotJson
        });
        success('Documento gerado. Você pode visualizá-lo na aba Documentos.');
      }
    } catch(err) {
      error('Erro ao gerar documento');
    }
  };

  const handleVoidDoc = async (id: string) => {
    const proceed = await confirm({
      title: 'Cancelar Documento',
      description: 'Cancelar este documento? Ele ficará marcado como inválido.',
      confirmText: 'Sim, Cancelar',
      isDestructive: true
    });
    if(!proceed) return;
    try {
      await reportsRepo.voidDocument(id);
      success('Documento cancelado com sucesso.');
      loadData();
    } catch(err: any) {
      error(err.message);
    }
  };

  const handleExportCSV = () => {
    // Generate simple CSV logic
    const csvData = "ID,TIPO,DATA,STATUS\n" + documents.map(d => `${d.id},${d.type},${d.createdAt || d.generatedAt},${d.status}`).join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export_contador.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintDoc = (doc: GeneratedDocument) => {
    // A simple trick to print specific content: Open a window or just use the print media query
    // But since this is a single page app, we will toggle a state to show ONLY the document,
    // trigger print, then restore. The easiest in React without complex state is just to 
    // rely on CSS classes for print, like 'print-only' and hiding the rest.
    // Let's create a visual printable wrapper.
    setPrintingDoc(doc);
    setTimeout(() => {
      window.print();
      setPrintingDoc(null);
    }, 100);
  };

  const [printingDoc, setPrintingDoc] = useState<GeneratedDocument | null>(null);

  if (printingDoc) {
    return (
      <div className="bg-white text-black p-8 max-w-4xl mx-auto min-h-screen">
        <div className="border-b-2 border-black pb-4 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wider">COFCOF.CO</h1>
            <p className="text-sm text-gray-500">Documento Auxiliar Sem Valor Fiscal</p>
          </div>
          <div className="text-right text-sm">
            <p><strong>Nº Doc:</strong> #{printingDoc.sequenceNumber.toString().padStart(6, '0')}</p>
            <p><strong>Emissão:</strong> {new Date(printingDoc.createdAt || printingDoc.generatedAt).toLocaleString()}</p>
            <p className="text-red-600 font-bold mt-1">{printingDoc.status === 'voided' ? 'CANCELADO' : ''}</p>
          </div>
        </div>
        
        <h2 className="text-xl font-bold mb-6 text-center underline">{printingDoc.title}</h2>
        
        <div className="mb-8">
           <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 border border-gray-200">
             {JSON.stringify(printingDoc.snapshotJson, null, 2)}
           </pre>
        </div>
        
        <div className="mt-16 pt-8 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>Este documento não substitui a emissão de nota fiscal obrigatória.</p>
          <p>Emitido por COFCOF.CO - Sistema de Gestão Interno.</p>
        </div>
      </div>
    );
  }

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(documents, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "export_contador.json");
    dlAnchorElem.click();
  };

  const renderTabs = () => {
    const tabs = [
      { id: 'vendas', label: 'Vendas' },
      { id: 'financeiro', label: 'Financeiro' },
      { id: 'estoque', label: 'Estoque' },
      { id: 'producao', label: 'Produção' },
      { id: 'consignacao', label: 'Consignação' },
      { id: 'documentos', label: 'Documentos' }
    ];
    return (
      <div className="flex bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/80 w-fit mb-6 shadow-sm overflow-x-auto custom-scrollbar">
        {tabs.map(t => (
          <button 
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === t.id ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col no-print animate-in fade-in duration-500">
      <PageHeader
        title="Central de Relatórios"
        description="Geração de documentos, extratos e relatórios pormenorizados."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV} className="flex items-center gap-2 text-xs">
              <Download size={14} /> CSV Contador
            </Button>
            <Button variant="outline" onClick={handleExportJSON} className="flex items-center gap-2 text-xs">
              <FileText size={14} /> JSON Dados
            </Button>
          </div>
        }
      />

      {renderTabs()}

      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardContent className="p-6 flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 h-64">
             <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mb-4" />
             Carregando dados...
          </div>
        ) : (
          <>
            {activeTab === 'vendas' && salesData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <Card className="bg-zinc-900/40">
                     <CardContent className="p-6 text-center">
                       <p className="text-xs uppercase tracking-wider font-semibold text-zinc-500 mb-1">Total Vendido</p>
                       <p className="text-2xl font-semibold font-heading text-zinc-100">{formatCurrency(salesData.totalSales)}</p>
                     </CardContent>
                   </Card>
                   <Card className="bg-zinc-900/40">
                     <CardContent className="p-6 text-center">
                       <p className="text-xs uppercase tracking-wider font-semibold text-zinc-500 mb-1">Descontos</p>
                       <p className="text-2xl font-semibold font-heading text-amber-500">{formatCurrency(salesData.totalDiscount)}</p>
                     </CardContent>
                   </Card>
                   <Card className="bg-zinc-900/40">
                     <CardContent className="p-6 text-center">
                       <p className="text-xs uppercase tracking-wider font-semibold text-zinc-500 mb-1">Ticket Médio</p>
                       <p className="text-2xl font-semibold font-heading text-emerald-400">{formatCurrency(salesData.ticketMedio)}</p>
                     </CardContent>
                   </Card>
                </div>
                <div className="flex justify-end border-t border-zinc-800/80 mt-6 pt-6">
                   <Button onClick={() => handleGenerateDoc('report', 'Relatório de Vendas', salesData)} className="flex items-center gap-2">
                     <FileText size={16} /> Salvar Snapshot Mensal
                   </Button>
                </div>
              </div>
            )}
            
            {activeTab === 'financeiro' && financeData && (
               <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <Card className="bg-zinc-900/40">
                     <CardContent className="p-6 text-center">
                       <p className="text-xs uppercase tracking-wider font-semibold text-zinc-500 mb-1">Receitas Consolidadas</p>
                       <p className="text-2xl font-semibold font-heading text-emerald-500">{formatCurrency(financeData.receitas)}</p>
                     </CardContent>
                   </Card>
                   <Card className="bg-zinc-900/40">
                     <CardContent className="p-6 text-center">
                       <p className="text-xs uppercase tracking-wider font-semibold text-zinc-500 mb-1">Despesas Operacionais</p>
                       <p className="text-2xl font-semibold font-heading text-red-500">{formatCurrency(financeData.despesas)}</p>
                     </CardContent>
                   </Card>
                   <Card className="bg-zinc-900/40">
                     <CardContent className="p-6 text-center">
                       <p className="text-xs uppercase tracking-wider font-semibold text-zinc-500 mb-1">Saldo Líquido (DRE)</p>
                       <p className="text-2xl font-semibold font-heading text-zinc-100">{formatCurrency(financeData.saldo)}</p>
                     </CardContent>
                   </Card>
                </div>
                <div className="flex justify-end border-t border-zinc-800/80 mt-6 pt-6">
                   <Button onClick={() => handleGenerateDoc('report', 'Extrato Financeiro e DRE', financeData)} className="flex items-center gap-2">
                     <FileText size={16} /> Salvar Snapshot Contábil
                   </Button>
                </div>
               </div>
            )}

            {activeTab === 'documentos' && (
              <div className="space-y-6">
                <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-xl text-amber-500 flex items-start gap-3">
                   <FileText size={20} className="shrink-0 mt-0.5" />
                   <div className="text-xs font-medium">
                     <strong className="block mb-1 text-sm">Aviso Legal Importante:</strong>
                     Todos os documentos gerados aqui são "Documentos Auxiliares Sem Valor Fiscal". Eles não substituem as exigências formais de NFe/NFCe ou os relatórios contábeis oficiais gerados pelo seu contador. Apenas servem para arquivamento do gestor.
                   </div>
                </div>

                <div className="overflow-x-auto border border-zinc-800/80 rounded-xl">
                   <table className="w-full text-left bg-zinc-950/30">
                      <thead>
                        <tr className="border-b border-zinc-800/80 text-zinc-500 text-[10px] uppercase tracking-wider font-bold bg-zinc-900/50">
                          <th className="py-4 px-6">Núm. Doc</th>
                          <th className="py-4 px-6">Data Geração</th>
                          <th className="py-4 px-6">Referência</th>
                          <th className="py-4 px-6">Validade</th>
                          <th className="py-4 px-6 text-right">Opções</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-zinc-800/50">
                        {documents.map(doc => (
                          <tr key={doc.id} className="hover:bg-zinc-900/50 group transition-colors">
                             <td className="py-4 px-6 font-mono text-xs text-zinc-400">#{String(doc.sequenceNumber).padStart(6,'0')}</td>
                             <td className="py-4 px-6 text-zinc-300 text-xs">{new Date(doc.createdAt || doc.generatedAt).toLocaleString()}</td>
                             <td className="py-4 px-6 font-medium text-zinc-100">{doc.title}</td>
                             <td className="py-4 px-6">
                               <span className={`px-2 py-0.5 text-[10px] rounded uppercase tracking-wider font-bold border ${doc.status === 'voided' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                 {doc.status === 'voided' ? 'Invalido' : 'Regular'}
                               </span>
                             </td>
                             <td className="py-4 px-6 text-right">
                                <div className="flex items-center justify-end gap-3">
                                  {doc.status === 'active' && (
                                     <button title="Cancelar" onClick={() => handleVoidDoc(doc.id)} className="text-zinc-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                                       <XCircle size={16} />
                                     </button>
                                  )}
                                  <button title="Imprimir Recibo" onClick={() => handlePrintDoc(doc)} className="text-zinc-500 hover:text-zinc-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                                     <Printer size={16} />
                                  </button>
                                </div>
                             </td>
                          </tr>
                        ))}
                        {documents.length === 0 && (
                          <tr><td colSpan={5} className="py-12 text-center">
                            <EmptyState icon={<FileBarChart2 size={32} className="text-zinc-600"/>} title="Nenhum Documento Gerado" description="Você pode gerar reports isolados em Vendas ou Financeiro para salvar snapshots nesta grid." />
                            </td></tr>
                        )}
                      </tbody>
                   </table>
                </div>
              </div>
            )}
            
            {['estoque', 'producao', 'consignacao'].includes(activeTab) && (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                 <EmptyState icon={<Filter size={32} className="text-zinc-600"/>} title="Dados Consolidados" description="Resumo gerencial sob medida para explorar histórico e análises desta área. (Visão completa em breve)" />
                 <Button variant="outline" className="mt-6">Exportar Bruto (CSV)</Button>
              </div>
            )}

          </>
        )}
        </CardContent>
      </Card>
    </div>
  );
}
