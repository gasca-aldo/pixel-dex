import {applyCatalogRelease,fetchReleaseCatalog} from './catalog-releases.ts';
import type {Item} from './tracker.ts';

// The caller pins the library snapshot AND auth generation for the whole batch.
export async function refreshReleaseBatch(items:Item[],isCurrent:()=>boolean,automatic=false,fetchCatalog=fetchReleaseCatalog,now=Date.now()) {
 const targets=items.filter(i=>!i.owned&&i.kind==='game'&&i.releaseSource==='catalog'&&i.catalogId?.startsWith('igdb:')&&(!automatic||!i.releaseCatalog||now-i.releaseCatalog.checkedAt>86400000)).sort((a,b)=>(a.releaseCatalog?.checkedAt??0)-(b.releaseCatalog?.checkedAt??0)).slice(0,20);
 const refreshed=new Map<string,Awaited<ReturnType<typeof fetchReleaseCatalog>>>();
 let failed=0;
 for(const target of targets){
  if(!isCurrent())return {cancelled:true,items,failed,updated:0,targets:targets.length};
  try{if(!refreshed.has(target.catalogId!))refreshed.set(target.catalogId!,await fetchCatalog(target.catalogId!));}
  catch{failed++;if(failed>=3)break;}
 }
 if(!isCurrent())return {cancelled:true,items,failed,updated:0,targets:targets.length};
 return {cancelled:false,failed,updated:refreshed.size,targets:targets.length,items:items.map(i=>targets.includes(i)&&refreshed.has(i.catalogId!)?applyCatalogRelease({...i,releaseCatalog:refreshed.get(i.catalogId!)}):i)};
}
