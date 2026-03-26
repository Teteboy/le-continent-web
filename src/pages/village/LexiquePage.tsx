import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Volume2, VolumeX, Loader2, AlertCircle, RefreshCw, BookOpen, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useVillageContent, FREE_LIMIT, ITEMS_PER_PAGE } from '@/hooks/useVillageContent';
import VillagePagination from '@/components/village/VillagePagination';
import LockedItemsList from '@/components/village/LockedItemsList';
import PremiumCTABanner from '@/components/premium/PremiumCTABanner';
import PaymentModal from '@/components/payment/PaymentModal';

interface LexiqueEntry {
  id: string;
  french: string;
  local: string;
  audio_url: string | null;
}

export default function LexiquePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const isPremium = profile?.is_premium ?? false;
  const { playingId, playSound } = useAudioPlayer();
  const [showPayment, setShowPayment] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  let village: { id: string; name: string } | null = null;
  try {
    const raw = searchParams.get('village');
    village = raw ? JSON.parse(raw) : null;
  } catch { village = null; }

  const { data, isLoading, error, refetch } = useVillageContent<LexiqueEntry>({
    table: 'lexique',
    villageId: village?.id,
    isPremium,
    currentPage,
    search,
    searchColumns: ['french', 'local'],
    orderBy: 'french',
    orderAscending: true,
    authLoading,
  });

  const items: LexiqueEntry[] = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const lockedCount = data?.lockedCount ?? 0;
  const displayLockedCount = !isPremium && data?.fakeLockedCount ? data.fakeLockedCount : lockedCount;
  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, total);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleUpgrade = () => {
    if (!user) { navigate('/inscription'); return; }
    setShowPayment(true);
  };

  const villageParam = encodeURIComponent(JSON.stringify(village));

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-16 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={() => navigate(`/village-options?village=${villageParam}`)}
            className="flex items-center gap-1.5 text-[#8B0000] hover:text-[#6B0000] font-semibold text-sm mb-2"
          >
            <ArrowLeft size={16} /> Retour
          </button>
          <h1 className="text-2xl font-black text-[#2C3E50] mb-1">Lexique de {village?.name?.split(' (')[0]}</h1>
          {!isLoading && total > 0 && (
            <p className="text-gray-500 text-sm">
              {isPremium ? `${startItem}-${endItem} sur ${total} mots` : `${items.length} mots gratuits`}
              {!isPremium && displayLockedCount > 0 && ` · ${displayLockedCount} verrouillés`}
            </p>
          )}
          <div className="relative mt-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher un mot..."
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              className="pl-9 pr-9 border-gray-200 focus-visible:ring-[#8B0000]"
            />
            {search && (
              <button onClick={() => handleSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={36} className="text-[#8B0000] animate-spin" />
            <p className="text-gray-500">Chargement du lexique...</p>
          </div>
        )}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <AlertCircle size={48} className="text-red-500" />
            <p className="text-gray-600">{error instanceof Error ? error.message : 'Erreur de chargement'}</p>
            <Button onClick={() => refetch()} variant="outline" className="flex items-center gap-2"><RefreshCw size={16} /> Réessayer</Button>
          </div>
        )}
        {!isLoading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <BookOpen size={56} className="text-gray-300" />
            <p className="text-gray-500">{search ? `Aucun résultat pour « ${search} »` : `Aucun mot disponible pour ${village?.name?.split(' (')[0]}`}</p>
            {search && <button onClick={() => handleSearchChange('')} className="text-[#8B0000] text-sm font-semibold hover:underline">Effacer la recherche</button>}
          </div>
        )}

        {!isLoading && !error && items.length > 0 && (
          <>
            <div className="grid grid-cols-[1fr_1fr_auto] gap-4 px-4 py-2 mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Français</span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{village?.name?.split(' (')[0]}</span>
              <span className="w-8" />
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
                      <span className="font-semibold text-[#2C3E50] text-sm">{item.french}</span>
                      <span className="text-gray-700 text-sm">{item.local}</span>
                      <button
                        onClick={() => playSound(item.id, item.audio_url)}
                        disabled={!item.audio_url}
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30"
                        style={{ color: item.audio_url ? '#8B0000' : '#ccc' }}
                      >
                        {item.audio_url
                          ? (playingId === item.id ? <VolumeX size={18} /> : <Volume2 size={18} />)
                          : <VolumeX size={18} />
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Locked items section - show for non-premium if there's fake locked count */}
              {!isPremium && displayLockedCount > 0 && (
                <LockedItemsList<LexiqueEntry>
                  items={Array(Math.min(5, displayLockedCount)).fill(null).map((_, i) => ({ id: `locked-${i}` } as LexiqueEntry))}
                  onUnlock={handleUpgrade}
                  renderItem={() => (
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-4 items-center px-4 py-4">
                      <span className="font-semibold text-gray-400 text-sm">Contenu verrouillé</span>
                      <span className="text-gray-400 text-sm">---</span>
                      <div className="w-8 h-8" />
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
