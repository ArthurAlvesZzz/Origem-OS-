import { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { useRepositories } from '../repositories/RepositoryProvider';
import { TeamMember, Role, Permission, Invitation, AuditLog } from '../repositories/interfaces/ITeamRepository';
import { Users, UserPlus, Shield, Activity, Fingerprint, Search, Edit2, Lock, ListFilter, MapPin, Mail, Loader2, Ban, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { useConfirm } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';

type Tab = 'members' | 'invitations' | 'roles' | 'permissions' | 'audit';

export function Equipe() {
  const { teamRepo, actualType } = useRepositories();
  const { confirm } = useConfirm();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('members');
  const [isLoading, setIsLoading] = useState(true);

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'members') {
        const res = await teamRepo.getMembers();
        setMembers(res);
      } else if (activeTab === 'roles') {
        const res = await teamRepo.getRoles();
        setRoles(res);
      } else if (activeTab === 'permissions') {
        const res = await teamRepo.getPermissions();
        setPermissions(res);
      } else if (activeTab === 'audit') {
        const res = await teamRepo.getAuditLogs();
        setAuditLogs(res);
      }
    } catch (e) {
      console.warn("Falha ao buscar equipe: ", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (member: TeamMember) => {
    try {
      if (member.status === 'active') {
        const proceed = await confirm({
          title: 'Suspender Usuário',
          description: 'Deseja realmente suspender este usuário? Ele perderá o acesso ao sistema.',
          confirmText: 'Sim, Suspender',
          isDestructive: true
        });
        if (!proceed) return;
        await teamRepo.suspendMember(member.id);
        success('Usuário suspenso com sucesso.');
      } else {
        await teamRepo.reactivateMember(member.id);
        success('Usuário reativado com sucesso.');
      }
      fetchData();
    } catch (e: any) {
      error(e.message || 'Erro ao alterar status');
    }
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'members', label: 'Membros', icon: Users },
    { id: 'invitations', label: 'Convites', icon: Mail },
    { id: 'roles', label: 'Papéis (Roles)', icon: Shield },
    { id: 'permissions', label: 'Permissões', icon: Lock },
    { id: 'audit', label: 'Auditoria', icon: Fingerprint },
  ];

  const getStatusColor = (status: string) => {
    if (status === 'active') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (status === 'suspended') return 'bg-red-500/10 text-red-500 border-red-500/20';
    if (status === 'invited') return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
  };

  const renderMembers = () => (
    <Card className="overflow-hidden">
      <div className="p-5 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-900/50">
        <h3 className="font-heading font-semibold text-zinc-50 flex items-center gap-2">
          <Users size={18} className="text-amber-500" /> Equipe Ativa
        </h3>
        <Button className="flex items-center gap-2 text-xs h-9">
          <UserPlus size={16} /> Novo Membro
        </Button>
      </div>
      <CardContent className="p-0">
      {isLoading ? (
        <div className="p-6 flex flex-col gap-4">
           <Skeleton className="h-12 w-full rounded-lg" />
           <Skeleton className="h-12 w-full rounded-lg bg-zinc-900/50" />
           <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/80 text-zinc-500 text-[10px] font-bold uppercase tracking-wider bg-zinc-950/30">
                <th className="p-5">Usuário</th>
                <th className="p-5">Contato</th>
                <th className="p-5">Papel</th>
                <th className="p-5">Status / Último Acesso</th>
                <th className="p-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-sm">
              {members.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-0">
                    <div className="py-16 flex items-center justify-center">
                    <EmptyState
                      icon={<Users size={32} className="text-zinc-600"/>}
                      title="Nenhum membro encontrado"
                      description="A sua equipe adicionada aparecerá aqui."
                    />
                    </div>
                  </td>
                </tr>
              )}
              {members.map(m => (
                <tr key={m.id} className="hover:bg-zinc-900/50 transition-colors group">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-bold uppercase shrink-0 border border-zinc-700/50">
                        {m.name.slice(0,2)}
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-100">{m.name}</div>
                        <div className="text-[11px] text-zinc-500 uppercase tracking-wide mt-0.5">Membro desde {new Date(m.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="text-sm font-medium text-zinc-300">{m.email}</div>
                    {m.phone && <div className="text-xs text-zinc-500 font-mono mt-0.5">{m.phone}</div>}
                  </td>
                  <td className="p-5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 bg-zinc-800/80 px-2.5 py-1 rounded-full inline-block border border-zinc-700/50">
                       {m.roleName || 'Sem Papel'}
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-1.5 items-start">
                       <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${getStatusColor(m.status)}`}>
                         {m.status}
                       </span>
                       <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                         {m.lastLoginAt ? `Log: ${new Date(m.lastLoginAt).toLocaleDateString()}` : 'Nunca logou'}
                       </span>
                    </div>
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-amber-500" title="Editar Permissões">
                        <Shield size={14} />
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-amber-500" title="Editar Usuário">
                        <Edit2 size={14} />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleStatusChange(m)} className={`h-8 w-8 p-0 ${m.status === 'active' ? 'text-zinc-400 hover:text-red-500 hover:border-red-500/50' : 'text-zinc-400 hover:text-emerald-500 hover:border-emerald-500/50'}`} title={m.status === 'active' ? 'Suspender' : 'Reativar'}>
                        {m.status === 'active' ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </CardContent>
    </Card>
  );

  const renderRoles = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="col-span-1">
        <h3 className="font-heading font-semibold text-lg text-zinc-50 mb-4 flex items-center justify-between">
          Papéis (Roles)
          <Button variant="outline" size="sm" className="h-8 text-xs text-amber-500 hover:text-amber-400 border-amber-500/20 hover:bg-amber-500/10">
            <UserPlus size={14} className="mr-1.5"/> Novo Papel
          </Button>
        </h3>
        <div className="space-y-3">
           {roles.map(r => (
             <Card key={r.id} className="cursor-pointer hover:border-amber-500/50 transition-colors group">
               <CardContent className="p-4">
                 <div className="text-sm font-semibold text-zinc-50 flex items-center gap-2 group-hover:text-amber-400 transition-colors">
                   {r.isSystem && <Shield size={14} className="text-amber-500" />} {r.name}
                 </div>
                 <div className="text-xs text-zinc-500 mt-1.5 line-clamp-2 leading-relaxed">{r.description || 'Sem descrição'}</div>
               </CardContent>
             </Card>
           ))}
        </div>
      </div>
      <div className="col-span-1 md:col-span-2">
        <Card className="h-full flex items-center justify-center bg-zinc-900/30 border-dashed border-zinc-800">
           <CardContent className="p-12 text-center text-zinc-500 flex flex-col items-center gap-4">
             <Shield size={32} className="opacity-20" />
             <p className="text-sm">Selecione um papel para visualizar as permissões detalhadas da matriz.</p>
           </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAudit = () => (
    <Card className="overflow-hidden">
      <CardContent className="p-0 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-800/80 text-zinc-500 text-[10px] font-bold uppercase tracking-wider bg-zinc-950/30">
            <th className="p-5">Data/Hora</th>
            <th className="p-5">Usuário</th>
            <th className="p-5">Ação</th>
            <th className="p-5">IP</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {auditLogs.length === 0 && (
             <tr><td colSpan={4} className="p-12 text-center text-zinc-500">Nenhum log de auditoria encontrado.</td></tr>
          )}
          {auditLogs.map(l => (
            <tr key={l.id} className="hover:bg-zinc-900/50 transition-colors">
              <td className="p-5 text-zinc-400 font-mono text-xs">{new Date(l.createdAt).toLocaleString()}</td>
              <td className="p-5 font-medium text-zinc-300">{l.user?.name || 'Sistema'}</td>
              <td className="p-5">
                 <span className="font-mono text-[10px] font-bold tracking-wider px-2 py-1 bg-zinc-800 rounded uppercase border border-zinc-700/50 text-emerald-400">{l.action}</span>
              </td>
              <td className="p-5 text-zinc-500 font-mono text-xs opacity-50">{l.ipAddress || '---'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'members': return renderMembers();
      case 'roles': return renderRoles();
      case 'audit': return renderAudit();
      default: return (
        <Card className="bg-zinc-900/30 border-dashed border-zinc-800">
          <CardContent className="p-16 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 mb-4">
               <Activity size={24} />
            </div>
            <h3 className="text-zinc-300 font-medium mb-2">Em Construção</h3>
            <p className="text-sm text-zinc-500 max-w-sm">Esta visualização está sendo preparada para a próxima etapa do roadmap.</p>
          </CardContent>
        </Card>
      );
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Gestão de Equipe e Acessos" breadcrumbs={[{label: "Dashboard", href: "#/"}, {label: "Gestão de Equipe e Acessos"}]} 
        description="Controle de usuários, permissões granulares e auditoria do tenant." 
      />

      <div className="flex bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/80 w-fit mb-6 shadow-sm overflow-x-auto custom-scrollbar">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                isActive ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-[400px]">
        {renderContent()}
      </div>

    </div>
  );
}
