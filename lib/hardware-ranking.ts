import type {HardwareMetadata} from './igdb-hardware-map.ts';
const clean=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function hardwareMatchScore(item:HardwareMetadata,query:string):number {
 const q=clean(query);if(!q)return 0;
 const name=clean(item.name),parent=clean(item.platformName);
 const aliases=(item.aliases??[]).map(clean);
 const names=[name],context:string[]=[];
 if(item.igdbPlatformVersionId){
  context.push(`${parent} ${name}`);
  const suffix=name.startsWith(parent+' ')?name.slice(parent.length+1):name;
  aliases.splice(0,aliases.length,...aliases.map(a=>`${a} ${suffix}`));
 }
 if([...names,...context].includes(q))return 300;
 if(aliases.includes(q))return 200;
 const tokens=q.split(' ');
 const matches=(values:string[])=>values.some(n=>tokens.every(t=>n.split(' ').some(w=>w.startsWith(t))));
 return matches(names)?120:matches(aliases)?110:matches(context)?100:0;
}
export function rankHardware(items:HardwareMetadata[],query:string):HardwareMetadata[]{
 const unique=[...new Map(items.map(i=>[`${i.igdbPlatformId}:${i.igdbPlatformVersionId??''}`,i])).values()];
 return unique.map(item=>({item,score:hardwareMatchScore(item,query)})).filter(r=>r.score>0).sort((a,b)=>b.score-a.score||Number(!!a.item.igdbPlatformVersionId)-Number(!!b.item.igdbPlatformVersionId)||a.item.name.localeCompare(b.item.name)).map(r=>r.item);
}
