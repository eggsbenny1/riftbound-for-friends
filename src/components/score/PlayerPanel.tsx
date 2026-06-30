import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScoreStore } from '@/stores/scoreStore';

type Side = 'player1' | 'player2';

type Props = {
  side: Side;
  flipped?: boolean;
};

export default function PlayerPanel({ side, flipped }: Props) {
  const player = useScoreStore((s) => s[side]);
  const games = useScoreStore((s) => side === 'player1' ? s.games_p1 : s.games_p2);
  const format = useScoreStore((s) => s.format);
  const matchOver = useScoreStore((s) => s.match_over);
  const gameWinner = useScoreStore((s) => s.game_winner);
  const winner = useScoreStore((s) => s.winner);
  const increment = useScoreStore((s) => s.increment);
  const decrement = useScoreStore((s) => s.decrement);

  const isWinning = player.score === 8 || winner === side;
  const isLoser = winner && winner !== side;
  const isBo = format !== 'bo1';

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
      {/* Player name */}
      <p className={cn(
        'text-lg font-bold tracking-wide',
        flipped && 'rotate-180',
        isLoser ? 'text-muted-foreground' : 'text-foreground'
      )}>
        {player.name}
      </p>

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
      {!matchOver && !gameWinner && (
        <div className={cn('flex gap-4', flipped && 'rotate-180')}>
          <button
            onPointerDown={(e) => { e.preventDefault(); decrement(side); }}
            className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 text-foreground active:scale-95 active:bg-white/20 transition-transform"
            aria-label="Decrease score"
          >
            <Minus size={32} />
          </button>
          <button
            onPointerDown={(e) => { e.preventDefault(); increment(side); }}
            className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/80 text-primary-foreground active:scale-95 active:bg-primary transition-transform"
            aria-label="Increase score"
          >
            <Plus size={32} />
          </button>
        </div>
      )}
    </div>
  );
}
