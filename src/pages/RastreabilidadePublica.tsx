import React, { useEffect, useState } from 'react';
import { Coffee, MapPin, Activity, CheckCircle2, Award, ChevronRight, QrCode } from 'lucide-react';
import { PublicLotTrace } from '../domain/types';
import { useRepositories } from '../repositories/RepositoryProvider';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

export function RastreabilidadePublica() {
  const { success, error: toastError, info } = useToast();
  const publicCode = window.location.pathname.split('/').pop() || '';
  const [loading, setLoading] = useState(true);
  const [trace, setTrace] = useState<PublicLotTrace | null>(null);
  const [error, setError] = useState('');
  
  const { traceabilityRepo } = useRepositories();

  useEffect(() => {
    if (!publicCode || publicCode === 'lote') {
      setError('Código de lote inválido.');
      setLoading(false);
      return;
    }
    setLoading(true);
    traceabilityRepo.getByPublicCode(publicCode)
      .then(res => {
        if (!res) throw new Error('Não encontrado');
        setTrace(res);
      })
      .catch(err => {
        console.error(err);
        setError('Rastreabilidade não encontrada ou indisponível.');
      })
      .finally(() => setLoading(false));
  }, [publicCode, traceabilityRepo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#100C08] flex flex-col items-center justify-center text-[#C59868]">
         <div className="w-8 h-8 border-2 border-[#C59868] border-t-transparent rounded-full animate-spin mb-4"></div>
         <p className="text-xs tracking-widest uppercase font-bold">Carregando lote...</p>
      </div>
    );
  }

  if (error || !trace) {
    return (
      <div className="min-h-screen bg-[#100C08] flex flex-col items-center justify-center text-zinc-500 p-6 selection:bg-[#C59868]/30">
         <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
           <MapPin size={24} className="text-zinc-600" />
         </div>
         <h1 className="text-xl font-heading text-zinc-100 font-medium mb-2">Lote não encontrado</h1>
         <p className="text-sm text-center max-w-sm mb-8 text-zinc-500">{error}</p>
         <a href="/loja" className="text-xs uppercase tracking-widest font-bold text-[#C59868] hover:text-[#b08558] transition-colors border max-w-xs border-[#C59868]/30 px-6 py-2 rounded-full">Explore a Loja</a>
      </div>
    );
  }

  // Parse JSONs
  let descriptors: string[] = [];
  try { if (trace.publicDescriptorsJson) descriptors = JSON.parse(trace.publicDescriptorsJson); } catch (e) {}

  let origin: any = null;
  try { if (trace.publicOriginJson) origin = JSON.parse(trace.publicOriginJson); } catch (e) {}

  let roast: any = null;
  try { if (trace.roastInfoJson) roast = JSON.parse(trace.roastInfoJson); } catch (e) {}

  const publishedDate = trace.publishedAt ? new Date(trace.publishedAt).toLocaleDateString('pt-BR') : '';

  return (
    <div className="min-h-screen bg-[#100C08] text-zinc-50 font-sans pb-0 selection:bg-[#C59868]/30">
      {/* Editorial Header */}
      <div className="relative pt-12 pb-20 px-6 overflow-hidden border-b border-zinc-900">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#C59868] via-[#100C08] to-[#100C08]"></div>
        <div className="relative max-w-lg mx-auto text-center flex flex-col items-center">
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#528F65]/10 rounded-full border border-[#528F65]/20 text-[10px] font-bold uppercase tracking-widest text-[#528F65] mb-8">
             <CheckCircle2 size={12} strokeWidth={2.5} />
             Lote Aprovado pela Torrefação
           </div>
           
           <h1 className="text-4xl md:text-5xl font-heading font-medium tracking-tight mb-4 text-zinc-50">
             {trace.title}
           </h1>
           
           <div className="flex items-center justify-center gap-4 text-xs font-mono text-zinc-500 mb-8 font-medium">
              <span className="text-[#C59868]">LOTE #{trace.publicCode}</span>
              <span>•</span>
              <span>{publishedDate}</span>
           </div>

           {trace.summary && (
             <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
               {trace.summary}
             </p>
           )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-12 space-y-12">
         {/* Score Section */}
         {trace.publicScore && (
           <div className="flex flex-col items-center">
             <div className="w-28 h-28 rounded-full border border-[#C59868]/30 flex flex-col items-center justify-center bg-gradient-to-b from-[#C59868]/10 to-transparent relative shadow-[0_0_30px_rgba(197,152,104,0.1)]">
                <div className="absolute top-0 -translate-y-1/2 bg-[#100C08] px-2 text-[#C59868]">
                  <Award size={20} />
                </div>
                <span className="text-4xl font-heading font-medium text-[#C59868]">{trace.publicScore}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#C59868]/70 mt-1">SCA Pts</span>
             </div>
           </div>
         )}

         {/* Origins Info */}
         {origin && (
           <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
             <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2 border-b border-zinc-900 pb-2">
               <MapPin size={14} className="text-[#C59868]" /> Origem do Grão
             </h3>
             <div className="grid grid-cols-2 gap-px bg-zinc-800/30 border border-zinc-800/50 rounded-2xl overflow-hidden">
                <div className="bg-zinc-950/80 p-4">
                  <div className="text-[10px] text-zinc-500 uppercase font-medium tracking-wider mb-1">Fazenda/Sítio</div>
                  <div className="text-sm font-medium text-zinc-200">{origin.farm || '-'}</div>
                </div>
                <div className="bg-zinc-950/80 p-4">
                  <div className="text-[10px] text-zinc-500 uppercase font-medium tracking-wider mb-1">Região</div>
                  <div className="text-sm font-medium text-zinc-200">{origin.region || '-'}</div>
                </div>
                <div className="bg-zinc-950/80 p-4">
                  <div className="text-[10px] text-zinc-500 uppercase font-medium tracking-wider mb-1">Altitude</div>
                  <div className="text-sm font-mono text-zinc-200">{origin.altitude ? `${origin.altitude}m` : '-'}</div>
                </div>
                <div className="bg-zinc-950/80 p-4">
                  <div className="text-[10px] text-zinc-500 uppercase font-medium tracking-wider mb-1">Safra</div>
                  <div className="text-sm font-mono text-zinc-200">{origin.cropYear || '-'}</div>
                </div>
             </div>
           </section>
         )}

         {/* Sensorial Profile */}
         {descriptors.length > 0 && (
           <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
             <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2 border-b border-zinc-900 pb-2">
               <Coffee size={14} className="text-[#C59868]" /> Notas Sensoriais
             </h3>
             <div className="flex flex-wrap gap-2 pt-2">
               {descriptors.map((desc: string, i: number) => (
                 <div key={i} className="px-4 py-2 bg-[#C59868]/10 text-[#C59868] border border-[#C59868]/20 rounded-full text-sm font-medium">
                   {desc}
                 </div>
               ))}
             </div>
           </section>
         )}

         {/* Roast details */}
         {roast && (
           <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
             <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2 border-b border-zinc-900 pb-2">
               <Activity size={14} className="text-[#C59868]" /> Processo de Torra
             </h3>
             <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                   <Activity size={64} />
                </div>
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-900 relative z-10">
                   <div>
                     <div className="text-[10px] text-zinc-500 uppercase font-medium tracking-wider mb-1">Data da Torra</div>
                     <div className="text-sm font-mono text-zinc-300">{roast.roastDate ? new Date(roast.roastDate).toLocaleDateString('pt-BR') : '-'}</div>
                   </div>
                   <div className="text-right">
                     <div className="text-[10px] text-zinc-500 uppercase font-medium tracking-wider mb-1">Ponto de Torra</div>
                     <div className="text-sm font-medium text-[#C59868] uppercase tracking-wider">{roast.roastLevel || '-'}</div>
                   </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed italic relative z-10">
                  Lote torrado sob rigoroso controle, acompanhando a curva de desenvolvimento para evidenciar suas características nativas.
                </p>
             </div>
           </section>
         )}

         {/* QR Code / Share Section */}
         <section className="mt-8 border border-zinc-800 bg-zinc-900/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-500 delay-500">
            <QrCode size={40} className="text-[#C59868]/50" />
            <div>
               <h4 className="text-sm font-medium text-zinc-200 mb-1">Compartilhe a Origem</h4>
               <p className="text-xs text-zinc-500">Qualquer pessoa pode escanear o QR Code no pacote para visualizar esta página.</p>
            </div>
            <Button 
               variant="outline" 
               className="w-full mt-2 font-mono text-xs uppercase tracking-widest"
               onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  success('Link copiado!');
               }}
            >
               Copiar Link do Lote
            </Button>
         </section>
      </div>

      {/* Footer / CTA */}
      <div className="bg-zinc-900 border-t border-zinc-800 py-16 px-6 text-center">
         <div className="max-w-md mx-auto flex flex-col items-center">
            <div className="w-12 h-12 bg-zinc-950 rounded-full flex items-center justify-center mb-6">
                <Coffee size={24} className="text-[#C59868]" />
            </div>
            <h2 className="text-2xl font-heading font-medium text-zinc-100 mb-4 tracking-tight">Experimente a Curadoria</h2>
            <p className="text-sm text-zinc-400 mb-8 max-w-sm mx-auto leading-relaxed">
               Receba lotes exclusivos como este, torrados sob demanda e entregues direto na sua porta. Cancele ou pause quando desejar.
            </p>
            <a href="/loja" className="inline-flex items-center gap-3 bg-[#C59868] hover:bg-[#b08558] text-[#100C08] px-8 py-4 rounded-full font-bold uppercase tracking-wider text-xs transition-transform active:scale-95 shadow-[0_4px_20px_-5px_rgba(197,152,104,0.4)]">
              Conhecer Assinatura <ChevronRight size={16} strokeWidth={3} />
            </a>
         </div>
      </div>
    </div>
  );
}
