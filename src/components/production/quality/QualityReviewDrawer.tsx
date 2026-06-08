import React, { useState, useEffect } from 'react';
import { useRepositories } from '../../../repositories/RepositoryProvider';
import { QualityReviewRecord } from '../../../repositories/interfaces/IQualityRepository';
import { X, Save, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import { Drawer } from '../../../components/ui/Drawer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';

interface QualityReviewDrawerProps {
  reviewId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function QualityReviewDrawer({ reviewId, onClose, onSuccess }: QualityReviewDrawerProps) {
  const { success, error: toastError, info } = useToast();
  const { confirm } = useConfirm();
  const { qualityRepo } = useRepositories();
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<QualityReviewRecord | null>(null);

  const [scores, setScores] = useState({
     fragrance: 0, aroma: 0, acidity: 0, body: 0, sweetness: 0, balance: 0, aftertaste: 0, defects: 0
  });
  const [notes, setNotes] = useState('');

  useEffect(() => {
    qualityRepo.getReviews().then(all => {
       const rev = all.find(r => r.id === reviewId);
       if (rev) {
          setReview(rev);
          setScores({
             fragrance: rev.fragranceScore || 0,
             aroma: rev.aromaScore || 0,
             acidity: rev.acidityScore || 0,
             body: rev.bodyScore || 0,
             sweetness: rev.sweetnessScore || 0,
             balance: rev.balanceScore || 0,
             aftertaste: rev.aftertasteScore || 0,
             defects: rev.defectsScore || 0,
          });
          setNotes(rev.notes || '');
       }
    });
  }, [reviewId, qualityRepo]);

  const totalScore = Object.values(scores).reduce((a,b) => a+b, 0) - (scores.defects * 2);

  const handleApprove = async () => {
    const proceed = await confirm({
      title: 'Aprovar Lote',
      description: 'Confirmar a aprovação deste lote CQ e liberação para estoque?',
      confirmText: 'Sim, Aprovar',
    });
    if (!proceed) return;

    setLoading(true);
    try {
      await Promise.all([
        qualityRepo.updateReview(reviewId, {
           fragranceScore: scores.fragrance,
           aromaScore: scores.aroma,
           acidityScore: scores.acidity,
           bodyScore: scores.body,
           sweetnessScore: scores.sweetness,
           balanceScore: scores.balance,
           aftertasteScore: scores.aftertaste,
           defectsScore: scores.defects,
           scoreTotal: totalScore > 0 ? totalScore + 50 : 0
        }),
        qualityRepo.approveReview(reviewId, notes)
      ]);
      onSuccess();
    } catch (e) {
      toastError('Erro ao aprovar lote.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const proceed = await confirm({
      title: 'Reprovar Lote',
      description: 'Tem certeza que deseja reprovar este lote CQ? Esta ação não pode ser desfeita.',
      confirmText: 'Sim, Reprovar',
      isDestructive: true
    });
    if (!proceed) return;

    setLoading(true);
    try {
      await Promise.all([
        qualityRepo.updateReview(reviewId, {
           fragranceScore: scores.fragrance,
           aromaScore: scores.aroma,
           acidityScore: scores.acidity,
           bodyScore: scores.body,
           sweetnessScore: scores.sweetness,
           balanceScore: scores.balance,
           aftertasteScore: scores.aftertaste,
           defectsScore: scores.defects,
           scoreTotal: totalScore > 0 ? totalScore + 50 : 0
        }),
        qualityRepo.rejectReview(reviewId, notes)
      ]);
      onSuccess();
    } catch (e) {
      toastError('Erro ao reprovar lote.');
    } finally {
      setLoading(false);
    }
  };

  if (!review) return null;

  return (
    <Drawer 
      isOpen={true} 
      onClose={onClose} 
      title="Avaliação Sensorial"
      subtitle={`Lote: ${review.batch?.code || review.productionBatchId}`}
      footer={
        <>
          <Button 
             variant="danger"
             onClick={handleReject} 
             disabled={loading} 
             className="flex-1 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-500 border-red-500/50"
          >
            <XCircle size={18} className="mr-2" /> Reprovar Lote
          </Button>
          <Button 
             variant="conclusive"
             onClick={handleApprove} 
             disabled={loading} 
             className="flex-1 px-4 py-3"
          >
            <CheckCircle size={18} className="mr-2" /> Aprovar & Liberar
          </Button>
        </>
      }
    >
      <div className="space-y-6">
         <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <h3 className="text-sm font-medium text-white mb-4">Notas SCA (0-10)</h3>
            <div className="grid grid-cols-2 gap-4">
               {['fragrance', 'aroma', 'acidity', 'body', 'sweetness', 'balance', 'aftertaste'].map(attr => (
                  <div key={attr}>
                     <label className="block text-xs text-zinc-400 mb-1 capitalize">{attr}</label>
                     <Input 
                       type="number" 
                       step="0.25" min="0" max="10" 
                       value={scores[attr as keyof typeof scores]} 
                       onChange={e => setScores({...scores, [attr]: parseFloat(e.target.value) || 0})}
                     />
                  </div>
               ))}
               <div>
                  <label className="block text-xs text-red-400 mb-1">Defeitos (Desc.)</label>
                  <Input 
                    type="number" 
                    step="1" min="0" 
                    value={scores.defects} 
                    onChange={e => setScores({...scores, defects: parseInt(e.target.value) || 0})}
                    className="border-red-900/50 text-red-400 focus:border-red-500" 
                  />
               </div>
            </div>
            
            <div className="mt-6 flex justify-between items-center pt-4 border-t border-zinc-800">
               <span className="text-sm text-zinc-400">Score Projetado (Base 50)</span>
               <span className={`text-xl font-bold ${totalScore + 50 >= 80 ? 'text-emerald-400' : 'text-amber-500'}`}>
                  {(totalScore + 50).toFixed(2)} pts
               </span>
            </div>
         </div>

         <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Observações / Laudo</label>
            <Textarea 
              rows={4}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notas sobre perfil de xícara, cor da torra, etc..."
            />
         </div>
      </div>
    </Drawer>
  );
}
