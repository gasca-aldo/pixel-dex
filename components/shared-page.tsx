 'use client';
import {useEffect,useState} from 'react';
import {getSupabase} from '@/lib/supabase';
import {covers} from '@/lib/covers';
import {ListReadView} from '@/components/game-lists';
import {type GameRef,type GameList} from '@/lib/tracker';
import {Gamepad2,UserRound} from 'lucide-react';
type SharedList=GameList & {slug:string};
type Profile={handle:string;name:string;bio:string;topGames:GameRef[];lists:SharedList[];collection:({id:string;title:string;kind:string;owned:boolean;platform:string;catalogId?:string}[])|null};
function Art({game}:{game:GameRef}) {
 const [broken,setBroken]=useState(false); const url=game.catalogId?covers[game.catalogId]:undefined;
 return <div className="shared-cover">{url&&!broken?<img src={url} alt={game.title} loading="lazy" onError={()=>setBroken(true)}/>:<Gamepad2 aria-label={game.title}/>}</div>;
}
export function SharedPage({handle,slug}:{handle:string;slug?:string}) {
 const [profile,setProfile]=useState<Profile|null>(null);const [list,setList]=useState<SharedList|null>(null);
 const [name,setName]=useState('');const [loading,setLoading]=useState(true);const [error,setError]=useState('');
 useEffect(()=>{
   let active=true;let request=0;
   async function load() {
     const ticket=++request;
     try {
       const db=getSupabase();
       // Supabase waits for session initialization and passes the signed-in token to the database.
       const {data,error}=await db.rpc(slug?'read_shared_list':'read_shared_profile',slug?{profile_handle:handle,list_slug:slug}:{profile_handle:handle});
       if(!active || ticket!==request)return;
       if(error)throw new Error('Unable to load this page. Please try again.');
       setError('');setProfile(slug?null:data);setList(slug?data?.list??null:null);setName(data?.name??'');
     }catch(e){if(active&&ticket===request){setError(e instanceof Error?e.message:'Unable to load page.');setProfile(null);setList(null);}}
     finally{if(active&&ticket===request)setLoading(false);}
   }
   void load();
   const onFocus=()=>{if(document.visibilityState==='visible')void load();};
   const timer=window.setInterval(onFocus,30000);
   window.addEventListener('focus',onFocus);document.addEventListener('visibilitychange',onFocus);
   return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',onFocus);document.removeEventListener('visibilitychange',onFocus);};
 },[handle,slug]);
 return <main className="shared-page"><header className="shared-nav"><a className="account-brand" href="/">pixel dex</a><a href="/login">My account</a></header>
 {loading?<p role="status">Loading…</p>:error?<p role="alert">{error}</p>:!profile&&!list?<section className="quiet-empty"><h1>Page unavailable</h1><p>This page may be private or no longer available.</p><a href="/login">Sign in</a></section>:list?<>
 <a href={'/p/'+handle} className="shared-owner">{name} · @{handle}</a><ListReadView list={list} renderArt={game=><Art game={game}/>}/>
 <p className="muted">{list.visibility==='Private'?'Private · Only you can view this list.':list.visibility==='Unlisted'?'Unlisted · Anyone with this link can view this list.':'Public list'}</p>
 </>:profile&&<>
 <div className="player-header"><div className="player-avatar"><UserRound size={32}/></div><div><h1>{profile.name}</h1><span>@{profile.handle}</span>{profile.bio&&<p>{profile.bio}</p>}</div></div>
 <section><h2>Top six</h2><p className="muted">Favorites, in no particular order</p><div className="top-six-grid">{profile.topGames.map(game=><div className="top-six-card" key={game.id}><Art game={game}/><h3>{game.title}</h3></div>)}</div>{!profile.topGames.length&&<p className="muted">No favorites selected yet.</p>}</section>
 <section><h2>Public lists</h2><div className="lists-grid">{profile.lists.map(list=><a className="list-card" key={list.id} href={'/p/'+handle+'/'+list.slug}><div className="list-mosaic">{list.entries.slice(0,4).map(e=><Art key={e.game.id} game={e.game}/>)}</div><div className="list-card-body"><h3>{list.title}</h3><p>{list.entries.length} games</p>{list.description&&<p>{list.description}</p>}</div></a>)}</div>{!profile.lists.length&&<p className="muted">No public lists yet.</p>}</section>
 {profile.collection!==null&&<section><h2>Collection</h2><div className="shared-collection">{profile.collection.map(item=><div key={item.id}><Art game={item}/><h3>{item.title}</h3><p className="muted">{item.platform} · {item.owned?'Owned':'Wishlist'}</p></div>)}</div>{!profile.collection.length&&<p className="muted">No items yet.</p>}</section>}
 </>}
 </main>;
}
