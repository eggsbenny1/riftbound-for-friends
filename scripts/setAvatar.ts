import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function main() {
  const [,, playerName, filePath] = process.argv;
  if (!playerName || !filePath) {
    console.error('Usage: npx tsx scripts/setAvatar.ts "Display Name" path/to/image.jpg');
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).slice(1);
  const storagePath = `${playerName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${ext}`;
  const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

  console.log(`Uploading ${filePath} → player-avatars/${storagePath} …`);

  const { error: uploadErr } = await supabase.storage
    .from('player-avatars')
    .upload(storagePath, fileBuffer, { contentType: mimeType, upsert: true });

  if (uploadErr) { console.error('Upload failed:', uploadErr.message); process.exit(1); }

  const { data: urlData } = supabase.storage
    .from('player-avatars')
    .getPublicUrl(storagePath);

  const publicUrl = urlData.publicUrl;
  console.log('Public URL:', publicUrl);

  const { data: players, error: findErr } = await supabase
    .from('players')
    .select('id, display_name')
    .ilike('display_name', `%${playerName}%`);

  if (findErr || !players?.length) {
    console.error('Player not found:', playerName);
    process.exit(1);
  }

  if (players.length > 1) {
    console.log('Multiple matches — picking first:', players.map(p => p.display_name));
  }

  const player = players[0];
  const { error: updateErr } = await supabase
    .from('players')
    .update({ avatar_url: publicUrl })
    .eq('id', player.id);

  if (updateErr) { console.error('Update failed:', updateErr.message); process.exit(1); }

  console.log(`✓ Updated avatar for ${player.display_name} (${player.id})`);
}

main();
