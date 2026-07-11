import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

// Try inserting a dummy row with legend columns to see if they exist
const { error } = await sb.from('matches').select('legend1_id,legend2_id').limit(1);
if (!error) {
  console.log('✓ legend1_id and legend2_id columns already exist');
} else {
  console.log('Columns missing — add them via Supabase SQL editor:');
  console.log('ALTER TABLE matches ADD COLUMN IF NOT EXISTS legend1_id text REFERENCES cards(id);');
  console.log('ALTER TABLE matches ADD COLUMN IF NOT EXISTS legend2_id text REFERENCES cards(id);');
}
