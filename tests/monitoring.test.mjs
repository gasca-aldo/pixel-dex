import test from 'node:test';
import assert from 'node:assert/strict';
import {advance,probe,run} from '../monitoring/core.ts';
const ok={ok:true,reason:'ok',status:200,durationMs:10};
const bad={ok:false,reason:'http',status:503,durationMs:10};
test('healthy and intermittent failures do not open an incident',()=>{
 let state;for(const [i,result] of [ok,bad,ok,bad,ok].entries()){const next=advance(state,'health',result,i*300000,i);assert.equal(next.event,undefined);state=next.state;}
 assert.equal(state.failures,0);assert.equal(state.successes,1);
});
test('thresholds, duplicate suppression, hourly reminders and two-success recovery',()=>{
 for(const [check,threshold] of [['health',3],['homepage',3],['game',2],['hardware',2]]){
  let state,event;for(let i=0;i<threshold;i++){({state,event}=advance(state,check,bad,i*300000,i));assert.equal(event?.type,i===threshold-1?'OUTAGE':undefined);}
  const incident=state.incidentId,opened=state.lastNotification.at;
  ({state,event}=advance(state,check,bad,opened+3599999,99));assert.equal(event,undefined);
  ({state,event}=advance(state,check,bad,opened+3600000,100));assert.equal(event.type,'REMINDER');
  ({state,event}=advance(state,check,ok,opened+3900000,101));assert.equal(event,undefined);
  ({state,event}=advance(state,check,ok,opened+4200000,102));assert.equal(event.type,'RECOVERY');assert.equal(event.incidentId,incident);
  ({state,event}=advance(state,check,ok,opened+4500000,103));assert.equal(event,undefined);assert.equal(state.incidentState,'healthy');
 }
});
test('scheduled slots deduplicate, searches run every fifteen minutes, state persists',async()=>{
 let saved;const store={get:async()=>saved?structuredClone(saved):undefined,put:async s=>{saved=structuredClone(s);}};
 const calls=[],events=[];const check=async c=>{calls.push(c);return bad;};
 await run(store,900000,check,e=>events.push(e),()=>900001);
 await run(store,900000,check,e=>events.push(e));assert.equal(calls.length,4);
 await run(store,1200000,check,e=>events.push(e));assert.equal(calls.length,6);
 await run(store,1500000,check,e=>events.push(e));assert.equal(events.filter(e=>e.type==='OUTAGE').length,2);
 await run(store,1800000,check,e=>events.push(e));assert.equal(events.filter(e=>e.type==='OUTAGE').length,4);
 assert.ok(saved.lastCompletedRun);assert.equal(saved.events.length,4);
});
test('probe validates expected content, stale hardware, redirects, duration, and bounded bodies',async()=>{
 const hardware={stale:false,results:[{igdbPlatformId:130,igdbPlatformVersionId:503,platformName:'Nintendo Switch'}]};
 const cases=[['homepage',()=>new Response('<html>pixel dex</html>',{headers:{'content-type':'text/html'}}),'ok'],['health',()=>Response.json({service:'pixel-dex',status:'ok'}),'ok'],['game',()=>Response.json({results:[{id:'igdb:1022',title:'The Legend of Zelda'}]}),'ok'],['hardware',()=>Response.json(hardware),'ok'],['hardware',()=>Response.json({...hardware,stale:true}),'stale'],['hardware',()=>Response.json({results:[]}),'content'],['health',()=>new Response(null,{status:302,headers:{location:'http://localhost'}}),'redirect'],['health',()=>new Response(null,{status:503}),'http'],['homepage',()=>new Response('a'.repeat(524289)),'content']];
 for(const [check,response,expected] of cases){const result=await probe(check,async(url,init)=>{assert.equal(init.redirect,'manual');assert.ok(init.signal);return response();});assert.equal(result.reason,expected);}
 const times=[0,10001,10001];assert.equal((await probe('hardware',async()=>Response.json(hardware),()=>times.shift()??10001)).reason,'slow');
 const result=await probe('health',async()=>{throw Error('secret private content');});assert.equal(result.reason,'timeout_or_network');assert.ok(!JSON.stringify(result).includes('secret'));
});
