import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import CardRow from './CardRow';
import type { DeckCard, DeckSection as DeckSectionType } from '@/types';

const SECTION_LABELS: Record<DeckSectionType, string> = {
  main: 'Main Deck',
  rune: 'Runes',
  battlefield: 'Battlefields',
  sideboard: 'Sideboard',
};

const SECTION_TARGETS: Record<DeckSectionType, number> = {
  main: 40,
  rune: 12,
  battlefield: 3,
  sideboard: 8,
};

type Props = {
  section: DeckSectionType;
  cards: DeckCard[];
  onQuantityChange?: (id: string, delta: number) => void;
  onRemove?: (id: string) => void;
  readonly?: boolean;
};

export default function DeckSection({ section, cards, onQuantityChange, onRemove, readonly }: Props) {
  const [open, setOpen] = useState(true);
  const total = cards.reduce((s, c) => s + c.quantity, 0);
  const target = SECTION_TARGETS[section];
  const atTarget = total === target;
  const over = total > target;

  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 hover:bg-white/5 transition-colors"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {SECTION_LABELS[section]}
        </span>
        <span
          className={`ml-auto text-xs font-bold ${
            over ? 'text-destructive' : atTarget ? 'text-green-400' : 'text-muted-foreground'
          }`}
        >
          {total}/{target}
        </span>
      </button>

      {open && (
        <div className="mt-1 space-y-0.5">
          {cards.length === 0 ? (
            <p className="px-4 py-2 text-xs text-muted-foreground italic">No cards yet</p>
          ) : (
            cards.map((c) => (
              <CardRow
                key={c.id}
                card={c}
                onQuantityChange={onQuantityChange}
                onRemove={onRemove}
                readonly={readonly}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
