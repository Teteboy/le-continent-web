import { useState } from 'react';
import { Shield, Phone, Lock, AlertTriangle, Tag, Check, Loader2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { PromoCode } from '@/types';

const ORIGINAL_PRICE = 1000;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userPhone?: string;
  userName?: string;
}

function calcFinalPrice(code: PromoCode): number {
  if (code.discount_type === 'fixed') return Math.max(0, ORIGINAL_PRICE - code.discount_value);
  return Math.max(0, ORIGINAL_PRICE - Math.floor(ORIGINAL_PRICE * code.discount_value / 100));
}

export default function PaymentModal({ open, onClose }: Props) {
  const [phone, setPhone] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'mtn' | 'orange' | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNotImplemented, setShowNotImplemented] = useState(false);

  // Promo code state
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState('');

  const methods = [
    { id: 'mtn' as const, name: 'MTN Mobile Money', logo: '/mtn.webp', color: '#FFCC00', hint: 'Commence par 65X, 67X, 68X' },
    { id: 'orange' as const, name: 'Orange Money', logo: '/orange.webp', color: '#FF6600', hint: 'Commence par 655, 69X' },
  ];

  const finalPrice = appliedPromo ? calcFinalPrice(appliedPromo) : ORIGINAL_PRICE;
  const discount = ORIGINAL_PRICE - finalPrice;

  const handleValidatePromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) { setPromoError('Entrez un code promo'); return; }
    setPromoLoading(true);
    setPromoError('');

    try {
      const { data, error: err } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (err || !data) {
        setPromoError('Code invalide ou expiré');
        setAppliedPromo(null);
        return;
      }

      const pc = data as PromoCode;

      // Check expiration
      if (pc.expires_at && new Date(pc.expires_at) < new Date()) {
        setPromoError('Ce code promo a expiré');
        setAppliedPromo(null);
        return;
      }

      // Check max uses
      if (pc.max_uses !== null && pc.used_count >= pc.max_uses) {
        setPromoError('Ce code promo a atteint sa limite d\'utilisation');
        setAppliedPromo(null);
        return;
      }

      setAppliedPromo(pc);
      toast.success(`Code promo "${code}" appliqué !`, {
        description: `Réduction de ${pc.discount_type === 'percentage' ? `${pc.discount_value}%` : `${pc.discount_value} FCFA`}`,
      });
    } catch {
      setPromoError('Erreur lors de la validation du code');
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoError('');
  };

  const handlePay = async () => {
    if (!phone.trim()) { setError('Entrez votre numéro de téléphone.'); return; }
    if (!selectedMethod) { setError('Choisissez un opérateur.'); return; }
    setError('');
    setLoading(true);

    try {
      setShowNotImplemented(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowNotImplemented(false);
    setError('');
    setSelectedMethod('');
    setPromoInput('');
    setAppliedPromo(null);
    setPromoError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl">
        {showNotImplemented ? (
          <div className="text-center py-8 px-4">
            <div className="w-20 h-20 bg-[#FF4500]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={40} className="text-[#FF4500]" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#2C3E50] mb-2">Paiement non disponible</h2>
            <p className="text-gray-600 text-sm mb-6">
              Le système de paiement est en cours de développement.
              Veuillez réessayer plus tard ou contacter le support.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-xs text-gray-500 mb-2">Contact support :</p>
              <p className="text-sm font-semibold text-[#8B0000]">WhatsApp: +237 691 372 897</p>
            </div>
            <Button onClick={handleClose} className="w-full bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold h-12 rounded-xl">
              Fermer
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-extrabold text-[#8B0000]">Paiement Premium</DialogTitle>
              <p className="text-sm text-gray-500 mt-1">Accédez à tout le contenu culturel du Cameroun</p>
            </DialogHeader>

            <div className="space-y-5 mt-2">
              {/* Amount */}
              <div className="bg-[#FFF8DC] border border-[#8B0000]/20 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500 mb-1">Montant à payer</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-gray-400 line-through text-base">
                    {appliedPromo ? `${ORIGINAL_PRICE.toLocaleString('fr-FR')} FCFA` : '2 000FCFA'}
                  </span>
                  <span className="text-4xl font-black text-[#27AE60]">
                    {finalPrice.toLocaleString('fr-FR')} FCFA
                  </span>
                  {appliedPromo ? (
                    <Badge className="bg-[#27AE60] text-white font-bold">
                      -{appliedPromo.discount_type === 'percentage' ? `${appliedPromo.discount_value}%` : `${discount}F`}
                    </Badge>
                  ) : (
                    <Badge className="bg-[#E74C3C] text-white font-bold">-50%</Badge>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">Accès à vie · Paiement unique</p>
              </div>

              {/* Promo Code */}
              <div className="bg-[#27AE60]/5 border border-[#27AE60]/20 rounded-xl p-4">
                <Label className="text-[#27AE60] font-semibold text-sm flex items-center gap-1.5 mb-2">
                  <Tag size={13} /> Code promo (optionnel)
                </Label>
                {appliedPromo ? (
                  <div className="flex items-center gap-2 bg-[#27AE60]/10 border border-[#27AE60]/30 rounded-lg px-3 py-2">
                    <Check size={15} className="text-[#27AE60] shrink-0" />
                    <code className="font-black text-[#27AE60] text-sm flex-1">{appliedPromo.code}</code>
                    <span className="text-xs text-[#27AE60] font-semibold">
                      -{appliedPromo.discount_type === 'percentage' ? `${appliedPromo.discount_value}%` : `${discount} FCFA`}
                    </span>
                    <button onClick={removePromo} className="text-gray-400 hover:text-red-500 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Entrez votre code promo"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      className="border-[#27AE60]/40 focus-visible:ring-[#27AE60] font-mono"
                      onKeyDown={(e) => e.key === 'Enter' && handleValidatePromo()}
                    />
                    <Button
                      type="button"
                      onClick={handleValidatePromo}
                      disabled={promoLoading || !promoInput.trim()}
                      className="bg-[#27AE60] hover:bg-[#219A52] text-white font-bold shrink-0"
                    >
                      {promoLoading ? <Loader2 size={14} className="animate-spin" /> : 'Valider'}
                    </Button>
                  </div>
                )}
                {promoError && (
                  <p className="text-red-500 text-xs mt-1.5 font-semibold">{promoError}</p>
                )}
              </div>

              {/* Phone input */}
              <div>
                <Label className="text-[#8B0000] font-semibold">Numéro de téléphone Mobile Money</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <Phone size={16} className="text-[#8B0000] shrink-0" />
                  <Input
                    placeholder="6XX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="border-[#8B0000]/40 focus-visible:ring-[#8B0000]"
                  />
                </div>
              </div>

              {/* Payment methods */}
              <div>
                <Label className="text-gray-700 font-semibold">Choisissez votre opérateur</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {methods.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMethod(m.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        selectedMethod === m.id
                          ? 'border-[#8B0000] bg-[#8B0000]/5 shadow-md'
                          : 'border-gray-200 hover:border-[#8B0000]/40'
                      }`}
                    >
                      <img src={m.logo} alt={m.name} className="h-9 object-contain" />
                      <span className="text-xs font-semibold text-gray-700 text-center">{m.name}</span>
                      <span className="text-xs text-gray-400 text-center">{m.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notice */}
              <div className="bg-[#FF4500]/5 border border-[#FF4500]/20 rounded-xl p-3 text-xs text-gray-600">
                <p className="font-semibold text-[#FF4500] mb-1">⚠️ Information importante</p>
                <p>Le système de paiement sera bientôt disponible. Les codes promo sont déjà validables.</p>
              </div>

              {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

              <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
                <Shield size={12} /> Paiement sécurisé · Bientôt disponible
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1" disabled={loading}>
                  Annuler
                </Button>
                <Button
                  onClick={handlePay}
                  disabled={loading || !selectedMethod || !phone.trim()}
                  className="flex-1 bg-[#27AE60] hover:bg-[#219A52] text-white font-bold"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Traitement...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Lock size={14} /> Payer {finalPrice.toLocaleString('fr-FR')} FCFA
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
