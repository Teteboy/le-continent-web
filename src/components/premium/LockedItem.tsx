import { Lock, Crown } from 'lucide-react';

interface LockedItemProps {
  children: React.ReactNode;
  onUpgrade: () => void;
}

export default function LockedItem({ children, onUpgrade }: LockedItemProps) {
  return (
    <div className="relative rounded-xl overflow-hidden cursor-pointer group" onClick={onUpgrade}>
      {/* Blurred content */}
      <div className="blur-sm pointer-events-none select-none opacity-60">
        {children}
      </div>
      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
        <div className="bg-[#8B0000] rounded-full p-2.5 shadow-lg mb-1.5">
          <Lock size={18} className="text-[#FFD700]" />
        </div>
        <span className="text-white text-xs font-bold bg-black/50 px-2 py-0.5 rounded-full flex items-center gap-1">
          <Crown size={10} className="text-[#FFD700]" /> Premium
        </span>
      </div>
    </div>
  );
}
