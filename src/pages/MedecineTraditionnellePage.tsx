import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Heart, Lock, Loader2, ChevronDown, ChevronUp, AlertCircle, RefreshCw, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { contentApi } from '@/lib/api-client';
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

  const [showPayment, setShowPayment] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Fetch from backend API (with Redis caching)
  const {
    data: remedies = [],
    isLoading,
    error,
    refetch,
  } = useQuery<MedicineRemedy[]>({
    queryKey: ['medicine-traditionnelle', isPremium],
    queryFn: async () => {
      const response = await contentApi.get('medicine_traditionnel', {
        limit: 1000,
        isPremium: 'true', // always fetch all; frontend handles access gating
        orderBy: 'category',
        orderAsc: 'true',
      });

      if (response.error) {
        throw new Error(response.error as string);
      }

      const items = (response.items as MedicineRemedy[]) || [];
      // Sort by display_order within each category (server only orders by one column)
      items.sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return (a.display_order || 0) - (b.display_order || 0);
      });
      return items;
    },
    staleTime: 10 * 60 * 1000,   // 10 minutes
    gcTime: 30 * 60 * 1000,       // 30 minutes
    retry: 2,
    retryDelay: (attempt) => Math.min(1500 * Math.pow(2, attempt), 10000),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const fetchError = error instanceof Error ? error.message : error ? 'Erreur inconnue' : null;

  // Group remedies by category
  const remediesByCategory = remedies.reduce((acc, remedy) => {
    if (!acc[remedy.category]) {
      acc[remedy.category] = [];
    }
    acc[remedy.category].push(remedy);
    return acc;
  }, {} as Record<string, MedicineRemedy[]>);

  const categories = Object.keys(remediesByCategory).sort();

  const toggleCategory = (category: string) => {
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
      navigate('/inscription?redirect=payment');
      return;
    }
    setShowPayment(true);
  };

  // Free users get only the first remedy in the first category for free
  const isRemedyLocked = (remedy: MedicineRemedy): boolean => {
    if (isPremium) return false;
    const firstCategory = categories[0];
    return !(remedy.category === firstCategory && remedy.display_order === 1);
  };

  if (isLoading && remedies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <Loader2 size={40} className="text-[#8B0000] animate-spin" />
      </div>
    );
  }

  if (fetchError && remedies.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] gap-4 px-6 text-center">
        <AlertCircle size={48} className="text-red-500" />
        <p className="text-gray-600">Impossible de charger les remèdes. Vérifiez votre connexion.</p>
        <Button onClick={() => refetch()} variant="outline" className="flex items-center gap-2">
          <RefreshCw size={16} /> Réessayer
        </Button>
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
              🔓 <strong>1 remède gratuit au total :</strong> Le premier remède de la première catégorie est gratuit
            </p>
            <p className="text-amber-700 text-xs mt-1">
              Passez à Premium pour accéder à tous les remèdes (Cœur, Diabète, Detox, Peau, etc.)
            </p>
          </div>
        )}

        {/* Categories */}
        {categories.map((category) => (
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
                  <div>
                    <h2 className="font-bold text-[#2C3E50] text-sm sm:text-base">{category}</h2>
                  </div>
                  <p className="text-xs text-gray-500">
                    {remediesByCategory[category]?.length || 0} remèdes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Badge reflects user account type */}
                {isPremium ? (
                  <Badge className="bg-[#27AE60] text-white text-[10px] flex items-center gap-1">
                    <Crown size={9} fill="currentColor" /> Complet
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px]">
                    1 Gratuit
                  </Badge>
                )}
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

                          <div className="mb-2">
                            <p className={`text-xs font-semibold text-gray-500 uppercase mb-1 ${locked ? 'blur-sm select-none' : ''}`}>Ingrédients</p>
                            <p className={`text-sm text-gray-700 whitespace-pre-line ${locked ? 'blur-sm select-none' : ''}`}>{formatText(remedy.ingredients)}</p>
                          </div>

                          {remedy.proportion && (
                            <div className="mb-2">
                              <p className={`text-xs font-semibold text-gray-500 uppercase mb-1 ${locked ? 'blur-sm select-none' : ''}`}>Proportion</p>
                              <p className={`text-sm text-gray-700 ${locked ? 'blur-sm select-none' : ''}`}>{remedy.proportion}</p>
                            </div>
                          )}

                          <div className="mb-2">
                            <p className={`text-xs font-semibold text-gray-500 uppercase mb-1 ${locked ? 'blur-sm select-none' : ''}`}>Bienfaits</p>
                            <p className={`text-sm text-gray-700 whitespace-pre-line ${locked ? 'blur-sm select-none' : ''}`}>{formatText(remedy.bienfats)}</p>
                          </div>

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

        {/* Upgrade prompt for free users */}
        {!isPremium && categories.length > 1 && (
          <div className="mt-8 bg-gradient-to-r from-[#8B0000] to-[#A52A2A] rounded-2xl p-6 text-center">
            <h3 className="text-white font-bold text-lg mb-2">
              🔓 Débloquez toutes les catégories
            </h3>
            <p className="text-white/80 text-sm mb-4">
              Accédez à tous les remèdes pour le cœur, le diabète, la detox, la peau, et bien plus encore !
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
        onSuccess={() => setShowPayment(false)}
      />
    </div>
  );
}
