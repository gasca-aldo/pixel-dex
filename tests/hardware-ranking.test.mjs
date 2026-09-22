import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeHardware,validHardwareMetadata} from '../lib/igdb-hardware-map.ts';
import {rankHardware,hardwareMatchScore} from '../lib/hardware-ranking.ts';
import {HardwareCatalog} from '../lib/igdb-hardware.ts';
const platforms=[
 {id:130,name:'Nintendo Switch',abbreviation:'Switch',alternative_name:'NX',versions:[503]},
 {id:48,name:'PlayStation 4',abbreviation:'PS4',versions:[178,179]},
 {id:12,name:'Xbox 360',abbreviation:'X360'},
 {id:29,name:'Sega Mega Drive/Genesis',alternative_name:'Sega Genesis'},
];
const versions=[{id:503,name:'OLED Model',platform_logo:227},{id:178,name:'PlayStation 4 Slim'},{id:179,name:'PlayStation 4 Pro'}];
const entries=platforms.flatMap(p=>[normalizeHardware(p),...versions.filter(v=>p.versions?.includes(v.id)).map(v=>normalizeHardware(p,v))]);
test('common hardware searches rank the relevant platform or revision first',()=>{
 for(const [q,id,version] of [['Switch',130],['Nintendo Switch',130],['Switch OLED',130,503],['PS4',48],['PlayStation 4',48],['PS4 Slim',48,178],['PS4 Pro',48,179],['Xbox 360',12],['Genesis',29],['Mega Drive',29]]){
  const first=rankHardware(entries,q)[0];assert.equal(first?.igdbPlatformId,id,q);assert.equal(first?.igdbPlatformVersionId,version,q);
 }
});
test('exact canonical names rank above aliases, then partial matches; duplicates collapse',()=>{
 const exact=normalizeHardware({id:1,name:'Switch'}),alias=entries[0],partial=normalizeHardware({id:2,name:'Switch accessory'});
 assert.deepEqual(rankHardware([partial,alias,exact,exact],'Switch').map(r=>r.igdbPlatformId),[1,130,2]);
 assert.equal(hardwareMatchScore(exact,'switch'),300);assert.equal(hardwareMatchScore(alias,'SWITCH'),200);
 assert.deepEqual(rankHardware(entries,'Unrelated hardware'),[]);
});
test('optional aliases preserve old metadata and reject invalid types',()=>{
 const legacy={...entries[0]};delete legacy.aliases;assert.ok(validHardwareMetadata(legacy));
 assert.deepEqual(entries[0].aliases,['Switch','NX']);
 assert.equal(validHardwareMetadata({...legacy,aliases:[42]}),false);
});
test('direct version matches rank above matches only through the parent context',()=>{
 const p={...platforms[3],versions:[64,623]};
 const direct=normalizeHardware(p,{id:64,name:p.name}),weak=normalizeHardware(p,{id:623,name:'EZ Games Video Game System'});
 assert.equal(rankHardware([weak,direct],'Genesis')[0].igdbPlatformVersionId,64);
});
test('an empty upstream search falls back to quoted name and IGDB alias filters',async()=>{
 const calls=[];
 const service=new HardwareCatalog({get:async()=>undefined,put:async()=>{}},async(endpoint,body)=>{
  calls.push(body);return body.includes('search ')?[]:[platforms[3]];
 });
 const data=await service.load('Genesis');assert.equal(data.results[0].igdbPlatformId,29);
 assert.match(calls[1],/name ~ \*"Genesis"\*/);assert.match(calls[1],/alternative_name/);
});
test('revision search uses parent IDs, batches logos, and caches the ranked response',async()=>{
 const cache=new Map(),calls=[];
 const service=new HardwareCatalog({get:async k=>cache.get(k),put:async(k,v)=>cache.set(k,v)},async(endpoint,body)=>{
  calls.push([endpoint,body]);
  if(endpoint==='platforms')return body.includes('"Switch OLED"')?[]:[platforms[0]];
  if(endpoint==='platform_versions')return [versions[0],{id:999,name:'Unrelated'}];
  return [{id:227,image_id:'pl6b'}];
 });
 const data=await service.load('Switch OLED');
 assert.equal(data.results[0].igdbPlatformVersionId,503);assert.equal(data.results[0].platformName,'Nintendo Switch');
 assert.equal(data.results[0].logo.kind,'generic-igdb-asset');assert.deepEqual(data.results[0].releases,[]);
 assert.equal(calls.length,4);assert.match(calls[2][1],/id = \(503\)/);
 await service.load('Switch OLED');assert.equal(calls.length,4);
});
