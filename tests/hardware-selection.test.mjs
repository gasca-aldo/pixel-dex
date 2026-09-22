import test from 'node:test';
import assert from 'node:assert/strict';
import {hardwareAlreadyCollected,hardwareReleaseLabel,readHardwareResponse} from '../lib/hardware-selection.ts';
import {normalizeHardware,hardwareCatalogEntry} from '../lib/igdb-hardware-map.ts';
import {makeItem,seedCollection,validCollection} from '../lib/tracker.ts';
const parent={id:130,name:'Nintendo Switch',versions:[173,503]};
test('generic and specific versions stay distinct; another unit has a new item ID',()=>{
 const generic=normalizeHardware(parent),specific=normalizeHardware(parent,{id:173,name:'Initial version'});
 const entry=hardwareCatalogEntry(specific),a=makeItem('console',entry.title,true,entry),b=makeItem('console',entry.title,true,entry);
 assert.equal(hardwareAlreadyCollected([a],specific),true);assert.equal(hardwareAlreadyCollected([a],generic),false);
 assert.notEqual(a.id,b.id);assert.equal(a.catalogId,b.catalogId);assert.equal(a.edition,'');assert.equal(b.color,'');
 assert.ok(validCollection({...seedCollection(),items:[a,b]}));assert.equal(entry.title,'Nintendo Switch — Initial version');
});
test('legacy matching uses verified IDs only and preserves custom details',()=>{
 const metadata=normalizeHardware(parent,{id:503,name:'OLED Model'});
 const legacy={...makeItem('console','OLED Model'),catalogId:'hw-existing',edition:'My edition',color:'My color',notes:'Keep these'};
 assert.equal(hardwareAlreadyCollected([legacy],metadata),false);
 assert.equal(hardwareAlreadyCollected([{...legacy,igdbPlatformId:130,igdbPlatformVersionId:503}],metadata),true);
 assert.equal(legacy.catalogId,'hw-existing');assert.equal(legacy.edition,'My edition');assert.equal(legacy.notes,'Keep these');
 assert.equal(makeItem('console','Custom hardware').edition,'');
});
test('release labels retain month quarter year and unknown precision',()=>{
 for(const [precision,value,label] of [['month','1995-10','October 1995'],['quarter','2027-Q2','Q2 2027'],['year','1993','1993'],['day','2021-10-08','Oct 8, 2021'],['unknown',null,'Unknown']])assert.equal(hardwareReleaseLabel({id:1,region:null,precision,value}),label);
});
test('hardware responses validate metadata and retain stale warnings',async()=>{
 const metadata=normalizeHardware(parent);
 assert.deepEqual(await readHardwareResponse(Response.json({results:[metadata],stale:true})),{results:[metadata],stale:true});
 for(const response of [Response.json({results:[{}],stale:false}),Response.json({results:[],stale:false},{status:503}),Response.json(null),new Response('<html>error</html>')])await assert.rejects(readHardwareResponse(response));
});
