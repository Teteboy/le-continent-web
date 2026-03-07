import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Volume2, VolumeX, Loader2, AlertCircle, RefreshCw, BookOpen, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import LockedItem from '@/components/premium/LockedItem';
import PremiumCTABanner from '@/components/premium/PremiumCTABanner';
import PaymentModal from '@/components/payment/PaymentModal';

const FREE_LIMIT = 3;

interface LexiqueEntry {
  id: string;
  french: string;
  local: string;
  audio_url: string | null;
}

export default function LexiquePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isPremium = profile?.is_premium ?? false;
  const { playingId, playSound } = useAudioPlayer();
  const [showPayment, setShowPayment] = useState(false);
  const [search, setSearch] = useState('');

  let village: { id: string; name: string } | null = null;
  try {
    const raw = searchParams.get('village');
    village = raw ? JSON.parse(raw) : null;
  } catch { village = null; }

  const [lexique, setLexique] = useState<LexiqueEntry[]>([]);
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
        .from('lexique')
        .select('*')
        .eq('village_id', village!.id)
        .order('french', { ascending: true });
      if (err) throw err;
      setLexique(data || []);
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

  const filtered = lexique.filter(item =>
    item.french.toLowerCase().includes(search.toLowerCase()) ||
    item.local.toLowerCase().includes(search.toLowerCase())
  );

  const freeItems = filtered.slice(0, FREE_LIMIT);
  const lockedItems = filtered.slice(FREE_LIMIT);
  const visibleItems = isPremium ? filtered : freeItems;
  const lockedCount = isPremium ? 0 : Math.max(0, lexique.length - FREE_LIMIT);

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
          <h1 className="text-2xl font-black text-[#2C3E50] mb-1">Lexique de {village?.name}</h1>
          {!loading && (
            <p className="text-gray-500 text-sm">
              {filtered.length} mot{filtered.length > 1 ? 's' : ''}
              {!isPremium && lockedCount > 0 && ` · ${lockedCount} verrouillé${lockedCount > 1 ? 's' : ''}`}
            </p>
          )}
          {/* Search */}
          <div className="relative mt-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher un mot..."
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={36} className="text-[#8B0000] animate-spin" />
            <p className="text-gray-500">Chargement du lexique...</p>
          </div>
        )}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <AlertCircle size={48} className="text-red-500" />
            <p className="text-gray-600">{error}</p>
            <Button onClick={loadData} variant="outline" className="flex items-center gap-2"><RefreshCw size={16} /> Réessayer</Button>
          </div>
        )}
        {!loading && !error && lexique.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <BookOpen size={56} className="text-gray-300" />
            <p className="text-gray-500">Aucun mot disponible pour {village?.name}</p>
          </div>
        )}

        {!loading && !error && lexique.length > 0 && (
          <>
            {/* Table header */}
            <div className="grid grid-cols-[1fr_1fr_auto] gap-4 px-4 py-2 mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Français</span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{village?.name}</span>
              <span className="w-8" />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {visibleItems.map((item, idx) => (
                <div
                  key={item.id}
                  className={`grid grid-cols-[1fr_1fr_auto] gap-4 items-center px-4 py-4 ${idx < visibleItems.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
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
              ))}

              {/* Locked rows */}
              {!isPremium && lockedItems.map((item) => (
                <LockedItem key={item.id} onUpgrade={handleUpgrade}>
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-4 items-center px-4 py-4 border-b border-gray-100">
                    <span className="font-semibold text-[#2C3E50] text-sm">{item.french}</span>
                    <span className="text-gray-700 text-sm">{item.local}</span>
                    <div className="w-8 h-8" />
                  </div>
                </LockedItem>
              ))}
            </div>

            {!isPremium && lockedCount > 0 && (
              <div className="mt-6">
                <PremiumCTABanner lockedCount={lockedCount} onUpgrade={handleUpgrade} compact />
              </div>
            )}

            {search && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Search size={40} className="text-gray-300" />
                <p className="text-gray-500">Aucun résultat pour « {search} »</p>
                <button onClick={() => setSearch('')} className="text-[#8B0000] text-sm font-semibold hover:underline">Effacer la recherche</button>
              </div>
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
