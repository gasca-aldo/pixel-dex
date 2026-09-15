import test from 'node:test';
import assert from 'node:assert/strict';
import {createHealthCheck,observeService} from '../lib/service-health.ts';
const req = (method='GET') => new Request('https://pixel.example/api/health',{method});
const config={url:'https://provider.example',key:'public-key'};
test('health checks coalesce, cache briefly, expire, and never expose provider data',async()=>{
 let calls=0,time=0;
 const check=createHealthCheck(async(url,init)=>{calls++;assert.equal(url,config.url+'/auth/v1/settings');assert.ok(init.signal);assert.equal(init.redirect,'manual');return Response.json({external:{email:true},secret:'do not expose'});},()=>time);
 const results=await Promise.all([check(req(),config),check(req(),config)]);
 assert.equal(calls,1);assert.equal(results[0].status,200);assert.deepEqual(await results[0].json(),{service:'pixel-dex',status:'ok'});
 assert.equal(results[1].headers.get('cache-control'),'no-store');
 assert.equal(await (await check(req('HEAD'),config)).text(),'');assert.equal(calls,1);
 time=30001;await check(req(),config);assert.equal(calls,2);
 assert.equal((await check(req('POST'),config)).status,405);assert.equal(calls,2);
});
test('provider failure, invalid responses, and missing configuration report unavailable',async()=>{
 for(const fetcher of [async()=>{throw Error('secret provider error');},async()=>new Response('bad JSON'),async()=>Response.json({external:{email:true}},{status:500}),async()=>Response.json({})]){
  const response=await createHealthCheck(fetcher)(req(),config);assert.equal(response.status,503);assert.deepEqual(await response.json(),{service:'pixel-dex',status:'unavailable'});
 }
 assert.equal((await createHealthCheck(async()=>assert.fail('must not fetch'))(req(),{})).status,503);
});
test('failure logs contain only fixed categories and status, never URL, body, tokens or exceptions',async()=>{
 const records=[];
 const request=new Request('https://pixel.example/p/private-user/private-list?code=secret',{headers:{authorization:'Bearer secret'}});
 const response=await observeService(request,async()=>{throw Error('password secret');},r=>records.push(r));
 assert.equal(response.status,503);assert.deepEqual(records,[{event:'pixel_dex_service_failure',area:'sharing',status:503}]);assert.ok(!(await response.text()).includes('secret'));
 await observeService(req(),async()=>new Response(null,{status:429}),r=>records.push(r));assert.equal(records.length,1);
 await observeService(req(),async()=>new Response(null,{status:503}),r=>records.push(r));assert.equal(records[1].area,'health');
});
