import { createClient, type SupabaseClient } from '@supabase/supabase-js';
let client: SupabaseClient | undefined;
export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !key.startsWith('sb_publishable_')) throw new Error('Account connection is not configured.');
  client ??= createClient(url, key, { global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) }, auth: { flowType: 'pkce', detectSessionInUrl: false } });
  return client;
}
