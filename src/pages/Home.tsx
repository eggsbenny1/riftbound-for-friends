import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import PlayerCard from '@/components/player/PlayerCard';
import type { Player, PlayerStats, Deck, Card } from '@/types';

type PlayerRow = Player & {
  stats: PlayerStats | null;
  activeDeck: (Deck & { legend_image_url?: string | null }) | null;
};

export default function Home() {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      // 1. Fetch all active players
      const { data: playerRows, error: pErr } = await supabase
        .from('players')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (pErr) { setError(pErr.message); setLoading(false); return; }
      if (!playerRows?.length) { setPlayers([]); setLoading(false); return; }

      const playerIds = playerRows.map((p) => p.id);

      // 2. Fetch player_stats for those players
      const { data: statsRows } = await supabase
        .from('player_stats')
        .select('*')
        .in('player_id', playerIds);

      // 3. Fetch active decks with their legend card (for image_url)
      const { data: deckRows } = await supabase
        .from('decks')
        .select(`
          *,
          legend:legend_id (
            id, name, tags, image_url, card_type
          )
        `)
        .in('player_id', playerIds)
        .eq('is_active', true);

      // Build lookup maps
      const statsMap = new Map<string, PlayerStats>(
        (statsRows ?? []).map((s: PlayerStats & { player_id: string }) => [s.player_id, s])
      );
      const deckMap = new Map<string, Deck & { legend: Card | null }>(
        (deckRows ?? []).map((d: Deck & { legend: Card | null }) => [d.player_id, d])
      );

      const combined: PlayerRow[] = playerRows.map((p) => {
        const deck = deckMap.get(p.id) ?? null;
        return {
          ...p,
          stats: statsMap.get(p.id) ?? null,
          activeDeck: deck
            ? { ...deck, legend_image_url: deck.legend?.image_url ?? null }
            : null,
        };
      });

      setPlayers(combined);
      setLoading(false);
    }

    load();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Crew</h1>
        <Link
          to="/admin"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          + Add Player
        </Link>
      </div>

      {loading && (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load players: {error}
        </div>
      )}

      {!loading && !error && players.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-24 text-center text-muted-foreground">
          <p className="text-lg font-medium">No players yet.</p>
          <p className="text-sm">Head to Admin to add your crew.</p>
          <Link
            to="/admin"
            className="mt-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to Admin
          </Link>
        </div>
      )}

      {!loading && !error && players.length > 0 && (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {players.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              stats={p.stats}
              activeDeck={p.activeDeck}
            />
          ))}
        </div>
      )}
    </div>
  );
}
