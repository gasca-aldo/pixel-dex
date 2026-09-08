import { getSupabase } from './supabase';
import { validCollection, type Collection } from './tracker';
export const draftKey = (id: string) => `pixel-dex:account-draft:${id}`;
export async function loadLibrary(id: string) {
  const {data, error} = await getSupabase().from('account_libraries').select('payload,revision').eq('user_id',id).maybeSingle();
  if(error) throw new Error('Unable to load your account library. Check your connection and database setup, then reload.');
  if(data && !validCollection(data.payload)) throw new Error('Your account library could not be read. It has not been changed.');
  return data as {payload: Collection; revision: number} | null;
}
export async function saveLibrary(payload: Collection, revision: number, owner: string) {
  // Recheck identity before sending; the database independently enforces ownership.
  const {data: {user}, error: authError} = await getSupabase().auth.getUser();
  if(authError || user?.id !== owner) throw new Error('Your session changed. Sign in again before saving.');
  const {data,error} = await getSupabase().rpc('save_account_library',{library:payload,expected_revision:revision,expected_owner:owner});
  if(error) throw new Error(error.message.includes('LIBRARY_CONFLICT') ? 'This library changed on another device. Export your unsaved copy before reloading to load the latest account version.' : 'Not saved to your account. Your draft is kept in this browser. Check your connection, then retry.');
  if(typeof data !== 'number') throw new Error('The save could not be confirmed. Your browser draft has been kept.');
  return data;
}
