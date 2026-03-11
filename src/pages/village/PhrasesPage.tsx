import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, MessageCircle, Loader2, AlertCircle, RefreshCw, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import LockedItem from '@/components/premium/LockedItem';
import PremiumCTABanner from '@/components/premium/PremiumCTABanner';
import PaymentModal from '@/components/payment/PaymentModal';

const FREE_LIMIT = 3;

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
  const [fontSize, setFontSize] = useState(17);

  let village: { id: string; name: string } | null = null;
  try {
    const raw = searchParams.get('village');
    village = raw ? JSON.parse(raw) : null;
  } catch { village = null; }

  const [phrases, setPhrases] = useState<Phrase[]>([]);
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
        .from('phrases')
        .select('*')
        .eq('village_id', village!.id)
        .order('created_at', { ascending: true });
      if (err) throw err;
      setPhrases(data || []);
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
  const freeItems = phrases.slice(0, FREE_LIMIT);
  const lockedItems = phrases.slice(FREE_LIMIT);
  const visibleItems = isPremium ? phrases : freeItems;
  const lockedCount = isPremium ? 0 : lockedItems.length;

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
              <h1 className="text-2xl font-black text-[#2C3E50]">Phrases de {village?.name}</h1>
              {!loading && (
                <p className="text-gray-500 text-sm mt-0.5">
                  Contenu en vedette
                  {!isPremium && lockedCount > 0 && ` · 600+ verrouillées`}
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
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={36} className="text-[#8B0000] animate-spin" />
            <p className="text-gray-500">Chargement des phrases...</p>
          </div>
        )}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <AlertCircle size={48} className="text-red-500" />
            <p className="text-gray-600">{error}</p>
            <Button onClick={loadData} variant="outline" className="flex items-center gap-2"><RefreshCw size={16} /> Réessayer</Button>
          </div>
        )}
        {!loading && !error && phrases.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <MessageCircle size={56} className="text-gray-300" />
            <p className="text-gray-500">Aucune phrase disponible pour {village?.name}</p>
          </div>
        )}

        {!loading && !error && visibleItems.map((item) => (
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

        {!isPremium && lockedItems.map((item) => (
          <LockedItem key={item.id} onUpgrade={handleUpgrade}>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-4" style={{ borderLeftColor: '#16A085' }}>
              <p className="text-[#1C1C1E] leading-relaxed font-medium" style={{ fontSize }}>{item.content}</p>
              {item.translation && (
                <div className="flex items-start gap-2 mt-4 pt-4 border-t border-gray-100">
                  <p className="text-gray-500 text-sm italic">{item.translation}</p>
                </div>
              )}
            </div>
          </LockedItem>
        ))}

        {!isPremium && lockedCount > 0 && (
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
