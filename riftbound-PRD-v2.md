# Riftbound Crew Tracker — Final PRD
> Version 2.0 | All architecture decisions confirmed

---

## Confirmed Decisions

| Topic | Decision |
|---|---|
| **Auth** | Single shared email/password account via Supabase Auth. All friends use the same login. |
| **Admin** | One shared admin account. You manage everything; friends use same credentials. |
| **Card database** | Seeded from the provided Excel file — 766 unique cards (39 Legends, 381 Units, 192 Spells, 92 Gear, 6 Rune types, 56 Battlefields). All card images link directly to Riot CDN — no uploads needed. |
| **Deck rules** | 1 Legend · 1 Champion (in main deck, counts toward 40) · 40 main deck cards · 12 runes · 3 battlefields · 0 or exactly 8 sideboard cards · max 3 copies of any card including champion |
| **Legend images** | Sourced from card data Image URL column (Riot CDN). No manual uploads. |
| **Player avatars** | Custom uploads via Supabase Storage. |
| **Game format** | 1v1 only. Best of 1, 3, or 5 — each individual game goes to 8 points. |
| **Score counter** | Same phone, split-screen. |
| **Hosting** | Netlify free tier. Free subdomain (e.g. `riftbound-crew.netlify.app`). |
| **Friends** | All use shared login. All can edit. |

---

## Architecture

```
React 18 + Vite + TypeScript
Tailwind CSS + shadcn/ui
React Router v6
Zustand (score counter state, auth state)
React Hook Form + Zod (all forms)
Supabase (Postgres, Auth, Storage, Realtime)
Netlify (hosting, auto-deploy from GitHub)
```

---

## Card Database Summary

From the attached Excel file (`All Card Data` sheet):

| Card Type | Unique Cards |
|---|---|
| Unit | 381 |
| Spell | 192 |
| Gear | 92 |
| Battlefield | 56 |
| Legend | 39 |
| Rune | 6 |
| **Total** | **766** |

**Sets included:** Origins (`ogn`), Origins Starter (`ogs`), Spiritforged (`sfd`), Unleashed (`unl`)

**39 Legends available** — see `seed-cards.json` for complete list.  
Key champions: Jinx, Darius, Ahri, Lee Sin, Yasuo, Leona, Teemo, Viktor, Miss Fortune, Sett, Kai'Sa, Volibear, Rumble, Lucian, Draven, Ornn, Jhin, Pyke, Vi, Diana, LeBlanc, Poppy, + more.

**All card images already live** — direct links to `cmsassets.rgpub.io`. No image hosting needed.

---

## Deck Validation Rules (enforced in UI + DB function)

```
Main deck:    exactly 40 cards
              - includes 1 chosen Champion card
              - max 3x copies of any single card (including champion)
              - minimum 39 non-champion cards

Runes:        exactly 12

Battlefields: exactly 3

Sideboard:    0 (none) OR exactly 8 (no in-between allowed)

Legend:       exactly 1 (selected separately, not in deck count)
```

---

## Database Schema

Five tables, three views, one validation function.

### Tables
- **`cards`** — 766-row reference table seeded from Excel. Read-only for users.
- **`players`** — Friend group members with avatar, accent colour, bio.
- **`decks`** — Multiple decks per player, one marked active.
- **`deck_cards`** — Cards in a deck with section, quantity, notes.
- **`matches`** — Match results with format, scores, tags, notes.
- **`match_moments`** — Key moments attached to a match.

### Views (auto-computed, no extra writes)
- **`player_stats`** — W/L/WR per player.
- **`matchup_stats`** — H2H records between any two players.
- **`deck_stats`** — W/L/WR per deck.

### Stored function
- **`validate_deck(deck_id)`** — Returns `{valid: boolean, errors: string[]}`.

---

## Routing Structure

```
/                          → Home (player grid)
/players/:id               → Player Profile (tabs: Overview, Deck, Matchups, History)
/players/:id/deck/:deckId  → Deck Viewer
/players/:id/deck/new      → New Deck Builder
/players/:id/deck/:id/edit → Edit Deck
/matches                   → Global Match History + Add Match
/score                     → Live Score Counter
/admin                     → Admin Panel (players, legends, matches)
/login                     → Shared login page
```

---

## Folder Structure

```
riftbound-crew-tracker/
├── public/
│   ├── favicon.ico
│   └── manifest.json          ← PWA: "Add to Home Screen"
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── ui/                ← shadcn/ui primitives
│   │   ├── layout/
│   │   │   ├── AppShell.tsx   ← Nav + outlet
│   │   │   ├── NavBar.tsx     ← Desktop top nav
│   │   │   └── BottomNav.tsx  ← Mobile bottom nav (Home | Score | Matches | Admin)
│   │   ├── player/
│   │   │   ├── PlayerCard.tsx       ← Grid card
│   │   │   ├── PlayerHero.tsx       ← Blurred legend hero section
│   │   │   ├── PlayerProfileTabs.tsx
│   │   │   └── PlayerForm.tsx       ← Add/edit player
│   │   ├── deck/
│   │   │   ├── DeckCard.tsx         ← Small deck preview card
│   │   │   ├── DeckBuilder.tsx      ← Full deck builder
│   │   │   ├── DeckSection.tsx      ← One section (main/rune/bf/side)
│   │   │   ├── DeckSummary.tsx      ← Counts + curve sidebar
│   │   │   ├── CardSearch.tsx       ← Searchable card picker
│   │   │   ├── CardRow.tsx          ← Single card row in deck
│   │   │   └── DeckImportExport.tsx ← Text import/export
│   │   ├── match/
│   │   │   ├── MatchCard.tsx        ← Match history row
│   │   │   ├── MatchForm.tsx        ← Add/edit match form
│   │   │   ├── MatchupTable.tsx     ← H2H grid per player
│   │   │   └── MatchFilters.tsx     ← Filter bar
│   │   └── score/
│   │       ├── ScoreCounter.tsx     ← Full split-screen component
│   │       ├── PlayerPanel.tsx      ← Half-screen score side
│   │       └── SaveMatchModal.tsx   ← Pre-filled match form after game
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── PlayerProfile.tsx
│   │   ├── DeckView.tsx
│   │   ├── DeckEdit.tsx
│   │   ├── Matches.tsx
│   │   ├── ScorePage.tsx
│   │   ├── Admin.tsx
│   │   └── Login.tsx
│   ├── hooks/
│   │   ├── usePlayers.ts
│   │   ├── useDecks.ts
│   │   ├── useMatches.ts
│   │   ├── useMatchups.ts
│   │   ├── useCards.ts            ← card search + filtering
│   │   └── useAuth.ts
│   ├── stores/
│   │   ├── scoreStore.ts          ← Zustand: live score + bo1/3/5 state
│   │   └── authStore.ts           ← Zustand: current session
│   ├── lib/
│   │   ├── supabase.ts            ← createClient setup
│   │   ├── deckValidation.ts      ← Client-side rule checker
│   │   ├── deckImport.ts          ← Text list parser
│   │   └── utils.ts
│   ├── types/
│   │   └── index.ts               ← (see types.ts file)
│   ├── data/
│   │   └── seed-cards.json        ← Card database (seeded into Supabase)
│   ├── App.tsx
│   └── main.tsx
├── .env.local                     ← VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
├── netlify.toml                   ← SPA redirect: /* -> /index.html
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

---

## Component Detail

### ScoreCounter — Bo1/Bo3/Bo5 Logic

```
Bo1: First to 8 points wins. Match over immediately.
Bo3: First to win 2 games (each game = first to 8 points). Match over at 2-0 or 2-1.
Bo5: First to win 3 games. Match over at 3-0, 3-1, or 3-2.

State tracked:
  - current game: score_p1, score_p2 (0–8)
  - series:       games_p1, games_p2 (game wins count)
  - match_over:   bool — triggers win screen + Save Match prompt
```

### DeckBuilder — Import Format

```
# Deck: Jinx Aggro
# Legend: Loose Cannon
# Champion: Jinx (x1)

## Battlefields
Reckoner's Arena x1
Vilemaw's Lair x1
Void Gate x1

## Runes
Fury Rune x12

## Main Deck (40)
Blazing Scorcher x3
Brazen Buccaneer x3
...

## Sideboard (optional — 0 or 8)
...
```

---

## MVP Build Milestones

### Milestone 1 — Foundation (Day 1–2)
- [ ] Vite + React + TypeScript + Tailwind + shadcn/ui scaffold
- [ ] React Router setup with all routes stubbed
- [ ] Supabase project created, schema SQL run, RLS enabled
- [ ] `seed-cards.json` inserted into `cards` table (script provided below)
- [ ] Supabase Auth configured (email/password, one shared account)
- [ ] Netlify project linked to GitHub repo, auto-deploy working
- [ ] `netlify.toml` with SPA redirect
- [ ] `.env.local` with Supabase keys
- [ ] Basic AppShell with NavBar + BottomNav (mobile)

### Milestone 2 — Players (Day 2–3)
- [ ] Home page: player grid using `PlayerCard`
- [ ] Player profile page with blurred legend hero
- [ ] Profile tabs: Overview, Deck, Matchups, History
- [ ] Player creation form
- [ ] Avatar upload via Supabase Storage

### Milestone 3 — Decks (Day 3–5)
- [ ] Deck builder with card sections
- [ ] `CardSearch` component with fuzzy name search against `cards` table
- [ ] Card row with quantity stepper (1–3)
- [ ] Deck summary sidebar (counts + curve)
- [ ] Save deck + client-side validation
- [ ] Text import/export
- [ ] Mark deck as active toggle

### Milestone 4 — Matches (Day 5–7)
- [ ] Match history list with filters
- [ ] Add match form (player selectors, deck selectors, score, tags, notes)
- [ ] Matchup stats table on player profile
- [ ] W/L auto-updates via views

### Milestone 5 — Score Counter (Day 7–8)
- [ ] Split-screen score counter (full-viewport)
- [ ] Bo1/Bo3/Bo5 format selector
- [ ] Game tracking (series state in Zustand)
- [ ] Win animation/highlight at 8 points or series clinch
- [ ] Global reset
- [ ] Save Match modal pre-filled from score state

### Milestone 6 — Polish (Day 8–10)
- [ ] Admin panel: manage players, matches
- [ ] PWA manifest + service worker (add to home screen)
- [ ] Loading skeletons on all data fetches
- [ ] Empty states on all pages
- [ ] Mobile layout polish pass (especially score counter + deck builder)
- [ ] Error boundaries

---

## Card Seeding Script

After running the Supabase schema SQL, run this to seed the card database:

```typescript
// scripts/seedCards.ts
import { createClient } from '@supabase/supabase-js';
import cards from '../src/data/seed-cards.json';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!   // use service key for seeding
);

async function seed() {
  const { error } = await supabase
    .from('cards')
    .upsert(cards, { onConflict: 'id' });

  if (error) console.error('Seed failed:', error);
  else console.log(`Seeded ${cards.length} cards`);
}

seed();
```

Run with: `npx tsx scripts/seedCards.ts`

---

## netlify.toml (required for React Router)

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## Key Design Decisions

### Legend Background on Player Profile
Use the player's active deck legend's `image_url` from the `cards` table.
Apply CSS: `background-image: url(${legend.image_url})`, `filter: blur(20px) brightness(0.4)`, cover the full hero section.
The profile card sits on top with a `backdrop-filter: blur(8px)` frosted glass effect.

### Domain Colours
Map each Riftbound domain to a theme colour for use in badges and UI accents:

```typescript
const DOMAIN_COLORS = {
  Fury:  '#ef4444', // red
  Calm:  '#3b82f6', // blue
  Mind:  '#a855f7', // purple
  Body:  '#22c55e', // green
  Chaos: '#f97316', // orange
  Order: '#eab308', // yellow
};
```

### Score Counter Touch Targets
All +/− buttons: minimum `h-20 w-20` (80px). Score display: `text-9xl`. Player panels: `h-[50dvh]` each (uses dynamic viewport height for mobile browser chrome).

---

## Ordered Build Prompts

Use these prompts in sequence to generate each file:

```
1. "Generate netlify.toml, vite.config.ts, tailwind.config.ts, and 
   package.json for Riftbound Crew Tracker (React 18, Vite, TypeScript, 
   Tailwind, shadcn/ui, React Router v6, Zustand, React Hook Form, Zod, 
   Supabase JS v2)."

2. "Generate src/lib/supabase.ts (Supabase client with env vars), 
   src/stores/authStore.ts (Zustand: session state), and 
   src/pages/Login.tsx (email/password form using React Hook Form)."

3. "Generate src/components/layout/AppShell.tsx, NavBar.tsx, and 
   BottomNav.tsx for mobile-first navigation. Routes: Home, Score, 
   Matches, Admin. Show active route highlight."

4. "Generate src/pages/Home.tsx with a PlayerCard grid. PlayerCard shows 
   avatar, display_name, active deck legend art, W/L/WR from player_stats 
   view. Use Supabase join to pull legend image_url."

5. "Generate src/pages/PlayerProfile.tsx with a blurred legend background 
   hero section (from the active deck's legend image_url), frosted-glass 
   profile card overlay, and four tabs: Overview, Deck, Matchups, History."

6. "Generate src/components/deck/DeckBuilder.tsx including CardSearch 
   (searching the cards table), DeckSection (grouped by battlefield/rune/ 
   main/sideboard), CardRow with quantity stepper, DeckSummary sidebar with 
   total counts and energy curve, and client-side deck validation."

7. "Generate src/lib/deckImport.ts: parse a plain-text deck list into 
   DeckCard[] and export a DeckCard[] back to plain text. Use the format 
   in the PRD (## Battlefields, ## Runes, ## Main Deck, ## Sideboard)."

8. "Generate src/components/match/MatchForm.tsx: add match with player 
   selectors, deck selectors, format picker (bo1/bo3/bo5), score inputs 
   (0–8 per game, game wins for series), winner, tags multi-select, notes, 
   moments. Submit inserts to Supabase matches table."

9. "Generate src/pages/ScorePage.tsx: full-screen split score counter. 
   Two halves (50dvh each). Each half: player name dropdown, giant score 
   display (text-9xl), +/- buttons (min h-20 w-20). Zustand scoreStore 
   tracks bo1/bo3/bo5 format, current game scores, series game wins. 
   Highlight winner at 8 points. Match-over screen with Save Match button 
   that opens SaveMatchModal pre-filled with result."

10. "Generate src/pages/Admin.tsx: tabs for Players (add/edit/delete with 
    avatar upload to Supabase Storage), Matches (editable list), and a 
    card seeding status check."
```

---

## Phase 2 Features

- **Deck win rates per matchup** (e.g. "Jinx deck vs Darius deck: 2-3")
- **Tournament mode** — bracket generator for the friend group
- **Discord webhook** — post match result to a crew Discord channel automatically
- **Card collection tracker** — track which cards each player owns (using the Summary sheet data)
- **Showcase card toggle** — show showcase art on profile/deck view if owned
- **Player ranking page** — ELO-style rating based on match history
- **Shareable deck URL** — `/deck/:id` public view, no login required
