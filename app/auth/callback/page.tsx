 'use client';
import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
let exchange: Promise<void> | undefined;
export default function AuthCallback() {
  const [error, setError] = useState('');
  useEffect(() => {
    exchange ??= (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if(params.has('error') || !code) throw new Error('This sign-in link is invalid or expired. Please request a new link.');
      const {error} = await getSupabase().auth.exchangeCodeForSession(code);
      window.history.replaceState(null, '', '/auth/callback');
      if(error) throw new Error('This link could not be verified. Open it in the browser where you started, or request a new link.');
      window.location.replace('/login');
    })();
    void exchange.catch(e => setError(e.message));
  }, []);
  return <main className="account-page"><section className="account-card"><h1>{error ? 'Unable to sign in' : 'Completing sign-in…'}</h1>{error ? <><p role="alert">{error}</p><a href="/login">Back to sign in</a></> : <p role="status">Please wait while we verify your account.</p>}</section></main>;
}
