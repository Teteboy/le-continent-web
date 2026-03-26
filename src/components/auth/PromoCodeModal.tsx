import { Copy, Check, Gift, Share2 } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  promoCode: string;
  firstName: string;
  loginEmail?: string;
}

export default function PromoCodeModal({ open, onClose, promoCode, firstName, loginEmail }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promoCode);
      setCopied(true);
      toast.success('Code copié !');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Impossible de copier automatiquement.');
    }
  };

  const handleShare = async () => {
    const text = `🎉 Rejoins *Le Continent* – La plateforme culturelle du Cameroun !\nUtilise mon code promo *${promoCode}* pour obtenir une réduction sur l'abonnement Premium.\n👉 https://lecontinent.cm/inscription`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Le Continent – Mon code promo', text });
      } catch {
        await navigator.clipboard.writeText(text);
        toast.success('Message copié !', { description: 'Collez-le dans WhatsApp ou SMS.' });
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Message copié !', { description: 'Collez-le dans WhatsApp ou SMS.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl text-center p-6 sm:p-8 mx-4">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-[#FFD700]/20 rounded-full flex items-center justify-center">
            <Gift size={40} className="text-[#8B0000]" />
          </div>
        </div>

        <h2 className="text-2xl font-extrabold text-[#8B0000] mb-2">
          🎉 Félicitations, {firstName} !
        </h2>
        <p className="text-gray-600 mb-5 text-sm leading-relaxed">
          Votre compte a été créé avec succès. Voici votre code promo exclusif :
        </p>

        {/* Promo code box */}
        <div className="bg-[#FFF8DC] border-2 border-[#8B0000] rounded-2xl p-5 mb-4 relative">
          <p className="text-xs text-gray-500 mb-1 uppercase font-semibold tracking-wider">Votre code promo</p>
          <p className="text-2xl font-black text-[#8B0000] tracking-widest">{promoCode}</p>
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 bg-[#8B0000]/10 hover:bg-[#8B0000]/20 rounded-lg p-2 transition-colors"
            title="Copier le code"
          >
            {copied ? <Check size={16} className="text-[#27AE60]" /> : <Copy size={16} className="text-[#8B0000]" />}
          </button>
        </div>

        {/* Share actions */}
        <div className="flex gap-3 mb-4">
          <Button
            onClick={handleCopy}
            variant="outline"
            className="flex-1 border-[#8B0000]/30 text-[#8B0000] hover:bg-[#8B0000] hover:text-white h-10 rounded-xl text-sm font-semibold flex items-center gap-1.5 justify-center"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />} Copier
          </Button>
          <Button
            onClick={handleShare}
            className="flex-1 bg-[#27AE60] hover:bg-[#219A52] text-white h-10 rounded-xl text-sm font-semibold flex items-center gap-1.5 justify-center"
          >
            <Share2 size={15} /> Partager
          </Button>
        </div>

        <div className="text-xs text-gray-400 mb-4 space-y-1">
          <p>💡 Partagez ce code avec vos proches pour leur offrir une réduction Premium.</p>
          <p className="text-gray-300">Conservez-le précieusement, il est unique !</p>
        </div>

        {/* Login info when no email provided */}
        {loginEmail && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-left">
            <p className="text-xs font-bold text-blue-700 mb-1">📌 Votre identifiant de connexion :</p>
            <p className="text-xs text-blue-600 font-mono break-all">{loginEmail}</p>
            <p className="text-xs text-blue-500 mt-1">
              Vous pouvez aussi vous connecter directement avec votre numéro de téléphone complet (ex: +237XXXXXXXXX).
            </p>
          </div>
        )}

        <Button
          onClick={onClose}
          className="w-full bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold rounded-xl py-3"
        >
          Continuer vers l'application
        </Button>
      </DialogContent>
    </Dialog>
  );
}
