import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, MessageCircle, Loader2, AlertCircle, RefreshCw, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useVillageContent, FREE_LIMIT, ITEMS_PER_PAGE } from '@/hooks/useVillageContent';
import VillagePagination from '@/components/village/VillagePagination';
import LockedItemsList from '@/components/village/LockedItemsList';
import PremiumCTABanner from '@/components/premium/PremiumCTABanner';
import PaymentModal from '@/components/payment/PaymentModal';

interface Phrase {
  id: string;
  content: string;
  translation: string | null;
  audio_url: string | null;
}

export default function PhrasesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isPremium = profile?.is_premium ?? false;
  const { playingId, playSound } = useAudioPlayer();
  const [showPayment, setShowPayment] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [fontSize, setFontSize] = useState(17);

  let village: { id: string; name: string } | null = null;
  try {
    const raw = searchParams.get('village');
    village = raw ? JSON.parse(raw) : null;
  } catch { village = null; }

  const { data, isLoading, error, refetch } = useVillageContent<Phrase>({
    table: 'phrases',
    villageId: village?.id,
    isPremium,
    currentPage,
    orderBy: 'created_at',
    orderAscending: true,
  });

  const items = data?.items ?? [];
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
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-[#2C3E50]">Phrases de {village?.name?.split(' (')[0]}</h1>
              {!isLoading && total > 0 && (
                <p className="text-gray-500 text-sm mt-0.5">
                  {isPremium
                    ? `${startItem}-${endItem} sur ${total} phrases`
                    : `${items.length} phrases gratuites`}
                  {!isPremium && displayLockedCount > 0 && ` · ${displayLockedCount} verrouillées`}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2 shrink-0">
              <button onClick={() => setFontSize(f => Math.max(13, f - 2))} className="text-[#8B0000] font-bold text-sm w-6 h-6 flex items-center justify-center rounded hover:bg-white">A-</button>
              <span className="text-xs text-gray-400 px-1">Aa</span>
              <button onClick={() => setFontSize(f => Math.min(28, f + 2))} className="text-[#8B0000] font-bold text-sm w-6 h-6 flex items-center justify-center rounded hover:bg-white">A+</button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={36} className="text-[#8B0000] animate-spin" />
            <p className="text-gray-500">Chargement des phrases...</p>
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
            <MessageCircle size={56} className="text-gray-300" />
            <p className="text-gray-500">Aucune phrase disponible pour {village?.name?.split(' (')[0]}</p>
          </div>
        )}

        {!isLoading && !error && (
          <div>
            {/* Unlocked items */}
            <div className="space-y-4 mb-4">
              {items.slice(0, isPremium ? ITEMS_PER_PAGE : FREE_LIMIT).map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-4"
                  style={{ borderLeftColor: '#16A085' }}
                >
                  {item.audio_url && (
                    <div className="flex justify-end mb-3">
                      <button
                        onClick={() => playSound(item.id, item.audio_url)}
                        className="flex items-center gap-2 text-[#16A085] text-xs font-semibold bg-[#16A085]/10 hover:bg-[#16A085]/20 px-3 py-1.5 rounded-full transition-colors"
                      >
                        {playingId === item.id
                          ? <><Pause size={13} /> Pause</>
                          : <><Play size={13} className="ml-0.5" /> Écouter</>
                        }
                      </button>
                    </div>
                  )}
                  <p className="text-[#1C1C1E] leading-relaxed font-medium" style={{ fontSize }}>
                    {item.content}
                  </p>
                  {item.translation && (
                    <div className="flex items-start gap-2 mt-4 pt-4 border-t border-gray-100">
                      <Volume2 size={14} className="text-gray-400 shrink-0 mt-0.5" />
                      <p className="text-gray-500 text-sm italic">{item.translation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Locked items section - show for non-premium if there's fake locked count */}
            {!isPremium && displayLockedCount > 0 && (
              <LockedItemsList<Phrase>
                items={Array(Math.min(5, displayLockedCount)).fill(null).map((_, i) => ({ id: `locked-${i}` } as Phrase))}
                onUnlock={handleUpgrade}
                renderItem={() => (
                  <div className="p-5 border-l-4" style={{ borderLeftColor: '#16A085' }}>
                    <p className="text-gray-400 leading-relaxed font-medium" style={{ fontSize }}>
                      Contenu verrouillé
                    </p>
                    <div className="flex items-start gap-2 mt-4 pt-4 border-t border-gray-100">
                      <p className="text-gray-400 text-sm italic">Passez Premium pour voir plus de phrases</p>
                    </div>
                  </div>
                )}
                compact
              />
            )}
          </div>
        )}

        {!isLoading && !error && !isPremium && displayLockedCount > 0 && (
          <PremiumCTABanner lockedCount={displayLockedCount} onUpgrade={handleUpgrade} />
        )}

        {/* Pagination - ONLY for premium */}
        {isPremium && (
          <VillagePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
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
