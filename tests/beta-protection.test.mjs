import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
import {consumeAttempt} from '../lib/login-window.mjs';
import {limitCatalog} from '../lib/catalog-limit.ts';
import {authCaptchaToken} from '../lib/auth-captcha.ts';
let source=await readFile(new URL('../worker.ts',import.meta.url),'utf8');
source=source.replace(/^import .*;\n/gm,'').replace(/^export \{GameCatalog\}.*;\n/gm,'');
const header=`import {consumeAttempt,WINDOW_MS,MAX_ATTEMPTS} from '${new URL('../lib/login-window.mjs',import.meta.url)}';
import {limitCatalog,CATALOG_WINDOW_MS,CATALOG_MAX_ATTEMPTS,COVER_MAX_ATTEMPTS} from '${new URL('../lib/catalog-limit.ts',import.meta.url)}';
import {authCaptchaToken} from '${new URL('../lib/auth-captcha.ts',import.meta.url)}';
class DurableObject {constructor(ctx){this.ctx=ctx;}}
const createHealthCheck=()=>()=>Response.json({status:'ok'});
const observeService=(_r,run)=>run();
const deleteAccount=()=>{throw Error('Unexpected account operation');};
const catalogRequest=()=>Response.json({results:['catalog stub']});
const app={fetch:()=>new Response('app')};\n`;
const {LoginLimiter,default:worker}=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(header+source)).toString('base64'));
function namespace(){
 const objects=new Map();const names=[];
 return {names,objects,idFromName(name){names.push(name);return name;},get(id){
  if(!objects.has(id)){
   const data=new Map();let serial=Promise.resolve();
   const storage={get:async k=>data.get(k),put:async(k,v)=>data.set(k,v),setAlarm:async n=>data.set('alarm',n),deleteAll:async()=>data.clear()};
   const instance=new LoginLimiter({storage,blockConcurrencyWhile:f=>{const p=serial.then(f);serial=p.catch(()=>{});return p;}});
   objects.set(id,{instance,data});
  }
  return {fetch:url=>objects.get(id).instance.fetch(new Request(url))};
 }};
}
const request=(path,ip='192.0.2.1')=>new Request('https://pixel.test'+path,{headers:ip?{'CF-Connecting-IP':ip}:{}});
test('catalog route enforces a shared game/hardware window, isolates IPs and covers, and does not expose IPs',async()=>{
 const ns=namespace(),env={LOGIN_LIMITER:ns};
 const responses=await Promise.all(Array.from({length:61},(_,i)=>worker.fetch(request(i%2?'/api/catalog?q=zelda':'/api/catalog/hardware?q=Switch'),env,{})));
 assert.equal(responses.filter(r=>r.status===200).length,60);
 const denied=responses.find(r=>r.status===429);assert.ok(Number(denied.headers.get('Retry-After'))>0);assert.equal(denied.headers.get('Cache-Control'),'no-store');
 assert.equal((await worker.fetch(request('/api/catalog?q=zelda','192.0.2.2'),env,{})).status,200);
 assert.equal((await worker.fetch(request('/api/catalog/cover/1022'),env,{})).status,200);
 assert.ok(ns.names.every(n=>/^(catalog|cover):[a-f0-9]{64}$/.test(n)));
 const login=await ns.get(ns.idFromName('login-isolated')).fetch('https://limiter/check');assert.equal((await login.json()).allowed,true);
});
test('catalog fails safely on limiter outage, malformed response, missing source IP, and non-GET',async()=>{
 const ns=namespace();assert.equal((await limitCatalog(request('/api/catalog?q=x',''),ns)).status,403);
 assert.equal((await limitCatalog(new Request('https://pixel.test/api/catalog',{method:'POST'}),ns)).status,405);
 for(const fetch of [async()=>{throw Error('private upstream details');},async()=>Response.json({}),async()=>Response.json({allowed:false,retryAfter:-1})]){
  const response=await limitCatalog(request('/api/catalog?q=x'),{idFromName:n=>n,get:()=>({fetch})});
  assert.equal(response.status,503);assert.ok(!(await response.text()).includes('private upstream'));
 }
});
test('catalog windows expire and rejected requests do not prolong lockout',()=>{
 const h=Array(60).fill(1000);assert.equal(consumeAttempt(h,2000,60000,60).allowed,false);
 assert.deepEqual(consumeAttempt(h,2000,60000,60).history,h);
 assert.equal(consumeAttempt(h,61000,60000,60).allowed,true);
});
test('CAPTCHA token input validation rejects missing, oversized and invalid values when required',()=>{
 for(const value of [undefined,'',null,42,'   ','x'.repeat(2049)])assert.throws(()=>authCaptchaToken(value,true));
 assert.equal(authCaptchaToken('verified-token',true),'verified-token');
 assert.equal(authCaptchaToken(undefined,false),undefined);
});
test('password endpoint forwards CAPTCHA to Supabase, blocks missing token and surfaces provider rejection safely',async()=>{
 const oldFetch=globalThis.fetch,oldKey=process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,oldUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;
 process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY='test-site-key';process.env.NEXT_PUBLIC_SUPABASE_URL='https://auth.test';
 let calls=0,body;
 globalThis.fetch=async(_url,init)=>{calls++;body=JSON.parse(init.body);return Response.json({error_code:'captcha_failed',msg:'private'},{status:400});};
 const make=token=>new Request('https://pixel.test/api/login',{method:'POST',headers:{origin:'https://pixel.test','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.9'},body:JSON.stringify({email:'nobody@example.invalid',password:'not-a-real-password',captchaToken:token})});
 try{
  const env={LOGIN_LIMITER:namespace()};assert.equal((await worker.fetch(make(undefined),env,{})).status,400);assert.equal(calls,0);
  const failed=await worker.fetch(make('verified-token'),env,{});assert.equal(failed.status,400);
  assert.deepEqual(body.gotrue_meta_security,{captcha_token:'verified-token'});assert.match((await failed.json()).error,/Security check failed/);
  globalThis.fetch=async()=>Response.json({error_code:'email_not_confirmed'},{status:400});
  assert.match((await (await worker.fetch(make('next-token'),env,{})).json()).error,/confirm your email/);
 }finally{globalThis.fetch=oldFetch;for(const [k,v]of Object.entries({NEXT_PUBLIC_TURNSTILE_SITE_KEY:oldKey,NEXT_PUBLIC_SUPABASE_URL:oldUrl})){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
});
