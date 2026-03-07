import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Loader2, AlertCircle, RefreshCw, BookOpen, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import LockedItem from '@/components/premium/LockedItem';
import PremiumCTABanner from '@/components/premium/PremiumCTABanner';
import PaymentModal from '@/components/payment/PaymentModal';

const FREE_LIMIT = 3;

interface Proverbe {
  id: string;
  content: string;
  translation: string | null;
  audio_url: string | null;
}

export default function ProverbesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isPremium = profile?.is_premium ?? false;
  const { playingId, playSound } = useAudioPlayer();
  const [showPayment, setShowPayment] = useState(false);

  let village: { id: string; name: string } | null = null;
  try {
    const raw = searchParams.get('village');
    village = raw ? JSON.parse(raw) : null;
  } catch { village = null; }

  const [proverbes, setProverbes] = useState<Proverbe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(17);

  useEffect(() => {
    if (!village?.id) { setError('Village non spécifié'); setLoading(false); return; }
    loadData();
  }, [village?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      setLoading(true); setError(null);
      const { data, error: err } = await supabase
        .from('proverbes')
        .select('*')
        .eq('village_id', village!.id)
        .order('created_at', { ascending: true });
      if (err) throw err;
      setProverbes(data || []);
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
  const freeItems = proverbes.slice(0, FREE_LIMIT);
  const lockedItems = proverbes.slice(FREE_LIMIT);
  const visibleItems = isPremium ? proverbes : freeItems;
  const lockedCount = isPremium ? 0 : lockedItems.length;

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-16 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate(`/village-options?village=${villageParam}`)}
              className="flex items-center gap-1.5 text-[#8B0000] hover:text-[#6B0000] font-semibold text-sm"
            >
              <ArrowLeft size={16} /> Retour
            </button>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-[#2C3E50]">Proverbes de {village?.name}</h1>
              {!loading && (
                <p className="text-gray-500 text-sm mt-0.5">
                  {proverbes.length} proverbe{proverbes.length > 1 ? 's' : ''}
                  {!isPremium && lockedCount > 0 && ` · ${lockedCount} verrouillé${lockedCount > 1 ? 's' : ''}`}
                </p>
              )}
            </div>
            {/* Font size controls */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2 shrink-0">
              <button onClick={() => setFontSize(f => Math.max(13, f - 2))} className="text-[#8B0000] font-bold text-sm w-6 h-6 flex items-center justify-center rounded hover:bg-white">A-</button>
              <span className="text-xs text-gray-400 px-1">Aa</span>
              <button onClick={() => setFontSize(f => Math.min(28, f + 2))} className="text-[#8B0000] font-bold text-sm w-6 h-6 flex items-center justify-center rounded hover:bg-white">A+</button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={36} className="text-[#8B0000] animate-spin" />
            <p className="text-gray-500">Chargement des proverbes...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <AlertCircle size={48} className="text-red-500" />
            <p className="text-gray-600">{error}</p>
            <Button onClick={loadData} variant="outline" className="flex items-center gap-2">
              <RefreshCw size={16} /> Réessayer
            </Button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && proverbes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <BookOpen size={56} className="text-gray-300" />
            <p className="text-gray-500">Aucun proverbe disponible pour {village?.name}</p>
            <Link to="/contact" className="text-[#8B0000] text-sm font-semibold hover:underline">Nous contacter pour en ajouter</Link>
          </div>
        )}

        {/* Free items */}
        {!loading && !error && visibleItems.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            {item.audio_url && (
              <div className="flex justify-end mb-3">
                <button
                  onClick={() => playSound(item.id, item.audio_url)}
                  className="flex items-center gap-2 text-[#8B0000] text-xs font-semibold bg-[#8B0000]/5 hover:bg-[#8B0000]/10 px-3 py-1.5 rounded-full transition-colors"
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

        {/* Locked items */}
        {!loading && !error && !isPremium && lockedItems.map((item) => (
          <LockedItem key={item.id} onUpgrade={handleUpgrade}>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-[#1C1C1E] leading-relaxed font-medium" style={{ fontSize }}>
                {item.content}
              </p>
              {item.translation && (
                <div className="flex items-start gap-2 mt-4 pt-4 border-t border-gray-100">
                  <p className="text-gray-500 text-sm italic">{item.translation}</p>
                </div>
              )}
            </div>
          </LockedItem>
        ))}

        {/* Premium CTA */}
        {!loading && !error && !isPremium && lockedCount > 0 && (
          <PremiumCTABanner lockedCount={lockedCount} onUpgrade={handleUpgrade} />
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
