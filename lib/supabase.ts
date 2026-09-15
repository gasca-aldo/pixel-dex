import { createClient, type SupabaseClient } from '@supabase/supabase-js';
let client: SupabaseClient | undefined;
export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !key.startsWith('sb_publishable_')) throw new Error('Account connection is not configured.');
  client ??= createClient(url, key, { global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store', signal: AbortSignal.any([...(init?.signal ? [init.signal] : []), AbortSignal.timeout(20000)]) }) }, auth: { flowType: 'pkce', detectSessionInUrl: false } });
  return client;
}

// Never let a queued password update pick up a different account's current SDK session.
export async function sendPasswordUpdate(token: string, password: string) {
  const response = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/auth/v1/user', {
    method: 'PUT', cache: 'no-store', signal: AbortSignal.timeout(20000),
    headers: { 'Content-Type': 'application/json', apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, Authorization: 'Bearer ' + token },
    body: JSON.stringify({password}),
  });
  if(!response.ok) {
    if(response.status === 401 || response.status === 403) throw new Error('Your session expired. Please request a new password-reset link.');
    throw new Error('Your password could not be updated. Please try again or request a new reset link.');
  }
}
