import { useState, useEffect, useCallback } from 'react';
import { Shield, Phone, Lock, Tag, Check, Loader2, X, MapPin, CreditCard, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { useQueryClient } from '@tanstack/react-query';
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

export default function PaymentModal({ open, onClose, onSuccess, userPhone }: Props) {
  const { user, profile } = useAuth();
  const setProfile = useAuthStore(state => state.setProfile);
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState('');

  // Auto-fill phone when modal opens if user is logged in
  useEffect(() => {
    if (open && userPhone) {
      setPhone(userPhone);
    }
  }, [open, userPhone]);
  const [selectedMethod, setSelectedMethod] = useState<'mtn' | 'orange' | 'card' | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Payment state
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [ptn, setPtn] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [showCheckAgain, setShowCheckAgain] = useState(false);

  // Store pending payment in localStorage to check on app load
  useEffect(() => {
    if (!open && user?.id) {
      checkPendingPayment();
    }
  }, [open, user?.id]);

  // Check for pending payments on app load or when modal opens
  const checkPendingPayment = useCallback(async () => {
    const storedPayment = localStorage.getItem('pending_payment');
    if (!storedPayment || !user?.id) return;
    
    try {
      const payment = JSON.parse(storedPayment);
      // Only check if payment belongs to current user
      if (payment.userId !== user.id) {
        localStorage.removeItem('pending_payment');
        return;
      }
      
      const API_URL = import.meta.env.VITE_API_URL || 'https://api.lecontinent.cm';
      const response = await fetch(`${API_URL}/api/payment/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: payment.paymentId, ptn: payment.ptn })
      });
      
      const data = await response.json();
      
      if (data.status === 'completed') {
        // Payment was completed!
        toast.success('Paiement confirmé! Votre compte est maintenant Premium.');
        await refreshProfile();
        localStorage.removeItem('pending_payment');
        // Show success state
        setPaymentId(payment.paymentId);
        setPtn(payment.ptn);
        setIsPolling(false);
        onSuccess?.();
      } else if (data.status === 'failed' || data.status === 'cancelled') {
        localStorage.removeItem('pending_payment');
      } else {
        // Still pending - offer to continue waiting
        setPaymentId(payment.paymentId);
        setPtn(payment.ptn);
        setShowCheckAgain(true);
      }
    } catch (err) {
      console.error('Error checking pending payment:', err);
    }
  }, [user?.id, onSuccess]);

  // Save pending payment to localStorage when payment starts
  const refreshProfile = async () => {
    if (!user?.id) return;
    try {
      // Invalidate all profile-related queries to force refetch
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      
      // Also directly fetch and update the store
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
  };

  // Increment promo used_count after successful payment
  const incrementPromoUsage = async (promoCode: PromoCode) => {
    try {
      await supabase
        .from('promo_codes')
        .update({ used_count: promoCode.used_count + 1 })
        .eq('id', promoCode.id);
    } catch (err) {
      console.error('Error incrementing promo usage:', err);
    }
  };

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
      // Use backend API with Redis caching instead of direct Supabase call
      const API_URL = import.meta.env.VITE_API_URL || 'https://api.lecontinent.cm';
      const response = await fetch(`${API_URL}/api/promo/validate/${encodeURIComponent(code)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to validate promo code');
      }
      
      const result = await response.json();
      
      if (!result.valid || !result.promo) {
        setPromoError('Code invalide ou expiré');
        setAppliedPromo(null);
        return;
      }

      const pc = result.promo as PromoCode;

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
        description: `Réduction de ${pc.discount_type === 'percentage' ? `${pc.discount_value}%` : `${pc.discount_value} FCAFA`}`,
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

  // Cancel payment when user clicks Annuler
  const cancelPayment = async () => {
    if (paymentId && isPolling) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'https://api.lecontinent.cm';
        await fetch(`${API_URL}/api/payment/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId })
        });
        // Clear pending payment from localStorage
        localStorage.removeItem('pending_payment');
      } catch (err) {
        console.error('Error cancelling payment:', err);
      }
    }
  };

  const handlePay = async () => {
    if (!phone.trim() || !selectedMethod) {
      setError('Veuillez entrer votre numéro de téléphone');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Determine API URL based on environment
      // Use VITE_API_URL if set, otherwise use production API
      const API_URL = import.meta.env.VITE_API_URL || 'https://api.lecontinent.cm';
      

      
      const response = await fetch(`${API_URL}/api/payment/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          amount: finalPrice,
          method: selectedMethod,
          userId: user?.id,
          userEmail: user?.email,
          userName: profile ? `${profile.first_name} ${profile.last_name}`.trim() : undefined
        })
      });

      const data = await response.json();

      if (data.success && data.ptn) {
        // CamPay payment initiated - user needs to confirm on phone
        toast.success('Paiement initiated!', {
          description: 'Veuillez confirmer le paiement sur votre téléphone',
          duration: 5000
        });
        
        // Store payment info for manual retry AND in localStorage for background checking
        setPaymentId(data.paymentId);
        setPtn(data.ptn);
        setIsPolling(true);
        setShowCheckAgain(false);
        
        // Save to localStorage so we can check status even if user navigates away
        localStorage.setItem('pending_payment', JSON.stringify({
          paymentId: data.paymentId,
          ptn: data.ptn,
          userId: user?.id,
          method: selectedMethod,
          amount: finalPrice,
          createdAt: new Date().toISOString()
        }));
        setPtn(data.ptn);
        setIsPolling(true);
        setShowCheckAgain(false);
        setLoading(false);
        
        // Poll for payment status - increased to 120 seconds (60 attempts * 2s)
        let attempts = 0;
        const maxAttempts = 60; // 120 seconds total
        
        const checkStatus = async () => {
          if (attempts >= maxAttempts) {
            setIsPolling(false);
            setShowCheckAgain(true);
            setError('Le temps d\'attente est écoulé. Cliquez sur "Vérifier" pour continuer à attendre, ou contactez le support.');
            return;
          }
          
          try {
            const statusResponse = await fetch(`${API_URL}/api/payment/confirm`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId: data.paymentId, ptn: data.ptn })
            });
            
            const statusData = await statusResponse.json();
            
            if (statusData.status === 'completed') {
              setIsPolling(false);
              toast.success('Paiement confirmé!');
              if (appliedPromo) await incrementPromoUsage(appliedPromo);
              refreshProfile();
              // Clear pending payment from localStorage
              localStorage.removeItem('pending_payment');
              onSuccess?.();
              onClose();
            } else if (statusData.status === 'failed') {
              setIsPolling(false);
              setError(statusData.message || 'Le paiement a échoué');
              // Clear pending payment from localStorage
              localStorage.removeItem('pending_payment');
            } else {
              attempts++;
              // Show progress toast
              if (attempts % 5 === 0) {
                toast.info(`En attente... ${attempts * 2}s écoulées`, { duration: 1000 });
              }
              setTimeout(checkStatus, 2000);
            }
          } catch {
            attempts++;
            setTimeout(checkStatus, 2000);
          }
        };
        
        // Start polling after 3 seconds
        setTimeout(checkStatus, 3000);
        
      } else if (data.success && data.checkoutUrl) {
        // Paydunya-style checkout URL (fallback)
        window.location.href = data.checkoutUrl;
      } else {
        setError(data.error || 'Erreur lors de l\'initialisation du paiement');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      // Don't set loading false here if we're polling
    }
  };

  const handleClose = async () => {
    // Cancel payment if polling
    if (paymentId && isPolling) {
      await cancelPayment();
    }
    
    setError('');
    setSelectedMethod('');
    setPromoInput('');
    setAppliedPromo(null);
    setPromoError('');
    setPaymentId(null);
    setPtn(null);
    setIsPolling(false);
    setShowCheckAgain(false);
    // Clear pending payment from localStorage
    localStorage.removeItem('pending_payment');
    onClose();
  };

  // Manual check payment status (for retry after timeout)
  const handleCheckAgain = async () => {
    if (!paymentId || !ptn) return;
    
    setLoading(true);
    setError('');
    setIsPolling(true);
    
    try {
      // Use same API URL as initial payment
      const API_URL = import.meta.env.VITE_API_URL || 'https://api.lecontinent.cm';
      
      const statusResponse = await fetch(`${API_URL}/api/payment/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, ptn })
      });
      
      const statusData = await statusResponse.json();
      
      if (statusData.status === 'completed') {
        toast.success('Paiement confirmé!');
        if (appliedPromo) await incrementPromoUsage(appliedPromo);
        refreshProfile();
        // Clear pending payment from localStorage
        localStorage.removeItem('pending_payment');
        onSuccess?.();
        onClose();
      } else if (statusData.status === 'failed') {
        setIsPolling(false);
        setError(statusData.message || 'Le paiement a échoué');
        // Clear pending payment from localStorage
        localStorage.removeItem('pending_payment');
        setShowCheckAgain(false);
      } else {
        // Continue polling
        setIsPolling(true);
        setShowCheckAgain(false);
        setLoading(false);
        
        // Continue polling for up to 60 more seconds
        let attempts = 0;
        const maxAttempts = 30;
        
        const continuePolling = async () => {
          if (attempts >= maxAttempts) {
            setIsPolling(false);
            setShowCheckAgain(true);
            setError('Le paiement prend plus de temps que prévu. Veuillez réessayer plus tard ou contacter le support.');
            return;
          }
          
          try {
            const response = await fetch(`${API_URL}/api/payment/confirm`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId, ptn })
            });
            
            const data = await response.json();
            
            if (data.status === 'completed') {
              setIsPolling(false);
              toast.success('Paiement confirmé!');
              if (appliedPromo) await incrementPromoUsage(appliedPromo);
              refreshProfile();
              // Clear pending payment from localStorage
              localStorage.removeItem('pending_payment');
              onSuccess?.();
              onClose();
            } else if (data.status === 'failed') {
              setIsPolling(false);
              setError(data.message || 'Le paiement a échoué');
              // Clear pending payment from localStorage
              localStorage.removeItem('pending_payment');
            } else {
              attempts++;
              setTimeout(continuePolling, 2000);
            }
          } catch {
            attempts++;
            setTimeout(continuePolling, 2000);
          }
        };
        
        setTimeout(continuePolling, 2000);
      }
    } catch (err) {
      console.error('Check again error:', err);
      setError('Erreur lors de la vérification. Veuillez réessayer.');
      setIsPolling(false);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl top-4 translate-y-0 max-h-[none] p-4">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-extrabold text-[#8B0000]">Paiement Premium</DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Accédez à tout le contenu culturel du Cameroun
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Amount */}
          <div className="bg-[#FFF8DC] border border-[#8B0000]/20 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">Montant à payer</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-gray-400 line-through text-sm">
                {appliedPromo ? `${ORIGINAL_PRICE.toLocaleString('fr-FR')} FCAFA` : '2 000FCAFA'}
              </span>
              <span className="text-2xl font-black text-[#27AE60]">
                {finalPrice.toLocaleString('fr-FR')} FCAFA
              </span>
              {appliedPromo ? (
                <Badge className="bg-[#27AE60] text-white font-bold text-xs">
                  -{appliedPromo.discount_type === 'percentage' ? `${appliedPromo.discount_value}%` : `${discount}F`}
                </Badge>
              ) : (
                <Badge className="bg-[#E74C3C] text-white font-bold text-xs">-50%</Badge>
              )}
            </div>
            <p className="text-[10px] text-gray-400">Accès à vie · Paiement unique</p>
          </div>

          {/* Phone input */}
          <div>
            <Label className="text-[#8B0000] font-semibold text-sm">Numéro Mobile Money</Label>
            <div className="flex items-center gap-2 mt-1">
              <Phone size={14} className="text-[#8B0000] shrink-0" />
              <Input
                placeholder="6XX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border-[#8B0000]/40 focus-visible:ring-[#8B0000] h-9"
              />
            </div>
          </div>

          {/* Payment methods */}
          <div>
            <Label className="text-gray-700 font-semibold text-sm">Choisissez votre opérateur</Label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {methods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMethod(m.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                    selectedMethod === m.id
                      ? 'border-[#8B0000] bg-[#8B0000]/5'
                      : 'border-gray-200 hover:border-[#8B0000]/40'
                  }`}
                >
                  {m.logo ? (
                    <img src={m.logo} alt={m.name} className="h-6 object-contain" />
                  ) : (
                    <CreditCard size={20} style={{ color: m.color }} />
                  )}
                  <span className="text-[10px] font-semibold text-gray-700 text-center">{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-[10px] text-green-700">
            <p className="font-semibold">✅ Paiement sécurisé via MTN et Orange</p>
          </div>

          {error && (
            <div className="space-y-2">
              <p className="text-red-600 text-sm font-medium">{error}</p>
              <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                <MapPin size={16} className="text-[#8B0000] mt-0.5 shrink-0" />
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-800">Awae Laverie, Yaoundé</p>
                  <p className="text-xs text-gray-500">Cameroun</p>
                </div>
              </div>
            </div>
          )}

          {/* Polling status indicator */}
          {isPolling && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-blue-700">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm font-medium">En attente de confirmation...</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Veuillez confirmer le paiement sur votre téléphone
              </p>
            </div>
          )}

          {/* Manual check button when polling timed out */}
          {showCheckAgain && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <p className="text-amber-700 text-sm font-medium mb-2">
                Le paiement prend plus de temps que prévu
              </p>
              <Button
                onClick={handleCheckAgain}
                className="bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold"
              >
                <RefreshCw size={14} className="mr-2" />
                Vérifier maintenant
              </Button>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-green-600 text-xs">
            <Shield size={12} /> Paiement sécurisé par MTN et Orange Money
          </div>

          {/* Main action buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1 h-9 text-sm">
              Annuler
            </Button>
            <Button
              onClick={handlePay}
              disabled={loading || !selectedMethod || !phone.trim()}
              className="flex-1 bg-[#27AE60] hover:bg-[#219A52] text-white font-bold h-9 text-sm"
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Traitement...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Lock size={12} /> Payer {finalPrice.toLocaleString('fr-FR')}F
                </span>
              )}
            </Button>
          </div>

          {/* Promo Code Section - Below buttons */}
          <div className="bg-[#27AE60]/5 border border-[#27AE60]/20 rounded-lg p-2.5">
            <Label className="text-[#27AE60] font-semibold text-xs flex items-center gap-1 mb-1.5">
              <Tag size={11} /> Code promo (optionnel)
            </Label>
            {appliedPromo ? (
              <div className="flex items-center gap-1.5 bg-[#27AE60]/10 border border-[#27AE60]/30 rounded px-2 py-1.5">
                <Check size={12} className="text-[#27AE60] shrink-0" />
                <code className="font-black text-[#27AE60] text-xs flex-1">{appliedPromo.code}</code>
                <span className="text-[10px] text-[#27AE60] font-semibold">
                  -{appliedPromo.discount_type === 'percentage' ? `${appliedPromo.discount_value}%` : `${discount}F`}
                </span>
                <button onClick={removePromo} className="text-gray-400 hover:text-red-500">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="flex gap-1.5">
                <Input
                  placeholder="Code promo"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  className="border-[#27AE60]/40 focus-visible:ring-[#27AE60] font-mono text-xs h-8"
                  onKeyDown={(e) => e.key === 'Enter' && handleValidatePromo()}
                />
                <Button
                  type="button"
                  onClick={handleValidatePromo}
                  disabled={promoLoading || !promoInput.trim()}
                  className="bg-[#27AE60] hover:bg-[#219A52] text-white font-bold shrink-0 h-8 text-xs px-3"
                >
                  {promoLoading ? <Loader2 size={12} className="animate-spin" /> : 'OK'}
                </Button>
              </div>
            )}
            {promoError && (
              <p className="text-red-500 text-[10px] mt-1 font-semibold">{promoError}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
