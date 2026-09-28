export const ORIGIN='https://pixel-dex.gasca-aldo.workers.dev';
export const CHECKS=['homepage','health','game','hardware'] as const;
export type Check=typeof CHECKS[number];
export type Result={ok:boolean;reason:'ok'|'http'|'redirect'|'content'|'stale'|'timeout_or_network'|'slow';status:number|null;durationMs:number};
export type Event={type:'OUTAGE'|'REMINDER'|'RECOVERY';check:Check;incidentId:string;at:number};
export type State={failures:number;successes:number;incidentId:string|null;incidentState:'healthy'|'outage';lastNotification:Event|null;lastCompletedRun:number;slot:number;result:Result};
export const interval=(check:Check)=>check==='game'||check==='hardware'?900000:300000;
export function advance(previous:State|undefined,check:Check,result:Result,at:number,slot:number):{state:State;event?:Event}{
 const state:State={failures:0,successes:0,incidentId:null,incidentState:'healthy',lastNotification:null,...previous,lastCompletedRun:at,slot,result};
 state.failures=result.ok?0:Math.min(state.failures+1,1000000);
 state.successes=result.ok?Math.min(state.successes+1,1000000):0;
 let event:Event|undefined;
 if(state.incidentState==='healthy'&&state.failures>=(check==='game'||check==='hardware'?2:3)){
  state.incidentId=`${check}-${slot}`;state.incidentState='outage';event={type:'OUTAGE',check,incidentId:state.incidentId,at};
 }else if(state.incidentState==='outage'&&state.successes>=2){
  event={type:'RECOVERY',check,incidentId:state.incidentId!,at};state.incidentState='healthy';
 }else if(state.incidentState==='outage'&&!result.ok&&at-(state.lastNotification?.at??at)>=3600000){
  event={type:'REMINDER',check,incidentId:state.incidentId!,at};
 }
 if(event)state.lastNotification=event;
 return {state,event};
}
const paths:Record<Check,string>={homepage:'/',health:'/api/health',game:'/api/catalog?q=The%20Legend%20of%20Zelda',hardware:'/api/catalog/hardware?q=Switch%20OLED'};
export async function probe(check:Check,fetcher:typeof fetch=fetch,now=Date.now):Promise<Result>{
 const start=now();let status:number|null=null;
 const finish=(reason:Result['reason']):Result=>({ok:reason==='ok',reason,status,durationMs:Math.max(0,now()-start)});
 try{
  const response=await fetcher(ORIGIN+paths[check],{redirect:'manual',signal:AbortSignal.timeout(12000),headers:{Accept:check==='homepage'?'text/html':'application/json'}});
  status=response.status;
  if(response.redirected||status>=300&&status<400){await response.body?.cancel();return finish('redirect');}
  if(status!==200){await response.body?.cancel();return finish('http');}
  // Bound memory and never retain or log upstream response bodies.
  const reader=response.body?.getReader();let length=0,text='';const decoder=new TextDecoder();
  if(reader)while(true){const chunk=await reader.read();if(chunk.done)break;length+=chunk.value.length;if(length>524288){await reader.cancel();return finish('content');}text+=decoder.decode(chunk.value,{stream:true});}
  text+=decoder.decode();
  let valid=false;
  if(check==='homepage')valid=(response.headers.get('content-type')??'').includes('text/html')&&/pixel\s+dex/i.test(text)&&/<html[\s>]/i.test(text);
  else{
   let data;try{data=JSON.parse(text);}catch{return finish('content');}
   if(check==='health')valid=data?.service==='pixel-dex'&&data?.status==='ok';
   if(check==='game')valid=Array.isArray(data?.results)&&data.results.some((r:{id?:string;title?:string})=>r.id==='igdb:1022'&&r.title==='The Legend of Zelda');
   if(check==='hardware'){
    valid=typeof data?.stale==='boolean'&&Array.isArray(data?.results)&&data.results.some((r:{igdbPlatformId?:number;igdbPlatformVersionId?:number;platformName?:string})=>r.igdbPlatformId===130&&r.igdbPlatformVersionId===503&&r.platformName==='Nintendo Switch');
    if(valid&&data.stale)return finish('stale');
   }
  }
  return finish(!valid?'content':now()-start>10000?'slow':'ok');
 }catch{return finish('timeout_or_network');}
}
export type Snapshot={checks:Partial<Record<Check,State>>;events:Event[];lastCompletedRun:number};
export type MonitorStore={get:()=>Promise<Snapshot|undefined>;put:(snapshot:Snapshot)=>Promise<void>};
// Delivery is an adapter: production currently supplies log-only delivery, never email.
export async function run(store:MonitorStore,scheduledAt:number,checkProbe=probe,notify:(event:Event)=>void=()=>{},now=Date.now){
 const snapshot=await store.get()??{checks:{},events:[],lastCompletedRun:0};
 const events:Event[]=[];
 const due=CHECKS.filter(check=>(snapshot.checks[check]?.slot??-1)<Math.floor(scheduledAt/interval(check)));
 const results=await Promise.all(due.map(check=>checkProbe(check)));
 for(const [index,check] of due.entries()){
  const slot=Math.floor(scheduledAt/interval(check));
  if((snapshot.checks[check]?.slot??-1)>=slot)continue;
  const {state,event}=advance(snapshot.checks[check],check,results[index],now(),slot);
  snapshot.checks[check]=state;
  if(event){snapshot.events=[...snapshot.events,event].slice(-32);events.push(event);}
 }
 snapshot.lastCompletedRun=now();await store.put(snapshot);
 for(const event of events)notify(event);
 return snapshot;
}
