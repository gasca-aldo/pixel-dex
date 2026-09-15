import test from 'node:test';
import assert from 'node:assert/strict';
import {applyCatalogRelease,catalogReleaseWindow,validReleaseCatalog,fetchReleaseCatalog} from '../lib/catalog-releases.ts';
import {mapGame,releaseCatalogFor} from '../lib/igdb-map.ts';
import {makeItem,validCollection,seedCollection} from '../lib/tracker.ts';
const raw={id:90,name:'Example',platforms:[{id:6,name:'PC (Microsoft Windows)'},{id:167,name:'PlayStation 5'}],release_dates:[
 {platform:6,date:1893456000,y:2030,date_format:{format:'YYYY-MM-DD'},release_region:{region:'North America'}},
 {platform:167,date:1924992000,y:2031,date_format:{format:'YYYY-MM-DD'},release_region:{region:'North America'}},
 {platform:6,date:1956528000,y:2032,date_format:{format:'YYYY-MM-DD'},release_region:{region:'Japan'}},
]};
test('explicit month metadata works without a placeholder day and validates imported months',()=>{
 const entry=mapGame({...raw,release_dates:[{platform:6,m:2,y:2028,date_format:{format:'YYYYMMMM'}}]});
 assert.deepEqual(catalogReleaseWindow(entry),{kind:'month',key:'2028-02',label:'February 2028',end:'2028-02-29'});
 assert.equal(validReleaseCatalog(entry.releaseCatalog),true);
 const bad={...entry.releaseCatalog,dates:[{...entry.releaseCatalog.dates[0],month:13}]};
 assert.equal(validReleaseCatalog(bad),false);
});
test('platform and region changes recalculate dates without changing ownership or notes',()=>{
 const entry=mapGame(raw),item={...makeItem('game',entry.title,false,entry),notes:'keep me'};
 assert.equal(item.releaseDate,'2030-01-01');
 assert.equal(applyCatalogRelease({...item,platform:'PlayStation 5'}).releaseDate,'2031-01-01');
 assert.equal(applyCatalogRelease({...item,releaseRegion:'Japan'}).releaseDate,'2032-01-01');
 assert.equal(applyCatalogRelease({...item,platform:'Xbox'}).releaseStatus,'tba');
 assert.equal(applyCatalogRelease({...item,releaseRegion:'Europe'}).releaseStatus,'tba');
 assert.equal(applyCatalogRelease(item).notes,'keep me');assert.equal(item.owned,false);
 assert.ok(validCollection({...seedCollection(),items:[JSON.parse(JSON.stringify(item))]}));
});
test('refresh handles postponement and withdrawal to TBA, while manual and legacy dates stay intact',()=>{
 const item=mapGame(raw);
 const postponed=releaseCatalogFor({...raw,release_dates:[{...raw.release_dates[0],date:1988150400,y:2033}]});
 assert.equal(applyCatalogRelease({...item,releaseCatalog:postponed}).releaseDate,'2033-01-01');
 const withdrawn=releaseCatalogFor({...raw,release_dates:[{...raw.release_dates[0],date:undefined,date_format:{format:'TBD'}}]});
 assert.equal(applyCatalogRelease({...item,releaseCatalog:withdrawn}).releaseStatus,'tba');
 for(const source of [undefined,'manual'])assert.equal(applyCatalogRelease({...item,releaseSource:source,releaseCatalog:postponed}).releaseDate,item.releaseDate);
});
test('worldwide fallback does not select beta or early access and unknown regions are not assumed local',()=>{
 const catalog=releaseCatalogFor({...raw,release_dates:[{...raw.release_dates[0],status:{name:'Early Access'}},{...raw.release_dates[1],platform:6,release_region:{region:'Worldwide'}}]});
 assert.equal(applyCatalogRelease({...mapGame(raw),releaseRegion:'North America',releaseCatalog:catalog}).releaseDate,'2031-01-01');
 const unknown=releaseCatalogFor({...raw,release_dates:[{...raw.release_dates[0],release_region:undefined}]});
 assert.equal(applyCatalogRelease({...mapGame(raw),releaseRegion:'North America',releaseCatalog:unknown}).releaseStatus,'tba');
 assert.equal(applyCatalogRelease({...mapGame(raw),releaseCatalog:unknown,releaseRegion:'Worldwide / earliest available'}).releaseDate,'2030-01-01');
});
test('bad refresh responses fail without returning replacement dates',async()=>{
 const previous=globalThis.fetch;
 try{
  for(const response of [new Response('<html>fail</html>',{status:503}),Response.json({error:'fail'},{status:429}),Response.json({platforms:[],dates:[]})]){
   globalThis.fetch=async()=>response;await assert.rejects(fetchReleaseCatalog('igdb:90'),/Unable to refresh/);
  }
 }finally{globalThis.fetch=previous;}
 assert.equal(validReleaseCatalog({checkedAt:1,platforms:[],dates:[null]}),false);
});

test('unmatched platforms return valid TBA records, not undefined dates',()=>{
 const entry=mapGame(raw);
 const item=applyCatalogRelease({...makeItem('game',entry.title,false,entry),platform:'Unannounced platform'});
 assert.equal(item.releaseDate,'');assert.equal(item.releaseStatus,'tba');
 assert.ok(validCollection({...seedCollection(),items:[item]}));
});
test('malformed calendar dates are rejected during import',()=>{
 const catalog=releaseCatalogFor(raw);
 assert.equal(validReleaseCatalog({...catalog,dates:[{...catalog.dates[0],date:'2030-02-30'}]}),false);
});
