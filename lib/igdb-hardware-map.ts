export type HardwareLogo = {id:number;imageId:string;url:string;kind:'generic-igdb-asset'};
export type HardwareRelease = {id:number;region:string|null;precision:'day'|'month'|'quarter'|'year'|'unknown';value:string|null};
export type HardwareMetadata = {
 source:'igdb';checkedAt:number;igdbPlatformId:number;igdbPlatformVersionId?:number;
 name:string;platformName:string;aliases?:string[];versionIds:number[];logo:HardwareLogo|null;
 manufacturer:string|null;releases:HardwareRelease[];
};
export type RawHardwarePlatform = {id:number;name?:string;abbreviation?:string;alternative_name?:string;versions?:number[];platform_logo?:number};
export type RawHardwareVersion = {id:number;name?:string;platform_logo?:number;main_manufacturer?:{company?:{name?:string}};platform_version_release_dates?:number[]};
export type RawHardwareRelease = {id:number;date?:number;y?:number;m?:number;date_format?:{format?:string};release_region?:{region?:string}};
export type RawHardwareLogo = {id:number;image_id?:string};
export const hardwareId=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>0&&Number(v)<=9999999999;
export const hardwareIds=(v:unknown):number[]=>Array.isArray(v)?[...new Set(v.filter(hardwareId))]:[];
const text=(v:unknown)=>typeof v==='string'&&v.trim()?v.trim():null;
export function normalizeHardwareRegion(value:unknown):string|null {
 const region=text(value)?.toLowerCase().replace(/[\s-]+/g,'_');
 if(!region)return null;
 const names:Record<string,string>={north_america:'North America',europe:'Europe',japan:'Japan',worldwide:'Worldwide',australia:'Australia',new_zealand:'New Zealand',china:'China',asia:'Asia',korea:'Korea',brazil:'Brazil'};
 return names[region]??region;
}
export function normalizeHardwareRelease(raw:RawHardwareRelease):HardwareRelease {
 const result:HardwareRelease={id:raw.id,region:normalizeHardwareRegion(raw.release_region?.region),precision:'unknown',value:null};
 const format=raw.date_format?.format?.toUpperCase().replace(/[^A-Z0-9]/g,'');
 const year=Number.isInteger(raw.y)&&raw.y!>=1000&&raw.y!<=9999?String(raw.y):null;
 if(['YYYYMMDD','YYYYMMMMDD'].includes(format??'')&&Number.isFinite(raw.date)&&Math.abs(raw.date!)<253402300800){
  const date=new Date(raw.date!*1000).toISOString().slice(0,10);
  if(/^\d{4}-\d{2}-\d{2}$/.test(date)&&(!year||date.startsWith(year+'-')))return {...result,precision:'day',value:date};
 }
 if(format==='YYYY'&&year)return {...result,precision:'year',value:year};
 if(['YYYYMM','YYYYMMMM'].includes(format??'')&&year&&Number.isInteger(raw.m)&&raw.m!>=1&&raw.m!<=12)return {...result,precision:'month',value:`${year}-${String(raw.m).padStart(2,'0')}`};
 if(/^YYYYQ[1-4]$/.test(format??'')&&year)return {...result,precision:'quarter',value:`${year}-Q${format!.slice(-1)}`};
 return result;
}
export function normalizeHardware(platform:RawHardwarePlatform,version?:RawHardwareVersion,releases:RawHardwareRelease[]=[],logo?:RawHardwareLogo,now=Date.now()):HardwareMetadata {
 if(!hardwareId(platform.id)||!text(platform.name))throw new Error('Invalid hardware platform');
 const versionIds=hardwareIds(platform.versions);
 if(version&&(!hardwareId(version.id)||!versionIds.includes(version.id)||!text(version.name)))throw new Error('Invalid hardware version relationship');
 const platformName=platform.name!.trim();
 const name=version?(version.name!.trim().toLowerCase()==='initial version'?`${platformName} — Initial version`:version.name!.trim()):platformName;
 const logoId=version?version.platform_logo:platform.platform_logo;
 const image=logo&&logo.id===logoId&&/^[a-zA-Z0-9_]+$/.test(logo.image_id??'')?{id:logo.id,imageId:logo.image_id!,url:`https://images.igdb.com/igdb/image/upload/t_original/${logo.image_id}.jpg`,kind:'generic-igdb-asset' as const}:null;
 const releaseIds=hardwareIds(version?.platform_version_release_dates);
 return {source:'igdb',checkedAt:now,igdbPlatformId:platform.id,...(version?{igdbPlatformVersionId:version.id}:{}),name,platformName,aliases:[...new Set([text(platform.abbreviation),text(platform.alternative_name)].filter((v):v is string=>!!v))],versionIds,logo:image,manufacturer:text(version?.main_manufacturer?.company?.name),releases:[...new Map(releases.filter(r=>releaseIds.includes(r.id)).map(r=>[r.id,normalizeHardwareRelease(r)])).values()]};
}
export function hardwareCatalogEntry(metadata:HardwareMetadata) {
 return {id:metadata.igdbPlatformVersionId?`igdb:platform-version:${metadata.igdbPlatformVersionId}`:`igdb:platform:${metadata.igdbPlatformId}`,kind:'console' as const,title:metadata.name,platform:metadata.platformName,subtitle:metadata.platformName,igdbPlatformId:metadata.igdbPlatformId,...(metadata.igdbPlatformVersionId?{igdbPlatformVersionId:metadata.igdbPlatformVersionId}:{}),hardwareMetadata:metadata};
}
export function validHardwareMetadata(value:unknown):value is HardwareMetadata {
 if(!value||typeof value!=='object')return false;
 const v=value as HardwareMetadata;
 const short=(s:unknown):s is string=>typeof s==='string'&&s.length<=500;
 return (v.aliases===undefined||Array.isArray(v.aliases)&&v.aliases.length<=10&&v.aliases.every(short))&&v.source==='igdb'&&Number.isFinite(v.checkedAt)&&v.checkedAt>0&&hardwareId(v.igdbPlatformId)&&(v.igdbPlatformVersionId===undefined||hardwareId(v.igdbPlatformVersionId))&&short(v.name)&&short(v.platformName)&&Array.isArray(v.versionIds)&&v.versionIds.length<=1000&&v.versionIds.every(hardwareId)&&(v.igdbPlatformVersionId===undefined||v.versionIds.includes(v.igdbPlatformVersionId))&&(v.manufacturer===null||short(v.manufacturer))&&(v.logo===null||!!v.logo&&hardwareId(v.logo.id)&&short(v.logo.imageId)&&/^[a-zA-Z0-9_]+$/.test(v.logo.imageId)&&v.logo.kind==='generic-igdb-asset'&&v.logo.url===`https://images.igdb.com/igdb/image/upload/t_original/${v.logo.imageId}.jpg`)&&Array.isArray(v.releases)&&v.releases.length<=1000&&v.releases.every(r=>{
  if(!r||!hardwareId(r.id)||!(r.region===null||short(r.region)))return false;
  if(r.precision==='unknown')return r.value===null;
  if(typeof r.value!=='string')return false;
  if(r.precision==='year')return /^\d{4}$/.test(r.value);
  if(r.precision==='month')return /^\d{4}-(0[1-9]|1[0-2])$/.test(r.value);
  if(r.precision==='quarter')return /^\d{4}-Q[1-4]$/.test(r.value);
  return r.precision==='day'&&/^\d{4}-\d{2}-\d{2}$/.test(r.value)&&Number.isFinite(Date.parse(r.value+'T00:00:00Z'))&&new Date(r.value+'T00:00:00Z').toISOString().slice(0,10)===r.value;
 });
}
