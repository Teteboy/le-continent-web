import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Volume2, VolumeX, Type, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useVillageContent, FREE_LIMIT, ITEMS_PER_PAGE } from '@/hooks/useVillageContent';
import VillagePagination from '@/components/village/VillagePagination';
import LockedItemsList from '@/components/village/LockedItemsList';
import PremiumCTABanner from '@/components/premium/PremiumCTABanner';
import PaymentModal from '@/components/payment/PaymentModal';

interface VillageData {
  id: string;
  name: string;
  description: string | null;
}

interface AlphabetEntry {
  id: string;
  french: string;
  local: string;
  audio_url: string | null;
}

export default function AlphabetPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const isPremium = profile?.is_premium ?? false;
  const { playingId, playSound } = useAudioPlayer();
  const [showPayment, setShowPayment] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  let village: { id: string; name: string; description?: string } | null = null;
  try {
    const raw = searchParams.get('village');
    village = raw ? JSON.parse(raw) : null;
  } catch { village = null; }

  // Fetch village details including description
  const { data: villageData } = useQuery({
    queryKey: ['village', village?.id],
    queryFn: async () => {
      if (!village?.id) return null;
      const API_BASE = import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL
        : (import.meta.env.DEV ? 'http://localhost:3000' : 'https://api.lecontinent.cm');
      const response = await fetch(`${API_BASE}/api/content/villages`);
      if (!response.ok) return null;
      const villages = await response.json();
      return villages.find((v: VillageData) => v.id === village?.id) || null;
    },
    enabled: !!village?.id,
  });

  const { data, isLoading, error, refetch } = useVillageContent<AlphabetEntry>({
    table: 'alphabet',
    villageId: village?.id,
    isPremium,
    currentPage,
    orderBy: 'french',
    orderAscending: true,
    authLoading,
  });

  const items: AlphabetEntry[] = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const lockedCount = data?.lockedCount ?? 0;
  const displayLockedCount = !isPremium && data?.fakeLockedCount ? data.fakeLockedCount : lockedCount;
  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, total);

  const handleUpgrade = () => {
    if (!user) { navigate('/inscription'); return; }
    setShowPayment(true);
  };

  const villageParam = encodeURIComponent(JSON.stringify(village));

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-16 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={() => navigate(`/village-options?village=${villageParam}`)}
            className="flex items-center gap-1.5 text-[#8B0000] font-semibold text-sm mb-2 hover:text-[#6B0000]"
          >
            <ArrowLeft size={16} /> Retour
          </button>
          <h1 className="text-2xl font-black text-[#2C3E50] mb-1">Alphabet de {village?.name?.split(' (')[0]}</h1>
          {!isLoading && total > 0 && (
            <p className="text-gray-500 text-sm">
              {isPremium ? `${startItem}-${endItem} sur ${total} lettres` : `${items.length} lettres gratuites`}
              {!isPremium && displayLockedCount > 0 && ` · ${displayLockedCount} verrouillées`}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Language description */}
        {(villageData?.description || village?.description) && (
          <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
            <p className="text-gray-700 text-sm leading-relaxed">
              {villageData?.description || village?.description}
            </p>
          </div>
        )}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={36} className="text-[#8B0000] animate-spin" />
            <p className="text-gray-500">Chargement de l'alphabet...</p>
          </div>
        )}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <AlertCircle size={48} className="text-red-500" />
            <p className="text-gray-600">{error instanceof Error ? error.message : 'Erreur de chargement'}</p>
            <Button onClick={() => refetch()} variant="outline" className="flex items-center gap-2"><RefreshCw size={16} /> Réessayer</Button>
          </div>
        )}
        {!isLoading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <Type size={56} className="text-gray-300" />
            <p className="text-gray-500">Aucune donnée d'alphabet pour {village?.name?.split(' (')[0]}</p>
          </div>
        )}

        {!isLoading && !error && items.length > 0 && (
          <>
            {/* Header row */}
            <div className="grid grid-cols-[1fr_1fr_auto] gap-4 px-4 py-2 mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Français</span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{village?.name?.split(' (')[0]}</span>
              <span className="w-10 text-xs font-bold text-gray-400 uppercase tracking-wide text-center">Audio</span>
            </div>

            <div>
              {/* Unlocked items */}
              <div className="space-y-2 mb-4">
                {items.slice(0, isPremium ? ITEMS_PER_PAGE : FREE_LIMIT).map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                  >
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-4 items-center px-4 py-4">
                      <span className="font-bold text-[#2C3E50] text-lg">{item.french}</span>
                      <span className="text-gray-700 text-lg font-medium">{item.local}</span>
                      <button
                        onClick={() => playSound(item.id, item.audio_url)}
                        disabled={!item.audio_url}
                        className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30"
                        style={{ color: item.audio_url ? '#8B0000' : '#ccc' }}
                      >
                        {item.audio_url
                          ? (playingId === item.id ? <VolumeX size={20} /> : <Volume2 size={20} />)
                          : <VolumeX size={20} />
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Locked items section - show for non-premium if there's fake locked count */}
              {!isPremium && displayLockedCount > 0 && (
                <LockedItemsList<AlphabetEntry>
                  items={Array(Math.min(5, displayLockedCount)).fill(null).map((_, i) => ({ id: `locked-${i}` } as AlphabetEntry))}
                  onUnlock={handleUpgrade}
                  renderItem={() => (
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-4 items-center px-4 py-4">
                      <span className="font-bold text-gray-400 text-lg">Contenu verrouillé</span>
                      <span className="text-gray-400 text-lg">---</span>
                      <div className="w-10 h-10" />
                    </div>
                  )}
                  maxInitialDisplay={5}
                  compact
                />
              )}
            </div>

            {!isPremium && displayLockedCount > 0 && (
              <div className="mt-6">
                <PremiumCTABanner lockedCount={displayLockedCount} onUpgrade={handleUpgrade} />
              </div>
            )}

            {/* Pagination - ONLY for premium */}
            {isPremium && (
              <VillagePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>

      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={() => setShowPayment(false)}
        userPhone={profile?.phone}
        userName={`${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`}
      />
    </div>
  );
}
