import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X, UtensilsCrossed, Loader2, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import LockedItem from '@/components/premium/LockedItem';
import PremiumCTABanner from '@/components/premium/PremiumCTABanner';
import PaymentModal from '@/components/payment/PaymentModal';

const FREE_LIMIT = 3;

interface Met {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
}

export default function MetsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isPremium = profile?.is_premium ?? false;
  const [showPayment, setShowPayment] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedMet, setSelectedMet] = useState<Met | null>(null);

  let village: { id: string; name: string } | null = null;
  try {
    const raw = searchParams.get('village');
    village = raw ? JSON.parse(raw) : null;
  } catch { village = null; }

  const [mets, setMets] = useState<Met[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!village?.id) { setError('Village non spécifié'); setLoading(false); return; }
    loadData();
  }, [village?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      setLoading(true); setError(null);
      const { data, error: err } = await supabase
        .from('mets')
        .select('*')
        .eq('village_id', village!.id)
        .order('name', { ascending: true });
      if (err) throw err;
      setMets(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de chargement';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    if (!user) { navigate('/inscription'); return; }
    setShowPayment(true);
  };

  const villageParam = encodeURIComponent(JSON.stringify(village));
  const filtered = mets.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
  const freeItems = filtered.slice(0, FREE_LIMIT);
  const lockedItems = filtered.slice(FREE_LIMIT);
  const visibleItems = isPremium ? filtered : freeItems;
  const lockedCount = isPremium ? 0 : Math.max(0, mets.length - FREE_LIMIT);

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
          <h1 className="text-2xl font-black text-[#2C3E50] mb-1">Mets de {village?.name}</h1>
          {!loading && (
            <p className="text-gray-500 text-sm">
              Contenu en vedette
              {!isPremium && lockedCount > 0 && ` · ${lockedCount} verrouillé${lockedCount > 1 ? 's' : ''}`}
            </p>
          )}
          <div className="relative mt-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher un plat..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-9 border-gray-200 focus-visible:ring-[#8B0000]"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-3">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={36} className="text-[#8B0000] animate-spin" />
            <p className="text-gray-500">Chargement des mets...</p>
          </div>
        )}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <AlertCircle size={48} className="text-red-500" />
            <p className="text-gray-600">{error}</p>
            <Button onClick={loadData} variant="outline" className="flex items-center gap-2"><RefreshCw size={16} /> Réessayer</Button>
          </div>
        )}
        {!loading && !error && mets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <UtensilsCrossed size={56} className="text-gray-300" />
            <p className="text-gray-500">Aucun plat disponible pour {village?.name}</p>
          </div>
        )}

        {!loading && !error && visibleItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedMet(item)}
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
              {item.description && <p className="text-gray-500 text-sm mt-0.5 line-clamp-2">{item.description}</p>}
            </div>
            <ChevronRight size={18} className="text-gray-400 shrink-0 group-hover:text-[#8B0000] transition-colors" />
          </button>
        ))}

        {!isPremium && lockedItems.map((item) => (
          <LockedItem key={item.id} onUpgrade={handleUpgrade}>
            <div className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <UtensilsCrossed size={28} className="text-gray-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#2C3E50] text-base">{item.name}</p>
                {item.description && <p className="text-gray-500 text-sm mt-0.5 line-clamp-2">{item.description}</p>}
              </div>
            </div>
          </LockedItem>
        ))}

        {!isPremium && lockedCount > 0 && (
          <PremiumCTABanner lockedCount={lockedCount} onUpgrade={handleUpgrade} />
        )}
      </div>

      {/* Met Detail Modal */}
      <Dialog open={!!selectedMet} onOpenChange={() => setSelectedMet(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-0 rounded-2xl">
          {selectedMet && (
            <>
              {selectedMet.image_url ? (
                <img src={selectedMet.image_url} alt={selectedMet.name} className="w-full h-52 object-cover rounded-t-2xl" />
              ) : (
                <div className="w-full h-40 bg-[#E67E22]/10 flex items-center justify-center rounded-t-2xl">
                  <UtensilsCrossed size={52} className="text-[#E67E22]" />
                </div>
              )}
              <div className="p-6">
                <h2 className="text-2xl font-extrabold text-[#2C3E50] mb-3">{selectedMet.name}</h2>
                <p className="text-sm text-[#8B0000] font-semibold mb-1">Village : {village?.name}</p>
                {selectedMet.description ? (
                  <p className="text-gray-700 leading-relaxed mt-3">{selectedMet.description}</p>
                ) : (
                  <p className="text-gray-400 italic mt-3">Aucune description disponible.</p>
                )}
                <Button variant="outline" onClick={() => setSelectedMet(null)} className="w-full mt-6">Fermer</Button>
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
