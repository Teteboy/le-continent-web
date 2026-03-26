import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LockedItem from './LockedItem';

interface LockedItemsListProps<T extends { id: string }> {
  items: T[];
  onUnlock: () => void;
  renderItem: (item: T) => React.ReactNode;
  maxInitialDisplay?: number;
  compact?: boolean;
}

export default function LockedItemsList<T extends { id: string }>({
  items,
  onUnlock,
  renderItem,
  maxInitialDisplay = 5,
  compact = false,
}: LockedItemsListProps<T>) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? items : items.slice(0, maxInitialDisplay);
  const hasMore = items.length > maxInitialDisplay;

  // Ensure onUnlock is always a valid function
  const handleUnlock = () => {
    if (typeof onUnlock === 'function') {
      onUnlock();
    }
  };

  return (
    <>
      <div className="space-y-2">
        {displayed.map((item) => (
          <LockedItem key={item.id} onUnlock={handleUnlock} compact={compact}>
            {renderItem(item)}
          </LockedItem>
        ))}
      </div>

      {hasMore && !showAll && (
        <div className="mt-4 text-center">
          <Button
            onClick={() => setShowAll(true)}
            variant="outline"
            className="border-[#8B0000]/30 text-[#8B0000] hover:bg-[#8B0000]/5 font-semibold flex items-center gap-2 mx-auto"
          >
            <ChevronDown size={16} />
            Afficher les {items.length - maxInitialDisplay} contenu(s) verrouillé(s) restant(s)
          </Button>
        </div>
      )}

      {showAll && hasMore && (
        <div className="mt-4 text-center">
          <Button
            onClick={() => setShowAll(false)}
            variant="outline"
            className="border-[#8B0000]/30 text-[#8B0000] hover:bg-[#8B0000]/5 font-semibold"
          >
            Masquer
          </Button>
        </div>
      )}
    </>
  );
}
