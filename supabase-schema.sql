-- ============================================================
-- RIFTBOUND CREW TRACKER — Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- CARDS (seeded from card data — read-only reference table)
-- ============================================================
CREATE TABLE IF NOT EXISTS cards (
  id            text PRIMARY KEY,               -- e.g. "ogn-247"
  name          text NOT NULL,
  card_type     text NOT NULL                   -- Unit | Spell | Rune | Gear | Legend | Battlefield
                  CHECK (card_type IN ('Unit','Spell','Rune','Gear','Legend','Battlefield')),
  rarity        text,                           -- Common | Uncommon | Rare | Epic | Showcase
  domain        text,                           -- e.g. "Fury, Mind"
  energy        int,
  might         int,
  power         int,
  tags          text,                           -- for Legends: champion name (e.g. "Jinx")
  ability       text,
  image_url     text,
  set_code      text GENERATED ALWAYS AS (split_part(id, '-', 1)) STORED
);

-- Cards are publicly readable, not editable by users
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cards public read" ON cards FOR SELECT USING (true);


-- ============================================================
-- PLAYERS
-- ============================================================
CREATE TABLE IF NOT EXISTS players (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username      text NOT NULL UNIQUE,
  display_name  text NOT NULL,
  avatar_url    text,                           -- Supabase Storage path
  bio           text,
  color         text DEFAULT '#6366f1',         -- player accent colour for UI
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players public read" ON players FOR SELECT USING (true);
CREATE POLICY "Players authenticated write" ON players
  FOR ALL USING (auth.role() = 'authenticated');


-- ============================================================
-- DECKS
-- ============================================================
CREATE TABLE IF NOT EXISTS decks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id     uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  name          text NOT NULL,
  legend_id     text REFERENCES cards(id),      -- must be a Legend card
  champion_name text,                           -- redundant convenience field
  is_active     boolean DEFAULT false,
  notes         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Enforce only one active deck per player
CREATE UNIQUE INDEX decks_one_active_per_player
  ON decks (player_id)
  WHERE is_active = true;

ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Decks public read" ON decks FOR SELECT USING (true);
CREATE POLICY "Decks authenticated write" ON decks
  FOR ALL USING (auth.role() = 'authenticated');


-- ============================================================
-- DECK CARDS
-- ============================================================
CREATE TABLE IF NOT EXISTS deck_cards (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id       uuid NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  card_id       text REFERENCES cards(id),      -- null = manual/custom card
  section       text NOT NULL
                  CHECK (section IN ('battlefield','rune','main','sideboard')),
  card_name     text NOT NULL,                  -- denormalised for display even if card_id is null
  card_type     text,
  domain        text,
  energy        int,
  quantity      int NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 3),
  notes         text,
  sort_order    int DEFAULT 0
);

ALTER TABLE deck_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deck cards public read" ON deck_cards FOR SELECT USING (true);
CREATE POLICY "Deck cards authenticated write" ON deck_cards
  FOR ALL USING (auth.role() = 'authenticated');


-- ============================================================
-- MATCHES
-- ============================================================
CREATE TABLE IF NOT EXISTS matches (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  played_at     timestamptz NOT NULL DEFAULT now(),
  format        text NOT NULL DEFAULT 'bo1'
                  CHECK (format IN ('bo1','bo3','bo5')),
  player1_id    uuid NOT NULL REFERENCES players(id),
  player2_id    uuid NOT NULL REFERENCES players(id),
  deck1_id      uuid REFERENCES decks(id),
  deck2_id      uuid REFERENCES decks(id),
  winner_id     uuid NOT NULL REFERENCES players(id),
  score_p1      int NOT NULL CHECK (score_p1 BETWEEN 0 AND 8),
  score_p2      int NOT NULL CHECK (score_p2 BETWEEN 0 AND 8),
  -- For bo3/bo5: track game wins, not just points
  games_p1      int DEFAULT 0,                  -- games won in series (bo3/bo5)
  games_p2      int DEFAULT 0,
  battlefield   text,
  notes         text,
  tags          text[] DEFAULT '{}',            -- ['close game','stomp','deck test','misplay','new legend']
  created_by    uuid REFERENCES players(id),
  created_at    timestamptz DEFAULT now(),

  CONSTRAINT players_different CHECK (player1_id != player2_id),
  CONSTRAINT winner_is_player CHECK (winner_id IN (player1_id, player2_id))
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Matches public read" ON matches FOR SELECT USING (true);
CREATE POLICY "Matches authenticated insert" ON matches
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Matches authenticated update" ON matches
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Matches authenticated delete" ON matches
  FOR DELETE USING (auth.role() = 'authenticated');


-- ============================================================
-- MATCH MOMENTS (key moments / play-by-play notes per match)
-- ============================================================
CREATE TABLE IF NOT EXISTS match_moments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id      uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  description   text NOT NULL,
  turn_number   int,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE match_moments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Match moments public read" ON match_moments FOR SELECT USING (true);
CREATE POLICY "Match moments authenticated write" ON match_moments
  FOR ALL USING (auth.role() = 'authenticated');


-- ============================================================
-- MATCHUP STATS VIEW
-- Automatically computed from matches — no extra writes needed
-- ============================================================
CREATE OR REPLACE VIEW matchup_stats AS
SELECT
  h.player_id,
  h.opponent_id,
  COUNT(*)                                          AS total_games,
  COUNT(*) FILTER (WHERE m.winner_id = h.player_id) AS wins,
  COUNT(*) FILTER (WHERE m.winner_id = h.opponent_id) AS losses,
  ROUND(
    COUNT(*) FILTER (WHERE m.winner_id = h.player_id)::numeric
    / NULLIF(COUNT(*), 0) * 100, 1
  )                                                 AS win_rate_pct,
  MAX(m.played_at)                                  AS last_played_at
FROM (
  SELECT player1_id AS player_id, player2_id AS opponent_id, id AS match_id FROM matches
  UNION ALL
  SELECT player2_id AS player_id, player1_id AS opponent_id, id AS match_id FROM matches
) h
JOIN matches m ON m.id = h.match_id
GROUP BY h.player_id, h.opponent_id;


-- ============================================================
-- PLAYER STATS VIEW
-- Aggregated wins, losses, win rate per player
-- ============================================================
CREATE OR REPLACE VIEW player_stats AS
SELECT
  p.id                                              AS player_id,
  p.display_name,
  COUNT(m.id)                                       AS total_games,
  COUNT(m.id) FILTER (WHERE m.winner_id = p.id)     AS wins,
  COUNT(m.id) FILTER (WHERE m.winner_id != p.id)    AS losses,
  ROUND(
    COUNT(m.id) FILTER (WHERE m.winner_id = p.id)::numeric
    / NULLIF(COUNT(m.id), 0) * 100, 1
  )                                                 AS win_rate_pct,
  MAX(m.played_at)                                  AS last_played_at
FROM players p
LEFT JOIN matches m ON (m.player1_id = p.id OR m.player2_id = p.id)
GROUP BY p.id, p.display_name;


-- ============================================================
-- DECK STATS VIEW
-- Win/loss record per deck
-- ============================================================
CREATE OR REPLACE VIEW deck_stats AS
SELECT
  d.id                                              AS deck_id,
  d.name                                            AS deck_name,
  d.player_id,
  COUNT(m.id)                                       AS total_games,
  COUNT(m.id) FILTER (
    WHERE (m.deck1_id = d.id AND m.winner_id = m.player1_id)
       OR (m.deck2_id = d.id AND m.winner_id = m.player2_id)
  )                                                 AS wins,
  COUNT(m.id) FILTER (
    WHERE (m.deck1_id = d.id AND m.winner_id = m.player2_id)
       OR (m.deck2_id = d.id AND m.winner_id = m.player1_id)
  )                                                 AS losses,
  ROUND(
    COUNT(m.id) FILTER (
      WHERE (m.deck1_id = d.id AND m.winner_id = m.player1_id)
         OR (m.deck2_id = d.id AND m.winner_id = m.player2_id)
    )::numeric
    / NULLIF(COUNT(m.id), 0) * 100, 1
  )                                                 AS win_rate_pct
FROM decks d
LEFT JOIN matches m ON (m.deck1_id = d.id OR m.deck2_id = d.id)
GROUP BY d.id, d.name, d.player_id;


-- ============================================================
-- DECK VALIDATION FUNCTION
-- Call this before saving a deck to check rule compliance
-- ============================================================
CREATE OR REPLACE FUNCTION validate_deck(p_deck_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb := '{"valid": true, "errors": []}'::jsonb;
  v_errors text[] := '{}';
  v_main_count int;
  v_rune_count int;
  v_bf_count int;
  v_sideboard_count int;
  v_legend_count int;
  v_max_copies int;
BEGIN
  -- Count each section
  SELECT COALESCE(SUM(quantity),0) INTO v_main_count
    FROM deck_cards WHERE deck_id = p_deck_id AND section = 'main';

  SELECT COALESCE(SUM(quantity),0) INTO v_rune_count
    FROM deck_cards WHERE deck_id = p_deck_id AND section = 'rune';

  SELECT COALESCE(SUM(quantity),0) INTO v_bf_count
    FROM deck_cards WHERE deck_id = p_deck_id AND section = 'battlefield';

  SELECT COALESCE(SUM(quantity),0) INTO v_sideboard_count
    FROM deck_cards WHERE deck_id = p_deck_id AND section = 'sideboard';

  -- Rules:
  -- Main deck = exactly 40 (champion counts as 1 of those 40, so 39 regular + 1 champion)
  IF v_main_count != 40 THEN
    v_errors := v_errors || format('Main deck must be exactly 40 cards (currently %s)', v_main_count);
  END IF;

  -- Runes = exactly 12
  IF v_rune_count != 12 THEN
    v_errors := v_errors || format('Must have exactly 12 runes (currently %s)', v_rune_count);
  END IF;

  -- Battlefields = exactly 3
  IF v_bf_count != 3 THEN
    v_errors := v_errors || format('Must have exactly 3 battlefields (currently %s)', v_bf_count);
  END IF;

  -- Sideboard = 0 or 8
  IF v_sideboard_count NOT IN (0, 8) THEN
    v_errors := v_errors || format('Sideboard must be 0 or exactly 8 cards (currently %s)', v_sideboard_count);
  END IF;

  -- Max 3 copies of any single card
  SELECT COALESCE(MAX(quantity), 0) INTO v_max_copies
    FROM deck_cards WHERE deck_id = p_deck_id;

  IF v_max_copies > 3 THEN
    v_errors := v_errors || 'No card may have more than 3 copies';
  END IF;

  IF array_length(v_errors, 1) > 0 THEN
    v_result := jsonb_build_object('valid', false, 'errors', to_jsonb(v_errors));
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- STORAGE BUCKETS (run separately in Supabase dashboard
-- or via the Storage API — included here for reference)
-- ============================================================

-- Storage bucket: player-avatars  (public)
-- Storage bucket: legend-art       (public, optional custom uploads)
-- Note: Legend images are already hosted on Riot CDN via image_url
--       in the cards table. This bucket is for future overrides only.

-- In Supabase Dashboard > Storage:
-- 1. Create bucket "player-avatars" — Public: ON, 5MB limit, accept image/*
-- 2. Create bucket "assets" — Public: ON, for any other app assets


-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER decks_updated_at
  BEFORE UPDATE ON decks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- USEFUL INDEXES
-- ============================================================
CREATE INDEX idx_deck_cards_deck_id   ON deck_cards(deck_id);
CREATE INDEX idx_deck_cards_card_id   ON deck_cards(card_id);
CREATE INDEX idx_matches_player1      ON matches(player1_id);
CREATE INDEX idx_matches_player2      ON matches(player2_id);
CREATE INDEX idx_matches_played_at    ON matches(played_at DESC);
CREATE INDEX idx_decks_player_id      ON decks(player_id);
CREATE INDEX idx_cards_card_type      ON cards(card_type);
CREATE INDEX idx_cards_name_search    ON cards USING gin(to_tsvector('english', name));


-- ============================================================
-- SEED: Shared password auth setup
-- In Supabase Auth > Settings, enable Email auth.
-- Create ONE shared user account:
--   Email: crew@riftbound.app  (or any address)
--   Password: [your shared password]
-- All friends use this single account to log in.
-- ============================================================
