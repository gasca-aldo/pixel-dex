 'use client';
import {useEffect,useState} from 'react';
import {getSupabase} from '@/lib/supabase';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
async function address(listId?:string) {
  const db=getSupabase();
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError || !user) throw new Error('Sign in to create shared links.');
  const {data,error}=await db.from('profile_handles').select('handle').eq('user_id',user.id).maybeSingle();
  if(error) throw new Error('Sharing is not configured yet. Apply the sharing database migration first.');
  if(!data) throw new Error('Choose a username on My profile first.');
  let path='/p/'+data.handle;
  if(listId) {
    const {data:list,error}=await db.from('list_addresses').select('slug').eq('user_id',user.id).eq('list_id',listId).maybeSingle();
    if(error || !list) throw new Error('Save this list to your account before sharing it.');
    path+='/'+list.slug;
  }
  return path;
}
export function ShareLink({listId}:{listId?:string}) {
  const [url,setUrl]=useState(''); const [message,setMessage]=useState(''); const [busy,setBusy]=useState(false);
  return <div className="share-link-control"><Button variant="outline" disabled={busy} onClick={async()=>{
    setBusy(true);setMessage('');
    try {const link=window.location.origin+await address(listId);setUrl(link);
      try {await navigator.clipboard.writeText(link);setMessage('Link copied.');} catch {setMessage('Copy the link below.');}
    } catch(e) {setMessage(e instanceof Error?e.message:'Unable to create the link.');} finally {setBusy(false);}
  }}>{busy?'Getting link…':'Copy '+(listId?'list':'profile')+' link'}</Button>
  {url && <Input aria-label="Shared link" readOnly value={url} onFocus={e=>e.target.select()}/>}
  {message && <p role="status">{message}</p>}</div>;
}
export function ProfileAddress() {
  const [handle,setHandle]=useState('');const [saved,setSaved]=useState('');const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);
  useEffect(()=>{let active=true;void address().then(path=>{if(active) setSaved(path.split('/').pop()||'');}).catch(()=>{});return()=>{active=false;};},[]);
  return <section className="profile-address"><h3>Your profile address</h3>{saved?<><a href={'/p/'+saved}>/p/{saved}</a><ShareLink/></>:<>
  <p>Choose a permanent username. Your profile will show your top six and public lists. List notes follow the visibility of their list.</p>
  <form onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);setMessage('');try {
    const {data,error}=await getSupabase().rpc('claim_profile_handle',{chosen_handle:handle});
    if(error) throw new Error(error.code==='P0001'?error.message:'Unable to save your username. Sign in and check the sharing database setup.');
    setSaved(data);
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to save username.');}finally{setBusy(false);}}}>
  <label htmlFor="profile-handle">Username</label><Input id="profile-handle" required minLength={3} maxLength={30} pattern="[a-z0-9][a-z0-9_-]{2,29}" autoCapitalize="none" autoCorrect="off" value={handle} onChange={e=>setHandle(e.target.value.toLowerCase())}/>
  <small>3–30 letters, numbers, underscores or hyphens.</small><Button disabled={busy}>{busy?'Saving…':'Set profile address'}</Button></form></>}
  {message&&<p role="alert">{message}</p>}</section>;
}
