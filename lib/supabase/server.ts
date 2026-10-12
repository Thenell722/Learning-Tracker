import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars');
}

export const supabaseServer = createClient(url, anonKey, {
  auth: { persistSession: false },
});
