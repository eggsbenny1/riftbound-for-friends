import { Minus, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DeckCard } from '@/types';

const DOMAIN_COLORS: Record<string, string> = {
  Fury: '#ef4444',
  Calm: '#3b82f6',
  Mind: '#a855f7',
  Body: '#22c55e',
  Chaos: '#f97316',
  Order: '#eab308',
};

function domainColor(domain: string | null): string {
  if (!domain) return '#6366f1';
  const first = domain.split(',')[0].trim();
  return DOMAIN_COLORS[first] ?? '#6366f1';
}

type Props = {
  card: DeckCard;
  onQuantityChange?: (id: string, delta: number) => void;
  onRemove?: (id: string) => void;
  readonly?: boolean;
};

export default function CardRow({ card, onQuantityChange, onRemove, readonly }: Props) {
  return (
    <div className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-white/5 transition-colors">
      {/* Domain colour dot */}
      <span
        className="h-2 w-2 flex-shrink-0 rounded-full"
        style={{ background: domainColor(card.domain) }}
      />

      {/* Card name */}
      <span className="flex-1 truncate text-sm text-foreground">{card.card_name}</span>

      {/* Energy cost */}
      {card.energy !== null && (
        <span className="text-xs text-muted-foreground w-4 text-center">{card.energy}</span>
      )}

      {/* Quantity stepper */}
      {!readonly ? (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onQuantityChange?.(card.id, -1)}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus size={12} />
          </button>
          <span
            className={cn(
              'w-5 text-center text-sm font-semibold',
              card.quantity === 3 ? 'text-primary' : 'text-foreground'
            )}
          >
            {card.quantity}
          </span>
          <button
            onClick={() => onQuantityChange?.(card.id, 1)}
            disabled={card.quantity >= 3}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-white/10 hover:text-foreground disabled:opacity-30 transition-colors"
            aria-label="Increase quantity"
          >
            <Plus size={12} />
          </button>
          <button
            onClick={() => onRemove?.(card.id)}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Remove card"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ) : (
        <span className="text-sm font-semibold text-muted-foreground">×{card.quantity}</span>
      )}
    </div>
  );
}
