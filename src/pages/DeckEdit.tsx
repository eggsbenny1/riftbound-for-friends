import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import DeckBuilder from '@/components/deck/DeckBuilder';
import type { Deck, DeckCard } from '@/types';

export default function DeckEdit() {
  const { id: playerId, deckId } = useParams<{ id: string; deckId: string }>();
  const isNew = deckId === 'new';

  const [deck, setDeck] = useState<(Deck & { cards?: DeckCard[] }) | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew || !deckId) { setLoading(false); return; }

    async function load() {
      const { data: deckData, error: dErr } = await supabase
        .from('decks')
        .select('*')
        .eq('id', deckId)
        .single();

      if (dErr || !deckData) { setError('Deck not found'); setLoading(false); return; }

      const { data: cardData } = await supabase
        .from('deck_cards')
        .select('*')
        .eq('deck_id', deckId)
        .order('sort_order');

      setDeck({ ...deckData as Deck, cards: (cardData as DeckCard[]) ?? [] });
      setLoading(false);
    }

    load();
  }, [deckId, isNew]);

  if (loading) return <div className="py-20 text-center text-muted-foreground">Loading…</div>;
  if (error) return <div className="py-20 text-center text-destructive">{error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-8">{isNew ? 'New Deck' : `Edit: ${deck?.name}`}</h1>
      <DeckBuilder
        playerId={playerId!}
        existingDeck={isNew ? undefined : (deck ?? undefined)}
      />
    </div>
  );
}
