import { useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft, MessageSquare, BookOpen, Clock, UtensilsCrossed,
  Type, MessageCircle, ExternalLink, Crown, Lock, Heart,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { FREE_LIMIT, ITEMS_PER_PAGE } from '@/hooks/useVillageContent';

// Get API base URL
const isDev = import.meta.env.DEV;
const API_BASE = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL
  : (isDev ? 'http://localhost:3000' : 'https://api.lecontinent.cm');

// Generate fake locked count for free users (same as useVillageContent)
function generateFakeLockedCount(tableName: string): number {
  const ranges: Record<string, number[]> = {
    mets: [1200, 1500, 1800, 2000, 2200, 2500, 2800, 3000],
    proverbes: [800, 1000, 1200, 1500, 1800, 2000, 2200, 2500],
    phrases: [600, 800, 1000, 1200, 1500, 1800, 2000, 2200],
    lexique: [1500, 1800, 2000, 2200, 2500, 2800, 3000, 3500],
    histoires: [300, 400, 500, 600, 700, 800, 900, 1000],
    alphabet: [200, 300, 400, 500, 600, 700, 800, 900],
    cultures_books: [100, 150, 200, 250, 300, 350, 400, 450],
  };
  
  const options = ranges[tableName] || [500, 700, 1000, 1500, 2000, 2500, 3000, 3500];
  return options[Math.floor(Math.random() * options.length)];
}

interface VillageOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  route: string;
  color: string;
}

const options: VillageOption[] = [
  { id: 'medecine', label: 'Médecine Traditionnelle', icon: <Heart size={24} />, description: 'Remèdes et tisanes naturelles', route: '/medecine-traditionnelle', color: '#E74C3C' },
  { id: 'proverbes', label: 'Proverbes', icon: <MessageSquare size={24} />, description: 'Sagesse et proverbes traditionnels', route: '/village/proverbes', color: '#27AE60' },
  { id: 'lexique', label: 'Lexique', icon: <BookOpen size={24} />, description: 'Vocabulaire et traductions', route: '/village/lexique', color: '#2980B9' },
  { id: 'histoire', label: 'Histoire', icon: <Clock size={24} />, description: 'Récits, légendes et contes', route: '/village/histoire', color: '#9B59B6' },
  { id: 'mets', label: 'Mets Traditionnels', icon: <UtensilsCrossed size={24} />, description: 'Plats et recettes authentiques', route: '/village/mets', color: '#E67E22' },
  { id: 'alphabet', label: 'Alphabet', icon: <Type size={24} />, description: 'Écriture et prononciation', route: '/village/alphabet', color: '#8B0000' },
  { id: 'phrases', label: 'Phrases Courantes', icon: <MessageCircle size={24} />, description: 'Expressions et dialogues', route: '/village/phrases', color: '#16A085' },
];

export default function VillageOptionsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const isPremium = profile?.is_premium ?? false;

  let village: { id: string; name: string; region?: string; description?: string } | null = null;
  try {
    const raw = searchParams.get('village');
    village = raw ? JSON.parse(raw) : null;
  } catch {
    village = null;
  }

  // Eagerly prefetch ALL village content when page loads - makes navigation instant
  useEffect(() => {
    if (!village?.id) return;
    
    // Track if effect was cancelled to prevent state updates after unmount
    let cancelled = false;
    
    // Table names and their corresponding orderBy (must match what pages use)
    const tableConfig = [
      { table: 'lexique', orderBy: 'french' },
      { table: 'alphabet', orderBy: 'french' },
      { table: 'proverbes', orderBy: 'created_at' },
      { table: 'histoires', orderBy: 'title' },
      { table: 'mets', orderBy: 'name' },
      { table: 'phrases', orderBy: 'created_at' },
    ];
    
    // Prefetch all pages in parallel for instant navigation
    tableConfig.forEach(({ table, orderBy }) => {
      const queryKey = ['village', table, village.id, isPremium ? 'premium' : 'free', 1, ''];
      
      // Skip if already cached or effect was cancelled
      if (cancelled || queryClient.getQueryData(queryKey)) return;
      
      const params = new URLSearchParams({
        page: '1',
        limit: ITEMS_PER_PAGE.toString(),
        isPremium: isPremium ? 'true' : 'false',
        orderBy: orderBy,
        orderAsc: 'true',
      });
      params.append('villageId', village.id);

      fetch(`${API_BASE}/api/content/${table}?${params.toString()}`)
        .then(res => res.json())
        .then(data => {
          if (cancelled || !data) return;
          queryClient.setQueryData(queryKey, {
            items: data.items || [],
            total: data.total || 0,
            totalPages: data.totalPages || 0,
            lockedCount: isPremium ? 0 : Math.max(0, (data.total || 0) - FREE_LIMIT),
            fakeLockedCount: !isPremium ? generateFakeLockedCount(table) : undefined,
          });
        })
        .catch(() => {});
    });
    
    return () => {
      cancelled = true;
    };
  }, [village?.id, isPremium, queryClient]);

  if (!village) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Village non trouvé.</p>
          <Link to="/cultures-premium" className="text-[#8B0000] font-semibold hover:underline">
            Retour aux cultures
          </Link>
        </div>
      </div>
    );
  }

  const villageParam = encodeURIComponent(JSON.stringify(village));

  // Map UI table IDs to backend table names
  const getBackendTable = (id: string): string => {
    if (id === 'histoire') return 'histoires';
    return id;
  };

  // Get the orderBy column for each table (must match what pages use)
  const getOrderBy = (table: string): string => {
    const orderMap: Record<string, string> = {
      proverbes: 'created_at',
      lexique: 'french',
      histoires: 'title',
      mets: 'name',
      alphabet: 'french',
      phrases: 'created_at',
    };
    return orderMap[table] || 'created_at';
  };

  // Prefetch content on hover using React Query's prefetchQuery
  // This properly caches data with fakeLockedCount computed
  const handleHover = async (tableId: string) => {
    // Skip prefetch for medicine page - it's not village-specific
    if (tableId === 'medecine') return;
    
    if (village && queryClient) {
      const table = getBackendTable(tableId);
      const orderBy = getOrderBy(table);
      const queryKey = ['village', table, village.id, isPremium ? 'premium' : 'free', 1, ''];
      
      // Only prefetch if not already cached or stale
      const cachedData = queryClient.getQueryData(queryKey);
      if (cachedData) return;
      
      try {
        const params = new URLSearchParams({
          page: '1',
          limit: ITEMS_PER_PAGE.toString(),
          isPremium: isPremium ? 'true' : 'false',
          orderBy: orderBy,
          orderAsc: 'true',
        });
        params.append('villageId', village.id);

        const response = await fetch(`${API_BASE}/api/content/${table}?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          
          // Transform the same way useVillageContent does
          const transformed = {
            items: data.items || [],
            total: data.total || 0,
            totalPages: data.totalPages || 0,
            lockedCount: isPremium ? 0 : Math.max(0, (data.total || 0) - FREE_LIMIT),
            fakeLockedCount: !isPremium ? generateFakeLockedCount(table) : undefined,
          };
          
          // Prefetch and cache with proper staleTime
          await queryClient.prefetchQuery({
            queryKey,
            queryFn: () => Promise.resolve(transformed),
            staleTime: 10 * 60 * 1000, // 10 minutes
          });
        }
      } catch { /* ignore errors */ }
    }
  };

  const handleOption = (opt: VillageOption) => {
    // Medicine page can optionally include village parameter for back navigation
    if (opt.id === 'medecine' && village) {
      navigate(`${opt.route}?village=${villageParam}`);
    } else if (opt.id === 'medecine') {
      navigate(opt.route);
    } else {
      navigate(`${opt.route}?village=${villageParam}`);
    }
  };

  const handleContact = () => {
    window.open('https://wa.me/237672549955', '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <div
        className="relative h-56 bg-cover bg-center"
        style={{ backgroundImage: 'url(/2.jpeg)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/70" />
        <div className="relative z-10 h-full flex flex-col px-4 sm:px-6 pt-6 max-w-3xl mx-auto">
          <button
            onClick={() => navigate('/cultures-premium')}
            className="flex items-center gap-2 text-white/80 hover:text-white font-semibold text-sm mb-auto transition-colors"
          >
            <ArrowLeft size={18} /> Retour
          </button>
          <div className="pb-6">
            <h1 className="text-4xl font-black text-white drop-shadow-lg">{village.name.split(' (')[0]}</h1>
            {village.name.includes(' (') && (
              <p className="text-white/60 text-sm mt-1">
                {village.name.match(/\((.*)\)/)?.[1]}
              </p>
            )}
            {village.region && (
              <p className="text-white/70 text-sm mt-1">{village.region}</p>
            )}
            {isPremium && (
              <div className="flex items-center gap-1.5 mt-2 bg-[#FFD700]/20 border border-[#FFD700]/40 text-[#FFD700] px-3 py-1 rounded-full text-xs font-bold w-fit">
                <Crown size={11} fill="currentColor" /> Accès complet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Options grid */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-gray-500 text-sm mb-6">
          {isPremium
            ? 'Choisissez une catégorie pour explorer le contenu :'
            : 'Choisissez une catégorie (3 éléments gratuits pour toutes les cultures) :'}
        </p>

        {!isPremium && (
          <div className="flex items-center gap-2 bg-[#FFF8DC] border border-[#FFD700]/40 rounded-xl px-4 py-3 mb-6">
            <Lock size={14} className="text-[#8B0000] shrink-0" />
            <p className="text-sm text-[#8B0000] font-semibold">
              Mode gratuit — 3 premiers éléments pour toutes les cultures. <span className="underline cursor-pointer">Passez Premium</span> pour tout débloquer.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleOption(opt)}
              onMouseEnter={() => handleHover(opt.id)}
              className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all text-left group"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: `${opt.color}18`, color: opt.color }}
              >
                {opt.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#2C3E50] text-base">{opt.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
              </div>
              {!isPremium && opt.id !== 'medecine' && (
                <Badge className="bg-gray-100 text-gray-400 border border-gray-200 text-[10px] shrink-0 flex items-center gap-1">
                  <Lock size={8} /> 3 gratuits
                </Badge>
              )}
              {opt.id === 'medecine' && (
                <Badge className="bg-green-100 text-green-700 border border-green-200 text-[10px] shrink-0">
                  1 gratuit/cat
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* Contact button */}
        <button
          onClick={handleContact}
          className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#1da851] text-white font-bold rounded-2xl py-4 transition-colors shadow-sm"
        >
          <ExternalLink size={18} />
          Nous contacter sur WhatsApp
        </button>
      </div>
    </div>
  );
}
