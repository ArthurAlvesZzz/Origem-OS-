import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useRepositories } from '../../../repositories/RepositoryProvider';
import { PublicLotTrace } from '../../../domain/types';

import QRCode from 'react-qr-code';
import { PrintLabel } from './PrintLabel';
import { useToast } from '../../../components/ui/Toast';
import { Drawer } from '../../ui/Drawer';
import { Button } from '../../ui/Button';
import { Select } from '../../ui/Select';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { useConfirm } from '../../ui/ConfirmDialog';

interface TraceabilityDrawerProps {
  traceId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function TraceabilityDrawer({ traceId, onClose, onSuccess }: TraceabilityDrawerProps) {
  const { success, error: toastError, info } = useToast();
  const { confirm } = useConfirm();
  const { traceabilityRepo, qualityRepo } = useRepositories();
  const [loading, setLoading] = useState(false);
  const [trace, setTrace] = useState<PublicLotTrace | null>(null);
  
  const [isCreating, setIsCreating] = useState(!traceId);
  const [approvedReviews, setApprovedReviews] = useState<any[]>([]);
  
  // Form fields
  const [selectedReviewId, setSelectedReviewId] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  
  useEffect(() => {
    if (traceId) {
      loadTrace();
    } else {
      loadApprovedReviews();
    }
  }, [traceId]);

  const loadTrace = async () => {
    try {
      const data = await traceabilityRepo.getById(traceId!);
      if (data) {
        setTrace(data);
        setTitle(data.title);
        setSummary(data.summary || '');
      }
    } catch (e) {
      console.error(e);
      toastError('Erro ao carregar rastreio');
    }
  };

  const loadApprovedReviews = async () => {
    try {
      const all = await qualityRepo.getReviews();
      const approved = all.filter(r => r.status === 'approved' || r.status === 'approved_with_notes');
      setApprovedReviews(approved);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (isCreating) {
        if (!selectedReviewId) throw new Error('Selecione um lote aprovado');
        if (!title) throw new Error('Informe o título público');
        
        // Em um app real, buscaríamos os descriptors originais para o DTO
        // Aqui, para simplificar a demo, passamos vazio ou simulamos
        await traceabilityRepo.createFromQualityReview({
          qualityReviewId: selectedReviewId,
          title,
          summary,
        });
      } else {
        await traceabilityRepo.update(trace!.id, {
          title,
          summary
        });
      }
      onSuccess();
    } catch (e: any) {
      toastError(e.message || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!trace) return;
    setLoading(true);
    try {
      await traceabilityRepo.publish(trace.id);
      onSuccess();
    } catch (e) {
      toastError('Erro ao publicar');
      setLoading(false);
    }
  };

  const handleUnpublish = async () => {
    if (!trace) return;
    
    const proceed = await confirm({
      title: 'Despublicar Lote',
      description: 'O QR Code e o link deixarão de funcionar para os clientes finais. Proceder?',
      confirmText: 'Sim, Despublicar',
      isDestructive: true
    });
    if (!proceed) return;

    setLoading(true);
    try {
      await traceabilityRepo.unpublish(trace.id);
      onSuccess();
    } catch (e) {
      toastError('Erro ao despublicar');
      setLoading(false);
    }
  };

  return (
    <>
      <Drawer
        isOpen={true}
        onClose={onClose}
        title={isCreating ? 'Novo Rastreio' : 'Detalhes do Rastreio'}
        size="md"
        footer={
          <div className="w-full space-y-4">
            <Button
              variant="conclusive"
              onClick={handleSave}
              disabled={loading || (isCreating && !selectedReviewId)}
              isLoading={loading}
              className="w-full gap-2 px-8 h-12"
            >
              {!loading && <Save size={20} />}
              Salvar Detalhes
            </Button>
            
            {!isCreating && trace && (
              <div className="grid grid-cols-2 gap-4">
                {trace.status !== 'published' ? (
                  <Button
                    variant="outline"
                    onClick={handlePublish}
                    disabled={loading}
                    className="w-full h-12 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20"
                  >
                    Publicar Lote
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleUnpublish}
                    disabled={loading}
                    className="w-full h-12 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 border-rose-500/20"
                  >
                    Despublicar Lote
                  </Button>
                )}
              </div>
            )}
          </div>
        }
      >
        <div className="space-y-6 no-print">
            {isCreating && (
              <div className="space-y-4">
                 <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Selecionar Lote (Quality Review Aprovado)</label>
               <Select
                 value={selectedReviewId}
                 onChange={e => setSelectedReviewId(e.target.value)}
               >
                 <option value="" disabled>Selecione...</option>
                 {approvedReviews.map(r => (
                   <option key={r.id} value={r.id}>
                      CQ#{r.id.substring(0,6)} - Score: {r.scoreTotal}
                   </option>
                 ))}
               </Select>
               {approvedReviews.length === 0 && (
                 <p className="text-xs text-amber-500 flex items-center gap-1"><AlertTriangle size={14} /> Nenhum lote aprovado no CQ.</p>
               )}
            </div>
          )}

          {!isCreating && trace && (
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                 <div>
                   <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Código Público</p>
                   <p className="font-mono text-zinc-200 text-lg">{trace.publicCode}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Status</p>
                   {trace.status === 'published' ? (
                     <span className="text-emerald-400 text-sm font-medium flex items-center gap-1"><CheckCircle2 size={16}/> Publicado</span>
                   ) : trace.status === 'unpublished' ? (
                     <span className="text-rose-400 text-sm font-medium">Inativo</span>
                   ) : (
                     <span className="text-zinc-400 text-sm font-medium">Rascunho</span>
                   )}
                 </div>
              </div>
              
              {trace.status === 'published' && (
                <div className="pt-4 flex flex-col items-center border-b border-zinc-800 pb-4">
                   <div className="bg-white p-2 rounded-lg mb-4">
                     <QRCode 
                        id="QRCodePreview"
                        value={`${window.location.origin}/lote/${trace.publicCode}`} 
                        size={120} 
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                     />
                   </div>
                   
                   <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2 w-full text-left">Link Público</p>
                   <div className="flex w-full items-center gap-2 mb-4">
                      <Input 
                         type="text" 
                         readOnly
                         value={`${window.location.origin}/lote/${trace.publicCode}`}
                         className="flex-1 font-mono text-xs"
                      />
                      <Button 
                        variant="secondary"
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/lote/${trace.publicCode}`)}
                        className="shrink-0 h-11 px-3"
                        title="Copiar"
                      >
                         Copiar
                      </Button>
                      <Button 
                        variant="secondary"
                        onClick={() => {
                          const svg = document.getElementById("QRCodePreview");
                          if (!svg) return;
                          const svgData = new XMLSerializer().serializeToString(svg);
                          const canvas = document.createElement("canvas");
                          const ctx = canvas.getContext("2d");
                          const img = new Image();
                          img.onload = () => {
                              canvas.width = img.width;
                              canvas.height = img.height;
                              if (ctx) {
                                ctx.fillStyle = "white";
                                ctx.fillRect(0, 0, canvas.width, canvas.height);
                                ctx.drawImage(img, 0, 0);
                              }
                              const pngFile = canvas.toDataURL("image/png");
                              const downloadLink = document.createElement("a");
                              downloadLink.download = `QR-${trace.publicCode}.png`;
                              downloadLink.href = pngFile;
                              downloadLink.click();
                          };
                          img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
                        }}
                        className="shrink-0 h-11 px-3 text-amber-500"
                        title="Baixar QR (PNG)"
                      >
                         PNG
                      </Button>
                      <Button 
                        variant="conclusive"
                        onClick={() => window.open(`/lote/${trace.publicCode}`, '_blank')}
                        className="shrink-0 h-11 px-3"
                      >
                         <ExternalLink size={14} />
                      </Button>
                   </div>
                   
                   <Button 
                     variant="outline"
                     onClick={() => window.print()}
                     className="w-full h-12"
                   >
                     Imprimir Etiqueta (QR Code)
                   </Button>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
             <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Título Público</label>
             <Input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Cerrado Ouro - Safra 2024"
             />
          </div>
          
          <div className="space-y-4">
             <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Resumo / História (Opcional)</label>
             <Textarea
                value={summary}
                onChange={e => setSummary(e.target.value)}
                rows={4}
                placeholder="Conte a história deste lote..."
                className="resize-none"
             />
          </div>
        </div>

        {/* Hidden label for printing - now OUTSIDE the no-print wrapper! */}
        {!isCreating && trace && trace.status === 'published' && (
          <PrintLabel trace={trace} size="small" />
        )}
      </Drawer>
    </>
  );
}
