import { create } from 'zustand';
import type { MatchFormat } from '@/types';

interface ScorePlayer {
  id: string | null;
  name: string;
  score: number;
}

interface ScoreStore {
  format: MatchFormat;
  player1: ScorePlayer;
  player2: ScorePlayer;
  games_p1: number;
  games_p2: number;
  game_winner: 'player1' | 'player2' | null; // set when a game ends, cleared on confirmGame
  match_over: boolean;
  winner: 'player1' | 'player2' | null;

  setFormat: (f: MatchFormat) => void;
  setPlayer: (side: 'player1' | 'player2', name: string, id?: string | null) => void;
  increment: (side: 'player1' | 'player2') => void;
  decrement: (side: 'player1' | 'player2') => void;
  confirmGame: () => void; // called when user presses "Next Match"
  resetGame: () => void;
  resetMatch: () => void;
}

const WINS_NEEDED: Record<MatchFormat, number> = { bo1: 1, bo3: 2, bo5: 3 };

const defaultPlayer = (name: string): ScorePlayer => ({ id: null, name, score: 0 });

export const useScoreStore = create<ScoreStore>((set, get) => ({
  format: 'bo1',
  player1: defaultPlayer('Player 1'),
  player2: defaultPlayer('Player 2'),
  games_p1: 0,
  games_p2: 0,
  game_winner: null,
  match_over: false,
  winner: null,

  setFormat: (f) => set({ format: f }),

  setPlayer: (side, name, id = null) =>
    set((s) => ({ [side]: { ...s[side], name, id } })),

  increment: (side) => {
    const state = get();
    if (state.match_over || state.game_winner) return;

    const current = state[side].score;
    if (current >= 8) return;

    const newScore = current + 1;

    if (newScore < 8) {
      set({ [side]: { ...state[side], score: newScore } });
      return;
    }

    // Score hit 8 — pause and show game-win overlay
    set({
      [side]: { ...state[side], score: newScore },
      game_winner: side,
    });
  },

  confirmGame: () => {
    const state = get();
    if (!state.game_winner) return;

    const side = state.game_winner;
    const other = side === 'player1' ? 'player2' : 'player1';
    const gKey = side === 'player1' ? 'games_p1' : 'games_p2';
    const newGames = state[gKey] + 1;
    const needed = WINS_NEEDED[state.format];

    if (newGames >= needed) {
      // Series over
      set({
        [gKey]: newGames,
        game_winner: null,
        match_over: true,
        winner: side,
      });
    } else {
      // More games — reset scores, update circles
      set({
        [side]: { ...state[side], score: 0 },
        [other]: { ...state[other], score: 0 },
        [gKey]: newGames,
        game_winner: null,
      });
    }
  },

  decrement: (side) => {
    const state = get();
    if (state.match_over || state.game_winner) return;
    const current = state[side].score;
    if (current <= 0) return;
    set({ [side]: { ...state[side], score: current - 1 } });
  },

  resetGame: () =>
    set((s) => ({
      player1: { ...s.player1, score: 0 },
      player2: { ...s.player2, score: 0 },
      game_winner: null,
    })),

  resetMatch: () =>
    set((s) => ({
      player1: { ...s.player1, score: 0 },
      player2: { ...s.player2, score: 0 },
      games_p1: 0,
      games_p2: 0,
      game_winner: null,
      match_over: false,
      winner: null,
    })),
}));
