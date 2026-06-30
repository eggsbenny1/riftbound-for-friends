import { Link } from 'react-router-dom';
import type { Player, PlayerStats, Deck } from '@/types';

type Props = {
  player: Player;
  stats: PlayerStats | null;
  activeDeck: (Deck & { legend_image_url?: string | null }) | null;
};

export default function PlayerCard({ player, stats, activeDeck }: Props) {
  const winRate =
    stats && stats.total_games > 0
      ? `${stats.win_rate_pct ?? 0}%`
      : '—';

  const legendImg = activeDeck?.legend_image_url ?? null;

  return (
    <Link
      to={`/players/${player.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-card shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl"
    >
      {/* Legend art background */}
      <div className="relative h-36 w-full overflow-hidden bg-muted">
        {legendImg ? (
          <img
            src={legendImg}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-top opacity-60 transition-opacity group-hover:opacity-80"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${player.color}33 0%, ${player.color}11 100%)` }}
          />
        )}
        {/* Gradient overlay so text is always readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
      </div>

      {/* Avatar + name */}
      <div className="relative -mt-10 flex flex-col items-center px-4 pb-4">
        <div
          className="h-20 w-20 overflow-hidden rounded-full border-4 shadow-md"
          style={{ borderColor: player.color }}
        >
          {player.avatar_url ? (
            <img
              src={player.avatar_url}
              alt={player.display_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-2xl font-bold text-white"
              style={{ background: player.color }}
            >
              {player.display_name[0]?.toUpperCase()}
            </div>
          )}
        </div>

        <h2 className="mt-2 text-lg font-bold leading-tight text-foreground">
          {player.display_name}
        </h2>

        {activeDeck?.legend && (
          <p className="text-xs text-muted-foreground">
            {activeDeck.legend.tags ?? activeDeck.legend.name}
          </p>
        )}

        {/* Stats row */}
        <div className="mt-3 flex w-full justify-around text-center text-sm">
          <div>
            <div className="font-semibold text-foreground">{stats?.wins ?? 0}</div>
            <div className="text-xs text-muted-foreground">W</div>
          </div>
          <div>
            <div className="font-semibold text-foreground">{stats?.losses ?? 0}</div>
            <div className="text-xs text-muted-foreground">L</div>
          </div>
          <div>
            <div className="font-semibold" style={{ color: player.color }}>
              {winRate}
            </div>
            <div className="text-xs text-muted-foreground">WR</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
