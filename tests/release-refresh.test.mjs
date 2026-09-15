import test from 'node:test';
import assert from 'node:assert/strict';
import {refreshReleaseBatch} from '../lib/release-refresh.ts';
import {makeItem} from '../lib/tracker.ts';
const catalog={checkedAt:1,platforms:[{id:6,name:'PC'}],dates:[{platform:6,region:'Worldwide',date:'2030-09-01',year:'2030',format:'YYYYMMDD',status:''}]};
const wish=(id,source='catalog')=>({...makeItem('game','Test '+id,false),catalogId:'igdb:'+id,platform:'PC',releaseSource:source,releaseStatus:'date',releaseDate:'2029-01-01',releaseCatalog:catalog});
test('batch postpones catalog dates but never requests or modifies manual, legacy, or owned dates',async()=>{
 const items=[wish(1),wish(2,'manual'),{...wish(3),releaseSource:undefined},{...wish(4),owned:true}];
 const calls=[];
 const result=await refreshReleaseBatch(items,()=>true,false,async id=>{calls.push(id);return catalog;});
 assert.deepEqual(calls,['igdb:1']);assert.equal(result.items[0].releaseDate,'2030-09-01');
 for(let i=1;i<items.length;i++)assert.equal(result.items[i],items[i]);
});
test('partial and total failures retain original saved dates and stop after three failures',async()=>{
 const items=[wish(1),wish(2),wish(3),wish(4),wish(5)];let calls=0;
 const result=await refreshReleaseBatch(items,()=>true,false,async()=>{if(++calls===1)return catalog;throw Error('offline');});
 assert.equal(calls,4);assert.equal(result.failed,3);assert.equal(result.items[0].releaseDate,'2030-09-01');
 for(let i=1;i<items.length;i++)assert.equal(result.items[i],items[i]);
 const failed=await refreshReleaseBatch(items,()=>true,false,async()=>{throw Error('timeout');});
 assert.equal(failed.updated,0);assert.deepEqual(failed.items,items);
});
test('a delayed refresh cannot replace data after account switch, signout, or intervening edits',async()=>{
 for(const reason of ['account switch','signout','edit','same account new session']){
  const items=[wish(1),wish(2)];let resolve;let generation=1;let calls=0;
  const pending=refreshReleaseBatch(items,()=>generation===1,false,()=>{calls++;return new Promise(r=>resolve=r);});
  generation++;resolve(catalog);const result=await pending;
  assert.equal(result.cancelled,true,reason);assert.equal(result.items,items);assert.equal(result.updated,0);assert.equal(calls,1);
 }
});
test('automatic refresh skips fresh metadata, bounds work, and deduplicates catalog requests',async()=>{
 const now=200000000;let calls=0;
 const items=[{...wish(90),releaseCatalog:{...catalog,checkedAt:now}},...Array.from({length:23},(_,i)=>wish(i+1)),wish(1)];
 const result=await refreshReleaseBatch(items,()=>true,true,async()=>{calls++;return catalog;},now);
 assert.equal(result.targets,20);assert.equal(calls,20);assert.equal(result.items[0],items[0]);
 calls=0;await refreshReleaseBatch([wish(1),wish(1)],()=>true,false,async()=>{calls++;return catalog;});assert.equal(calls,1);
});
