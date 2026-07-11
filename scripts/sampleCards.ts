import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
const { data, error } = await sb.from('cards').select('id,name,card_type,tags').limit(20);
if (error) console.error(error.message);
else console.log(JSON.stringify(data, null, 2));
