import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeHardware,normalizeHardwareRelease,normalizeHardwareRegion,hardwareCatalogEntry,validHardwareMetadata} from '../lib/igdb-hardware-map.ts';
import {HardwareCatalog,HARDWARE_RETENTION} from '../lib/igdb-hardware.ts';
import {seedCollection,validCollection,makeItem} from '../lib/tracker.ts';

const platform={id:130,name:'Nintendo Switch',versions:[173,503],platform_logo:606};
const version={id:173,name:'Initial version',platform_version_release_dates:[217],platform_logo:227};
const release={id:217,date:1488499200,y:2017,m:3,date_format:{format:'YYYYMMDD'},release_region:{region:'worldwide'}};
test('legacy collection round trip does not add IGDB IDs or change editions',()=>{
 const legacy=seedCollection();const before=JSON.stringify(legacy);
 const restored=JSON.parse(before);assert.ok(validCollection(restored));
 assert.equal(JSON.stringify(restored),before);
 for(const item of restored.items){assert.equal(item.igdbPlatformId,undefined);assert.equal(item.hardwareMetadata,undefined);}
});
test('new IGDB hardware preserves optional metadata without guessing edition or color',()=>{
 const metadata=normalizeHardware(platform,version,[release]);
 const entry=hardwareCatalogEntry(metadata);const item=makeItem('console',entry.title,true,entry);
 assert.equal(item.edition,'');assert.equal(item.color,'');
 assert.equal(item.catalogId,'igdb:platform-version:173');assert.notEqual(item.id,item.catalogId);
 const collection={...seedCollection(),items:[item]};
 assert.ok(validCollection(JSON.parse(JSON.stringify(collection))));
 assert.equal(item.releaseDate,''); // Metadata does not overwrite a user's chosen release date.
 assert.equal(item.hardwareMetadata,metadata);
 const legacy={...item,catalogId:'hw-switch',edition:'My edition',color:'My color'};
 assert.ok(validCollection({...collection,items:[legacy]}));assert.equal(legacy.catalogId,'hw-switch');
});
test('missing fields stay unknown; Initial version includes parent context',()=>{
 const data=normalizeHardware(platform,version,[release]);
 assert.equal(data.name,'Nintendo Switch — Initial version');
 assert.equal(data.logo,null);assert.equal(data.manufacturer,null);assert.ok(validHardwareMetadata(data));
 const generic=normalizeHardware({id:29,name:'Sega Mega Drive/Genesis'});
 assert.deepEqual(generic.releases,[]);assert.deepEqual(generic.versionIds,[]);assert.equal(generic.logo,null);
 assert.equal(normalizeHardware(platform,{id:503,name:'OLED Model'}).name,'OLED Model');
});
test('release normalization honors precision rather than placeholder timestamps',()=>{
 const raw={id:710,date:812505600,y:1995,m:10};
 for(const [format,precision,value] of [['YYYYMMDD','day','1995-10-01'],['YYYYMM','month','1995-10'],['YYYYMMMM','month','1995-10'],['YYYY','year','1995'],['YYYYQ2','quarter','1995-Q2'],['TBD','unknown',null],['unexpected','unknown',null]]){
  const r=normalizeHardwareRelease({...raw,date_format:{format}});assert.equal(r.precision,precision);assert.equal(r.value,value);
 }
 assert.equal(normalizeHardwareRelease(raw).value,null);
 assert.equal(normalizeHardwareRelease({...raw,m:13,date_format:{format:'YYYYMM'}}).value,null);
 assert.equal(normalizeHardwareRelease({...raw,date:NaN,date_format:{format:'YYYYMMDD'}}).value,null);
 assert.equal(normalizeHardwareRelease({...raw,y:2027,date_format:{format:'YYYYMMDD'}}).value,null);
});
test('region codes normalize without inventing missing regions',()=>{
 for(const input of ['north_america','North America','north-america'])assert.equal(normalizeHardwareRegion(input),'North America');
 assert.equal(normalizeHardwareRegion('new_zealand'),'New Zealand');assert.equal(normalizeHardwareRegion('WORLDWIDE'),'Worldwide');
 assert.equal(normalizeHardwareRegion(null),null);assert.equal(normalizeHardwareRegion(''),null);
});
test('relationships follow parent arrays, not reverse release links',()=>{
 const data=normalizeHardware(platform,version,[release,{...release,id:999}]);
 assert.deepEqual(data.releases.map(r=>r.id),[217]);
 assert.throws(()=>normalizeHardware(platform,{id:999,name:'Wrong version'}),/relationship/);
 const two=normalizeHardware(platform,{...version,platform_version_release_dates:[217,218]},[release,{...release,id:218}]);
 assert.equal(two.releases.length,2); // Same region is not a unique key.
});
test('IGDB images are generic assets and only match the requested logo',()=>{
 const data=normalizeHardware(platform,version,[],{id:227,image_id:'pl6b'});
 assert.equal(data.logo.kind,'generic-igdb-asset');assert.equal(data.logo.url,'https://images.igdb.com/igdb/image/upload/t_original/pl6b.jpg');
 assert.equal(normalizeHardware(platform,version,[],{id:606,image_id:'plgu'}).logo,null);
 assert.equal(normalizeHardware(platform,version,[],{id:227,image_id:'../bad'}).logo,null);
 assert.equal(validHardwareMetadata({...data,logo:{...data.logo,url:'https://example.test'}}),false);
});
function fixture(){
 let time=1000000000,fail=false;const cache=new Map(),calls=[];
 const query=async(endpoint,body)=>{calls.push([endpoint,body]);if(fail)throw new Error('Upstream failed');
  return endpoint==='platforms'?[platform]:endpoint==='platform_versions'?[version]:endpoint==='platform_version_release_dates'?[release]:[{id:227,image_id:'pl6b'}];};
 const service=new HardwareCatalog({get:async k=>cache.get(k),put:async(k,v)=>{cache.set(k,v);}},query,()=>time);
 return {service,cache,calls,advance:n=>{time+=n;},fail:()=>{fail=true;}};
}
test('hardware endpoints share cached metadata and follow release ID queries',async()=>{
 const f=fixture();const first=await f.service.load('',130,173);
 assert.deepEqual(f.calls.map(c=>c[0]),['platforms','platform_versions','platform_version_release_dates','platform_logos']);
 assert.match(f.calls[2][1],/where id = \(217\)/);assert.doesNotMatch(f.calls[2][1],/platform_version\s*=/);
 assert.equal(first.stale,false);assert.equal(first.results[0].releases[0].value,'2017-03-03');
 await f.service.load('',130,173);assert.equal(f.calls.length,4);
 f.advance(86400001);const fresh=await f.service.load('',130,173);assert.equal(f.calls.length,8);assert.ok(fresh.checkedAt>first.checkedAt);
});
test('failed refresh keeps stale metadata and original checkedAt without extending cache',async()=>{
 const f=fixture();const first=await f.service.load('',130,173);const snapshot=JSON.stringify([...f.cache]);
 f.advance(86400001);f.fail();const stale=await f.service.load('',130,173);
 assert.equal(stale.stale,true);assert.equal(stale.checkedAt,first.checkedAt);assert.deepEqual(stale.results,first.results);assert.equal(JSON.stringify([...f.cache]),snapshot);
 f.advance(HARDWARE_RETENTION);await assert.rejects(f.service.load('',130,173),/Upstream failed/);
});
test('uncached failures and incomplete release results are never cached as success',async()=>{
 const f=fixture();f.fail();await assert.rejects(f.service.load('',130,173));assert.equal(f.cache.size,0);
 let writes=0;const service=new HardwareCatalog({get:async()=>undefined,put:async()=>{writes++;}},async endpoint=>endpoint==='platforms'?[platform]:endpoint==='platform_versions'?[version]:[]);
 await assert.rejects(service.load('',130,173),/Incomplete hardware releases/);assert.equal(writes,0);
});
test('wrong platform-version pairing is rejected before querying a version',async()=>{
 const f=fixture();await assert.rejects(f.service.load('',130,999),/does not belong/);assert.equal(f.calls.length,1);assert.equal(f.cache.size,0);
});
test('identical concurrent hardware requests are coalesced',async()=>{
 const f=fixture();const [a,b]=await Promise.all([f.service.load('',130,173),f.service.load('',130,173)]);
 assert.deepEqual(a,b);assert.equal(f.calls.length,4);
});
test('platform search is quoted and does not invent version releases',async()=>{
 const f=fixture();const result=await f.service.load('Switch"; limit 500;');
 assert.ok(f.calls[0][1].includes('search '+JSON.stringify('Switch"; limit 500;')+'; limit 20;'));
 assert.deepEqual(result.results,[]); // Unrelated rows are not returned for an unmatched query.
 const matches=await f.service.load('Switch');
 assert.equal(matches.results[0].igdbPlatformVersionId,undefined);assert.deepEqual(matches.results[0].releases,[]);
 const count=f.calls.length;await f.service.load('Switch');assert.equal(f.calls.length,count);
 f.advance(3600001);await f.service.load('Switch');assert.ok(f.calls.length>count);
});
test('version listing is a bounded parent-linked query without release fan-out',async()=>{
 const calls=[];
 const service=new HardwareCatalog({get:async()=>undefined,put:async()=>{}},async(endpoint,body)=>{calls.push([endpoint,body]);return endpoint==='platforms'?[platform]:[{id:173,name:'Initial version'},{id:503,name:'OLED Model'}];});
 const result=await service.load('',130,undefined,true);
 assert.equal(calls.length,2);assert.match(calls[1][1],/id = \(173,503\)/);
 assert.deepEqual(result.results.map(r=>r.igdbPlatformVersionId),[173,503]);
 assert.equal(result.results[0].name,'Nintendo Switch — Initial version');assert.deepEqual(result.results[0].releases,[]);
});
