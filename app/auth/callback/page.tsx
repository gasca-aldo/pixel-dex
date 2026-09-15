 'use client';
import { useEffect, useRef, useState } from 'react';
import { destinationAfterAuth } from '@/lib/auth-destination';
import { invalidAuthLink, readAuthCallback } from '@/lib/auth-callback';
import { getSupabase } from '@/lib/supabase';
export default function AuthCallback() {
  const started = useRef(false);
  const verifying = useRef(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if(started.current) return;
    started.current = true;
    void (async () => {
      const input = readAuthCallback(window.location.search, window.location.hash);
      if(input.kind === 'recovery') {
        // Keep the bearer link out of referrers/history and require a deliberate action.
        window.history.replaceState(null, '', '/auth/callback');
        setToken(input.token);
        return;
      }
      const auth = getSupabase().auth;
      let recovery = false;
      const {data: listener} = auth.onAuthStateChange(event => { if(event === 'PASSWORD_RECOVERY') recovery = true; });
      const {error} = await auth.exchangeCodeForSession(input.code).finally(() => {
        listener.subscription.unsubscribe();
        window.history.replaceState(null, '', '/auth/callback');
      });
      if(error) throw new Error(invalidAuthLink);
      window.location.replace(destinationAfterAuth(recovery ? 'recovery' : null));
    })().catch(() => {window.history.replaceState(null, '', '/auth/callback'); setError(invalidAuthLink);});
  }, []);
  async function verifyRecovery() {
    if(!token || verifying.current) return;
    verifying.current = true;
    const tokenHash = token;
    setToken(null);
    try {
      const {error} = await getSupabase().auth.verifyOtp({token_hash: tokenHash, type: 'recovery'});
      if(error) throw error;
      window.location.replace('/login');
    } catch { setError(invalidAuthLink); }
  }
  return <main className="account-page"><section className="account-card"><h1>{error ? 'Unable to sign in' : token ? 'Reset your password' : 'Completing sign-in…'}</h1>{error ? <><p role="alert">{error}</p><a href="/login">Request a new link</a></> : token ? <><p>Continue to verify your reset link and choose a new password.</p><button className="primary" onClick={() => void verifyRecovery()}>Continue password reset</button></> : <p role="status">Please wait while we verify your account.</p>}</section></main>;
}
