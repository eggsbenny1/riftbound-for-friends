import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { ArrowLeft, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import MatchCard from '@/components/match/MatchCard';
import MatchupTable from '@/components/match/MatchupTable';
import DeckSection from '@/components/deck/DeckSection';
import type { Deck, DeckCard, Match, MatchupStat, Player, PlayerStats } from '@/types';

type ProfileData = {
  player: Player;
  stats: PlayerStats | null;
  activeDeck: (Deck & { legend_image_url?: string | null; legend_name?: string }) | null;
  decks: Deck[];
  matches: Match[];
  matchups: MatchupStat[];
  allPlayers: Player[];
};

export default function PlayerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ProfileData | null>(null);
  const [deckCards, setDeckCards] = useState<DeckCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    load(id);
  }, [id]);

  async function load(playerId: string) {
    setLoading(true);
    setError(null);

    const [
      { data: player, error: pErr },
      { data: statsRows },
      { data: deckRows },
      { data: matchRows },
      { data: matchupRows },
      { data: allPlayerRows },
    ] = await Promise.all([
      supabase.from('players').select('*').eq('id', playerId).single(),
      supabase.from('player_stats').select('*').eq('player_id', playerId),
      supabase.from('decks').select('*, legend:legend_id(id,name,tags,image_url)').eq('player_id', playerId).order('is_active', { ascending: false }).order('name'),
      supabase.from('matches').select('*, player1:player1_id(*), player2:player2_id(*)').or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`).order('played_at', { ascending: false }).limit(50),
      supabase.from('matchup_stats').select('*').eq('player_id', playerId),
      supabase.from('players').select('*').eq('is_active', true),
    ]);

    if (pErr || !player) { setError('Player not found'); setLoading(false); return; }

    const stats = statsRows?.[0] ?? null;
    const activeDeckRaw = (deckRows as any[])?.find((d: any) => d.is_active);
    const activeDeck = activeDeckRaw
      ? {
          ...activeDeckRaw,
          legend_image_url: activeDeckRaw.legend?.image_url ?? null,
          legend_name: activeDeckRaw.legend?.tags ?? activeDeckRaw.legend?.name ?? null,
        }
      : null;

    setData({
      player: player as Player,
      stats: stats as PlayerStats | null,
      activeDeck,
      decks: (deckRows as Deck[]) ?? [],
      matches: (matchRows as Match[]) ?? [],
      matchups: (matchupRows as MatchupStat[]) ?? [],
      allPlayers: (allPlayerRows as Player[]) ?? [],
    });

    // Load active deck cards
    if (activeDeckRaw?.id) {
      const { data: cardRows } = await supabase
        .from('deck_cards')
        .select('*')
        .eq('deck_id', activeDeckRaw.id)
        .order('sort_order');
      setDeckCards((cardRows as DeckCard[]) ?? []);
    }

    setLoading(false);
  }

  if (loading) return <div className="py-20 text-center text-muted-foreground">Loading…</div>;
  if (error || !data) return <div className="py-20 text-center text-destructive">{error ?? 'Not found'}</div>;

  const { player, stats, activeDeck, decks, matches, matchups, allPlayers } = data;
  const legendImg = activeDeck?.legend_image_url;

  return (
    <div className="-mt-6 -mx-4">
      {/* Hero section */}
      <div className="relative h-48 sm:h-64 overflow-hidden">
        {legendImg ? (
          <img
            src={legendImg}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-top"
            style={{ filter: 'blur(20px) brightness(0.4)', transform: 'scale(1.1)' }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${player.color}44, ${player.color}11)` }}
          />
        )}
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 flex items-center gap-1 rounded-lg bg-black/40 backdrop-blur-sm px-3 py-1.5 text-sm text-white hover:bg-black/60"
        >
          <ArrowLeft size={14} /> Back
        </button>

        {/* Frosted glass profile card */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md px-6 py-4 shadow-2xl">
          <div
            className="h-16 w-16 rounded-full overflow-hidden border-2 shrink-0"
            style={{ borderColor: player.color }}
          >
            {player.avatar_url ? (
              <img src={player.avatar_url} alt={player.display_name} className="h-full w-full object-cover" />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-xl font-bold text-white"
                style={{ background: player.color }}
              >
                {player.display_name[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{player.display_name}</h1>
            {activeDeck?.legend_name && (
              <p className="text-sm text-white/70">{activeDeck.legend_name}</p>
            )}
            {player.bio && <p className="text-xs text-white/60 mt-0.5 max-w-xs">{player.bio}</p>}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mt-16 flex justify-center gap-8 py-4 border-b border-white/10">
        {[
          { label: 'Wins', value: stats?.wins ?? 0, color: 'text-green-400' },
          { label: 'Losses', value: stats?.losses ?? 0, color: 'text-destructive' },
          { label: 'WR%', value: stats?.total_games ? `${stats.win_rate_pct ?? 0}%` : '—', color: 'text-primary' },
          { label: 'Games', value: stats?.total_games ?? 0, color: 'text-foreground' },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center">
            <div className={`text-xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs.Root defaultValue="overview" className="px-4 pb-8">
        <Tabs.List className="flex gap-1 border-b border-white/10 mt-2 mb-6">
          {['overview', 'deck', 'matchups', 'history'].map((tab) => (
            <Tabs.Trigger
              key={tab}
              value={tab}
              className="px-4 py-2 text-sm font-medium capitalize text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary transition-colors"
            >
              {tab}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* Overview */}
        <Tabs.Content value="overview" className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Active Deck</h2>
          {activeDeck ? (
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-card p-4">
              <div>
                <p className="font-semibold">{activeDeck.name}</p>
                {activeDeck.legend_name && (
                  <p className="text-sm text-muted-foreground">{activeDeck.legend_name}</p>
                )}
              </div>
              <Link
                to={`/players/${id}/deck/${activeDeck.id}/edit`}
                className="text-xs text-primary hover:underline"
              >
                Edit
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No active deck.</p>
          )}

          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mt-4">Recent Matches</h2>
          {matches.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No matches yet.</p>
          ) : (
            <div className="space-y-2">
              {matches.slice(0, 5).map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          )}
        </Tabs.Content>

        {/* Deck */}
        <Tabs.Content value="deck" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Decks</h2>
            <Link
              to={`/players/${id}/deck/new`}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Plus size={12} /> New Deck
            </Link>
          </div>

          {decks.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No decks yet.</p>
          ) : (
            decks.map((deck) => (
              <div key={deck.id} className="rounded-xl border border-white/10 bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{deck.name}</span>
                    {deck.is_active && (
                      <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
                        Active
                      </span>
                    )}
                  </div>
                  <Link
                    to={`/players/${id}/deck/${deck.id}/edit`}
                    className="text-xs text-primary hover:underline"
                  >
                    Edit
                  </Link>
                </div>
                {deck.id === activeDeck?.id && deckCards.length > 0 && (
                  <div className="mt-2">
                    {(['main', 'rune', 'battlefield', 'sideboard'] as const).map((s) => {
                      const sc = deckCards.filter((c) => c.section === s);
                      return sc.length > 0 ? (
                        <DeckSection key={s} section={s} cards={sc} readonly />
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </Tabs.Content>

        {/* Matchups */}
        <Tabs.Content value="matchups">
          <MatchupTable stats={matchups} players={allPlayers} currentPlayerId={id!} />
        </Tabs.Content>

        {/* History */}
        <Tabs.Content value="history" className="space-y-2">
          {matches.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No match history yet.</p>
          ) : (
            matches.map((m) => <MatchCard key={m.id} match={m} />)
          )}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
