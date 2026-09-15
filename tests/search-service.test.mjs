import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
import {readSearchResponse} from '../lib/search-response.ts';
let source=await readFile(new URL('../lib/igdb-server.ts',import.meta.url),'utf8');
source=source.replace("import {DurableObject} from 'cloudflare:workers';",'class DurableObject {constructor(ctx,env){this.ctx=ctx;this.env=env;}}');
source=source.replace("'./igdb-map'",JSON.stringify(new URL('../lib/igdb-map.ts',import.meta.url).href));
const {GameCatalog}=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
function service(){
 const data=new Map();
 const storage={get:async k=>data.get(k),put:async(k,v)=>{if(typeof k==='string')data.set(k,v);else for(const [key,value]of Object.entries(k))data.set(key,value);},getAlarm:async()=>1};
 return {data,instance:new GameCatalog({storage},{TWITCH_CLIENT_ID:'test',TWITCH_CLIENT_SECRET:'test'})};
}
const gold={id:1558,name:'Pokémon Gold Version',remakes:[1556],cover:{image_id:'cover1'}};
const heart={id:1556,name:'Pokémon HeartGold Version'};
test('direct matches do not wait for related lookup; cached reads bypass slow searches and duplicate queries coalesce',async()=>{
 const original=globalThis.fetch;let calls=0,release;let started;
 const began=new Promise(resolve=>started=resolve);
 globalThis.fetch=async(url,init)=>{
  if(String(url).includes('oauth2'))return Response.json({access_token:'test',expires_in:3600});
  calls++;started();await new Promise(resolve=>release=resolve);return Response.json([gold]);
 };
 try{
  const {instance,data}=service();data.set('game:9',{until:0,body:{cover:'https://images.igdb.com/example.jpg'}});
  const first=instance.fetch(new Request('https://catalog/?q=pokemon%20gold'));
  await began;
  const duplicate=instance.fetch(new Request('https://catalog/?q=pokemon%20gold'));
  const cover=await Promise.race([instance.fetch(new Request('https://catalog/?id=9')),new Promise((_,reject)=>setTimeout(()=>reject(Error('Cached read blocked')),200))]);
  assert.equal(cover.status,200);release();
  const [a,b]=await Promise.all([first,duplicate]);
  assert.equal(calls,1);assert.deepEqual(await a.json(),await b.json());
  globalThis.fetch=async()=>{calls++;return Response.json([heart]);};
  const related=await instance.fetch(new Request('https://catalog/?q=pokemon%20gold&related=1'));
  assert.deepEqual((await related.json()).results.map(g=>g.title),[gold.name,heart.name]);
  assert.equal(calls,2);
 }finally{globalThis.fetch=original;}
});
test('closely spaced searches wait for their slot instead of returning search busy',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async(url)=>String(url).includes('oauth2')?Response.json({access_token:'test',expires_in:3600}):Response.json([gold]);
 try{
  const {instance}=service();
  const responses=await Promise.all(['pokemon gol','pokemon gold','pokémon gold'].map(q=>instance.fetch(new Request('https://catalog/?q='+encodeURIComponent(q)))));
  assert.deepEqual(responses.map(r=>r.status),[200,200,200]);
 }finally{globalThis.fetch=original;}
});
test('HTML, malformed JSON and upstream errors produce controlled messages',async()=>{
 for(const response of [new Response('<html>Gateway error</html>',{status:502}),new Response('{bad'),Response.json({error:'raw upstream failure'},{status:429}),Response.json(null)]){
  await assert.rejects(readSearchResponse(response),/Game search/);
 }
 assert.deepEqual(await readSearchResponse(Response.json({results:[],enrich:true})),{results:[],enrich:true});
});

test('release refresh uses its own expiring cache and never replaces data on upstream failure',async()=>{
 const original=globalThis.fetch;let calls=0,unavailable=false;
 globalThis.fetch=async(url,init)=>{
  if(String(url).includes('oauth2'))return Response.json({access_token:'test',expires_in:3600});
  calls++;assert.match(init.body,/release_dates.release_region.region/);
  return unavailable?new Response('unavailable',{status:503}):Response.json([{...gold,platforms:[{id:6,name:'PC (Microsoft Windows)'}],release_dates:[]}]);
 };
 try{
  const {instance,data}=service();
  const request=()=>new Request('https://catalog/?release=1558');
  const [a,b]=await Promise.all([instance.fetch(request()),instance.fetch(request())]);
  assert.equal(a.status,200);assert.equal(b.status,200);assert.equal(calls,1);
  const saved=await a.json();assert.equal(saved.platforms[0].name,'PC');
  await instance.fetch(request());assert.equal(calls,1);
  const key='search:release:v2:1558';data.set(key,{until:0,body:saved});unavailable=true;
  assert.equal((await instance.fetch(request())).status,503);
  assert.deepEqual(data.get(key).body,saved);
  assert.equal((await instance.fetch(new Request('https://catalog/?release=bad'))).status,400);
 }finally{globalThis.fetch=original;}
});
