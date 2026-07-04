import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScoreStore } from '@/stores/scoreStore';
import type { Player } from '@/types';

type Side = 'player1' | 'player2';

type Props = {
  side: Side;
  flipped?: boolean;
  players: Player[];
};

export default function PlayerPanel({ side, flipped, players }: Props) {
  const player = useScoreStore((s) => s[side]);
  const games = useScoreStore((s) => side === 'player1' ? s.games_p1 : s.games_p2);
  const format = useScoreStore((s) => s.format);
  const matchOver = useScoreStore((s) => s.match_over);
  const gameWinner = useScoreStore((s) => s.game_winner);
  const winner = useScoreStore((s) => s.winner);
  const increment = useScoreStore((s) => s.increment);
  const decrement = useScoreStore((s) => s.decrement);
  const setPlayer = useScoreStore((s) => s.setPlayer);

  const isWinning = player.score === 8 || winner === side;
  const isLoser = winner && winner !== side;
  const isBo = format !== 'bo1';
  const blocked = matchOver || !!gameWinner;

  return (
    <div
      className={cn(
        'relative flex h-[50dvh] w-full flex-col items-center justify-center gap-4 select-none transition-colors',
        flipped && 'rotate-180',
        isWinning && !matchOver && 'bg-primary/10',
        winner === side && 'bg-primary/20',
        isLoser && 'bg-white/5 opacity-70'
      )}
    >
      {/* Player name / selector — counter-rotated so it reads correctly from both sides */}
      <div className={cn('flex justify-center w-full px-8', flipped && 'rotate-180')}>
        {blocked ? (
          <p className={cn('text-lg font-bold tracking-wide text-center', isLoser ? 'text-muted-foreground' : 'text-foreground')}>
            {player.name}
          </p>
        ) : (
          <select
            value={player.id ?? ''}
            onChange={(e) => {
              const p = players.find((x) => x.id === e.target.value);
              setPlayer(side, p?.display_name ?? (side === 'player1' ? 'Player 1' : 'Player 2'), p?.id ?? null);
            }}
            className="bg-transparent text-lg font-bold tracking-wide text-foreground text-center appearance-none cursor-pointer focus:outline-none w-full"
          >
            <option value="">{side === 'player1' ? 'Player 1' : 'Player 2'}</option>
            {players.map((p) => (
              <option key={p.id} value={p.id} className="bg-card text-foreground">
                {p.display_name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Series game pips for bo3/bo5 */}
      {isBo && (
        <div className={cn('flex gap-2', flipped && 'rotate-180')}>
          {Array.from({ length: format === 'bo3' ? 2 : 3 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-3 w-3 rounded-full border-2',
                i < games ? 'border-primary bg-primary' : 'border-white/30'
              )}
            />
          ))}
        </div>
      )}

      {/* Giant score */}
      <div
        className={cn(
          'text-[clamp(6rem,20vw,10rem)] font-black leading-none tabular-nums',
          isWinning ? 'text-primary' : 'text-foreground',
          isLoser && 'text-muted-foreground'
        )}
      >
        {player.score}
      </div>

      {/* +/- buttons */}
      {!blocked && (
        <div className={cn('flex gap-5', flipped && 'rotate-180')}>
          <button
            onPointerDown={(e) => { e.preventDefault(); decrement(side); }}
            className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/10 text-foreground active:scale-95 active:bg-white/20 transition-transform"
            aria-label="Decrease score"
          >
            <Minus size={36} />
          </button>
          <button
            onPointerDown={(e) => { e.preventDefault(); increment(side); }}
            disabled={player.score >= 8}
            className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/80 text-primary-foreground active:scale-95 active:bg-primary transition-transform disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
            aria-label="Increase score"
          >
            <Plus size={36} />
          </button>
        </div>
      )}
    </div>
  );
}
