import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import DeckSection from '@/components/deck/DeckSection';
import DeckSummary from '@/components/deck/DeckSummary';
import DeckImportExport from '@/components/deck/DeckImportExport';
import type { Deck, DeckCard } from '@/types';

export default function DeckView() {
  const { id: playerId, deckId } = useParams<{ id: string; deckId: string }>();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<DeckCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deckId) return;
    async function load() {
      const [{ data: d }, { data: c }] = await Promise.all([
        supabase.from('decks').select('*, legend:legend_id(*)').eq('id', deckId!).single(),
        supabase.from('deck_cards').select('*').eq('deck_id', deckId!).order('sort_order'),
      ]);
      setDeck(d as Deck);
      setCards((c as DeckCard[]) ?? []);
      setLoading(false);
    }
    load();
  }, [deckId]);

  if (loading) return <div className="py-20 text-center text-muted-foreground">Loading…</div>;
  if (!deck) return <div className="py-20 text-center text-destructive">Deck not found</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{deck.name}</h1>
          {deck.is_active && (
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
              Active
            </span>
          )}
        </div>
        <Link
          to={`/players/${playerId}/deck/${deckId}/edit`}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Edit
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 rounded-xl border border-white/10 bg-card p-4">
          {(['main', 'rune', 'battlefield', 'sideboard'] as const).map((s) => {
            const sc = cards.filter((c) => c.section === s);
            return <DeckSection key={s} section={s} cards={sc} readonly />;
          })}
        </div>
        <div className="lg:w-64 space-y-4">
          <DeckSummary cards={cards} />
          <DeckImportExport
            cards={cards}
            deckName={deck.name}
            onImport={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
