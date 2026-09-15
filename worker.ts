import {createHealthCheck,observeService} from './lib/service-health';
const healthCheck = createHealthCheck();
import {deleteAccount} from './lib/delete-account';
import app from 'vinext/server/fetch-handler';
import {DurableObject} from 'cloudflare:workers';
import {consumeAttempt, WINDOW_MS} from './lib/login-window.mjs';
import {catalogRequest,type CatalogEnv} from './lib/igdb-server';
export {GameCatalog} from './lib/igdb-server';
type Env=CatalogEnv & {SUPABASE_SECRET_KEY?:string;LOGIN_LIMITER:DurableObjectNamespace};
export class LoginLimiter extends DurableObject<Env> {
 async fetch() {
   return this.ctx.blockConcurrencyWhile(async()=>{
     const history=await this.ctx.storage.get<number[]>('attempts')??[];
     const now=Date.now();const result=consumeAttempt(history,now);
     if(result.allowed){await this.ctx.storage.put('attempts',result.history);await this.ctx.storage.setAlarm(now+WINDOW_MS);}
     return Response.json({allowed:result.allowed,retryAfter:result.retryAfter});
   });
 }
 async alarm(){await this.ctx.storage.deleteAll();}
}
const json=(value:unknown,status=200,extra:Record<string,string>={})=>Response.json(value,{status,headers:{'Cache-Control':'no-store',...extra}});
async function handleRequest(request:Request,env:Env,ctx:ExecutionContext) {
   const url=new URL(request.url);
   if(url.pathname==='/api/health')return healthCheck(request,{url:process.env.NEXT_PUBLIC_SUPABASE_URL,key:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY});
   if(url.pathname==='/api/account')return deleteAccount(request,{url:process.env.NEXT_PUBLIC_SUPABASE_URL!,secret:env.SUPABASE_SECRET_KEY});
   if(url.pathname.startsWith('/api/catalog'))return catalogRequest(request,env);
   if(url.pathname!=='/api/login')return app.fetch(request,env,ctx);
   if(request.method!=='POST')return json({error:'Method not allowed'},405,{Allow:'POST'});
   if(request.headers.get('origin')!==url.origin)return json({error:'Invalid origin'},403);
   if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'JSON required'},415);
   if(Number(request.headers.get('content-length')??0)>8192)return json({error:'Request too large'},413);
   const ip=request.headers.get('CF-Connecting-IP')??(['localhost','127.0.0.1'].includes(url.hostname)?'local':null);
   if(!ip)return json({error:'Unable to verify request'},403);
   try {
     const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip));
     const key=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
     const limit=await env.LOGIN_LIMITER.get(env.LOGIN_LIMITER.idFromName(key)).fetch('https://limiter/check');
     const decision=await limit.json() as {allowed:boolean;retryAfter:number};
     if(!decision.allowed)return json({error:'Too many sign-in attempts. Please try again later.',retryAfter:decision.retryAfter},429,{'Retry-After':String(decision.retryAfter)});
     const raw=await request.text();if(raw.length>8192)return json({error:'Request too large'},413);
     const body=JSON.parse(raw);
     if(typeof body.email!=='string'||typeof body.password!=='string'||body.email.length>320||body.password.length>4096)return json({error:'Enter your email and password'},400);
     const response=await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL+'/auth/v1/token?grant_type=password',{
       method:'POST',headers:{apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,'Content-Type':'application/json'},
       body:JSON.stringify({email:body.email.trim(),password:body.password}),signal:AbortSignal.timeout(15000)
     });
     const result=await response.json() as {access_token?:string;refresh_token?:string;error_code?:string};
     if(!response.ok)return json({error:response.status===429?'Please wait before trying again.':result.error_code==='email_not_confirmed'?'Please confirm your email before signing in.':'Unable to sign in. Check your email and password.'},response.status===429?429:400);
     if(!result.access_token||!result.refresh_token)return json({error:'Unable to complete sign-in'},502);
     return json({access_token:result.access_token,refresh_token:result.refresh_token});
   } catch {return json({error:'Unable to connect. Please try again.'},503);}
}
export default {fetch(request:Request,env:Env,ctx:ExecutionContext){return observeService(request,()=>handleRequest(request,env,ctx));}};
