import {hardwareCatalogEntry,validHardwareMetadata,type HardwareMetadata,type HardwareRelease} from './igdb-hardware-map.ts';
import type {Item} from './tracker.ts';
export function hardwareAlreadyCollected(items:Item[],metadata:HardwareMetadata){
 const id=hardwareCatalogEntry(metadata).id;
 return items.some(item=>item.kind==='console'&&(item.catalogId===id||(item.igdbPlatformId===metadata.igdbPlatformId&&item.igdbPlatformVersionId===metadata.igdbPlatformVersionId)));
}
export function hardwareReleaseLabel(release:HardwareRelease){
 if(!release.value||release.precision==='unknown')return 'Unknown';
 if(release.precision==='month')return new Date(release.value+'-01T12:00:00Z').toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'});
 if(release.precision==='quarter'){const [year,quarter]=release.value.split('-');return `${quarter} ${year}`;}
 if(release.precision==='day')return new Date(release.value+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
 return release.value;
}
export async function readHardwareResponse(response:Response):Promise<{results:HardwareMetadata[];stale:boolean}>{
 const body=await response.json() as {results?:unknown;stale?:unknown}|null;
 if(!response.ok||!body||!Array.isArray(body.results)||!body.results.every(validHardwareMetadata)||typeof body.stale!=='boolean')throw new Error('Hardware search is unavailable. Try again.');
 return {results:body.results,stale:body.stale};
}
