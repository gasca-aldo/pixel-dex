 'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { type User } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Mode = 'login' | 'signup' | 'reset';
export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  useEffect(() => {
    let active = true;
    const auth = getSupabase().auth;
    void auth.getUser().then(({data}) => { if(active) { setUser(data.user); setLoading(false); } }).catch(() => { if(active) { setError('Unable to connect. Please reload to try again.'); setLoading(false); } });
    const {data} = auth.onAuthStateChange((_event, session) => {setUser(session?.user ?? null); setPassword('');});
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  async function run(action: () => Promise<void>) {
    if(busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(''); setMessage('');
    try { await action(); } catch(e) {setError(e instanceof Error ? e.message : 'Unable to connect. Please try again.');}
    finally {busyRef.current = false; setBusy(false);}
  }
  function changeMode(next: Mode) {setMode(next); setError(''); setMessage(''); setPassword('');}
  async function submit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      const auth = getSupabase().auth;
      const redirectTo = window.location.origin + '/auth/callback';
      if(user) {
        const {error} = await auth.updateUser({password});
        if(error) throw error;
        setPassword('');
        window.location.replace('/');
      } else if(mode === 'login') {
        const {error} = await auth.signInWithPassword({email: email.trim(), password});
        if(error) throw error;
        window.location.assign('/');
      } else if(mode === 'signup') {
        const {error} = await auth.signUp({email: email.trim(), password, options: {emailRedirectTo: redirectTo}});
        if(error) throw error;
        setPassword(''); setMessage('Check your email for a confirmation link. If you already have an account, sign in or reset your password.');
      } else {
        const {error} = await auth.resetPasswordForEmail(email.trim(), {redirectTo});
        if(error) throw error;
        setMessage('If an account exists for this email, you will receive a password-reset link. Open it in this browser to choose a new password.');
      }
    });
  }
  return <main className="account-page"><section className="account-card">
    <a href="/" className="account-brand">pixel dex</a>
    <h1>{user ? 'Your account' : mode === 'signup' ? 'Create an account' : mode === 'reset' ? 'Reset your password' : 'Welcome back'}</h1>
    {loading ? <p role="status">Checking your account…</p> : <>
      {user ? <p>Signed in as {user.email}</p> : mode !== 'reset' && <><Button disabled={busy} variant="outline" onClick={() => run(async () => {
        const {error} = await getSupabase().auth.signInWithOAuth({provider:'google', options:{redirectTo: window.location.origin + '/auth/callback'}});
        if(error) throw error;
      })}>Continue with Google</Button><p className="account-divider">or use email</p></>}
      <form onSubmit={submit}>
        {!user && <label>Email<Input type="email" autoComplete="email" required value={email} disabled={busy} onChange={e => setEmail(e.target.value)}/></label>}
        {(user || mode !== 'reset') && <label>{user ? 'New password' : 'Password'}<Input type="password" required minLength={user || mode === 'signup' ? 8 : 1} autoComplete={user || mode === 'signup' ? 'new-password' : 'current-password'} value={password} disabled={busy} onChange={e => setPassword(e.target.value)}/>{(user || mode === 'signup') && <small>Use at least 8 characters.</small>}</label>}
        <Button type="submit" disabled={busy}>{busy ? 'Please wait…' : user ? 'Update password' : mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}</Button>
      </form>
      {user ? <><a href="/">Go to My collection</a><Button variant="outline" disabled={busy} onClick={() => run(async () => { const {error} = await getSupabase().auth.signOut(); if(error) throw error; setMessage('Signed out.'); })}>Sign out</Button></> : <nav aria-label="Account options"><Button variant="link" disabled={busy} onClick={() => changeMode(mode === 'signup' ? 'login' : 'signup')}>{mode === 'signup' ? 'Already have an account? Sign in' : 'Create an account'}</Button><Button variant="link" disabled={busy} onClick={() => changeMode(mode === 'reset' ? 'login' : 'reset')}>{mode === 'reset' ? 'Back to sign in' : 'Forgot password?'}</Button></nav>}
    </>}
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    <p className="account-local-note">Sign in to access your account library. You can import an existing browser library from Settings.</p>
  </section></main>;
}
