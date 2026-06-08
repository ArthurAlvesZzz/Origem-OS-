import { formatBRL } from '../lib/format';
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Mail, Phone, MapPin, Briefcase, FileText, Download } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { useRepositories } from '../repositories/RepositoryProvider';
import { Customer } from '../domain/types';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Skeleton } from '../components/ui/Skeleton';
import { Drawer } from '../components/ui/Drawer';
import { useToast } from '../components/ui/Toast';
import { Pagination } from '../components/ui/Pagination';
import { exportToCSV } from '../lib/export';

export function Clientes() {
  const { customerRepo } = useRepositories();
  const { error } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // drawer
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();

  useEffect(() => {
    loadCustomers();
  }, [customerRepo]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await customerRepo.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error(err);
      error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter(c => {
    const term = searchTerm.toLowerCase();
    const matchTerm = c.name.toLowerCase().includes(term) || 
                      (c.email && c.email.toLowerCase().includes(term)) || 
                      (c.document && c.document.toLowerCase().includes(term));
    const matchType = filterType === 'todos' || c.type === filterType || (filterType === 'bloqueados' && c.status === 'blocked');
    return matchTerm && matchType;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col animate-in fade-in duration-500">
      <PageHeader
        title="Clientes & Parceiros" breadcrumbs={[{label: "Dashboard", href: "#/"}, {label: "Clientes & Parceiros"}]}
        description="Gerencie sua rede de contatos B2B, B2C e distribuidores."
        action={
          <Button 
            onClick={() => { setSelectedCustomer(undefined); setDrawerOpen(true); }}
            className="flex items-center gap-2"
          >
            <Plus size={16} /> Novo Contato
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
         <div className="flex-1">
           <Input 
             icon={<Search size={18} className="text-zinc-500" />}
             placeholder="Buscar por nome, e-mail ou documento..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
         </div>
         <div className="sm:w-64">
           <Select 
             value={filterType}
             onChange={(e) => setFilterType(e.target.value)}
           >
             <option value="todos">Todos os Contatos (Ativos)</option>
             <option value="b2c">Clientes Final (B2C)</option>
             <option value="b2b">Clientes Atacado (B2B)</option>
             <option value="partner">Parceiros (Consignação)</option>
             <option value="supplier">Fornecedores</option>
             <option value="bloqueados">Bloqueados / Inativos</option>
           </Select>
         </div>
         <Button variant="outline" className="gap-2 sm:w-auto w-full justify-center" onClick={() => exportToCSV(filtered, 'clientes', [
          { key: 'name', label: 'Nome' },
          { key: 'email', label: 'E-mail' },
          { key: 'phone', label: 'Telefone' },
          { key: 'document', label: 'Documento' }
         ])}>
          <Download size={16} className="text-zinc-500" /> Exportar CSV
         </Button>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardContent className="p-0 flex-1 flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col p-6 space-y-4">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg bg-zinc-900/50" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg bg-zinc-900/50" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex-1 p-8 flex items-center justify-center">
              <EmptyState
                icon={<Briefcase size={32} className="text-zinc-600" />}
                title="Nenhum contato encontrado"
                description="Não há contatos cadastrados para o filtro selecionado no momento."
              />
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800/80">
                  <tr>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Nome / Documento</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Tipo de Vínculo</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Canais de Contato</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Localidade</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Status Operacional</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {paginated.map(customer => (
                    <tr 
                      key={customer.id} 
                      onClick={() => { setSelectedCustomer(customer); setDrawerOpen(true); }}
                      className="hover:bg-zinc-900 cursor-pointer transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-zinc-100 group-hover:text-amber-400 transition-colors">{customer.name}</div>
                        {(customer.document || customer.legalName) && (
                          <div className="text-xs font-mono text-zinc-500 mt-1 flex items-center gap-1.5">
                            {customer.document} {customer.legalName ? `· ${customer.legalName}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded inline-flex text-[10px] font-bold uppercase tracking-wider border ${
                          customer.type === 'partner' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                          customer.type === 'b2b' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          customer.type === 'b2c' ? 'bg-zinc-900 text-zinc-400 border-zinc-700' :
                          'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        }`}>
                          {customer.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col gap-1.5">
                           {customer.email && (
                             <div className="flex items-center gap-2 text-zinc-400 text-xs"><Mail size={12} className="text-zinc-500"/> {customer.email}</div>
                           )}
                           {customer.phone && (
                             <div className="flex items-center gap-2 text-zinc-400 text-xs"><Phone size={12} className="text-zinc-500"/> {customer.phone}</div>
                           )}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-400 text-xs">
                        {customer.city && customer.state ? (
                          <div className="flex items-center gap-1.5"><MapPin size={12} className="text-zinc-500"/> {customer.city}, {customer.state}</div>
                        ) : 'Não informado'}
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${
                             customer.status === 'blocked' ? 'bg-red-500' :
                             customer.status === 'inactive' ? 'bg-zinc-600' :
                             'bg-emerald-500'
                           }`} />
                           <span className="text-xs font-medium text-zinc-300">
                             {customer.status === 'blocked' ? 'Bloqueado' : customer.status === 'inactive' ? 'Inativo' : 'Ativo'}
                           </span>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        {filtered.length > 0 && !loading && (
           <Pagination 
             currentPage={currentPage}
             totalPages={totalPages}
             onPageChange={setCurrentPage}
             itemsPerPage={itemsPerPage}
             totalItems={filtered.length}
           />
        )}
      </Card>

      {isDrawerOpen && (
        <CustomerDrawer 
          customer={selectedCustomer} 
          onClose={() => setDrawerOpen(false)} 
          onSave={() => { setDrawerOpen(false); loadCustomers(); }} 
        />
      )}
    </div>
  );
}

function CustomerDrawer({ customer, onClose, onSave }: { customer?: Customer, onClose: () => void, onSave: () => void }) {
  const { customerRepo } = useRepositories();
  const { error: toastError, success } = useToast();
  const [saving, setSaving] = useState(false);
  
  // Basic states
  const [name, setName] = useState(customer?.name || '');
  const [legalName, setLegalName] = useState(customer?.legalName || '');
  const [documentType, setDocumentType] = useState(customer?.documentType || 'none');
  const [documentVal, setDocumentVal] = useState(customer?.document || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [type, setType] = useState(customer?.type || 'b2c');
  const [status, setStatus] = useState(customer?.status || 'active');
  const [defaultPaymentTermsDays, setDefaultPaymentTermsDays] = useState(customer?.defaultPaymentTermsDays || 0);

  // Phase 8A fields
  const [loyaltyLevel, setLoyaltyLevel] = useState(customer?.loyaltyLevel || '');
  const [loyaltyPoints, setLoyaltyPoints] = useState(customer?.loyaltyPoints || 0);
  const [favoriteProducts, setFavoriteProducts] = useState(customer?.favoriteProducts || '');
  const [dietaryRestrictions, setDietaryRestrictions] = useState(customer?.dietaryRestrictions || '');
  const [npsScore, setNpsScore] = useState<number | ''>(customer?.npsScore ?? '');

  const [balance, setBalance] = useState<{openReceivables: number, consignmentBalance: number, totalExposure: number} | null>(null);

  useEffect(() => {
    if (customer?.id) {
      customerRepo.getCustomerBalance(customer.id).then(setBalance).catch(console.error);
    }
  }, [customer?.id]);

  const handleSubmit = async () => {
    if (!name) { toastError('Nome é obrigatório'); return; }
    setSaving(true);
    try {
      const payload = {
        name, legalName, documentType, document: documentVal, email, phone, type, status, defaultPaymentTermsDays,
        loyaltyLevel, loyaltyPoints, favoriteProducts, dietaryRestrictions, npsScore: npsScore === '' ? undefined : Number(npsScore)
      };
      if (customer) {
        await customerRepo.updateCustomer(customer.id, payload);
      } else {
        await customerRepo.createCustomer(payload as any);
      }
      onSave();
    } catch (err: any) {
      toastError(err.message || 'Erro ao salvar cliente');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title={customer ? 'Editar Contato' : 'Cadastrar Novo Parceiro'}
      icon={<Briefcase size={20} />}
      subtitle={customer ? `ID Referência: ${customer.id}` : 'Preencha os dados cadastrais na ficha abaixo'}
      size="md"
      footer={
        <div className="flex w-full gap-3">
          <Button variant="outline" size="lg" onClick={onClose} className="flex-1 text-[15px]"> Cancelar </Button>
          <Button size="lg" variant="conclusive" onClick={handleSubmit} disabled={saving} isLoading={saving} className="flex-1 text-[15px]"> Salvar Ficha do Contato </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Balance/Exposure card if editing */}
        {customer && balance && (
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-5 flex gap-6 mt-2 mb-2">
            <div>
               <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1.5 flex items-center gap-1.5"><Briefcase size={12}/> A Receber Aberto</div>
               <div className="text-xl font-heading font-semibold text-emerald-500 tracking-tight">{formatBRL(balance.openReceivables)}</div>
            </div>
            <div className="w-px bg-zinc-800/80" />
            <div>
               <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1.5 flex items-center gap-1.5"><FileText size={12}/> Consignado em Ponto</div>
               <div className="text-xl font-heading font-semibold text-indigo-400 tracking-tight">{formatBRL(balance.consignmentBalance)}</div>
            </div>
            <div className="w-px bg-zinc-800/80" />
            <div>
               <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1.5 ">Exposição Total</div>
               <div className="text-xl font-heading font-semibold text-zinc-100 tracking-tight">{formatBRL(balance.totalExposure)}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Nome Completo / Nome Fantasia *</label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Razão Social (Se PJ)</label>
            <Input value={legalName} onChange={e => setLegalName(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Categoria de Vínculo</label>
            <Select value={type} onChange={e => setType(e.target.value)}>
              <option value="b2c">Cliente Final (B2C)</option>
              <option value="b2b">Cliente Atacado (B2B)</option>
              <option value="partner">Parceiro (Consignação)</option>
              <option value="supplier">Fornecedor</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Status Operacional</label>
            <Select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="active">Ativo (Liberado)</option>
              <option value="inactive">Inativo / Pausado</option>
              <option value="blocked">Bloqueado</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Tipo de Documento Oficial</label>
            <Select value={documentType} onChange={e => setDocumentType(e.target.value)}>
              <option value="none">Isento / Nenhum</option>
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Número Documento</label>
            <Input value={documentVal} onChange={e => setDocumentVal(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">E-mail de Faturamento</label>
            <Input value={email} onChange={e => setEmail(e.target.value)} type="email"/>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Telefone Comercial / WhatsApp</label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} />
          </div>

          <div className="col-span-2">
             <div className="bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-xl mt-2">
               <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Condição Prazo Padrão Pgmto (Em Dias)</label>
               <Input type="number" value={defaultPaymentTermsDays} onChange={e => setDefaultPaymentTermsDays(Number(e.target.value))} />
               <p className="text-xs text-zinc-500 mt-2">Este prazo será assumido em novos orçamentos ou consignações atreladas a este fornecedor/cliente.</p>
             </div>
          </div>

          <div className="col-span-2 mt-6 pt-6 border-t border-zinc-800/80">
            <h3 className="text-sm font-semibold font-heading text-zinc-100 mb-5 flex items-center gap-2">
              <FileText size={16} className="text-amber-500" /> Profiling & CRM Enrichment
            </h3>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Nível de Fidelidade (Tier)</label>
                <Select value={loyaltyLevel} onChange={e => setLoyaltyLevel(e.target.value)}>
                  <option value="">Status Não Atribuído</option>
                  <option value="Bronze">Nível Bronze</option>
                  <option value="Prata">Nível Prata</option>
                  <option value="Ouro">Nível Ouro</option>
                  <option value="Black">Nível Black Exclusivo</option>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Score (Pontos Retidos)</label>
                <Input type="number" value={loyaltyPoints} onChange={e => setLoyaltyPoints(Number(e.target.value))} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Itens e Preferências de Compra Frequentes</label>
                <Input value={favoriteProducts} onChange={e => setFavoriteProducts(e.target.value)} placeholder="Ex: Bolo de Cenoura, Cappuccino Duplo..." />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Restrições Alimentares / Observações Críticas</label>
                <Input value={dietaryRestrictions} onChange={e => setDietaryRestrictions(e.target.value)} placeholder="Ex: Intolerância Severa a Lactose, Celíaco..." />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Nota Histórica NPS (0-10)</label>
                <Input type="number" min="0" max="10" value={npsScore} onChange={e => setNpsScore(e.target.value as any)} placeholder="Ex: 9 - Cliente Promotor" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
