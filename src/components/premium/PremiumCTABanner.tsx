import { Crown, Lock, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PremiumCTABannerProps {
  lockedCount: number;
  onUpgrade: () => void;
  compact?: boolean;
}

export default function PremiumCTABanner({ lockedCount, onUpgrade, compact = false }: PremiumCTABannerProps) {
  if (compact) {
    return (
      <div
        className="flex items-center justify-between gap-3 bg-gradient-to-r from-[#8B0000] to-[#6B0000] rounded-xl p-4 cursor-pointer hover:from-[#6B0000] hover:to-[#5B0000] transition-all shadow-lg"
        onClick={onUpgrade}
      >
        <div className="flex items-center gap-3">
          <Crown size={22} className="text-[#FFD700] shrink-0" fill="currentColor" />
          <div>
            <p className="text-white font-bold text-sm">
              {lockedCount} contenu{lockedCount > 1 ? 's' : ''} verrouillé{lockedCount > 1 ? 's' : ''}
            </p>
            <p className="text-white/70 text-xs">Débloquez tout avec Premium — 1 000 FCFA</p>
          </div>
        </div>
        <Button size="sm" className="bg-[#FFD700] text-[#8B0000] font-bold hover:bg-yellow-400 shrink-0 flex items-center gap-1">
          Accès Complet <ArrowRight size={12} />
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#8B0000] to-[#6B0000] rounded-2xl p-6 shadow-xl text-center">
      <Crown size={40} className="text-[#FFD700] mx-auto mb-3" fill="currentColor" />
      <h3 className="text-xl font-extrabold text-white mb-1">
        {lockedCount} contenu{lockedCount > 1 ? 's' : ''} supplémentaire{lockedCount > 1 ? 's' : ''} disponible{lockedCount > 1 ? 's' : ''}
      </h3>
      <p className="text-white/70 text-sm mb-4">Passez Premium pour accéder à tous les contenus culturels</p>

      <div className="grid grid-cols-2 gap-1.5 mb-5 text-left max-w-xs mx-auto">
        {['Proverbes & Sagesse', 'Lexique complet', 'Mets traditionnels', 'Alphabet local', 'Phrases courantes', 'Histoire complète'].map((f) => (
          <div key={f} className="flex items-center gap-1.5 text-xs text-white/80">
            <CheckCircle size={11} className="text-[#27AE60] shrink-0" /> {f}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-3 mb-4">
        <span className="text-white/50 line-through text-sm">2 000 FCFA</span>
        <span className="text-2xl font-black text-[#FFD700]">1 000 FCFA</span>
        <Badge className="bg-[#E74C3C] text-white font-bold text-xs">-50%</Badge>
      </div>

      <Button
        onClick={onUpgrade}
        className="bg-[#FFD700] text-[#8B0000] hover:bg-yellow-400 font-extrabold px-8 h-12 rounded-2xl flex items-center gap-2 mx-auto shadow-lg"
      >
        <Lock size={16} /> Passer Premium — 1 000 FCFA
      </Button>

      <p className="text-white/40 text-xs mt-3 flex items-center justify-center gap-1">
        🔒 Paiement sécurisé · MTN & Orange Money · Accès à vie
      </p>
    </div>
  );
}
