import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PlayerCard from '@/components/player/PlayerCard';
import type { Card, Deck, Player, PlayerStats } from '@/types';

type PlayerRow = Player & {
  stats: PlayerStats | null;
  activeDeck: (Deck & { legend_image_url?: string | null; legend?: Card | null }) | null;
};

export default function Home() {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError(null);

    const { data: playerRows, error: pErr } = await supabase
      .from('players')
      .select('*')
      .eq('is_active', true)
      .order('display_name');

    if (pErr) { setError(pErr.message); setLoading(false); return; }
    if (!playerRows?.length) { setPlayers([]); setLoading(false); return; }

    const playerIds = playerRows.map((p) => p.id);

    const [{ data: statsRows }, { data: deckRows }] = await Promise.all([
      supabase.from('player_stats').select('*').in('player_id', playerIds),
      supabase
        .from('decks')
        .select('*, legend:legend_id(id, name, tags, image_url, card_type)')
        .in('player_id', playerIds)
        .eq('is_active', true),
    ]);

    const statsMap = new Map<string, PlayerStats>(
      (statsRows ?? []).map((s: any) => [s.player_id, s])
    );
    const deckMap = new Map<string, any>(
      (deckRows ?? []).map((d: any) => [d.player_id, d])
    );

    setPlayers(
      playerRows.map((p) => {
        const deck = deckMap.get(p.id) ?? null;
        return {
          ...p,
          stats: statsMap.get(p.id) ?? null,
          activeDeck: deck
            ? { ...deck, legend_image_url: deck.legend?.image_url ?? null }
            : null,
        };
      })
    );
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Page header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">The Crew</h1>
          {!loading && players.length > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {players.length} player{players.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <Link
          to="/admin"
          className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2
            text-sm font-medium text-muted-foreground shadow-card
            hover:text-foreground hover:border-border/80 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Player
        </Link>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-2xl bg-card border border-border/40"
            />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">
          Failed to load players: {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && players.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-32 text-center">
          <p className="text-xl font-semibold text-foreground">No players yet</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Add your crew members in Admin to get started tracking matches.
          </p>
          <Link
            to="/admin"
            className="mt-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold
              text-primary-foreground shadow-primary hover:brightness-110 transition-all"
          >
            Go to Admin
          </Link>
        </div>
      )}

      {/* Player grid */}
      {!loading && !error && players.length > 0 && (
        <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {players.map((p) => (
            <PlayerCard key={p.id} player={p} stats={p.stats} activeDeck={p.activeDeck} />
          ))}
        </div>
      )}
    </div>
  );
}
