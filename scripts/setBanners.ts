import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

const map = [
  { name: 'Benson', banner: '/banners/fizz.jpg' },
  { name: 'Dean',   banner: '/banners/ahri.jpg' },
  { name: 'Jimmy',  banner: '/banners/samira.avif' },
  { name: 'Andrew', banner: '/banners/mf.avif' },
];

async function main() {
  for (const { name, banner } of map) {
    const { error } = await sb
      .from('players')
      .update({ banner_url: banner })
      .ilike('display_name', `%${name}%`);
    console.log(error ? `ERR ${name}: ${error.message}` : `✓ ${name} → ${banner}`);
  }
}

main();
