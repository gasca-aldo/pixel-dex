import {DurableObject} from 'cloudflare:workers';
import {mapGame,releaseCatalogFor,gameFields,searchBody,prefixBody,rankGames,relatedBody,titleScore,type RawGame} from './igdb-map';
import {HardwareCatalog,HARDWARE_RETENTION,type HardwareEndpoint} from './igdb-hardware';
export type CatalogEnv={TWITCH_CLIENT_ID?:string;TWITCH_CLIENT_SECRET?:string;GAME_CATALOG:DurableObjectNamespace};
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
type Cached<T>={until:number;body:T};
type SearchResult={results:ReturnType<typeof mapGame>[];enrich?:boolean};
export class GameCatalog extends DurableObject<CatalogEnv> {
 private token=''; private expires=0; private nextRequest=0;
 private renewing?:Promise<void>;
 private pending=new Map<string,Promise<Response>>();
 private queued=0;
 private hardware?:HardwareCatalog;
 async fetch(request:Request) {
  const url=new URL(request.url),id=url.searchParams.get('id'),q=(url.searchParams.get('q')??'').trim();
  if(url.searchParams.has('hardware')){
   const platform=url.searchParams.get('platform'),version=url.searchParams.get('version');
   if((platform!==null&&!/^[1-9]\d{0,9}$/.test(platform))||(version!==null&&(!platform||!/^[1-9]\d{0,9}$/.test(version)))||(!platform&&(q.length<2||q.length>120)))return reply({error:'Invalid hardware request'},400);
   this.hardware??=new HardwareCatalog({get:key=>this.ctx.storage.get(key),put:async(key,value)=>{await this.ctx.storage.put(key,value);if(!await this.ctx.storage.getAlarm())await this.ctx.storage.setAlarm(Date.now()+86400000);}},<T>(endpoint:HardwareEndpoint,body:string)=>this.query<T>(body,endpoint));
   try{return reply(await this.hardware.load(q,platform?Number(platform):undefined,version?Number(version):undefined,url.searchParams.get('versions')==='1'));}
   catch{return reply({error:'Unable to load hardware right now. Existing items have not been changed.'},503);}
  }
  const releaseId=url.searchParams.get('release');
  if(releaseId){
   if(!/^[1-9]\d{0,9}$/.test(releaseId))return reply({error:'Invalid game'},400);
   const key='search:release:v2:'+releaseId;
   try{
    const cached=await this.ctx.storage.get<Cached<unknown>>(key);if(cached&&cached.until>Date.now())return reply(cached.body);
    if(!this.env.TWITCH_CLIENT_ID||!this.env.TWITCH_CLIENT_SECRET)return reply({error:'Release dates are not configured in this environment.'},503);
    let task=this.pending.get(key);
    if(!task){task=(async()=>{const games=await this.query(`fields ${gameFields}; where id = ${releaseId}; limit 1;`);if(!games.length)return reply({error:'Game unavailable'},404);const body=releaseCatalogFor(games[0]);await this.ctx.storage.put(key,{until:Date.now()+3600000,body});if(!await this.ctx.storage.getAlarm())await this.ctx.storage.setAlarm(Date.now()+86400000);return reply(body);})();this.pending.set(key,task);}
    try{return (await task).clone();}finally{if(this.pending.get(key)===task)this.pending.delete(key);}
   }catch{return reply({error:'Unable to refresh releases'},503);}
  }
  const enrich=url.searchParams.get('related')==='1';
  if(id?!/^[1-9]\d{0,9}$/.test(id):q.length<2||q.length>120)return reply({error:'Enter between 2 and 120 characters.'},400);
  const base='search:v10:'+q.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const key=id?'game:'+id:base+(enrich?':related':':direct');
  try {
   const cached=await this.ctx.storage.get<Cached<unknown>>(key);
   if(cached&&(id||cached.until>Date.now()))return reply(cached.body);
   if(!this.env.TWITCH_CLIENT_ID||!this.env.TWITCH_CLIENT_SECRET)return reply({error:'Game search is not configured in this environment. You can still add a title manually.'},503);
   // Coalesce identical requests without blocking unrelated cached reads.
   let task=this.pending.get(key);
   if(!task){task=this.load(id,q,base,key,enrich);this.pending.set(key,task);}
   try{return (await task).clone();}finally{if(this.pending.get(key)===task)this.pending.delete(key);}
  }catch{return reply({error:'Unable to load games right now. Please try again.'},503);}
 }
 private async authorize() {
  if(this.expires>Date.now())return;
  if(!this.renewing)this.renewing=(async()=>{
   const response=await fetch('https://id.twitch.tv/oauth2/token',{method:'POST',body:new URLSearchParams({client_id:this.env.TWITCH_CLIENT_ID!,client_secret:this.env.TWITCH_CLIENT_SECRET!,grant_type:'client_credentials'}),signal:AbortSignal.timeout(4000)});
   if(!response.ok)throw new Error('Authentication unavailable');
   const token=await response.json() as {access_token:string;expires_in:number};
   this.token=token.access_token;this.expires=Date.now()+(token.expires_in-60)*1000;
  })().finally(()=>{this.renewing=undefined;});
  await this.renewing;
 }
 private async query<T=RawGame>(body:string,endpoint:'games'|HardwareEndpoint='games'):Promise<T[]> {
  await this.authorize();
  // Bound concurrency and space starts, allowing requests to overlap on I/O.
  // No global blockConcurrencyWhile: cached covers/searches remain responsive.
  if(this.queued>=6)throw new Error('Catalog capacity');
  this.queued++;
  try {
   const start=Math.max(Date.now(),this.nextRequest);this.nextRequest=start+350;
   const wait=start-Date.now();if(wait>0)await new Promise(resolve=>setTimeout(resolve,wait));
   const response=await fetch('https://api.igdb.com/v4/'+endpoint,{method:'POST',headers:{'Client-ID':this.env.TWITCH_CLIENT_ID!,Authorization:`Bearer ${this.token}`,'Content-Type':'text/plain'},body,signal:AbortSignal.timeout(4000)});
   if(response.status===401)this.expires=0;
   if(!response.ok)throw new Error('Catalog unavailable');
   const rows=await response.json();
   if(!Array.isArray(rows))throw new Error('Invalid catalog response');
   return rows as T[];
  }finally{this.queued--;}
 }
 private async rememberCovers(games:RawGame[]) {
  const records:Record<string,Cached<{cover:string|null}>>={};
  for(const game of games){const image=game.cover?.image_id;records['game:'+game.id]={until:Date.now()+86400000,body:{cover:image&&/^[a-zA-Z0-9_]+$/.test(image)?`https://images.igdb.com/igdb/image/upload/t_cover_big/${image}.jpg`:null}};}
  if(games.length)await this.ctx.storage.put(records);
 }
 private async load(id:string|null,q:string,base:string,key:string,enrich:boolean):Promise<Response> {
  if(id){
   const games=await this.query(`fields cover.image_id; where id = ${id}; limit 1;`);
   await this.rememberCovers(games);
   return reply((await this.ctx.storage.get<Cached<unknown>>(key))?.body??{cover:null});
  }
  let games=(await this.ctx.storage.get<Cached<RawGame[]>>(base+':raw'));
  if(!games||games.until<Date.now()){
   // Prefix matching handles both complete titles and typing; only fall back
   // to full text for reordered words or aliases without a prefix match.
   let direct=await this.query(prefixBody(q));
   if(!rankGames(direct,q).length)direct=await this.query(searchBody(q));
   games={until:Date.now()+3600000,body:direct};await this.ctx.storage.put(base+':raw',games);
  }
  let candidates=[...games.body];
  const anchor=rankGames(candidates,q)[0];
  const relation=anchor&&titleScore(anchor.name,q)>=70?relatedBody(anchor):null;
  if(enrich&&relation&&anchor){
   const relatedKey='search:related:v1:'+anchor.id;
   let related=await this.ctx.storage.get<Cached<RawGame[]>>(relatedKey);
   if(!related||related.until<Date.now()){
    try{related={until:Date.now()+3600000,body:await this.query(relation)};await this.ctx.storage.put(relatedKey,related);}
    catch{return reply({results:rankGames(candidates,q,anchor).slice(0,20).map(mapGame)});}
   }
   candidates.push(...related.body);
  }
  const ranked=rankGames(candidates,q,anchor).slice(0,20);
  await this.rememberCovers(ranked);
  const result:SearchResult={results:ranked.map(mapGame),enrich:!enrich&&!!relation};
  await this.ctx.storage.put(key,{until:Date.now()+3600000,body:result});
  if(!await this.ctx.storage.getAlarm())await this.ctx.storage.setAlarm(Date.now()+86400000);
  return reply(result);
 }
 async alarm(){const entries=await this.ctx.storage.list<Cached<unknown>>({prefix:'search:'});const expired=[...entries].filter(([,v])=>v.until<Date.now()).map(([k])=>k);if(expired.length)await this.ctx.storage.delete(expired);
  const hardware=await this.ctx.storage.list<Cached<{checkedAt:number}>>({prefix:'hardware:'});
  const old=[...hardware].filter(([,v])=>Date.now()-v.body.checkedAt>=HARDWARE_RETENTION).map(([k])=>k);
  if(old.length)await this.ctx.storage.delete(old);
  if(hardware.size>old.length)await this.ctx.storage.setAlarm(Date.now()+86400000);
 }
}
export async function catalogRequest(request:Request,env:CatalogEnv) {
 const url=new URL(request.url);
 if(request.method!=='GET')return reply({error:'Method not allowed'},405);
 const cover=url.pathname.match(/^\/api\/catalog\/cover\/([1-9]\d{0,9})$/);
 const release=url.pathname.match(/^\/api\/catalog\/releases\/([1-9]\d{0,9})$/);
 const hardware=url.pathname.match(/^\/api\/catalog\/hardware(?:\/platforms\/([1-9]\d{0,9})(?:\/(versions)(?:\/([1-9]\d{0,9}))?)?)?$/);
 if(url.pathname!=='/api/catalog'&&!cover&&!release&&!hardware)return reply({error:'Not found'},404);
 const target=new URL('https://catalog/');
 if(hardware){target.searchParams.set('hardware','1');if(hardware[1])target.searchParams.set('platform',hardware[1]);if(hardware[3])target.searchParams.set('version',hardware[3]);else if(hardware[2])target.searchParams.set('versions','1');target.searchParams.set('q',url.searchParams.get('q')??'');}
 else if(release)target.searchParams.set('release',release[1]);else if(cover)target.searchParams.set('id',cover[1]);else {target.searchParams.set('q',url.searchParams.get('q')??'');if(url.searchParams.get('related')==='1')target.searchParams.set('related','1');}
 const response=await env.GAME_CATALOG.get(env.GAME_CATALOG.idFromName('igdb')).fetch(target);
 if(!cover)return response;
 if(!response.ok)return response;
 const result=await response.json() as {cover:string|null};
 const imageUrl=result.cover && url.searchParams.get('dpr')==='2'?result.cover.replace('/t_cover_big/','/t_cover_big_2x/'):result.cover;
 return imageUrl?new Response(null,{status:302,headers:{Location:imageUrl,'Cache-Control':'public, max-age=3600'}}):new Response(null,{status:404});
}
