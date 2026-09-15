export const releaseRegions=['North America','Europe','Japan','Worldwide / earliest available'] as const;
export type ReleaseRegion=typeof releaseRegions[number];
export type ReleaseCatalog={checkedAt:number;platforms:{id:number;name:string}[];dates:{platform?:number;region:string;date:string;year:string;format:string;status:string}[]};
type ReleaseItem={platform:string;releaseDate:string;releaseStatus?:'date'|'year'|'tba'|'released';releaseSource?:'catalog'|'manual';releaseRegion?:ReleaseRegion;releaseCatalog?:ReleaseCatalog};
const validDate=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const key=(s:string)=>s.toLowerCase().replace(/[^a-z]/g,'');
export function validReleaseCatalog(value:unknown):value is ReleaseCatalog {
 if(!value||typeof value!=='object')return false;
 const v=value as ReleaseCatalog;
 return Number.isFinite(v.checkedAt)&&v.checkedAt>0&&Array.isArray(v.platforms)&&v.platforms.length<=200&&v.platforms.every(p=>p&&Number.isSafeInteger(p.id)&&typeof p.name==='string'&&p.name.length<200)&&Array.isArray(v.dates)&&v.dates.length<=1000&&v.dates.every(d=>d&&(d.platform===undefined||Number.isSafeInteger(d.platform))&&['region','date','year','format','status'].every(k=>typeof d[k as keyof typeof d]==='string')&&(!d.date||validDate(d.date))&&(!d.year||/^\d{4}$/.test(d.year)));
}
export function applyCatalogRelease<T extends ReleaseItem>(item:T):T {
 if(item.releaseSource!=='catalog'||!item.releaseCatalog)return item;
 const catalog=item.releaseCatalog;
 const platform=catalog.platforms.find(p=>p.name===item.platform);
 let dates=catalog.dates.filter(d=>platform?d.platform===platform.id:!catalog.platforms.length&&d.platform===undefined);
 dates=dates.filter(d=>!/(earlyaccess|alpha|beta|cancel|delist)/.test(key(d.status)));
 const region=item.releaseRegion??'Worldwide / earliest available';
 if(region!=='Worldwide / earliest available'){
  const local=dates.filter(d=>key(d.region)===key(region));
  dates=local.length?local:dates.filter(d=>key(d.region)==='worldwide');
 }
 // Prefer a full release over early access, beta, or cancelled records.
 dates=dates.filter(d=>!/(earlyaccess|alpha|beta|cancel|delist)/.test(key(d.status)));
 dates.sort((a,b)=>(a.date||a.year||'9999').localeCompare(b.date||b.year||'9999'));
 const first=dates[0];
 const year=first && !['TBD','TBA'].includes(first.format.toUpperCase()) ? first.year : '';
 const exact=first&&['YYYYMMMMDD','YYYYMMDD'].includes(first.format.toUpperCase().replace(/[^A-Z]/g,''))&&validDate(first.date);
 return {...item,releaseDate:exact?first!.date:year,releaseStatus:exact?'date':year?'year':'tba'};
}
export async function fetchReleaseCatalog(id:string,signal?:AbortSignal):Promise<ReleaseCatalog> {
 if(!/^igdb:[1-9]\d{0,9}$/.test(id))throw new Error('This entry is not linked to IGDB.');
 const response=await fetch('/api/catalog/releases/'+id.slice(5),{signal:signal??AbortSignal.timeout(12000),cache:'no-store'});
 let data;try{data=await response.json();}catch{throw new Error('Unable to refresh release dates. Try again later.');}
 if(!response.ok||!validReleaseCatalog(data))throw new Error('Unable to refresh release dates. Your saved date has been kept.');
 return data;
}
