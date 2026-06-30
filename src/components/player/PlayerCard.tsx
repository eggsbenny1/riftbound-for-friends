import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { Player, PlayerStats, Deck } from '@/types';

type Props = {
  player: Player;
  stats: PlayerStats | null;
  activeDeck: (Deck & { legend_image_url?: string | null }) | null;
};

export default function PlayerCard({ player, stats, activeDeck }: Props) {
  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const total = stats?.total_games ?? 0;
  const wr = total > 0 ? (stats?.win_rate_pct ?? 0) : null;

  const legendImg = activeDeck?.legend_image_url ?? null;
  const legendName = (activeDeck as any)?.legend?.tags ?? (activeDeck as any)?.legend?.name ?? null;

  return (
    <Link
      to={`/players/${player.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60
        bg-card shadow-card transition-all duration-300
        hover:-translate-y-1.5 hover:shadow-card-hover hover:border-border"
    >
      {/* Legend art hero */}
      <div className="relative h-40 w-full overflow-hidden bg-muted">
        {legendImg ? (
          <>
            <img
              src={legendImg}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-top
                transition-transform duration-500 group-hover:scale-105"
            />
            {/* Gradient fade to card bg */}
            <div className="absolute inset-0 bg-legend-fade" />
          </>
        ) : (
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, ${player.color}, transparent 70%)`,
            }}
          />
        )}

        {/* Win rate pill — top right */}
        {wr !== null && (
          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full
            bg-black/50 backdrop-blur-sm px-2.5 py-1">
            <span
              className="text-xs font-bold tabular"
              style={{ color: wr >= 50 ? '#4ade80' : '#f87171' }}
            >
              {wr}%
            </span>
          </div>
        )}
      </div>

      {/* Avatar — bridges the art/info sections */}
      <div className="relative -mt-8 flex flex-col items-center px-5 pb-5">
        <div
          className="h-16 w-16 overflow-hidden rounded-2xl border-2 shadow-lg shrink-0"
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
              className="flex h-full w-full items-center justify-center text-xl font-bold text-white"
              style={{ background: player.color }}
            >
              {player.display_name[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Name + legend */}
        <h2 className="mt-3 text-base font-bold leading-tight text-foreground text-center">
          {player.display_name}
        </h2>
        {legendName ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{legendName}</p>
        ) : (
          <p className="mt-0.5 text-xs text-muted-foreground italic">No active deck</p>
        )}

        {/* Divider */}
        <div className="mt-4 mb-3 h-px w-full bg-border/60" />

        {/* Stats row */}
        <div className="flex w-full justify-around text-center">
          <div>
            <div className={cn('stat-number', wins > 0 ? 'text-green-400' : 'text-muted-foreground')}>
              {wins}
            </div>
            <div className="stat-label">W</div>
          </div>
          <div className="w-px bg-border/60" />
          <div>
            <div className={cn('stat-number', losses > 0 ? 'text-red-400' : 'text-muted-foreground')}>
              {losses}
            </div>
            <div className="stat-label">L</div>
          </div>
          <div className="w-px bg-border/60" />
          <div>
            <div
              className="stat-number"
              style={{ color: total === 0 ? undefined : wr! >= 50 ? '#4ade80' : '#f87171' }}
            >
              {total === 0 ? '—' : `${wr}%`}
            </div>
            <div className="stat-label">WR</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
