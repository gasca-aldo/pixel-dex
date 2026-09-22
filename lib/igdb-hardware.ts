import {hardwareId,hardwareIds,normalizeHardware,validHardwareMetadata,type HardwareMetadata,type RawHardwarePlatform,type RawHardwareVersion,type RawHardwareRelease,type RawHardwareLogo} from './igdb-hardware-map.ts';
import {rankHardware} from './hardware-ranking.ts';
export type HardwareEndpoint='platforms'|'platform_versions'|'platform_version_release_dates'|'platform_logos';
export type HardwareQuery=<T>(endpoint:HardwareEndpoint,body:string)=>Promise<T[]>;
type Result={results:HardwareMetadata[];checkedAt:number;stale:boolean};
type Entry={until:number;body:Result};
type Store={get:(key:string)=>Promise<Entry|undefined>;put:(key:string,value:Entry)=>Promise<void>};
const DAY=86400000;
export const HARDWARE_RETENTION=7*DAY;
// Uses the same Durable Object storage and upstream request queue as game queries.
export class HardwareCatalog {
 private pending=new Map<string,Promise<Result>>();
 private store:Store;
 private query:HardwareQuery;
 private now:()=>number;
 constructor(store:Store,query:HardwareQuery,now=Date.now){this.store=store;this.query=query;this.now=now;}
 async load(search:string,platformId?:number,versionId?:number,listVersions=false):Promise<Result> {
  if(platformId!==undefined&&!hardwareId(platformId)||versionId!==undefined&&(!hardwareId(versionId)||!platformId))throw new Error('Invalid hardware ID');
  search=search.trim();
  if(!platformId&&(search.length<2||search.length>120))throw new Error('Invalid hardware search');
  const key='hardware:v2:'+(platformId?`${platformId}:${listVersions?'versions':versionId??'platform'}`:`search:${search.toLowerCase()}`);
  const existing=this.pending.get(key);if(existing)return existing;
  const task=this.cached(key,platformId?DAY:3600000,()=>this.fetch(search,platformId,versionId,listVersions));
  this.pending.set(key,task);
  try{return await task;}finally{if(this.pending.get(key)===task)this.pending.delete(key);}
 }
 private async cached(key:string,ttl:number,fetch:()=>Promise<HardwareMetadata[]>):Promise<Result>{
  const cached=await this.store.get(key);
  if(cached&&cached.until>this.now())return cached.body;
  try{
   const results=await fetch();
   if(!results.every(validHardwareMetadata))throw new Error('Invalid hardware metadata');
   const body={results,checkedAt:this.now(),stale:false};
   await this.store.put(key,{until:this.now()+ttl,body});return body;
  }catch(error){
   if(cached&&this.now()-cached.body.checkedAt<HARDWARE_RETENTION)return {...cached.body,stale:true};
   throw error;
  }
 }
 private async fetch(search:string,platformId?:number,versionId?:number,listVersions=false):Promise<HardwareMetadata[]>{
  const fields='fields id,name,abbreviation,alternative_name,versions,platform_logo; ';
  let platforms=await this.query<RawHardwarePlatform>('platforms',`${fields}${platformId?`where id = ${platformId}; limit 1;`:`search ${JSON.stringify(search)}; limit 20;`}`);
  if(!Array.isArray(platforms))throw new Error('Invalid platforms response');
  if(!platformId){
   // A revision name may not match a platform. Discover its parent using a bounded prefix search.
   const prefix=search.split(/\s+/)[0];
   if((prefix!==search||!platforms.length)&&prefix.length>=2){
    const term=JSON.stringify(prefix);
    const parents=await this.query<RawHardwarePlatform>('platforms',`${fields}where name ~ *${term}* | abbreviation ~ *${term}* | alternative_name ~ *${term}*; limit 50;`);
    platforms=[...new Map([...platforms,...parents].map(p=>[p.id,p])).values()];
   }
   const candidates=platforms.map(p=>normalizeHardware(p));
   const parentMatches=[...new Map([...rankHardware(candidates,search),...rankHardware(candidates,prefix)].map(p=>[p.igdbPlatformId,p])).values()].slice(0,10);
   const parents=platforms.filter(p=>parentMatches.some(m=>m.igdbPlatformId===p.id));
   const ids=hardwareIds(parents.flatMap(p=>p.versions??[])).slice(0,500);
   const versions=ids.length?await this.query<RawHardwareVersion>('platform_versions',`fields id,name,platform_logo; where id = (${ids.join(',')}); limit 500;`):[];
   const rows=platforms.map(p=>({p,v:undefined as RawHardwareVersion|undefined}));
   for(const p of parents)for(const v of versions)if(hardwareIds(p.versions).includes(v.id))rows.push({p,v});
   const ranked=rankHardware(rows.map(({p,v})=>normalizeHardware(p,v,[],undefined,this.now())),search).slice(0,20);
   const chosen=ranked.map(m=>rows.find(({p,v})=>p.id===m.igdbPlatformId&&v?.id===m.igdbPlatformVersionId)!);
   const logoIds=hardwareIds(chosen.map(({p,v})=>v?v.platform_logo:p.platform_logo));
   const logos=logoIds.length?await this.query<RawHardwareLogo>('platform_logos',`fields id,image_id; where id = (${logoIds.join(',')}); limit 500;`):[];
   return chosen.map(({p,v})=>normalizeHardware(p,v,[],logos.find(l=>l.id===(v?v.platform_logo:p.platform_logo)),this.now()));
  }
  const platform=platforms.find(p=>p.id===platformId);if(!platform)throw new Error('Hardware unavailable');
  if(listVersions){
   const ids=hardwareIds(platform.versions);if(ids.length>500)throw new Error('Too many hardware versions');
   if(!ids.length)return [];
   const versions=await this.query<RawHardwareVersion>('platform_versions',`fields id,name; where id = (${ids.join(',')}); limit 500;`);
   if(ids.some(id=>!versions.some(v=>v.id===id)))throw new Error('Incomplete hardware versions');
   return versions.filter(v=>ids.includes(v.id)).map(v=>normalizeHardware(platform,v,[],undefined,this.now()));
  }
  let version:RawHardwareVersion|undefined;
  let releases:RawHardwareRelease[]=[];
  if(versionId){
   if(!hardwareIds(platform.versions).includes(versionId))throw new Error('Version does not belong to this platform');
   const versions=await this.query<RawHardwareVersion>('platform_versions',`fields id,name,platform_logo,main_manufacturer.company.name,platform_version_release_dates; where id = ${versionId}; limit 1;`);
   version=versions.find(v=>v.id===versionId);if(!version)throw new Error('Hardware version unavailable');
   const ids=hardwareIds(version.platform_version_release_dates);
   if(ids.length>1000)throw new Error('Too many hardware releases');
   for(let offset=0;offset<ids.length;offset+=500){
    const batch=ids.slice(offset,offset+500);
    const rows=await this.query<RawHardwareRelease>('platform_version_release_dates',`fields id,date,y,m,date_format.format,release_region.region; where id = (${batch.join(',')}); limit 500;`);
    if(batch.some(id=>!rows.some(r=>r.id===id)))throw new Error('Incomplete hardware releases');
    releases.push(...rows);
   }
  }
  const logoId=version?version.platform_logo:platform.platform_logo;
  let logo:RawHardwareLogo|undefined;
  if(hardwareId(logoId)){
   const logos=await this.query<RawHardwareLogo>('platform_logos',`fields id,image_id; where id = ${logoId}; limit 1;`);
   logo=logos.find(l=>l.id===logoId);
  }
  return [normalizeHardware(platform,version,releases,logo,this.now())];
 }
}
