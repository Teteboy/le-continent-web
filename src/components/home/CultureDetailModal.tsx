import { X, Users, MessageCircle, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Culture } from '@/types';

interface Props {
  culture: Culture | null;
  onClose: () => void;
  isPremium: boolean;
  onUpgrade: () => void;
}

export default function CultureDetailModal({ culture, onClose, isPremium, onUpgrade }: Props) {
  if (!culture) return null;

  return (
    <Dialog open={!!culture} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
        {/* Header with image */}
        <div
          className="relative h-48 bg-cover bg-center rounded-t-2xl"
          style={{ backgroundImage: `url(${culture.image})` }}
        >
          <div className="absolute inset-0 bg-black/50 rounded-t-2xl" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 text-white rounded-full p-1.5 transition-colors"
          >
            <X size={18} />
          </button>
          <div className="absolute bottom-4 left-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{culture.icon}</span>
              <div>
                <h2 className="text-2xl font-extrabold text-white drop-shadow">{culture.name}</h2>
                <p className="text-[#FFD700] font-semibold text-sm">{culture.region}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Stats */}
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Users size={14} className="text-[#8B0000]" />
              <span>{culture.population}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <MessageCircle size={14} className="text-[#8B0000]" />
              <span>{culture.language}</span>
            </div>
          </div>

          <p className="text-gray-700 leading-relaxed mb-5">{culture.shortDescription}</p>

          {/* Features */}
          <div className="mb-5">
            <h3 className="font-bold text-[#8B0000] mb-3">Caractéristiques</h3>
            <div className="space-y-2">
              {culture.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#27AE60] shrink-0" />
                  <span className="text-sm text-gray-700">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade prompt */}
          {!isPremium && (
            <div
              className="bg-[#8B0000] rounded-xl p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#6B0000] transition-colors"
              onClick={onUpgrade}
            >
              <div>
                <p className="text-white font-bold text-sm">Débloquer le contenu complet</p>
                <p className="text-white/70 text-xs mt-0.5">Recettes, proverbes, audio et vidéos</p>
              </div>
              <Badge className="bg-[#FFD700] text-[#8B0000] font-bold shrink-0">1 000 FCFA</Badge>
            </div>
          )}

          {isPremium && (
            <div className="bg-[#27AE60]/10 border border-[#27AE60]/30 rounded-xl p-4 text-center">
              <p className="text-[#27AE60] font-bold">✓ Contenu complet débloqué</p>
            </div>
          )}

          <Button variant="outline" onClick={onClose} className="w-full mt-4">
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
