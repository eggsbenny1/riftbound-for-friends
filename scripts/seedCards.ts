// scripts/seedCards.ts
//
// Uploads all cards from src/data/seed-cards.json into the Supabase `cards` table.
// Run with: npx tsx scripts/seedCards.ts
//
// Requires a .env file in the project root with:
//   SUPABASE_URL=https://your-project-ref.supabase.co
//   SUPABASE_SERVICE_KEY=your-service-role-key

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

type Card = {
  id: string;
  name: string;
  card_type: string;
  rarity: string | null;
  domain: string | null;
  energy: number | null;
  might: number | null;
  power: number | null;
  tags: string | null;
  ability: string | null;
  image_url: string | null;
};

async function seed() {
  const filePath = join(process.cwd(), 'src', 'data', 'seed-cards.json');
  const raw = readFileSync(filePath, 'utf-8');
  const cards: Card[] = JSON.parse(raw);

  console.log(`Loaded ${cards.length} cards from seed-cards.json`);
  console.log('Uploading to Supabase in batches...');

  // Upload in batches of 200 to avoid payload size limits
  const batchSize = 200;
  let uploaded = 0;

  for (let i = 0; i < cards.length; i += batchSize) {
    const batch = cards.slice(i, i + batchSize);
    const { error } = await supabase
      .from('cards')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`Batch ${i / batchSize + 1} failed:`, error.message);
      process.exit(1);
    }

    uploaded += batch.length;
    console.log(`  ${uploaded}/${cards.length} cards uploaded`);
  }

  console.log(`\nDone. Seeded ${uploaded} cards into the cards table.`);
}

seed().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
