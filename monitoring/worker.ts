import {DurableObject} from 'cloudflare:workers';
import {run,type Snapshot} from './core';
type Env={MONITOR_STATE:DurableObjectNamespace};
export class MonitorState extends DurableObject<Env>{
 async fetch(request:Request){
  return this.ctx.blockConcurrencyWhile(async()=>{
   const scheduledAt=Number(new URL(request.url).searchParams.get('at'));
   if(!Number.isFinite(scheduledAt)||scheduledAt<=0)return new Response(null,{status:400});
   const snapshot=await run({get:()=>this.ctx.storage.get<Snapshot>('state'),put:s=>this.ctx.storage.put('state',s)},scheduledAt,undefined,event=>console.log(JSON.stringify({event:'pixel_dex_monitor_event',delivery:'log-only',...event})));
   console.log(JSON.stringify({event:'pixel_dex_monitor_run',lastCompletedRun:snapshot.lastCompletedRun,checks:Object.fromEntries(Object.entries(snapshot.checks).map(([check,state])=>[check,{...state.result,lastCompletedRun:state.lastCompletedRun,incidentState:state.incidentState}]))}));
   return new Response(null,{status:204});
  });
 }
}
export default {
 async scheduled(controller:ScheduledController,env:Env){
  try{
   const response=await env.MONITOR_STATE.get(env.MONITOR_STATE.idFromName('pixel-dex')).fetch(`https://monitor.internal/run?at=${controller.scheduledTime}`);
   if(!response.ok)throw new Error('Monitor failed');
  }catch{console.error(JSON.stringify({event:'pixel_dex_monitor_failure'}));throw new Error('Monitor run failed');}
 },
 // No public trigger, state endpoint, credentials, or collection access.
 fetch(){return new Response(null,{status:404});}
};
