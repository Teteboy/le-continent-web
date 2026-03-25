import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Play, Pause, X, BookOpen, Loader2, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useVillageContent, FREE_LIMIT, ITEMS_PER_PAGE } from '@/hooks/useVillageContent';
import VillagePagination from '@/components/village/VillagePagination';
import LockedItemsList from '@/components/village/LockedItemsList';
import PremiumCTABanner from '@/components/premium/PremiumCTABanner';
import PaymentModal from '@/components/payment/PaymentModal';

interface Histoire {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  audio_url: string | null;
}

export default function HistoirePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isPremium = profile?.is_premium ?? false;
  const { playingId, playSound, stopSound } = useAudioPlayer();
  const [showPayment, setShowPayment] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedStory, setSelectedStory] = useState<Histoire | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  let village: { id: string; name: string } | null = null;
  try {
    const raw = searchParams.get('village');
    village = raw ? JSON.parse(raw) : null;
  } catch { village = null; }

  const { data, isLoading, error, refetch } = useVillageContent<Histoire>({
    table: 'histoires',
    villageId: village?.id,
    isPremium,
    currentPage,
    search,
    searchColumns: ['title'],
    orderBy: 'title',
    orderAscending: true,
  });

  const items = data?.items ?? [];
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

  const closeModal = () => {
    stopSound();
    setSelectedStory(null);
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
          <h1 className="text-2xl font-black text-[#2C3E50] mb-1">Histoire de {village?.name?.split(' (')[0]}</h1>
          {!isLoading && total > 0 && (
            <p className="text-gray-500 text-sm">
              {isPremium ? `${startItem}-${endItem} sur ${total} histoires` : `${items.length} histoires gratuites`}
              {!isPremium && displayLockedCount > 0 && ` · ${displayLockedCount} verrouillées`}
            </p>
          )}
          <div className="relative mt-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher une histoire..."
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-3">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={36} className="text-[#8B0000] animate-spin" />
            <p className="text-gray-500">Chargement des histoires...</p>
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
            <BookOpen size={56} className="text-gray-300" />
            <p className="text-gray-500">{search ? `Aucun résultat pour « ${search} »` : `Aucune histoire disponible pour ${village?.name?.split(' (')[0]}`}</p>
            {search && <button onClick={() => handleSearchChange('')} className="text-[#8B0000] text-sm font-semibold hover:underline">Effacer la recherche</button>}
          </div>
        )}

        {!isLoading && !error && (
          <div>
            {/* Unlocked items */}
            <div className="space-y-3 mb-4">
              {items.slice(0, isPremium ? ITEMS_PER_PAGE : FREE_LIMIT).map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/village/histoire/${item.id}?village=${encodeURIComponent(JSON.stringify(village))}`)}
                  className="w-full flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all text-left group"
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-[#9B59B6]/10 flex items-center justify-center shrink-0">
                      <BookOpen size={28} className="text-[#9B59B6]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#2C3E50] text-base leading-tight">{item.title}</p>
                    {item.content && (
                      <p className="text-gray-500 text-sm mt-1 line-clamp-2">{item.content.slice(0, 100)}...</p>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-gray-400 shrink-0 group-hover:text-[#8B0000] transition-colors" />
                </button>
              ))}
            </div>

            {/* Locked items section - show for non-premium if there's fake locked count */}
            {!isPremium && displayLockedCount > 0 && (
              <LockedItemsList<Histoire>
                items={Array(Math.min(5, displayLockedCount)).fill(null).map((_, i) => ({ id: `locked-${i}` } as Histoire))}
                onUnlock={handleUpgrade}
                renderItem={() => (
                  <button className="w-full flex items-center gap-4 p-4 text-left pointer-events-none">
                    <div className="w-20 h-20 rounded-xl bg-[#9B59B6]/10 flex items-center justify-center shrink-0">
                      <BookOpen size={28} className="text-[#9B59B6]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-400 text-base leading-tight">Histoire verrouillée</p>
                      <p className="text-gray-400 text-sm mt-1">Passez Premium pour voir plus</p>
                    </div>
                  </button>
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

      {/* Story Detail Modal */}
      <Dialog open={!!selectedStory} onOpenChange={closeModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 rounded-2xl">
          {selectedStory && (
            <>
              {selectedStory.image_url ? (
                <div className="relative h-52 rounded-t-2xl overflow-hidden">
                  <img src={selectedStory.image_url} alt={selectedStory.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {selectedStory.audio_url && (
                    <button
                      onClick={() => playSound(selectedStory.id, selectedStory.audio_url)}
                      className="absolute bottom-4 right-4 bg-[#8B0000] text-white rounded-full p-3 hover:bg-[#6B0000] transition-colors shadow-lg"
                    >
                      {playingId === selectedStory.id ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                  )}
                </div>
              ) : (
                selectedStory.audio_url && (
                  <div className="flex justify-end px-6 pt-6">
                    <button
                      onClick={() => playSound(selectedStory.id, selectedStory.audio_url)}
                      className="flex items-center gap-2 text-[#8B0000] text-sm font-semibold bg-[#8B0000]/10 hover:bg-[#8B0000]/20 px-4 py-2 rounded-full"
                    >
                      {playingId === selectedStory.id ? <><Pause size={14} /> Pause</> : <><Play size={14} className="ml-0.5" /> Écouter</>}
                    </button>
                  </div>
                )
              )}
              <div className="p-6">
                <h2 className="text-2xl font-extrabold text-[#2C3E50] mb-4">{selectedStory.title}</h2>
                {selectedStory.content ? (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{selectedStory.content}</p>
                ) : (
                  <p className="text-gray-400 italic">Contenu non disponible</p>
                )}
                <Button variant="outline" onClick={closeModal} className="w-full mt-6">Fermer</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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
