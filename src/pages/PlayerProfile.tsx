import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { ArrowLeft, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import MatchCard from '@/components/match/MatchCard';
import MatchupTable from '@/components/match/MatchupTable';
import DeckSection from '@/components/deck/DeckSection';
import type { Deck, DeckCard, Match, MatchupStat, Player, PlayerStats } from '@/types';
import { getPlayerBanner } from '@/lib/playerBanners';

type ProfileData = {
  player: Player;
  stats: PlayerStats | null;
  activeDeck: (Deck & { legend_image_url?: string | null; legend_name?: string }) | null;
  decks: Deck[];
  matches: Match[];
  matchups: MatchupStat[];
  allPlayers: Player[];
};

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'deck',     label: 'Decks' },
  { value: 'matchups', label: 'Matchups' },
  { value: 'history',  label: 'History' },
];

export default function PlayerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ProfileData | null>(null);
  const [deckCards, setDeckCards] = useState<DeckCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (id) load(id); }, [id]);

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
      supabase.from('decks').select('*, legend:legend_id(id,name,tags,image_url)')
        .eq('player_id', playerId).order('is_active', { ascending: false }).order('name'),
      supabase.from('matches')
        .select('*, player1:player1_id(*), player2:player2_id(*)')
        .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)
        .order('played_at', { ascending: false }).limit(50),
      supabase.from('matchup_stats').select('*').eq('player_id', playerId),
      supabase.from('players').select('*').eq('is_active', true),
    ]);

    if (pErr || !player) { setError('Player not found'); setLoading(false); return; }

    const stats = statsRows?.[0] ?? null;
    const activeDeckRaw = (deckRows as any[])?.find((d: any) => d.is_active);
    const activeDeck = activeDeckRaw ? {
      ...activeDeckRaw,
      legend_image_url: activeDeckRaw.legend?.image_url ?? null,
      legend_name: activeDeckRaw.legend?.tags ?? activeDeckRaw.legend?.name ?? null,
    } : null;

    setData({
      player: player as Player,
      stats: stats as PlayerStats | null,
      activeDeck,
      decks: (deckRows as Deck[]) ?? [],
      matches: (matchRows as Match[]) ?? [],
      matchups: (matchupRows as MatchupStat[]) ?? [],
      allPlayers: (allPlayerRows as Player[]) ?? [],
    });

    if (activeDeckRaw?.id) {
      const { data: cardRows } = await supabase
        .from('deck_cards').select('*').eq('deck_id', activeDeckRaw.id).order('sort_order');
      setDeckCards((cardRows as DeckCard[]) ?? []);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-32 text-destructive">
        {error ?? 'Not found'}
      </div>
    );
  }

  const { player, stats, activeDeck, decks, matches, matchups, allPlayers } = data;
  const legendImg = activeDeck?.legend_image_url;
  const bannerImg = getPlayerBanner(player.display_name);
  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const total = stats?.total_games ?? 0;
  const wr = total > 0 ? (stats?.win_rate_pct ?? 0) : null;

  return (
    <div className="-mt-10 -mx-6">
      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        {/* Dark base */}
        <div className="absolute inset-0" style={{ background: '#07101d' }} />
        {bannerImg ? (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${bannerImg.src})`,
              backgroundSize: 'cover',
              backgroundPosition: bannerImg.position,
              filter: 'blur(3px) brightness(0.55) saturate(1.1)',
              transform: 'scale(1.04)',
            }}
          />
        ) : player.avatar_url ? (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${player.avatar_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              filter: 'blur(3px) brightness(0.55) saturate(1.1)',
              transform: 'scale(1.04)',
            }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 80% 60% at 50% 30%, ${player.color}50 0%, transparent 70%)`,
            }}
          />
        )}
        {/* Subtle dark overlay so text stays readable */}
        <div className="absolute inset-0 bg-black/20" />
        {/* Bottom fade into page background */}
        <div className="absolute inset-0 bg-hero-fade" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-5 left-6 z-10 flex items-center gap-1.5 rounded-lg
            bg-black/40 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-white/80
            hover:text-white hover:bg-black/60 transition-colors"
        >
          <ArrowLeft size={13} /> Back
        </button>

        {/* Profile pill — centered inside the hero */}
        <div className="absolute inset-x-6 bottom-8 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2
          z-10 flex items-center gap-5
          rounded-2xl border border-white/10 bg-white/[0.08] backdrop-blur-xl
          px-6 py-5 shadow-modal sm:min-w-[340px]">
          <div
            className="h-16 w-16 rounded-2xl overflow-hidden border-2 shrink-0 shadow-lg"
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
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-white truncate">{player.display_name}</h1>
            {activeDeck?.legend_name && (
              <p className="text-sm text-white/60 mt-0.5">{activeDeck.legend_name}</p>
            )}
            {player.bio && (
              <p className="text-xs text-white/50 mt-1 line-clamp-1">{player.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats bar ─────────────────────────────────────── */}
      <div className="mt-6 px-6">
        <div className="flex justify-around rounded-2xl border border-border/60 bg-card shadow-card py-5">
          {[
            { label: 'Wins',   value: wins,   color: wins > 0 ? '#4ade80' : undefined },
            { label: 'Losses', value: losses, color: losses > 0 ? '#f87171' : undefined },
            { label: 'Win Rate', value: wr !== null ? `${wr}%` : '—', color: wr !== null ? (wr >= 50 ? '#4ade80' : '#f87171') : undefined },
            { label: 'Games',  value: total,  color: undefined },
          ].map(({ label, value, color }, i, arr) => (
            <div key={label} className="flex items-center gap-0">
              <div className="text-center px-4 sm:px-8">
                <div className="text-2xl font-bold tabular leading-none" style={color ? { color } : undefined}>
                  {value}
                </div>
                <div className="stat-label mt-2">{label}</div>
              </div>
              {i < arr.length - 1 && <div className="h-8 w-px bg-border/60" />}
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────── */}
      <Tabs.Root defaultValue="overview" className="mt-8 px-6 pb-8">
        <Tabs.List className="flex border-b border-border/60 mb-8">
          {TABS.map(({ value, label }) => (
            <Tabs.Trigger
              key={value}
              value={value}
              className="relative px-4 py-2.5 text-sm font-medium text-muted-foreground
                transition-colors hover:text-foreground
                data-[state=active]:text-foreground
                focus-visible:outline-none
                group"
            >
              {label}
              <span className="absolute inset-x-4 -bottom-px h-px bg-primary scale-x-0 transition-transform group-data-[state=active]:scale-x-100" />
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* Overview */}
        <Tabs.Content value="overview" className="space-y-6 focus-visible:outline-none">
          <section>
            <h2 className="section-label mb-3">Active Deck</h2>
            {activeDeck ? (
              <div className="card-surface flex items-center justify-between p-5">
                <div>
                  <p className="font-semibold">{activeDeck.name}</p>
                  {activeDeck.legend_name && (
                    <p className="text-sm text-muted-foreground mt-0.5">{activeDeck.legend_name}</p>
                  )}
                </div>
                <Link
                  to={`/players/${id}/deck/${activeDeck.id}/edit`}
                  className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Edit →
                </Link>
              </div>
            ) : (
              <div className="card-surface p-5">
                <p className="text-sm text-muted-foreground italic">No active deck.</p>
                <Link
                  to={`/players/${id}/deck/new`}
                  className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Plus size={12} /> Create deck
                </Link>
              </div>
            )}
          </section>

          <section>
            <h2 className="section-label mb-3">Recent Matches</h2>
            {matches.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No matches yet.</p>
            ) : (
              <div className="space-y-2">
                {matches.slice(0, 5).map((m) => <MatchCard key={m.id} match={m} />)}
              </div>
            )}
          </section>
        </Tabs.Content>

        {/* Deck */}
        <Tabs.Content value="deck" className="focus-visible:outline-none">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-label">All Decks</h2>
            <Link
              to={`/players/${id}/deck/new`}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Plus size={12} /> New Deck
            </Link>
          </div>

          {decks.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No decks yet.</p>
          ) : (
            <div className="space-y-4">
              {decks.map((deck) => (
                <div key={deck.id} className="card-surface p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="font-semibold">{deck.name}</span>
                      {deck.is_active && (
                        <span className="badge bg-primary/15 text-primary">Active</span>
                      )}
                    </div>
                    <Link
                      to={`/players/${id}/deck/${deck.id}/edit`}
                      className="text-xs font-medium text-primary hover:text-primary/80"
                    >
                      Edit →
                    </Link>
                  </div>
                  {deck.id === activeDeck?.id && deckCards.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {(['main', 'rune', 'battlefield', 'sideboard'] as const).map((s) => {
                        const sc = deckCards.filter((c) => c.section === s);
                        return sc.length > 0 ? (
                          <DeckSection key={s} section={s} cards={sc} readonly />
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Tabs.Content>

        {/* Matchups */}
        <Tabs.Content value="matchups" className="focus-visible:outline-none">
          <MatchupTable stats={matchups} players={allPlayers} currentPlayerId={id} />
        </Tabs.Content>

        {/* History */}
        <Tabs.Content value="history" className="space-y-2 focus-visible:outline-none">
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
