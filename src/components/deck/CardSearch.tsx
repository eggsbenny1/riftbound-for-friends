import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Card, CardType, DeckSection } from '@/types';

const TYPE_OPTIONS: { label: string; value: CardType | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Unit', value: 'Unit' },
  { label: 'Spell', value: 'Spell' },
  { label: 'Gear', value: 'Gear' },
  { label: 'Rune', value: 'Rune' },
  { label: 'Battlefield', value: 'Battlefield' },
];

type Props = {
  targetSection: DeckSection;
  onAdd: (card: Card) => void;
};

export default function CardSearch({ targetSection, onAdd }: Props) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<CardType | ''>('');
  const [results, setResults] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2 && !typeFilter) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      let q = supabase
        .from('cards')
        .select('*')
        .order('name')
        .limit(30);

      if (query.length >= 2) q = q.ilike('name', `%${query}%`);
      if (typeFilter) q = q.eq('card_type', typeFilter);

      // Auto-filter by section
      if (targetSection === 'rune') q = q.eq('card_type', 'Rune');
      if (targetSection === 'battlefield') q = q.eq('card_type', 'Battlefield');

      const { data } = await q;
      setResults((data as Card[]) ?? []);
      setLoading(false);
    }, 300);
  }, [query, typeFilter, targetSection]);

  const effectiveTypeFilter =
    targetSection === 'rune' ? 'Rune' :
    targetSection === 'battlefield' ? 'Battlefield' : typeFilter;

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cards…"
          className="w-full rounded-lg border border-input bg-secondary pl-9 pr-9 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Type filter — hidden when section forces a type */}
      {targetSection === 'main' || targetSection === 'sideboard' ? (
        <div className="flex gap-1 flex-wrap">
          {TYPE_OPTIONS.filter((t) => t.value !== 'Rune' && t.value !== 'Battlefield').map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTypeFilter(opt.value as CardType | '')}
              className={`rounded-full px-3 py-0.5 text-xs font-medium transition-colors ${
                effectiveTypeFilter === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}

      {/* Results */}
      {loading && (
        <p className="text-xs text-muted-foreground px-1">Searching…</p>
      )}

      {!loading && results.length > 0 && (
        <ul className="max-h-56 overflow-y-auto rounded-lg border border-white/10 bg-card divide-y divide-white/5">
          {results.map((card) => (
            <li key={card.id}>
              <button
                onClick={() => onAdd(card)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-white/5 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{card.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {card.card_type}
                    {card.domain ? ` · ${card.domain}` : ''}
                    {card.energy !== null ? ` · ${card.energy}E` : ''}
                  </p>
                </div>
                <span className="text-xs text-primary font-semibold shrink-0">+ Add</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && (query.length >= 2 || typeFilter) && results.length === 0 && (
        <p className="text-xs text-muted-foreground px-1 italic">No cards found.</p>
      )}
    </div>
  );
}
