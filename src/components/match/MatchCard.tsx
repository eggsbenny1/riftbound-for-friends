import { Link } from 'react-router-dom';
import type { Match } from '@/types';

type Props = { match: Match };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MatchCard({ match }: Props) {
  const p1 = match.player1;
  const p2 = match.player2;
  const winnerId = match.winner_id;

  const formatLabel = match.format.toUpperCase();

  const scoreLabel =
    match.format === 'bo1'
      ? `${match.score_p1}–${match.score_p2}`
      : `${match.games_p1}–${match.games_p2} (${match.score_p1}–${match.score_p2})`;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-card px-4 py-3 hover:bg-white/5 transition-colors">
      {/* Format badge */}
      <span className="shrink-0 rounded-md bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
        {formatLabel}
      </span>

      {/* Players */}
      <div className="flex flex-1 items-center gap-2 min-w-0 text-sm">
        <Link
          to={`/players/${match.player1_id}`}
          className={`truncate font-semibold ${winnerId === match.player1_id ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          {p1?.display_name ?? 'Player 1'}
        </Link>
        <span className="shrink-0 font-bold text-primary">{scoreLabel}</span>
        <Link
          to={`/players/${match.player2_id}`}
          className={`truncate font-semibold ${winnerId === match.player2_id ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          {p2?.display_name ?? 'Player 2'}
        </Link>
      </div>

      {/* Tags */}
      {match.tags?.length > 0 && (
        <div className="hidden sm:flex gap-1 shrink-0">
          {match.tags.slice(0, 2).map((t) => (
            <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Date */}
      <span className="shrink-0 text-xs text-muted-foreground">{formatDate(match.played_at)}</span>
    </div>
  );
}
