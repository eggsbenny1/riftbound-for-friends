// ============================================================
// src/types/index.ts — Riftbound Crew Tracker
// ============================================================

// ─── Card Database ────────────────────────────────────────
export type CardType = 'Unit' | 'Spell' | 'Rune' | 'Gear' | 'Legend' | 'Battlefield';
export type CardRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Showcase';
export type Domain =
  | 'Fury' | 'Calm' | 'Mind' | 'Body' | 'Chaos' | 'Order' | 'Colorless'
  | 'Fury, Mind' | 'Fury, Body' | 'Fury, Chaos' | 'Fury, Order'
  | 'Calm, Mind' | 'Calm, Body' | 'Calm, Chaos' | 'Calm, Order'
  | 'Mind, Chaos' | 'Mind, Order' | 'Body, Chaos' | 'Body, Order';

export type Card = {
  id: string;            // e.g. "ogn-247"
  name: string;
  card_type: CardType;
  rarity: CardRarity | null;
  domain: Domain | null;
  energy: number | null;
  might: number | null;
  power: number | null;
  tags: string | null;   // For Legends: champion name (e.g. "Jinx")
  ability: string | null;
  image_url: string | null;
  set_code?: string;     // Generated: "ogn" | "ogs" | "sfd" | "unl"
};

// Legend is a Card with card_type === 'Legend'
export type Legend = Card & {
  card_type: 'Legend';
  tags: string;          // champion name, non-null for legends
};

// ─── Players ─────────────────────────────────────────────
export type Player = {
  id: string;            // uuid
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  color: string;         // hex accent colour, e.g. "#6366f1"
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PlayerWithStats = Player & PlayerStats;

export type PlayerStats = {
  total_games: number;
  wins: number;
  losses: number;
  win_rate_pct: number;
  last_played_at: string | null;
};

// ─── Decks ───────────────────────────────────────────────
export type DeckSection = 'battlefield' | 'rune' | 'main' | 'sideboard';

export type DeckCard = {
  id: string;
  deck_id: string;
  card_id: string | null;
  section: DeckSection;
  card_name: string;
  card_type: string | null;
  domain: string | null;
  energy: number | null;
  quantity: number;      // 1–3
  notes: string | null;
  sort_order: number;
  card?: Card;           // joined
};

export type Deck = {
  id: string;
  player_id: string;
  name: string;
  legend_id: string | null;
  champion_name: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  legend?: Card;
  player?: Player;
  cards?: DeckCard[];
};

export type DeckSummary = {
  main_count: number;     // target 40
  rune_count: number;     // target 12
  bf_count: number;       // target 3
  sideboard_count: number;// 0 or 8
  curve: Record<number, number>; // energy -> count
};

export type DeckValidation = {
  valid: boolean;
  errors: string[];
};

// ─── Matches ─────────────────────────────────────────────
export type MatchFormat = 'bo1' | 'bo3' | 'bo5';

export type MatchTag =
  | 'close game' | 'stomp' | 'misplay' | 'deck test'
  | 'new legend' | 'comeback' | 'rematch';

export type Match = {
  id: string;
  played_at: string;
  format: MatchFormat;
  player1_id: string;
  player2_id: string;
  deck1_id: string | null;
  deck2_id: string | null;
  winner_id: string;
  score_p1: number;      // points scored (0–8)
  score_p2: number;
  games_p1: number;      // game wins in series (bo3/bo5)
  games_p2: number;
  battlefield: string | null;
  notes: string | null;
  tags: MatchTag[];
  created_by: string | null;
  created_at: string;
  // Joined
  player1?: Player;
  player2?: Player;
  deck1?: Deck;
  deck2?: Deck;
  moments?: MatchMoment[];
};

export type MatchMoment = {
  id: string;
  match_id: string;
  description: string;
  turn_number: number | null;
  created_at: string;
};

// ─── Matchup Stats ───────────────────────────────────────
export type MatchupStat = {
  player_id: string;
  opponent_id: string;
  total_games: number;
  wins: number;
  losses: number;
  win_rate_pct: number;
  last_played_at: string | null;
  opponent?: Player;
};

// ─── Deck Stats ──────────────────────────────────────────
export type DeckStat = {
  deck_id: string;
  deck_name: string;
  player_id: string;
  total_games: number;
  wins: number;
  losses: number;
  win_rate_pct: number;
};

// ─── Score Counter ───────────────────────────────────────
export type ScorePlayer = {
  id: string | null;
  name: string;
  score: number;         // 0–8
};

export type ScoreState = {
  player1: ScorePlayer;
  player2: ScorePlayer;
  format: MatchFormat;
  games_p1: number;
  games_p2: number;
  winner: 'player1' | 'player2' | null;
  match_over: boolean;
};

// ─── Forms ───────────────────────────────────────────────
export type NewMatchForm = {
  played_at: string;
  format: MatchFormat;
  player1_id: string;
  player2_id: string;
  deck1_id: string;
  deck2_id: string;
  score_p1: number;
  score_p2: number;
  games_p1: number;
  games_p2: number;
  winner_id: string;
  battlefield: string;
  notes: string;
  tags: MatchTag[];
  moments: Omit<MatchMoment, 'id' | 'match_id' | 'created_at'>[];
};

export type NewDeckForm = {
  name: string;
  legend_id: string;
  champion_name: string;
  notes: string;
  is_active: boolean;
};

export type NewPlayerForm = {
  username: string;
  display_name: string;
  bio: string;
  color: string;
  avatar_file?: File;
};

// ─── App ─────────────────────────────────────────────────
export type AppTab = 'overview' | 'deck' | 'matchups' | 'history' | 'notes';

export type NavItem = {
  label: string;
  path: string;
  icon: string;
};

// ─── Supabase helpers ────────────────────────────────────
export type DbResult<T> = {
  data: T | null;
  error: Error | null;
};
