import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LockedItemProps {
  onUnlock: () => void;
  children?: React.ReactNode;
  compact?: boolean;
}

export default function LockedItem({ onUnlock, children, compact = false }: LockedItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onUnlock) {
      onUnlock();
    }
  };

  // When children are provided, they control the content layout
  // Don't add extra padding - children have their own
  // Add minimum height to ensure overlay with lock icon and button can show
  const containerClasses = children 
    ? 'relative bg-white rounded-2xl border border-gray-100 overflow-hidden group shadow-sm flex flex-col' 
    : `relative bg-white rounded-2xl border border-gray-100 overflow-hidden group shadow-sm ${compact ? 'p-3' : 'p-5'}`;

  const containerStyle: React.CSSProperties = children 
    ? { position: 'relative', zIndex: 1, minHeight: '9rem' } // 144px - enough for overlay
    : { position: 'relative', zIndex: 1 };

  return (
    <div 
      className={containerClasses}
      style={containerStyle}
    >
      {/* Content */}
      <div className="pointer-events-none select-none">
        {children || (
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        )}
      </div>

      {/* Lock overlay - positioned absolutely over content - ALWAYS VISIBLE */}
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-md rounded-2xl"
        style={{ zIndex: 100 }}
        role="button"
        aria-label="Contenu verrouillé - Cliquez pour débloquer"
        tabIndex={0}
        onClick={handleClick}
      >
        {/* Lock icon */}
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-2xl">
          <Lock size={28} className="text-[#8B0000]" />
        </div>
        
        {/* Text */}
        <p className="text-white font-bold text-base mb-1">Contenu Verrouillé</p>
        <p className="text-white/80 text-sm mb-4">Passez Premium pour accéder</p>
        
        {/* Button - Always visible with distinct styling */}
        <Button
          onClick={handleClick}
          size="sm"
          className="bg-[#FFD700] hover:bg-yellow-400 text-[#8B0000] font-bold h-10 text-sm px-8 rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
          style={{ pointerEvents: 'auto' }}
        >
          <Lock size={14} className="mr-2" />
          Débloquer
        </Button>
      </div>
    </div>
  );
}
