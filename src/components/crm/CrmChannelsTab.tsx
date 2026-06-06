import React, { useState, useEffect } from 'react';
import { Users, QrCode } from 'lucide-react';
import QRCode from 'react-qr-code';
import { CrmChannelConnectionRecord } from '../../repositories/interfaces/ICrmRepository';
import { ICrmRepository } from '../../repositories/interfaces/ICrmRepository';

export function CrmChannelsTab({ crmRepo }: { crmRepo: ICrmRepository }) {
     const [channels, setChannels] = useState<CrmChannelConnectionRecord[]>([]);

     useEffect(() => {
         crmRepo.getChannelConnections().then(setChannels);
     }, [crmRepo]);

     return (
         <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {channels.map(ch => (
                     <div key={ch.id} className="bg-[#100C08] border border-zinc-800 rounded-xl p-6">
                         <div className="flex items-center gap-4 mb-6">
                             <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                 <Users size={20} className="text-[#C59868]" />
                             </div>
                             <div>
                                 <h3 className="font-medium text-zinc-100">{ch.provider}</h3>
                                 <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-sm ${ch.status === 'connected' ? 'bg-[#528F65]/10 text-[#528F65]' : 'bg-[#AF4D4D]/10 text-[#AF4D4D]'}`}>{ch.status}</span>
                             </div>
                         </div>
                         <p className="text-xs text-zinc-500 mb-6 h-8 text-balance">Módulo conector oficial para disparo e atendimento omnichannel.</p>
                         <button className="w-full py-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-bold tracking-widest uppercase text-[10px] rounded-lg transition-colors">Configurar credenciais</button>
                     </div>
                 ))}
             </div>

             <div className="mt-8 pt-8 border-t border-zinc-800">
                 <h3 className="font-heading font-medium text-zinc-100 mb-6 flex items-center gap-2">
                     <QrCode size={18} className="text-[#C59868]" /> Acessos & QR Codes Inteligentes
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     {/* WhatsApp Portal */}
                     <div className="bg-[#100C08] border border-zinc-800 rounded-xl p-6 flex flex-col items-center text-center">
                         <div className="bg-white p-4 rounded-xl mb-6 shadow-sm">
                             <QRCode value="https://wa.me/5511999999999?text=Ol%C3%A1%21%20Gostaria%20de%20atendimento." size={120} />
                         </div>
                         <h4 className="text-zinc-100 font-medium mb-2">WhatsApp Fale Conosco</h4>
                         <p className="text-xs text-zinc-500 text-balance mb-6 h-12">Escaneie para iniciar uma conversa rastreada via WhatsApp.</p>
                         <button className="text-[10px] uppercase font-bold tracking-widest text-[#C59868] hover:text-[#b08558]">Copiar Link Curto</button>
                     </div>

                     {/* Customer Portal */}
                     <div className="bg-[#100C08] border border-zinc-800 rounded-xl p-6 flex flex-col items-center text-center">
                         <div className="bg-white p-4 rounded-xl mb-6 shadow-sm">
                             <QRCode value={`${window.location.origin}/portal/login`} size={120} />
                         </div>
                         <h4 className="text-zinc-100 font-medium mb-2">Portal do Cliente (B2B/B2C)</h4>
                         <p className="text-xs text-zinc-500 text-balance mb-6 h-12">Acesso via OTP (SMS/WhatsApp) para clientes verificarem assinaturas e histórico.</p>
                         <button className="text-[10px] uppercase font-bold tracking-widest text-[#C59868] hover:text-[#b08558]">Copiar Link</button>
                     </div>
                 </div>
             </div>
         </div>
     );
}
