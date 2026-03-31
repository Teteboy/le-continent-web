import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users, BookOpen, Lightbulb, Star, Lock, CheckCircle, MapPin, Clock,
  Crown, ArrowRight, Sparkles, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { INVENTIONS, TRADITIONAL_JOBS, PREMIUM_CONTENT } from '@/data/inventions';
import { useAuth } from '@/hooks/useAuth';
import CultureDetailModal from '@/components/home/CultureDetailModal';
import PaymentModal from '@/components/payment/PaymentModal';
import type { Culture } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { resilientFetch } from '@/lib/fetch';

export default function HomePage() {
  const { user, profile } = useAuth();
  const isPremium = profile?.is_premium ?? false;
  const navigate = useNavigate();
  const [selectedCulture, setSelectedCulture] = useState<Culture | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  
  // Carousel state for villages
  const [selectedVillage, setSelectedVillage] = useState<{ id: string; name: string; region: string | null; image_url: string | null } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUserInteracting = useRef(false);
  const scrollIntervalRef = useRef<number | null>(null);

  // Fetch villages from backend API (with Redis caching for faster loads)
  const { data: villages = [], isLoading: villagesLoading } = useQuery({
    queryKey: ['villages'],
    queryFn: async () => {
      const API_BASE = import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL
        : (import.meta.env.DEV ? 'http://localhost:3000' : 'https://api.lecontinent.cm');

      const response = await resilientFetch(`${API_BASE}/api/content/villages`);
      if (!response.ok) throw new Error('Failed to fetch villages');
      return response.json();
    },
    // Use specific config for villages - very aggressive caching
    staleTime: 60 * 60 * 1000, // 1 hour - villages don't change often
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchInterval: false, // Disable auto-refresh
    refetchOnMount: false, // Don't refetch on mount - use cached data
    refetchOnWindowFocus: false, // Disable refetch on window focus
    refetchOnReconnect: false, // Disable refetch on reconnect
    retry: 1, // Only retry once
    retryDelay: 500,
  });

  // Auto-scroll effect with pause on hover for manual sliding
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || villages.length === 0) return;

    const startAutoScroll = () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = window.setInterval(() => {
        if (!isUserInteracting.current && container) {
          const maxScroll = container.scrollWidth - container.clientWidth;
          if (container.scrollLeft >= maxScroll - 10) {
            container.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            container.scrollBy({ left: 320, behavior: 'smooth' });
          }
        }
      }, 2500);
    };

    startAutoScroll();

    // Pause on user interaction
    const handleMouseDown = () => { isUserInteracting.current = true; };
    const handleMouseUp = () => { isUserInteracting.current = false; };
    const handleTouchStart = () => { isUserInteracting.current = true; };
    const handleTouchEnd = () => { 
      isUserInteracting.current = false;
      startAutoScroll();
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [villages.length]);

  // No manual retry loop needed — TanStack Query handles retries automatically.

  const handleVillageClick = (village: { id: string; name: string; region: string | null; image_url: string | null }) => {
    setSelectedVillage(village);
  };

  const handleExploreFree = () => {
    if (selectedVillage) {
      navigate(`/village-options?village=${encodeURIComponent(JSON.stringify(selectedVillage))}`);
    }
    setSelectedVillage(null);
  };

  const handleUpgrade = () => {
    if (!user) { navigate('/inscription?redirect=payment'); return; }
    setShowPayment(true);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Hero banner */}
      <div className="relative h-72 sm:h-80 bg-cover bg-center" style={{ backgroundImage: 'url(/1.jpeg)' }}>
        <div className="absolute inset-0 hero-overlay" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <div className="inline-flex items-center gap-2 bg-[#FFD700]/20 text-[#FFD700] text-xs font-bold px-4 py-1.5 rounded-full mb-4 border border-[#FFD700]/30">
            <Sparkles size={12} /> Le Panthéon Culturel
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white drop-shadow-lg mb-2">Le Continent</h1>
          <p className="text-[#FFD700] font-semibold text-base mb-5">Explorez la richesse culturelle du Cameroun</p>
          <div className="flex gap-4">
            {[
              { num: '250+', label: 'Ethnies' },
              { num: '280+', label: 'Langues' },
              { num: '3', label: 'Cultures gratuites' },
            ].map((s) => (
              <div key={s.label} className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-2.5 text-center">
                <div className="text-xl font-black text-[#FFD700]">{s.num}</div>
                <div className="text-xs text-white">{s.label}</div>
              </div>
            ))}
          </div>
          {isPremium && (
            <div className="flex items-center gap-2 bg-[#8B0000]/80 text-[#FFD700] px-5 py-2 rounded-full text-sm font-bold mt-4 border border-[#FFD700]/30">
              <Crown size={14} fill="currentColor" /> Compte Premium Actif
            </div>
          )}
        </div>
      </div>

      {/* Cultures section - Carousel */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users size={20} className="text-[#8B0000]" />
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#2C3E50]">Cultures Camerounaises</h2>
                <Badge className="bg-[#27AE60]/10 text-[#27AE60] border border-[#27AE60]/30 text-xs font-semibold">{villages.length} Villages</Badge>
              </div>
              <p className="text-gray-500 text-sm">Cliquez sur une culture pour explorer ses traditions</p>
            </div>
            <Link to="/cultures-premium">
              <Button variant="outline" size="sm" className="hidden sm:flex border-[#8B0000]/30 text-[#8B0000] hover:bg-[#8B0000] hover:text-white items-center gap-1.5 font-semibold rounded-xl">
                Voir tout <ArrowRight size={14} />
              </Button>
            </Link>
          </div>

          {/* Loading state */}
          {villagesLoading && (
            <div className="flex justify-center items-center py-16 gap-3">
              <Loader2 size={26} className="text-[#8B0000] animate-spin" />
              <span className="text-gray-500 text-sm">Chargement des cultures...</span>
            </div>
          )}

          {/* Auto-sliding carousel with constant scroll */}
          {!villagesLoading && villages.length > 0 && (
            <div className="relative overflow-hidden">
              {/* Gradient overlays */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

              {/* Cards container with auto-scroll and manual sliding */}
              <div
                ref={scrollContainerRef}
                className="flex gap-6 overflow-x-auto scrollbar-hide px-10"
                style={{ scrollBehavior: 'smooth' }}
              >
                {villages.map((village: { id: string; name: string; region: string | null; image_url: string | null }) => (
                  <div
                    key={village.id}
                  className="flex-shrink-0 w-80 cursor-pointer"
                  onClick={() => handleVillageClick(village)}
                >
                  <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group" style={{ borderTop: '4px solid #8B0000' }}>
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={village.image_url || 'https://flagcdn.com/w320/cm.png'}
                        alt={village.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://flagcdn.com/w320/cm.png'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🏛️</span>
                          <div>
                            <p className="text-white font-bold text-sm leading-tight truncate" title={village.name}>{village.name.split(' (')[0]}</p>
                            {village.name.includes(' (') && (
                              <p className="text-white/60 text-xs truncate" title={village.name}>
                                {village.name.match(/\((.*)\)/)?.[1]}
                              </p>
                            )}
                            <p className="text-white/70 text-xs">{village.region}</p>
                          </div>
                        </div>
                        <Badge className="bg-[#27AE60] text-white text-[10px] font-bold">Gratuit</Badge>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        Découvrez les traditions et la culture de ce peuple.
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="bg-[#27AE60]/10 text-[#27AE60] text-xs font-semibold px-2 py-1 rounded-lg flex items-center gap-1">
                          <CheckCircle size={9} /> Histoire
                        </span>
                        <span className="bg-[#27AE60]/10 text-[#27AE60] text-xs font-semibold px-2 py-1 rounded-lg flex items-center gap-1">
                          <CheckCircle size={9} /> Proverbes
                        </span>
                      </div>
                      <button className="mt-3 w-full text-sm font-bold text-[#8B0000] hover:text-[#6B0000] flex items-center justify-center gap-1.5 py-2 bg-[#8B0000]/5 hover:bg-[#8B0000]/10 rounded-xl transition-colors">
                        Explorer <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </div>
          )}

          <style>{`
            @keyframes scroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
        </div>
      </section>

      {/* Village Detail Dialog */}
      <Dialog open={!!selectedVillage} onOpenChange={() => setSelectedVillage(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          {selectedVillage && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-extrabold text-[#8B0000]">
                  🏛️ {selectedVillage.name.split(' (')[0]}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <img
                  src={selectedVillage.image_url || 'https://flagcdn.com/w320/cm.png'}
                  alt={selectedVillage.name}
                  className="w-full h-40 object-cover rounded-xl"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://flagcdn.com/w320/cm.png'; }}
                />
                {selectedVillage.region && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <MapPin size={14} className="text-[#8B0000]" />
                    {selectedVillage.region}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  Explorez l'histoire, les proverbes, le lexique et bien plus encore de ce peuple camerounais.
                </p>
                <p className="text-xs text-gray-500">
                  3 contenus gratuits par catégorie • Le reste est Premium
                </p>
                <div className="flex gap-3 pt-2">
                  {isPremium ? (
                    <Button
                      className="flex-1 bg-[#FFD700] text-[#8B0000] hover:bg-yellow-400 font-bold"
                      onClick={handleExploreFree}
                    >
                      Explorer
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        className="flex-1 border-[#8B0000]/30 text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
                        onClick={handleExploreFree}
                      >
                        Explorer gratuitement
                      </Button>
                      <Button
                        className="flex-1 bg-[#FFD700] text-[#8B0000] hover:bg-yellow-400 font-bold"
                        onClick={handleUpgrade}
                      >
                        Passer Premium
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Premium section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-2">
            <Star size={20} className="text-[#FFD700]" fill="#FFD700" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#2C3E50]">Contenu Premium</h2>
          </div>
          <p className="text-gray-500 text-sm mb-7">
            {isPremium ? 'Vous avez accès à tout le contenu ci-dessous.' : '3 éléments gratuits par catégorie · Premium débloque tout'}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {PREMIUM_CONTENT.map((item) => (
              <div
                key={item.id}
                className="relative bg-white border border-gray-100 rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
                onClick={() => navigate('/cultures-premium')}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${item.color}18` }}>
                  {isPremium ? (
                    <span style={{ color: item.color }}>
                      {item.icon === 'utensils' ? '🍽️' : item.icon === 'book-open' ? '📖' : item.icon === 'message-circle' ? '💬' : item.icon === 'scroll' ? '📜' : item.icon === 'volume-2' ? '🔊' : item.icon === 'video' ? '🎬' : item.icon === 'languages' ? '🌐' : item.icon === 'heart' ? '❤️' : '📚'}
                    </span>
                  ) : (
                    <Lock size={18} style={{ color: item.color }} />
                  )}
                </div>
                <h3 className="font-bold text-[#2C3E50] text-xs mb-1 leading-tight">{item.title}</h3>
                <p className="text-[10px] text-gray-400 line-clamp-2">{item.freeItems.length} sur {item.items.length} gratuit</p>
                {!isPremium && (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-[#8B0000] rounded-full flex items-center justify-center">
                    <Lock size={8} className="text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* History section */}
      <section className="py-12 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen size={20} className="text-[#2980B9]" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#2C3E50]">Histoire du Cameroun</h2>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { year: '—3000', event: 'Civilisation Sao' },
                { year: '1884', event: 'Protectorat allemand' },
                { year: '1960', event: 'Indépendance' },
                { year: '1972', event: 'République Unie' },
              ].map((item) => (
                <div key={item.year} className="flex items-start gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#2980B9] mt-1.5 shrink-0" />
                  <div>
                    <p className="font-bold text-[#2980B9] text-sm">{item.year}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{item.event}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              De la civilisation Sao aux royaumes Bamoun, Bamiléké et Duala, le Cameroun possède une histoire sur plus de 5 000 ans. Colonisé d'abord par les Allemands, puis partagé entre Français et Britanniques après 1916, le pays a acquis son indépendance le 1ᵉʳ janvier 1960 et est aujourd'hui l'un des pays les plus culturellement diversifiés d'Afrique.
            </p>
          </div>
        </div>
      </section>

      {/* Inventions */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={20} className="text-[#E67E22]" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#2C3E50]">Inventions & Découvertes</h2>
          </div>
          <p className="text-gray-500 text-sm mb-7">Contributions camerounaises à la science et à l'humanité</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {INVENTIONS.map((inv) => (
              <div key={inv.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{inv.icon}</div>
                <Badge variant="secondary" className="text-[#E67E22] bg-[#E67E22]/10 font-semibold text-xs mb-2">{inv.category}</Badge>
                <h3 className="font-bold text-[#2C3E50] text-sm mb-1.5">{inv.title}</h3>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{inv.description}</p>
                <div className="flex items-center gap-1 text-xs text-[#8B0000] font-semibold">
                  <Clock size={10} /> {inv.year}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Traditional Jobs */}
      <section className="py-12 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#2C3E50] mb-7">Métiers Traditionnels</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {TRADITIONAL_JOBS.map((job) => (
              <div key={job.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-center hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-[#27AE60]/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-[#27AE60]/20 transition-colors">
                  <span className="text-[#27AE60] font-black text-lg">{job.name[0]}</span>
                </div>
                <h3 className="font-bold text-[#2C3E50] text-sm mb-1.5">{job.name}</h3>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{job.description}</p>
                <div className="flex items-center justify-center gap-1 text-xs text-[#8B0000] font-semibold">
                  <MapPin size={10} /> {job.region}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Upgrade CTA */}
      {!isPremium ? (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white border-2 border-[#FFD700] rounded-2xl p-7 shadow-xl max-w-2xl mx-auto text-center">
              <div className="flex items-center justify-center gap-3 mb-5">
                <Crown size={36} className="text-[#FFD700]" fill="#FFD700" />
                <div className="text-left">
                  <h3 className="text-2xl font-extrabold text-[#8B0000]">Passez Premium</h3>
                  <p className="text-gray-500 text-sm">Accès illimité · Paiement unique</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-5 text-left">
                {['Toutes les cultures détaillées', 'Audio des langues locales', 'Vidéos documentaires HD', 'Recettes traditionnelles'].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle size={14} className="text-[#27AE60] shrink-0" /> {f}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-3 mb-5">
                <span className="text-gray-400 line-through text-lg">2 000 FCFA</span>
                <span className="text-4xl font-black text-[#27AE60]">1 000 FCFA</span>
                <Badge className="bg-[#E74C3C] text-white font-bold">-50%</Badge>
              </div>
              <Button
                onClick={handleUpgrade}
                className="w-full max-w-sm bg-[#27AE60] hover:bg-[#219A52] text-white font-extrabold h-14 rounded-2xl text-base flex items-center justify-center gap-2 shadow-lg mx-auto"
              >
                <Lock size={18} /> Débloquer Premium — 1 000 FCFA
              </Button>
              <p className="text-xs text-gray-400 mt-3 flex items-center justify-center gap-1.5">
                🔒 Paiement sécurisé · MTN & Orange Money
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-12 bg-gradient-to-br from-[#8B0000] to-[#6B0000]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Crown size={44} className="text-[#FFD700] mx-auto mb-3" fill="#FFD700" />
            <h3 className="text-2xl font-extrabold text-[#FFD700] mb-2">Vous êtes Premium !</h3>
            <p className="text-white/80 mb-5 text-sm">Profitez de l'accès complet à toutes les ressources culturelles</p>
            <Button onClick={() => navigate('/cultures-premium')} className="bg-[#27AE60] hover:bg-[#219A52] text-white font-bold px-8 rounded-2xl h-12 flex items-center gap-2 mx-auto">
              Explorer le contenu complet <ArrowRight size={16} />
            </Button>
          </div>
        </section>
      )}

      <CultureDetailModal
        culture={selectedCulture}
        onClose={() => setSelectedCulture(null)}
        isPremium={isPremium}
        onUpgrade={() => { setSelectedCulture(null); handleUpgrade(); }}
      />
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
