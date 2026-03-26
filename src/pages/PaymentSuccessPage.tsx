import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Crown, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { profileApi } from '@/lib/api-client';
import { toast } from 'sonner';
import type { UserProfile } from '@/types';

export default function PaymentSuccessPage() {
  const { user, profile } = useAuth();
  const setProfile = useAuthStore(state => state.setProfile);
  const [refreshing, setRefreshing] = useState(true);

  // Read payment details from localStorage (saved by PaymentModal)
  const [paymentInfo] = useState(() => {
    try {
      const stored = localStorage.getItem('pending_payment');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Clean up after reading
        localStorage.removeItem('pending_payment');
        return parsed;
      }
    } catch { /* ignore */ }
    return null;
  });

  // Refresh profile from backend to reflect premium status
  useEffect(() => {
    let cancelled = false;
    let retryCount = 0;
    const maxRetries = 3;

    const refreshProfile = async () => {
      if (!user?.id) {
        setRefreshing(false);
        return;
      }
      try {
        const response = await profileApi.get(user.id);
        const updatedProfile = (response as { profile?: UserProfile }).profile;

        if (!cancelled && updatedProfile) {
          setProfile(updatedProfile);

          // Show success toast if premium is now active
          if (updatedProfile.is_premium) {
            toast.success('🎉 Paiement confirmé !', {
              description: 'Votre compte Premium est maintenant actif. Profitez de tout le contenu culturel !',
              duration: 8000,
            });
          }
        }
      } catch {
        // Retry on failure
        if (!cancelled && retryCount < maxRetries) {
          retryCount++;
          console.log(`[PaymentSuccess] Profile refresh retry ${retryCount}/${maxRetries}`);
          setTimeout(refreshProfile, 2000 * retryCount); // Exponential backoff
          return;
        }
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    };

    refreshProfile();
    return () => { cancelled = true; };
  }, [user?.id, setProfile]);

  const amount = paymentInfo?.amount ?? 1000;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#8B0000] to-[#2C3E50] py-12 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-2xl overflow-hidden shadow-2xl text-center">
        <div className="py-8 px-6">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale">
            <Check size={40} className="text-white" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Paiement Réussi !
          </h1>

          {refreshing ? (
            <div className="flex items-center justify-center gap-2 text-gray-500 mb-6">
              <Loader2 size={16} className="animate-spin" />
              <span>Activation de votre compte Premium…</span>
            </div>
          ) : (
            <p className="text-gray-500 mb-6">
              {profile?.is_premium
                ? 'Votre accès Premium est maintenant activé. Profitez de tout le contenu !'
                : 'Merci pour votre paiement. Votre accès sera activé sous peu.'}
            </p>
          )}

          {/* Premium badge */}
          {profile?.is_premium && (
            <div className="flex items-center justify-center gap-2 mb-6">
              <Crown size={18} className="text-[#FFD700]" />
              <span className="font-bold text-[#8B0000]">Compte Premium Actif</span>
            </div>
          )}

          {/* Payment Details */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-500">Statut</span>
              <span className="text-green-600 font-semibold">✓ Confirmé</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-500">Montant</span>
              <span className="font-semibold">{amount.toLocaleString('fr-FR')} XAF</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Date</span>
              <span className="font-semibold">
                {new Date().toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/cultures"
              className="bg-[#8B0000] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#6B0000] transition-colors"
            >
              Explorer le contenu
            </Link>
            <Link
              to="/"
              className="border-2 border-[#8B0000] text-[#8B0000] px-6 py-3 rounded-xl font-semibold hover:bg-[#8B0000] hover:text-white transition-colors"
            >
              Accueil
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scale {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .animate-scale {
          animation: scale 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
