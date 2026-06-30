import { useEffect, useState } from 'react';
import { Trophy, RotateCcw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useScoreStore } from '@/stores/scoreStore';
import PlayerPanel from './PlayerPanel';
import SaveMatchModal from './SaveMatchModal';
import type { MatchFormat, Player } from '@/types';

export default function ScoreCounter() {
  const store = useScoreStore();
  const [players, setPlayers] = useState<Player[]>([]);
  const [saveOpen, setSaveOpen] = useState(false);

  useEffect(() => {
    supabase.from('players').select('*').eq('is_active', true).order('display_name')
      .then(({ data }) => setPlayers((data as Player[]) ?? []));
  }, []);

  const winnerName = store.winner === 'player1' ? store.player1.name : store.player2.name;
  const gameWinnerName = store.game_winner === 'player1' ? store.player1.name : store.player2.name;

  return (
    <div className="fixed inset-0 z-30 flex flex-col overflow-hidden">
      {/* Wallpaper — contained so the full image is always visible.
          On mobile it fills the width; on wider screens the image stays
          phone-sized and the sides show the dark background. */}
      <div className="absolute inset-0 bg-[#07101d]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/score-wallpaper.jpg)',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'blur(6px) brightness(0.38) saturate(1.15)',
          }}
        />
      </div>
      {/* Legibility overlay */}
      <div className="absolute inset-0 bg-black/35" />
      {/* Format selector — narrow strip in the middle */}
      <div className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
        {!store.match_over && (
          <div className="flex gap-1 rounded-full border border-white/20 bg-card/80 backdrop-blur-sm p-1">
            {(['bo1', 'bo3', 'bo5'] as MatchFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => store.setFormat(f)}
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase transition-colors ${
                  store.format === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Player 1 — top half, rotated so P1 faces upward on the table */}
      <div className="flex-1 border-b border-white/10">
        <PlayerPanel side="player1" flipped players={players} />
      </div>

      {/* Player 2 — bottom half */}
      <div className="flex-1">
        <PlayerPanel side="player2" players={players} />
      </div>

      {/* Game-win overlay (Bo3/Bo5 mid-series) */}
      {store.game_winner && !store.match_over && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-black/75 backdrop-blur-md">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Game Over</p>
          <p className="text-5xl font-black uppercase tracking-tight text-foreground">
            {gameWinnerName}
          </p>
          <p className="text-lg font-semibold text-primary">wins this game</p>
          <button
            onClick={() => store.confirmGame()}
            className="mt-4 rounded-2xl bg-primary px-10 py-4 text-base font-bold text-primary-foreground shadow-primary hover:brightness-110 active:scale-[0.97] transition-all"
          >
            Next Game →
          </button>
          <button
            onClick={() => store.undoWin()}
            className="text-xs text-white/40 hover:text-white/70 transition-colors mt-1"
          >
            ← Go back
          </button>
        </div>
      )}

      {/* Match over overlay */}
      {store.match_over && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-black/75 backdrop-blur-md">
          <Trophy size={56} className="text-yellow-400" />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Series Over</p>
          <p className="text-5xl font-black uppercase tracking-tight text-foreground">{winnerName}</p>
          <p className="text-lg font-semibold text-primary">wins the match</p>
          {store.format !== 'bo1' && (
            <p className="text-sm text-muted-foreground">{store.games_p1}–{store.games_p2}</p>
          )}
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setSaveOpen(true)}
              className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:brightness-110"
            >
              Save Match
            </button>
            <button
              onClick={() => store.resetMatch()}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-6 py-3 font-semibold text-muted-foreground hover:text-foreground"
            >
              <RotateCcw size={16} /> New Match
            </button>
          </div>
          <button
            onClick={() => store.undoWin()}
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            ← Go back
          </button>
        </div>
      )}

      {/* Reset button — bottom-right */}
      {!store.match_over && (
        <button
          onClick={() => store.resetMatch()}
          className="absolute bottom-4 right-4 z-10 flex items-center gap-1 rounded-lg border border-white/10 bg-card/80 backdrop-blur-sm px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw size={12} /> Reset
        </button>
      )}

      {/* Home pill — bottom-left, opposite the reset button */}
      {!store.match_over && (
        <Link
          to="/"
          className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 rounded-lg border border-white/10 bg-card/80 backdrop-blur-sm px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Home size={12} /> Home
        </Link>
      )}

      <SaveMatchModal
        open={saveOpen}
        onOpenChange={setSaveOpen}
        onSaved={() => store.resetMatch()}
      />
    </div>
  );
}
