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
  match_over: boolean;
  winner: 'player1' | 'player2' | null;

  setFormat: (f: MatchFormat) => void;
  setPlayer: (side: 'player1' | 'player2', name: string, id?: string | null) => void;
  increment: (side: 'player1' | 'player2') => void;
  decrement: (side: 'player1' | 'player2') => void;
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
  match_over: false,
  winner: null,

  setFormat: (f) => set({ format: f }),

  setPlayer: (side, name, id = null) =>
    set((s) => ({ [side]: { ...s[side], name, id } })),

  increment: (side) => {
    const state = get();
    if (state.match_over) return;

    const other = side === 'player1' ? 'player2' : 'player1';
    const current = state[side].score;
    if (current >= 8) return;

    const newScore = current + 1;
    const updatedPlayer = { ...state[side], score: newScore };

    if (newScore < 8) {
      set({ [side]: updatedPlayer });
      return;
    }

    // Game won — tally series
    const gKey = side === 'player1' ? 'games_p1' : 'games_p2';
    const newGames = state[gKey] + 1;
    const needed = WINS_NEEDED[state.format];

    if (newGames >= needed) {
      // Match over
      set({
        [side]: updatedPlayer,
        [gKey]: newGames,
        match_over: true,
        winner: side,
      });
    } else {
      // Start next game
      set({
        [side]: { ...updatedPlayer, score: 0 },
        [other]: { ...state[other], score: 0 },
        [gKey]: newGames,
      });
    }
  },

  decrement: (side) => {
    const state = get();
    if (state.match_over) return;
    const current = state[side].score;
    if (current <= 0) return;
    set({ [side]: { ...state[side], score: current - 1 } });
  },

  resetGame: () =>
    set((s) => ({
      player1: { ...s.player1, score: 0 },
      player2: { ...s.player2, score: 0 },
    })),

  resetMatch: () =>
    set((s) => ({
      player1: { ...s.player1, score: 0 },
      player2: { ...s.player2, score: 0 },
      games_p1: 0,
      games_p2: 0,
      match_over: false,
      winner: null,
    })),
}));
