import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft, MessageSquare, BookOpen, Clock, UtensilsCrossed,
  Type, MessageCircle, ExternalLink, Crown, Lock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

interface VillageOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  route: string;
  color: string;
}

const options: VillageOption[] = [
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
  const isPremium = profile?.is_premium ?? false;

  let village: { id: string; name: string; region?: string } | null = null;
  try {
    const raw = searchParams.get('village');
    village = raw ? JSON.parse(raw) : null;
  } catch {
    village = null;
  }

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

  const handleOption = (opt: VillageOption) => {
    navigate(`${opt.route}?village=${villageParam}`);
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
            <h1 className="text-4xl font-black text-white drop-shadow-lg">{village.name}</h1>
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
              {!isPremium && (
                <Badge className="bg-gray-100 text-gray-400 border border-gray-200 text-[10px] shrink-0 flex items-center gap-1">
                  <Lock size={8} /> 3 gratuits
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

