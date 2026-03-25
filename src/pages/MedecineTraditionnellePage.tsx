import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Heart, Lock, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import PaymentModal from '@/components/payment/PaymentModal';

// Helper to format text with proper line breaks
const formatText = (text: string | null | undefined): string => {
  if (!text) return '';
  return text.replace(/\\n/g, '\n');
};

interface MedicineRemedy {
  id: string;
  category: string;
  title: string;
  ingredients: string;
  proportion: string;
  bienfats: string;
  posologie: string;
  is_premium: boolean;
  display_order: number;
}

// Free category - Anemia/Blood production
export default function MedecineTraditionnellePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isPremium = profile?.is_premium ?? false;

  // Get village from URL if coming from village page
  let village: { id: string; name: string } | null = null;
  try {
    const raw = searchParams.get('village');
    village = raw ? JSON.parse(raw) : null;
  } catch {
    village = null;
  }

  const [remedies, setRemedies] = useState<MedicineRemedy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchRemedies();
  }, []);

  const fetchRemedies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('medicine_traditionnel')
        .select('*')
        .order('category', { ascending: true })
        .order('display_order', { ascending: true });

      if (error) throw error;
      setRemedies(data || []);
    } catch (err) {
      console.error('Error fetching remedies:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group remedies by category
  const remediesByCategory = remedies.reduce((acc, remedy) => {
    if (!acc[remedy.category]) {
      acc[remedy.category] = [];
    }
    acc[remedy.category].push(remedy);
    return acc;
  }, {} as Record<string, MedicineRemedy[]>);

  const categories = Object.keys(remediesByCategory).sort();

  // For free users, show all categories but only 1 remedy per category
  // For premium users, show all categories with all remedies
  const displayedCategories = categories;

  const toggleCategory = (category: string) => {
    if (!isPremium) {
      // For free users, show payment when trying to expand other categories
      // They can see the categories but need to expand to see content
      // Actually, let's allow them to expand but the remedies will be locked
    }
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const handleBack = () => {
    if (village) {
      navigate(`/village-options?village=${encodeURIComponent(JSON.stringify(village))}`);
    } else {
      navigate('/cultures-premium');
    }
  };

  const handleUpgrade = () => {
    if (!user) {
      navigate('/inscription');
      return;
    }
    setShowPayment(true);
  };

  // Check if a remedy should be locked
  // Free users: first remedy in each category is free (display_order = 1)
  // Premium users: all remedies are unlocked
  const isRemedyLocked = (remedy: MedicineRemedy): boolean => {
    if (isPremium) return false;
    // Free users get the first remedy (display_order = 1) in each category for free
    if (remedy.display_order === 1) return false;
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <Loader2 size={40} className="text-[#8B0000] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <div
        className="relative h-56 bg-cover bg-center"
        style={{ backgroundImage: 'url(/3.jpeg)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/70" />
        <div className="relative z-10 h-full flex flex-col px-4 sm:px-6 pt-6 max-w-4xl mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white/80 hover:text-white font-semibold text-sm mb-auto transition-colors"
          >
            <ArrowLeft size={18} /> Retour
          </button>
          <div className="pb-4">
            <h1 className="text-3xl font-black text-white drop-shadow-lg flex items-center gap-3">
              🌿 Médecine Traditionnelle
            </h1>
            <p className="text-white/80 mt-2 text-sm sm:text-base">
              Remèdes et tisanes traditionnelles Camerounaises
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-8 max-w-4xl mx-auto">
        {/* Free/Premium Notice */}
        {!isPremium && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-amber-800 text-sm">
              🔓 <strong>1remède gratuit par catégorie:</strong> Débloquez le premier remède de chaque catégorie
            </p>
            <p className="text-amber-700 text-xs mt-1">
              Passez à Premium pour accéder à tous les remèdes (Cœur, Diabète, Detox, Peau, etc.)
            </p>
          </div>
        )}

        {/* Categories */}
        {displayedCategories.map((category) => (
          <div key={category} className="mb-6">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#E74C3C]/10 flex items-center justify-center">
                  <Heart size={20} className="text-[#E74C3C]" />
                </div>
                <div className="text-left">
                  <h2 className="font-bold text-[#2C3E50] text-sm sm:text-base">{category}</h2>
                  <p className="text-xs text-gray-500">
                    {remediesByCategory[category]?.length || 0} remèdes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Lock icon shown per-remedy based on isRemedyLocked */}
                {expandedCategory === category ? (
                  <ChevronUp size={20} className="text-gray-400" />
                ) : (
                  <ChevronDown size={20} className="text-gray-400" />
                )}
              </div>
            </button>

            {/* Expanded Category Content */}
            {expandedCategory === category && (
              <div className="mt-3 space-y-3">
                {remediesByCategory[category]?.map((remedy) => {
                  const locked = isRemedyLocked(remedy);
                  return (
                    <div
                      key={remedy.id}
                      className={`bg-white rounded-xl p-4 shadow-sm border ${
                        locked ? 'border-amber-200 bg-amber-50/50' : 'border-gray-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className={`font-bold text-[#2C3E50] mb-2 ${locked ? 'blur-sm select-none' : ''}`}>{remedy.title}</h3>
                          
                          {/* Ingredients - hidden for locked */}
                          <div className="mb-2">
                            <p className={`text-xs font-semibold text-gray-500 uppercase mb-1 ${locked ? 'blur-sm select-none' : ''}`}>Ingrédients</p>
                            <p className={`text-sm text-gray-700 whitespace-pre-line ${locked ? 'blur-sm select-none' : ''}`}>{formatText(remedy.ingredients)}</p>
                          </div>

                          {/* Proportion */}
                          {remedy.proportion && (
                            <div className="mb-2">
                              <p className={`text-xs font-semibold text-gray-500 uppercase mb-1 ${locked ? 'blur-sm select-none' : ''}`}>Proportion</p>
                              <p className={`text-sm text-gray-700 ${locked ? 'blur-sm select-none' : ''}`}>{remedy.proportion}</p>
                            </div>
                          )}

                          {/* Bienfaits */}
                          <div className="mb-2">
                            <p className={`text-xs font-semibold text-gray-500 uppercase mb-1 ${locked ? 'blur-sm select-none' : ''}`}>Bienfaits</p>
                            <p className={`text-sm text-gray-700 whitespace-pre-line ${locked ? 'blur-sm select-none' : ''}`}>{formatText(remedy.bienfats)}</p>
                          </div>

                          {/* Posologie */}
                          <div className="mb-2">
                            <p className={`text-xs font-semibold text-gray-500 uppercase mb-1 ${locked ? 'blur-sm select-none' : ''}`}>Posologie</p>
                            <p className={`text-sm text-[#8B0000] font-semibold ${locked ? 'blur-sm select-none' : ''}`}>{remedy.posologie}</p>
                          </div>
                        </div>

                        {locked && (
                          <div className="shrink-0">
                            <Lock size={20} className="text-amber-600" />
                          </div>
                        )}
                      </div>

                      {locked && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <Button
                            onClick={handleUpgrade}
                            className="w-full bg-gradient-to-r from-[#8B0000] to-[#A52A2A] hover:from-[#A52A2A] hover:to-[#8B0000] text-white text-sm"
                          >
                            <Lock size={14} className="mr-2" />
                            Débloquer Premium
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {/* Show upgrade prompt for free users when not in free category */}
        {!isPremium && categories.length > 1 && (
          <div className="mt-8 bg-gradient-to-r from-[#8B0000] to-[#A52A2A] rounded-2xl p-6 text-center">
            <h3 className="text-white font-bold text-lg mb-2">
              🔓 Débloquez toutes les catégories
            </h3>
            <p className="text-white/80 text-sm mb-4">
              Accédez à tous les remèdes pour le cœur, le diabète, la detox, la peau, et bien plus encore!
            </p>
            <Button
              onClick={handleUpgrade}
              className="bg-white text-[#8B0000] hover:bg-white/90 font-bold px-8"
            >
              Passer à Premium
            </Button>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal 
        open={showPayment} 
        onClose={() => setShowPayment(false)} 
      />
    </div>
  );
}
