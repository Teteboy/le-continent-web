import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X, UtensilsCrossed, Loader2, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useVillageContent, FREE_LIMIT, ITEMS_PER_PAGE } from '@/hooks/useVillageContent';
import VillagePagination from '@/components/village/VillagePagination';
import LockedItemsList from '@/components/village/LockedItemsList';
import PremiumCTABanner from '@/components/premium/PremiumCTABanner';
import PaymentModal from '@/components/payment/PaymentModal';

// Parse description into structured format
// Description parser moved to MetsDetailPage

interface Met {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
}

export default function MetsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const isPremium = profile?.is_premium ?? false;
  const [showPayment, setShowPayment] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  let village: { id: string; name: string } | null = null;
  try {
    const raw = searchParams.get('village');
    village = raw ? JSON.parse(raw) : null;
  } catch { village = null; }

  const { data, isLoading, error, refetch } = useVillageContent<Met>({
    table: 'mets',
    villageId: village?.id,
    isPremium,
    currentPage,
    search,
    searchColumns: ['name'],
    orderBy: 'name',
    orderAscending: true,
    authLoading,
  });

  const items: Met[] = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const lockedCount = data?.lockedCount ?? 0;
  const displayLockedCount = !isPremium && data?.fakeLockedCount ? data.fakeLockedCount : lockedCount;
  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, total);

  const unlockedOnPage = isPremium ? ITEMS_PER_PAGE : Math.max(0, FREE_LIMIT - (currentPage - 1) * ITEMS_PER_PAGE);
  const unlockedItems = items.slice(0, unlockedOnPage);
  const lockedOnPage = Math.max(0, ITEMS_PER_PAGE - unlockedItems.length);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleUpgrade = () => {
    if (!user) { navigate('/inscription?redirect=payment'); return; }
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
          <h1 className="text-2xl font-black text-[#2C3E50] mb-1">Mets de {village?.name?.split(' (')[0]}</h1>
          {!isLoading && total > 0 && (
            <p className="text-gray-500 text-sm">
              {isPremium ? `${startItem}-${endItem} sur ${total} plats` : `${unlockedItems.length} plats gratuits`}
              {!isPremium && displayLockedCount > 0 && ` · ${displayLockedCount} verrouillés`}
            </p>
          )}
          <div className="relative mt-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher un plat..."
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
            <p className="text-gray-500">Chargement des mets...</p>
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
            <UtensilsCrossed size={56} className="text-gray-300" />
            <p className="text-gray-500">{search ? `Aucun résultat pour « ${search} »` : `Aucun plat disponible pour ${village?.name?.split(' (')[0]}`}</p>
            {search && <button onClick={() => handleSearchChange('')} className="text-[#8B0000] text-sm font-semibold hover:underline">Effacer la recherche</button>}
          </div>
        )}

        {!isLoading && !error && (
          <div>
            {/* Unlocked items */}
            <div className="space-y-3 mb-4">
              {unlockedItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/village/mets/${item.id}?village=${encodeURIComponent(JSON.stringify(village))}`)}
                  className="w-full flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all text-left group"
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-[#E67E22]/10 flex items-center justify-center shrink-0">
                      <UtensilsCrossed size={28} className="text-[#E67E22]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#2C3E50] text-base">{item.name}</p>
                    {item.description && (
                      <p className="text-gray-500 text-sm mt-0.5 line-clamp-2">
                        {item.description.replace(//g, '•').replace(/•/g, '•').split('•')[0].trim() || item.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-gray-400 shrink-0 group-hover:text-[#8B0000] transition-colors" />
                </button>
              ))}
            </div>

            {/* Locked items section - show for non-premium if there are locked on this page */}
            {!isPremium && lockedOnPage > 0 && (
              <LockedItemsList<Met>
                items={Array(lockedOnPage).fill(null).map((_, i) => ({ id: `locked-${i}` } as Met))}
                onUnlock={handleUpgrade}
    renderItem={() => <button className="w-full flex items-center gap-4 p-4 text-left pointer-events-none">
      <div className="w-20 h-20 rounded-xl bg-[#E67E22]/10 flex items-center justify-center shrink-0">
        <UtensilsCrossed size={28} className="text-[#E67E22]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[#2C3E50] text-base">Contenu verrouillé</p>
        <p className="text-gray-500 text-sm mt-0.5">Passez Premium pour voir plus</p>
      </div>
    </button>}
                maxInitialDisplay={lockedOnPage}
                compact
              />
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <VillagePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}

        {!isLoading && !error && !isPremium && displayLockedCount > 0 && (
          <PremiumCTABanner lockedCount={displayLockedCount} onUpgrade={handleUpgrade} />
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

