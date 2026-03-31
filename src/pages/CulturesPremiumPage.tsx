import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Crown, Lock, MapPin, Diamond, ArrowRight, Loader2, BookOpen,
  AlertCircle, RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import PaymentModal from '@/components/payment/PaymentModal';
import { resilientFetch } from '@/lib/fetch';

const DRAPEAU_URI = 'https://flagcdn.com/w320/cm.png';

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : (import.meta.env.DEV ? 'http://localhost:3000' : 'https://api.lecontinent.cm');

const VILLAGE_CATEGORIES = ['lexique', 'alphabet', 'proverbes', 'histoires', 'mets', 'phrases'];

interface Village {
  id: string;
  name: string;
  region: string;
  image_url: string | null;
  description: string | null;
  order: number;
  created_at: string;
}

interface VillageCategoryCounts {
  [villageId: string]: {
    [category: string]: number;
  };
}

export default function CulturesPremiumPage() {
  const { user, profile } = useAuth();
  const isPremium = profile?.is_premium ?? false;
  const navigate = useNavigate();

  const [showPayment, setShowPayment] = useState(false);

  // Fetch villages
  const { data: villages = [], isLoading, error, refetch } = useQuery({
    queryKey: ['villages'],
    queryFn: async () => {
      const response = await resilientFetch(`${API_BASE}/api/content/villages`);
      if (!response.ok) throw new Error('Erreur de chargement des villages');
      return (await response.json()) as Village[];
    },
    staleTime: 10 * 60 * 1000,
    refetchInterval: false,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: 500,
  });

  // Fetch category counts for sorting (separate query so villages load fast)
  const { data: categoryCounts = {} } = useQuery<VillageCategoryCounts>({
    queryKey: ['village-category-counts'],
    queryFn: async () => {
      const response = await resilientFetch(`${API_BASE}/api/content/villages-category-counts`);
      if (!response.ok) return {};
      return await response.json();
    },
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Sort: villages with content in ALL categories first, then by number of categories desc, then alphabetically
  const sortedVillages = [...villages].sort((a, b) => {
    const aCount = VILLAGE_CATEGORIES.filter(c => (categoryCounts[a.id]?.[c] ?? 0) > 0).length;
    const bCount = VILLAGE_CATEGORIES.filter(c => (categoryCounts[b.id]?.[c] ?? 0) > 0).length;
    if (aCount !== bCount) return bCount - aCount;
    return a.name.localeCompare(b.name);
  });

  const errorMessage = error instanceof Error ? error.message : null;

  const handleVillageClick = (village: Village) => {
    navigate(`/village-options?village=${encodeURIComponent(JSON.stringify(village))}`);
  };

  const handleUpgrade = () => {
    if (!user) { navigate('/inscription?redirect=payment'); return; }
    setShowPayment(true);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Hero Header */}
      <div
        className="relative h-64 bg-cover bg-center"
        style={{ backgroundImage: 'url(/1.jpeg)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#8B0000]/80 to-black/70" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <div className="flex items-center gap-2 mb-3">
            {isPremium ? (
              <div className="flex items-center gap-2 bg-[#FFD700]/20 border border-[#FFD700]/40 text-[#FFD700] px-4 py-1.5 rounded-full text-sm font-bold">
                <Diamond size={14} fill="currentColor" /> Accès Premium Actif
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 text-white/80 px-4 py-1.5 rounded-full text-sm">
                <Lock size={12} /> Toutes les cultures · Premium pour tout débloquer
              </div>
            )}
          </div>
          <h1 className="text-4xl font-black text-white drop-shadow-lg mb-2">Cultures du Cameroun</h1>
            <p className="text-[#FFD700] font-semibold text-sm">
              {isPremium
                ? `${villages.length} dialectes disponibles`
                : `${villages.length} cultures · 3 éléments gratuits par catégorie`}
            </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Premium welcome banner */}
        {isPremium && (
          <div className="bg-gradient-to-r from-[#8B0000] to-[#6B0000] rounded-2xl p-5 mb-8 flex items-center gap-4 shadow-lg">
            <Crown size={36} className="text-[#FFD700] shrink-0" fill="currentColor" />
            <div>
              <h2 className="text-white font-extrabold text-lg">Bienvenue dans l'espace Premium !</h2>
              <p className="text-white/70 text-sm">Vous avez accès à tous les contenus culturels du Cameroun.</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={36} className="text-[#8B0000] animate-spin" />
            <p className="text-gray-500">Chargement des cultures...</p>
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <AlertCircle size={48} className="text-red-500" />
            <p className="text-gray-600">{errorMessage || 'Erreur de chargement'}</p>
            <Button onClick={() => refetch()} variant="outline" className="flex items-center gap-2">
              <RefreshCw size={16} /> Réessayer
            </Button>
          </div>
        )}

        {/* Villages list */}
        {!isLoading && !error && (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-extrabold text-[#2C3E50]">
                {isPremium ? 'Toutes les cultures' : 'Cultures disponibles'}
              </h2>
            </div>

            <div className="space-y-3 mb-8">
              {sortedVillages.map((village) => {
                const imgSrc = village.image_url || DRAPEAU_URI;
                const catCount = VILLAGE_CATEGORIES.filter(c => (categoryCounts[village.id]?.[c] ?? 0) > 0).length;

                return (
                  <div
                    key={village.id}
                    onClick={() => handleVillageClick(village)}
                    className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-200"
                  >
                    {/* Image */}
                    <div className="relative shrink-0">
                      <img
                        src={imgSrc}
                        alt={village.name}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                    </div>

                     {/* Info */}
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2">
                         <p className="font-bold text-[#2C3E50] text-sm truncate" title={village.name}>{village.name.split(' (')[0]?.charAt(0).toUpperCase() + village.name.split(' (')[0]?.slice(1)}</p>
                       </div>
                      {village.name.includes(' (') && (
                        <p className="font-bold text-xs text-gray-500 italic truncate" title={village.name}>
                          {village.name.match(/\((.*)\)/)?.[1]}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-[#8B0000]" /> {village.region || 'Cameroun'}
                      </p>
                    </div>

                    {/* Badge / Arrow */}
                    <div className="shrink-0">
                      <div className="flex items-center gap-2">
                        {isPremium ? (
                          <Badge className="bg-[#FFD700]/20 text-[#8B0000] border border-[#FFD700]/40 text-xs font-semibold flex items-center gap-1">
                            <Crown size={9} fill="currentColor" /> Premium
                          </Badge>
                        ) : (
                          <Badge className="bg-[#27AE60]/10 text-[#27AE60] border border-[#27AE60]/30 text-xs font-semibold">
                            Gratuit
                          </Badge>
                        )}
                        <ArrowRight size={16} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bibliothèque */}
            <div className="mb-8">
              <h3 className="text-base font-extrabold text-[#2C3E50] uppercase tracking-wide mb-3">Bibliothèque</h3>
              <div
                className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md cursor-pointer hover:-translate-y-0.5 transition-all"
                onClick={() => navigate('/bibliotheque')}
              >
                <div className="w-16 h-16 rounded-xl bg-[#2980B9]/10 flex items-center justify-center shrink-0">
                  <BookOpen size={28} className="text-[#2980B9]" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#2C3E50]">📚 Bibliothèque & Ressources</p>
                  <p className="text-sm text-gray-500">Documents, archives et ressources historiques</p>
                </div>
                <ArrowRight size={16} className="text-gray-400 shrink-0" />
              </div>
            </div>

            {/* Médecine Traditionnelle */}
            <div className="mb-8">
              <h3 className="text-base font-extrabold text-[#2C3E50] uppercase tracking-wide mb-3">Médecine Traditionnelle</h3>
              <div
                className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md cursor-pointer hover:-translate-y-0.5 transition-all"
                onClick={() => navigate('/medecine-traditionnelle')}
              >
                <div className="w-16 h-16 rounded-xl bg-[#E74C3C]/10 flex items-center justify-center shrink-0">
                  <span className="text-2xl">🌿</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#2C3E50]">🌿 Médecine Traditionnelle</p>
                  <p className="text-sm text-gray-500">Plantes medicinales et soins traditionnels Camerounais</p>
                </div>
                <ArrowRight size={16} className="text-gray-400 shrink-0" />
              </div>
            </div>

            {/* Premium CTA for free users */}
            {!isPremium && (
              <div className="bg-gradient-to-br from-[#8B0000] to-[#6B0000] rounded-2xl p-7 text-center shadow-xl">
                <Crown size={44} className="text-[#FFD700] mx-auto mb-3" fill="currentColor" />
                <h3 className="text-2xl font-extrabold text-white mb-1">
                  Accédez au contenu complet
                </h3>
                <p className="text-white/70 text-sm mb-5">
                  Passez Premium pour débloquer tous les éléments par catégorie (proverbes, lexique, histoire, etc.)
                </p>
                <div className="flex items-center justify-center gap-3 mb-5">
                  <span className="text-white/40 line-through text-base">2 000 FCFA</span>
                  <span className="text-3xl font-black text-[#FFD700]">1 000 FCFA</span>
                  <Badge className="bg-[#E74C3C] text-white font-bold">-50%</Badge>
                </div>
                <Button
                  onClick={handleUpgrade}
                  className="bg-[#FFD700] text-[#8B0000] hover:bg-yellow-400 font-extrabold px-8 h-12 rounded-2xl flex items-center gap-2 mx-auto shadow-lg"
                >
                  <Lock size={16} /> Passer Premium
                </Button>
                <p className="text-white/40 text-xs mt-3">🔒 Paiement sécurisé · MTN & Orange Money</p>
              </div>
            )}
          </>
        )}
      </div>

      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={() => { setShowPayment(false); }}
        userPhone={profile?.phone}
        userName={`${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`}
      />
    </div>
  );
}
