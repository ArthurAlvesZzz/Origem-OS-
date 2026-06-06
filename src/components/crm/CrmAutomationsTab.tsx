import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { CrmAutomationRecord } from '../../repositories/interfaces/ICrmRepository';
import { ICrmRepository } from '../../repositories/interfaces/ICrmRepository';
import { Button } from '../ui/Button';

export function CrmAutomationsTab({ crmRepo }: { crmRepo: ICrmRepository }) {
     const [automations, setAutomations] = useState<CrmAutomationRecord[]>([]);
     const [newAutoName, setNewAutoName] = useState('');

     const loadData = async () => {
         const a = await crmRepo.getAutomations();
         setAutomations(a);
     };

     useEffect(() => { loadData(); }, [crmRepo]);

     const handleCreateAutomation = async () => {
         if (!newAutoName) return;
         try {
             await crmRepo.createAutomation({ name: newAutoName, trigger: 'custom_event', actionsJson: '[]', active: true });
             setNewAutoName('');
             loadData();
         } catch(e) {}
     };

     return (
         <div className="space-y-6">
             <div className="bg-[#100C08] border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
                 <input 
                     className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 flex-1 focus:border-[#C59868] outline-none transition-colors" 
                     placeholder="Nome do novo fluxo (ex: Welcome Assinantes)..." 
                     value={newAutoName}
                     onChange={e => setNewAutoName(e.target.value)}
                 />
                 <Button onClick={handleCreateAutomation} className="bg-[#C59868] hover:bg-[#b08558] text-[#100C08] px-6 font-bold uppercase tracking-widest text-[10px]">
                     Criar Fluxo
                 </Button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {automations.map(a => (
                     <div key={a.id} className="bg-[#100C08] border border-zinc-800 rounded-xl p-6 shadow-sm">
                         <div className="flex justify-between items-start mb-4">
                             <h3 className="font-heading font-medium text-zinc-100 pr-4 leading-tight">{a.name}</h3>
                             <div className="w-8 h-4 bg-[#528F65]/20 rounded-full flex items-center px-0.5 justify-end shrink-0"><div className="w-3 h-3 bg-[#528F65] rounded-full shadow-sm"></div></div>
                         </div>
                         <div className="bg-zinc-950 px-3 py-2 rounded border border-zinc-800/50 mb-4 inline-block">
                             <div className="text-[9px] text-[#C59868] font-bold uppercase tracking-widest flex items-center gap-2 font-mono">
                                 <Zap size={10} /> Gatilho: {a.trigger}
                             </div>
                         </div>
                         
                         <p className="text-xs text-zinc-500 mb-6 text-balance h-8 leading-relaxed">Quando o evento alvo ocorrer, o sistema executará as ações de forma invisível.</p>
                         
                         <div className="flex justify-start gap-2 border-t border-zinc-800/50 pt-4">
                             <button disabled title="Disponível com integração API" className="px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-lg transition-colors w-full cursor-not-allowed">Detalhes & Ações</button>
                         </div>
                     </div>
                 ))}
             </div>
             {automations.length === 0 && <div className="text-center text-zinc-500 py-12 text-sm">Nenhum fluxo automático cadastrado</div>}
         </div>
     );
}
