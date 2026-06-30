import { Link } from 'react-router-dom';
import type { Match } from '@/types';

type Props = { match: Match };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export default function MatchCard({ match }: Props) {
  const p1 = match.player1;
  const p2 = match.player2;
  const winnerId = match.winner_id;

  const p1Won = winnerId === match.player1_id;
  const p2Won = winnerId === match.player2_id;

  const scoreLabel =
    match.format === 'bo1'
      ? `${match.score_p1}–${match.score_p2}`
      : `${match.games_p1}–${match.games_p2}`;

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-border/60 bg-card
      px-4 py-3.5 transition-colors hover:border-border hover:bg-card/80">

      {/* Format */}
      <span className="shrink-0 badge bg-secondary text-muted-foreground">
        {match.format}
      </span>

      {/* Players + score */}
      <div className="flex flex-1 items-center gap-2 min-w-0 text-sm">
        <Link
          to={`/players/${match.player1_id}`}
          onClick={(e) => e.stopPropagation()}
          className={`truncate font-semibold transition-colors hover:text-primary ${
            p1Won ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          {p1?.display_name ?? 'Player 1'}
        </Link>

        <span className="shrink-0 font-bold text-base tabular text-foreground px-1">
          {scoreLabel}
        </span>

        <Link
          to={`/players/${match.player2_id}`}
          onClick={(e) => e.stopPropagation()}
          className={`truncate font-semibold transition-colors hover:text-primary ${
            p2Won ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          {p2?.display_name ?? 'Player 2'}
        </Link>
      </div>

      {/* Tags */}
      {match.tags?.length > 0 && (
        <div className="hidden sm:flex gap-1 shrink-0">
          {match.tags.slice(0, 2).map((t) => (
            <span key={t} className="badge bg-secondary text-muted-foreground">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Date */}
      <span className="shrink-0 text-xs text-muted-foreground tabular">
        {formatDate(match.played_at)}
      </span>
    </div>
  );
}
