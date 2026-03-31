import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import {
  ArrowRight, Star, Lock, Globe, BookOpen, Volume2, CheckCircle,
  Utensils, Book, MessageCircle, Scroll, Play, Video, Volume2 as AudioIcon,
  Gift, Users, Crown, Sparkles, Loader2, ChevronLeft, ChevronRight,
  Heart, Languages,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import HeroSection from '@/components/home/HeroSection';
import { PREMIUM_CONTENT } from '@/data/inventions';
import { FREE_CULTURES } from '@/data/cultures';
import { useAuth } from '@/hooks/useAuth';
import { generatePromoCode } from '@/lib/promoCode';
import { profileApi } from '@/lib/api-client';
import { resilientFetch } from '@/lib/fetch';

interface Village {
  id: string;
  name: string;
  region: string | null;
  image_url: string | null;
}

const iconMap: Record<string, React.ReactNode> = {
  utensils: <Utensils size={20} />,
  'book-open': <Book size={20} />,
  'message-circle': <MessageCircle size={20} />,
  scroll: <Scroll size={20} />,
  'volume-2': <AudioIcon size={20} />,
  video: <Video size={20} />,
  languages: <Languages size={20} />,
  heart: <Heart size={20} />,
};

const tribeSlides = [
  { name: 'Les Bamiléké', region: 'Région de l\'Ouest', description: 'Royaumes célèbres pour leurs chefferies et l\'art de la perle', image: '/1.jpeg' },
  { name: 'Les Sawa', region: 'Littoral (Douala, Édéa)', description: 'Peuple côtier, gardiens des traditions maritimes et du Ngondo', image: '/onboarding2.jpg' },
  { name: 'Les Peuls (Fulbé)', region: 'Extrême-Nord, Nord, Adamaoua', description: 'Éleveurs nomades célèbres pour leur littérature orale', image: '/onboarding3.jpg' },
  { name: 'Les Béti', region: 'Centre, Sud, Littoral', description: 'Peuple forestier avec de riches traditions orales et musicales', image: '/onboarding4.jpg' },
  { name: 'Les Bamoun', region: 'Région de l\'Ouest (Foumban)', description: 'Peuple créateur d\'un alphabet original et d\'une culture royale unique', image: '/onboarding1.jpg' },
  { name: 'Les Bassa', region: 'Littoral, Centre', description: 'Peuple ancien avec une culture riche et des traditions ancestrales', image: '/onboarding2.jpg' },
  { name: 'Les Duala', region: 'Douala (Littoral)', description: 'Gardiens du Ngondo, traditions maritimes et spirituelles', image: '/onboarding3.jpg' },
  { name: 'Les Ewondo', region: 'Centre (Yaoundé)', description: ' traditions royales et culture duuka (bâtons royaux)', image: '/onboarding4.jpg' },
  { name: 'Les Bamileke', region: 'Nord-Ouest', description: 'Royaumes traditionnels et architecture des chefferies', image: '/1.jpeg' },
  { name: 'Les Tikar', region: 'Adamaoua, Centre', description: 'Ancien peuple avec traditions guerrières et culturelles', image: '/onboarding1.jpg' },
  { name: 'Les Bassa', region: 'Sud-Ouest', description: 'Culture authentique et traditions maritimes', image: '/onboarding2.jpg' },
  { name: 'Les Nyong et Soo', region: 'Centre, Est', description: 'Peuple forestier avec rituels ancestraux', image: '/onboarding3.jpg' },
];

const features = [
  { icon: <Globe size={28} className="text-[#8B0000]" />, title: '250+ Ethnies', desc: 'Explorez la diversité culturelle du Cameroun à travers ses nombreuses ethnies et traditions.' },
  { icon: <BookOpen size={28} className="text-[#2980B9]" />, title: 'Histoire Complète', desc: 'De la civilisation Sao aux temps modernes, toute l\'histoire du Cameroun.' },
  { icon: <Volume2 size={28} className="text-[#27AE60]" />, title: 'Audio & Langues', desc: 'Apprenez les langues locales avec des enregistrements de locuteurs natifs.' },
  { icon: <Star size={28} className="text-[#FFD700]" />, title: 'Contenu Premium', desc: 'Recettes traditionnelles, proverbes, documentaires et bien plus encore.' },
];

const referralBenefits = [
  { icon: <Gift size={20} className="text-[#8B0000]" />, title: 'Code exclusif', desc: 'Chaque membre reçoit un code unique à l\'inscription.' },
  { icon: <Users size={20} className="text-[#2980B9]" />, title: 'Partagez & gagnez', desc: 'Envoyez votre code à vos proches.' },
  { icon: <Crown size={20} className="text-[#FFD700]" />, title: '500 FCFA/filleul', desc: 'Recevez 50% de commission dès qu\'ils passent Premium.' },
];

export default function LandingPage() {
  const { user, profile } = useAuth();
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Handle referral button click
  const handleReferralClick = async () => {
    if (!user) {
      // Not logged in - show message to register
      toast.info('Veuillez vous inscrire pour obtenir un code de parrainage !');
      return;
    }

    // If user already has a promo code, show it
    if (profile?.promo_code) {
      setReferralCode(profile.promo_code);
      setShowReferralDialog(true);
      return;
    }

    // Generate new promo code
    setIsGenerating(true);
    try {
      const code = generatePromoCode();
      const response = await profileApi.update(user.id, { promo_code: code });

      if (response.error) throw new Error(response.error as string);
      setReferralCode(code);
      setShowReferralDialog(true);
      toast.success('Code de parrainage généré !');
    } catch (err) {
      console.error('Error generating promo code:', err);
      toast.error('Erreur lors de la création du code');
    } finally {
      setIsGenerating(false);
    }
  };

  // Fetch villages from backend API (with Redis caching for faster loads)
  const { data: villages = [], error, refetch, isLoading } = useQuery<Village[]>({
    queryKey: ['villages'],
    queryFn: async () => {
      const isDev = import.meta.env.DEV;
      const API_BASE = import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL
        : (isDev ? 'http://localhost:3000' : 'https://api.lecontinent.cm');

      const response = await resilientFetch(`${API_BASE}/api/content/villages`);
      if (!response.ok) throw new Error('Erreur de chargement des villages');
      return (await response.json()) as Village[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - villages don't change often
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchInterval: false, // Disable auto-refresh
    refetchOnMount: true, // Fetch on mount
    refetchOnWindowFocus: false, // Disable refetch on window focus
    retry: 1, // Only retry once
    retryDelay: 500,
  });

  // No manual retry loop needed — TanStack Query handles retries automatically.

  // Carousel state for tribe showcase
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollPrev = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollNext = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  // Track scroll position for pagination
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const newSlide = Math.round(scrollLeft / 320);
      setCurrentSlide(newSlide);
    }
  };

  return (
    <div className="overflow-hidden">
      <HeroSection />

      {/* Features section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2C3E50] mb-3">
              Pourquoi choisir <span className="text-[#8B0000]">Le Continent</span> ?
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base">La plateforme culturelle camerounaise la plus complète, accessible partout dans le monde.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-[#FFF8DC]/50 border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all text-center group hover:-translate-y-1">
                <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
                <h3 className="font-bold text-[#2C3E50] text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free villages preview - fetched from database */}
      <section className="py-20 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#27AE60]/20 text-[#27AE60] text-sm font-bold px-4 py-2 rounded-full mb-4">
              <CheckCircle size={14} /> Accès Gratuit — Sans inscription
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2C3E50] mb-3">
              Explorez les cultures camerounaises
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm">
              3 contenus par catégorie (Histoire, Proverbes, Lexique).<br />
              <span className="text-[#FFD700] font-semibold">Le reste est Premium.</span>
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={36} className="text-[#8B0000] animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <p className="text-red-500 text-sm">Erreur de chargement des cultures.</p>
              <button onClick={() => refetch()} className="text-[#8B0000] font-semibold text-sm underline hover:no-underline">Réessayer</button>
            </div>
          ) : villages.length > 0 ? (
            <div className="relative">
              {/* Carousel container with overflow and animation */}
              <div className="overflow-x-auto pb-4 scrollbar-hide">
                <div
                  className="flex gap-6"
                  style={{
                    animation: 'scroll 60s linear infinite',
                    width: 'fit-content',
                  }}
                >
                  {/* Double the items for seamless loop */}
                  {[...villages, ...villages].map((village, idx) => (
                    <Link
                      to={`/village-options?village=${encodeURIComponent(JSON.stringify({ id: village.id, name: village.name, region: village.region }))}`}
                      key={`${village.id}-${idx}`}
                      className="flex-shrink-0 w-72"
                    >
                      <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-1" style={{ borderTop: '4px solid #8B0000' }}>
                        <div className="relative h-40 overflow-hidden">
                          <img
                            src={village.image_url || 'https://flagcdn.com/w320/cm.png'}
                            alt={village.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://flagcdn.com/w320/cm.png'; }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-3 left-3 flex items-center gap-2">
                            <span className="text-2xl">🏛️</span>
                            <div>
                              <p className="text-white font-bold text-sm truncate" title={village.name}>{village.name.split(' (')[0]}</p>
                              {village.name.includes(' (') && (
                                <p className="text-white/60 text-xs truncate" title={village.name}>
                                  {village.name.match(/\((.*)\)/)?.[1]}
                                </p>
                              )}
                              {village.region && <p className="text-white/70 text-xs">{village.region}</p>}
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            Découvrez les traditions et la culture de ce peuple.
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">6 catégories</span>
                            <span className="text-xs font-bold text-[#27AE60] flex items-center gap-1">
                              <CheckCircle size={11} /> 3 gratuits
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Gradient overlays for smooth edges */}
              <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-[#F8F9FA] to-transparent pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-[#F8F9FA] to-transparent pointer-events-none" />
            </div>
          ) : (
            /* Fallback to static cultures if no villages in database */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {FREE_CULTURES.map((culture) => (
                <Link to="/cultures" key={culture.id}>
                  <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-1" style={{ borderTop: `4px solid ${culture.color}` }}>
                    <div className="relative h-40 overflow-hidden">
                      <img src={culture.image} alt={culture.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <span className="text-2xl">{culture.icon}</span>
                        <div>
                          <p className="text-white font-bold text-sm">{culture.name}</p>
                          <p className="text-white/70 text-xs">{culture.region}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{culture.shortDescription}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{culture.population}</span>
                        <span className="text-xs font-bold text-[#27AE60] flex items-center gap-1">
                          <CheckCircle size={11} /> Gratuit
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link to="/cultures-premium">
              <Button size="lg" className="bg-[#8B0000] hover:bg-[#6B0000] text-white font-extrabold px-8 rounded-full shadow-lg flex items-center gap-2 mx-auto">
                Explorer toutes les cultures <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

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

      {/* Tribe showcase with carousel */}
      <section className="py-20 bg-[#2C3E50]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
              Un voyage au cœur du <span className="text-[#FFD700]">Cameroun</span>
            </h2>
            <p className="text-white/60 max-w-xl mx-auto text-sm">Des photos et contenus authentiques, directement des communautés locales.</p>
          </div>

          {/* Carousel with arrows */}
          <div className="relative">
            {/* Left Arrow */}
            <button
              onClick={scrollPrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all"
            >
              <ChevronLeft size={24} className="text-[#2C3E50]" />
            </button>

            {/* Right Arrow */}
            <button
              onClick={scrollNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all"
            >
              <ChevronRight size={24} className="text-[#2C3E50]" />
            </button>

            {/* Cards container */}
            <div
              ref={scrollContainerRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide px-10"
              style={{ scrollBehavior: 'smooth' }}
              onScroll={handleScroll}
            >
              {tribeSlides.map((slide, i) => (
                <Link
                  to="/cultures-premium"
                  key={i}
                  className="flex-shrink-0 w-80"
                >
                  <div className="relative group overflow-hidden rounded-2xl aspect-[4/3] cursor-pointer">
                    <img
                      src={slide.image}
                      alt={slide.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white font-bold text-lg">{slide.name}</h3>
                      <p className="text-white/70 text-sm mt-1">{slide.region}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: Math.ceil(tribeSlides.length / 3) }).map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTo({ left: i * 320, behavior: 'smooth' });
                    setCurrentSlide(i);
                  }
                }}
                className={`w-3 h-3 rounded-full transition-all ${
                  currentSlide >= i * 3 && currentSlide < (i + 1) * 3
                    ? 'bg-[#FFD700] w-6'
                    : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>

          {/* Explore all cultures button */}
          <div className="flex justify-center mt-8">
            <Link
              to="/cultures-premium"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#FFD700] hover:bg-yellow-400 text-[#2C3E50] font-bold rounded-full transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Explorer toutes les cultures
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Premium content preview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#FFD700]/20 text-[#8B0000] text-sm font-bold px-4 py-2 rounded-full mb-4">
              <Sparkles size={14} /> Contenu Détaillé
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2C3E50] mb-3">
              3 éléments gratuits par catégorie
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm">Chaque catégorie propose 3 éléments gratuits. Premium débloque tout le contenu.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PREMIUM_CONTENT.map((item) => (
              <Link to="/cultures-premium" key={item.id}>
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 group cursor-pointer">
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}18` }}>
                        <span style={{ color: item.color }}>{iconMap[item.icon]}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-[#2C3E50] text-base">{item.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs font-semibold text-[#27AE60] mb-3 flex items-center gap-1">
                        <CheckCircle size={12} /> Gratuit ({item.freeItems.length} éléments) :
                      </p>
                      <div className="space-y-2">
                        {item.freeItems.map((freeItem, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{freeItem}</span>
                            <span className="w-6 h-6 bg-[#27AE60]/10 rounded-full flex items-center justify-center group-hover:bg-[#27AE60] group-hover:text-white transition-colors">
                              <Play size={10} className="ml-0.5" />
                            </span>
                          </div>
                        ))}
                      </div>
                      {item.items.length > item.freeItems.length && (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs text-gray-400">
                          <Lock size={11} />
                          <span>{item.items.length - item.freeItems.length} éléments supplémentaires avec Premium</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="px-6 py-3 bg-gray-50 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#8B0000] bg-[#8B0000]/10 px-3 py-1.5 rounded-full">
                      Cliquez pour accéder
                    </span>
                    <ArrowRight size={16} className="text-[#8B0000] group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Referral system section */}
      <section className="py-20 bg-[#FFF8DC]/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-[#8B0000]/10 text-[#8B0000] text-sm font-bold px-4 py-2 rounded-full mb-6">
            <Gift size={14} /> Programme de Parrainage
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2C3E50] mb-4">
            Parrainez vos proches, <span className="text-[#27AE60]">gagnez 500 FCFA</span>
          </h2>
          <p className="text-gray-500 mb-10 max-w-xl mx-auto text-sm">
            À l'inscription, vous recevez un code promo unique. Partagez-le avec vos amis et familles — dès qu'ils passent Premium, vous recevez automatiquement 500 FCFA de commission.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            {referralBenefits.map((benefit, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-[#FFF8DC] rounded-full flex items-center justify-center mx-auto mb-4">
                  {benefit.icon}
                </div>
                <h3 className="font-bold text-[#2C3E50] mb-2">{benefit.title}</h3>
                <p className="text-sm text-gray-500">{benefit.desc}</p>
              </div>
            ))}
          </div>
          <Button 
            size="lg" 
            className="bg-[#8B0000] hover:bg-[#6B0000] text-white font-extrabold px-10 rounded-full shadow-xl flex items-center gap-2 mx-auto"
            onClick={handleReferralClick}
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Gift size={18} />}
            {isGenerating ? 'Génération...' : 'Obtenir mon code parrainage'}
          </Button>
        </div>
      </section>

      {/* Referral Code Dialog */}
      <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-[#8B0000] text-center">
              🎉 Votre code de parrainage
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-gray-600 text-sm mb-4">
              Partagez ce code avec vos amis et gagnez 500FCFA pour chaque ami qui passe Premium !
            </p>
            <div className="bg-[#FFF8DC] border-2 border-[#FFD700] rounded-xl px-6 py-4 mb-4">
              <p className="text-3xl font-black text-[#8B0000] tracking-widest">{referralCode}</p>
            </div>
            <p className="text-xs text-gray-400">
              Vous pouvez aussi le trouver dans votre page Profil
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => setShowReferralDialog(false)}
            >
              Fermer
            </Button>
            <Button 
              className="flex-1 bg-[#8B0000] hover:bg-[#6B0000]"
              onClick={() => {
                navigator.clipboard.writeText(referralCode || '');
                toast.success('Code copié !');
              }}
            >
              Copier le code
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Premium CTA */}
      <section className="py-20 bg-gradient-to-br from-[#8B0000] to-[#6B0000]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <Crown size={52} className="text-[#FFD700] mx-auto mb-5" fill="#FFD700" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Passez Premium dès <span className="text-[#FFD700]">1000 FCFA</span>
          </h2>
          <p className="text-white/75 mb-8 max-w-xl mx-auto text-sm">
            Accédez à tout le contenu culturel camerounais : recettes, langues, proverbes, documentaires et bien plus encore. Paiement unique, accès à vie.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-lg mx-auto mb-8 text-left">
            {['Toutes les cultures détaillées', 'Audio des langues locales', 'Vidéos documentaires HD', 'Recettes traditionnelles', 'Alphabets camerounais', '500+ proverbes traduits'].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-white/80">
                <CheckCircle size={13} className="text-[#27AE60] shrink-0" />
                {item}
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {!user && (
              <Link to="/inscription">
                <Button size="lg" className="bg-[#FFD700] text-[#8B0000] hover:bg-yellow-400 font-extrabold px-8 rounded-full shadow-xl flex items-center gap-2">
                  Créer mon compte <ArrowRight size={18} />
                </Button>
              </Link>
            )}
            <Link to="/cultures-premium">
              <Button size="lg" className="bg-white text-[#8B0000] hover:bg-gray-100 px-8 rounded-full font-bold">
                Voir le contenu gratuit
              </Button>
            </Link>
          </div>
          <p className="text-white/40 text-xs mt-5 flex items-center justify-center gap-1.5">
            <Lock size={11} /> Paiement sécurisé · MTN Mobile Money & Orange Money
          </p>
        </div>
      </section>
    </div>
  );
}
