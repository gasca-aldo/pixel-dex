import {applyCatalogRelease,type ReleaseCatalog} from './catalog-releases.ts';
export type RawGame = {id:number;name:string;collections?:number[];remakes?:number[];remasters?:number[];ports?:number[];first_release_date?:number;game_type?:{type:string};keywords?:{name:string}[];cover?:{image_id:string};platforms?:{id?:number;name:string}[];release_dates?:{platform?:number;m?:number;date?:number;date_format?:{format:string};y?:number;release_region?:{region:string};status?:{name:string}}[]};
export function releaseCatalogFor(game:RawGame):ReleaseCatalog {
 return {checkedAt:Date.now(),platforms:(game.platforms??[]).filter(p=>Number.isSafeInteger(p.id)).map(p=>({id:p.id!,name:p.name==='PC (Microsoft Windows)'?'PC':p.name})),dates:(game.release_dates??[]).map(d=>({platform:d.platform,...(Number.isInteger(d.m)&&d.m!>=1&&d.m!<=12?{month:d.m}:{}),region:d.release_region?.region??'',date:d.date&&Number.isFinite(d.date)&&Math.abs(d.date)<253402300800?new Date(d.date*1000).toISOString().slice(0,10):'',year:d.y&&d.y>=1900&&d.y<=9999?String(d.y):'',format:d.date_format?.format??'',status:d.status?.name??''}))};
}
export function mapGame(game:RawGame) {
 const platform=game.platforms?.find(p=>p.name==='PC (Microsoft Windows)')??game.platforms?.[0];
 const releaseCatalog=releaseCatalogFor(game);
 return applyCatalogRelease({id:`igdb:${game.id}`,title:game.name,kind:'game' as const,platform:platform?.name==='PC (Microsoft Windows)'?'PC':platform?.name??'',subtitle:game.platforms?.map(p=>p.name).join(' · ')||'IGDB',releaseDate:'',releaseStatus:'tba' as 'date'|'year'|'tba',releaseSource:'catalog' as const,releaseRegion:'Worldwide / earliest available' as const,releaseCatalog});
}
export const gameFields='name,collections,remakes,remasters,ports,first_release_date,game_type.type,keywords.name,cover.image_id,platforms.id,platforms.name,release_dates.release_region.region,release_dates.status.name,release_dates.platform,release_dates.date,release_dates.date_format.format,release_dates.y,release_dates.m';
export function searchBody(query:string) {
 return `search ${JSON.stringify(query)}; fields ${gameFields}; limit 50;`;
}
const titleKey=(title:string)=>title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\bversion\b/g,'').trim().replace(/ +/g,' ');
export function titleScore(title:string,query:string) {
 const name=titleKey(title),q=titleKey(query);
 if(!q)return 0;
 if(name===q)return 100;
 if(name.startsWith(q))return 90;
 const words=q.split(' ');
 if(words.every(word=>name.split(' ').includes(word)))return 80;
 if(words.every(word=>name.replace(/ /g,'').includes(word)))return 70;
 return 0;
}
export function rankGames(games:RawGame[],query:string,anchor?:RawGame) {
 const unique=[...new Map(games.filter(isOfficialCandidate).map(game=>[game.id,game])).values()];
 const variants=new Set([...(anchor?.remakes??[]),...(anchor?.remasters??[]),...(anchor?.ports??[])]);
 const tier=(g:RawGame)=>g.id===anchor?.id?110:Math.max(titleScore(g.name,query),variants.has(g.id)?85:0,(g.collections??[]).some(id=>anchor?.collections?.includes(id))?40:0);
 const distance=(g:RawGame)=>g.first_release_date&&anchor?.first_release_date?Math.abs(g.first_release_date-anchor.first_release_date):Infinity;
 return unique.sort((a,b)=>tier(b)-tier(a)||(distance(a)-distance(b))||a.name.localeCompare(b.name)||a.id-b.id);
}
export function relatedBody(anchor:RawGame) {
 const ids=[...(anchor.remakes??[]),...(anchor.remasters??[]),...(anchor.ports??[])].filter(Number.isSafeInteger);
 const series=(anchor.collections??[]).filter(Number.isSafeInteger);
 const conditions=[ids.length?`id = (${ids.join(',')})`:'',series.length?`collections = (${series.join(',')})`:''].filter(Boolean);
 return conditions.length?`fields ${gameFields}; where ${conditions.join(' | ')}; sort first_release_date asc; limit 100;`:null;
}

// IGDB uses both game types and community keywords for unofficial releases.
// Do not infer licensing from a title or exclude legitimate ports/remakes.
const unofficialTypes = new Set(['mod', 'standalonemod', 'fork']);
const unofficialKeywords = new Set(['unofficial', 'fangame', 'fangames', 'fanmade', 'romhack', 'romhacks', 'homebrew', 'unlicensed', 'bootleg', 'unofficialport', 'fanremake']);
const normalizeTag = (value:string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
export function isOfficialCandidate(game:RawGame) {
 return !unofficialTypes.has(normalizeTag(game.game_type?.type ?? '')) &&
  !(game.keywords??[]).some(keyword=>unofficialKeywords.has(normalizeTag(keyword.name)));
}

// Full-text search does not reliably match an unfinished final word.
// Slugs provide accent-insensitive prefix matching without guessing game names.
export function prefixBody(query:string) {
 const name=query.trim().replace(/\s+/g,' ');
 const slug=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const filters=slug.length>=2?[`slug ~ ${JSON.stringify(slug)}*`]:[`name ~ ${JSON.stringify(name)}*`];
 return `fields ${gameFields}; where (${filters.join(' | ')}); sort total_rating_count desc; limit 50;`;
}
