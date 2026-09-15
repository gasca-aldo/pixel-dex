 'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {getSupabase} from '@/lib/supabase';
import {clearDeletedAccount} from '@/lib/account-cleanup';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
export default function DeleteAccountPage(){
 const [user,setUser]=useState<{id:string;email?:string}|null>(null),[loading,setLoading]=useState(true),[confirmation,setConfirmation]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const inFlight=useRef(false);
 useEffect(()=>{let active=true;void getSupabase().auth.getUser().then(({data,error})=>{if(active){setUser(data.user);if(error)setError('Please sign in again.');setLoading(false);}}).catch(()=>{if(active){setError('Unable to load your account. Please reload.');setLoading(false);}});return()=>{active=false;};},[]);
 async function remove(e:FormEvent){
  e.preventDefault();if(!user||confirmation!=='DELETE'||inFlight.current)return;
  inFlight.current=true;setBusy(true);setError('');
  try{
   const auth=getSupabase().auth;
   const {data:{session},error}=await auth.getSession();
   if(error||!session||session.user.id!==user.id)throw new Error('Your account changed. Reload before trying again.');
   const response=await fetch('/api/account',{method:'DELETE',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({confirmation,expectedUserId:user.id}),signal:AbortSignal.timeout(35000)});
   const result=await response.json() as {deleted?:boolean;userId?:string;error?:string}|null;
   if(!response.ok||result?.deleted!==true||result?.userId!==user.id)throw new Error(result?.error||'Deletion could not be confirmed. Reload to check your account.');
   // Clear only this account's recovery data, not another account or the separate local library.
   const storageKey='sb-'+new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0]+'-auth-token';
   try{clearDeletedAccount(localStorage,user.id,storageKey);}catch{}
   window.location.replace('/login?account=deleted');
  }catch(e){setError(e instanceof Error?e.message:'Deletion could not be confirmed. Reload to check your account.');inFlight.current=false;setBusy(false);}
 }
 return <main className="account-page"><section className="account-card"><a href="/" className="account-brand">pixel dex</a><h1>Delete your account</h1>{loading?<p role="status">Checking your account…</p>:user?<><p>Account: <strong>{user.email}</strong></p><p>This permanently removes your Pixel Dex account, cloud library, profile, favorites, and all public, private, and unlisted lists. Shared links will stop working.</p><p>Export a backup from Settings first if you want to keep your collection. Your Google account is unaffected. Downloaded backups, copies saved by other people, and the separate browser-only library are not deleted.</p><form onSubmit={remove}><label htmlFor="delete-confirmation">Type DELETE to confirm</label><Input id="delete-confirmation" autoComplete="off" value={confirmation} disabled={busy} onChange={e=>setConfirmation(e.target.value)}/><Button variant="destructive" type="submit" disabled={busy||confirmation!=='DELETE'}>{busy?'Deleting account…':'Permanently delete my account'}</Button></form>{!busy&&<a href="/">Cancel and return to My collection</a>}</>:<a href="/login">Sign in to manage your account</a>}{error&&<p role="alert">{error}</p>}<a href="/privacy">Privacy notice</a></section></main>;
}
