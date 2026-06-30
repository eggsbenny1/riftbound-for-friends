import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function main() {
  // 1. Create bucket if it doesn't exist
  const { error: bucketErr } = await supabase.storage.createBucket('player-avatars', {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  });
  if (bucketErr && !bucketErr.message.includes('already exists')) {
    console.error('Bucket error:', bucketErr.message);
    process.exit(1);
  }
  console.log('✓ Bucket ready');

  // 2. Upload benson.jpg
  const fileBuffer = fs.readFileSync('benson.jpg');
  const storagePath = `benson-${Date.now()}.jpg`;

  const { error: uploadErr } = await supabase.storage
    .from('player-avatars')
    .upload(storagePath, fileBuffer, { contentType: 'image/jpeg', upsert: true });

  if (uploadErr) { console.error('Upload failed:', uploadErr.message); process.exit(1); }

  const { data: urlData } = supabase.storage
    .from('player-avatars')
    .getPublicUrl(storagePath);

  console.log('✓ Uploaded:', urlData.publicUrl);

  // 3. Find player
  const { data: players, error: findErr } = await supabase
    .from('players')
    .select('id, display_name')
    .ilike('display_name', '%benson%');

  if (findErr || !players?.length) {
    console.error('No player found matching "benson"');
    process.exit(1);
  }

  const player = players[0];

  // 4. Update avatar_url
  const { error: updateErr } = await supabase
    .from('players')
    .update({ avatar_url: urlData.publicUrl })
    .eq('id', player.id);

  if (updateErr) { console.error('Update failed:', updateErr.message); process.exit(1); }

  console.log(`✓ Set avatar for ${player.display_name}`);
}

main();
