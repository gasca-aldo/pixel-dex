 'use client';
import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
export function AccountStatus() {
  const [email, setEmail] = useState<string>();
  useEffect(() => {
    const auth = getSupabase().auth;
    let active = true;
    void auth.getSession().then(({data}) => { if(active) setEmail(data.session?.user.email); });
    const {data} = auth.onAuthStateChange((_event, session) => setEmail(session?.user.email));
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  return <div className="settings-section"><h3>Account</h3><p>{email || 'Sign in with Google or email.'}</p><a className="secondary" href="/login">{email ? 'Manage account' : 'Sign in'}</a><p>Signed-in libraries save to your account. The local library stays separate.</p></div>;
}
