'use client';
import {useEffect,useRef,useState} from 'react';
import {hardwareCatalogEntry,type HardwareMetadata} from '@/lib/igdb-hardware-map';
import {hardwareAlreadyCollected,hardwareReleaseLabel,readHardwareResponse} from '@/lib/hardware-selection';
import type {CatalogItem,Item} from '@/lib/tracker';

export function HardwareMetadataDetails({metadata}:{metadata:HardwareMetadata}){
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[metadata.logo?.url]);
 return <section className="igdb-hardware-details" aria-label="IGDB hardware information">
  {metadata.logo&&!failed?<img src={metadata.logo.url} alt={`${metadata.name} — generic IGDB asset`} onError={()=>setFailed(true)}/>:<p>Image: Unknown</p>}
  <p><strong>{metadata.platformName}</strong>{metadata.igdbPlatformVersionId?` · ${metadata.name}`:' · Generic platform (no specific version)'}</p>
  <p>Manufacturer: {metadata.manufacturer??'Unknown'}</p>
  <p>Catalog edition / color: Unknown. You can enter your own details.</p>
  {metadata.releases.length?<ul aria-label="Regional release dates">{metadata.releases.map(r=><li key={r.id}>{r.region??'Unknown region'}: {hardwareReleaseLabel(r)}</li>)}</ul>:<p>Release date: Unknown</p>}
  <small>IGDB assets are generic, not verified photos of an edition.</small>
 </section>;
}

export function HardwareSearch({query,items,onSelect}:{query:string;items:Item[];onSelect:(entry:CatalogItem)=>void}){
 const [results,setResults]=useState<HardwareMetadata[]>([]),[platform,setPlatform]=useState<HardwareMetadata|null>(null),[versions,setVersions]=useState<HardwareMetadata[]>([]),[selected,setSelected]=useState<HardwareMetadata|null>(null);
 const [loading,setLoading]=useState(false),[error,setError]=useState(''),[stale,setStale]=useState(false);
 const request=useRef<AbortController|null>(null),generation=useRef(0),heading=useRef<HTMLHeadingElement>(null);
 async function read(url:string,signal:AbortSignal){return readHardwareResponse(await fetch(url,{signal:AbortSignal.any([signal,AbortSignal.timeout(15000)]),cache:'no-store'}));}
 useEffect(()=>{
  const serial=++generation.current;request.current?.abort();const controller=new AbortController();request.current=controller;
  setPlatform(null);setSelected(null);setVersions([]);setResults([]);setError('');setStale(false);
  if(query.trim().length<2){setLoading(false);return ()=>controller.abort();}
  setLoading(true);
  const timer=setTimeout(()=>{void read('/api/catalog/hardware?q='+encodeURIComponent(query.trim()),controller.signal).then(data=>{
   if(serial===generation.current){setResults(data.results);setStale(data.stale);}
  }).catch(()=>{if(serial===generation.current&&!controller.signal.aborted)setError('Hardware search is unavailable. Try again.');}).finally(()=>{if(serial===generation.current)setLoading(false);});},300);
  return ()=>{clearTimeout(timer);controller.abort();generation.current++;};
 },[query]);
 async function choose(candidate:HardwareMetadata,openPlatform=false){
  const serial=++generation.current;request.current?.abort();const controller=new AbortController();request.current=controller;
  setLoading(true);setError('');setSelected(null);
  if(openPlatform){setPlatform(candidate);setVersions([]);}
  const base='/api/catalog/hardware/platforms/'+candidate.igdbPlatformId;
  try{
   const data=await read(base+(candidate.igdbPlatformVersionId?'/versions/'+candidate.igdbPlatformVersionId:''),controller.signal);
   if(serial!==generation.current)return;
   const metadata=data.results[0];
   if(!metadata||metadata.igdbPlatformId!==candidate.igdbPlatformId||metadata.igdbPlatformVersionId!==candidate.igdbPlatformVersionId)throw new Error('Unexpected hardware');
   if(openPlatform){
    setPlatform(metadata);
    const list=await read(base+'/versions',controller.signal);
    if(serial!==generation.current)return;
    if(list.results.some(v=>v.igdbPlatformId!==metadata.igdbPlatformId||!v.igdbPlatformVersionId||!metadata.versionIds.includes(v.igdbPlatformVersionId)))throw new Error('Unexpected version');
    setVersions(list.results);setStale(data.stale||list.stale);
   }else{setSelected(metadata);setStale(data.stale);}
  }catch{if(serial===generation.current&&!controller.signal.aborted)setError('Hardware details could not load. Try again or choose another result.');}
  finally{if(serial===generation.current){setLoading(false);heading.current?.focus();}}
 }
 function back(){generation.current++;request.current?.abort();setPlatform(null);setSelected(null);setLoading(false);setError('');}
 return <div className="igdb-hardware-search" aria-busy={loading}>
  <h3 ref={heading} tabIndex={-1}>{platform?platform.platformName:'IGDB hardware'}</h3>
  <p role="status">{loading?'Loading IGDB hardware…':error|| (stale?'Showing previously cached IGDB data.':query.trim().length<2?'Type at least 2 characters to search.':'Choose a platform, then a version or the generic platform.')}</p>
  {platform?<>
   <button className="secondary" onClick={back}>Back to platforms</button>
   <button className="catalog-result" disabled={loading} onClick={()=>void choose(platform)}><span><strong>Use generic {platform.platformName}</strong><small>No specific version{hardwareAlreadyCollected(items,platform)?' · Already in collection':''}</small></span></button>
   {versions.map(v=><button className="catalog-result" key={v.igdbPlatformVersionId} disabled={loading} onClick={()=>void choose(v)}><span><strong>{v.name}</strong><small>{v.platformName}{hardwareAlreadyCollected(items,v)?' · Already in collection':''}</small></span></button>)}
   {!loading&&!error&&!versions.length&&<p>No versions available. Generic platform selection is still available.</p>}
  </>:results.map(p=><button className="catalog-result" key={`${p.igdbPlatformId}:${p.igdbPlatformVersionId??''}`} onClick={()=>void choose(p,!p.igdbPlatformVersionId)}>{p.logo&&<img src={p.logo.url} alt="Generic IGDB asset" width={48} height={48} style={{objectFit:'contain',flexShrink:0}}/>}<span><strong>{p.name}</strong><small>{p.igdbPlatformVersionId?p.platformName:'Choose platform or version'}{hardwareAlreadyCollected(items,p)?' · Already in collection':''}</small></span></button>)}
  {!platform&&!loading&&!error&&query.trim().length>=2&&!results.length&&<p>No IGDB match. You can add a custom entry.</p>}
  {selected&&!loading&&<><HardwareMetadataDetails metadata={selected}/>{hardwareAlreadyCollected(items,selected)&&<p>Already in collection — you can add another unit.</p>}<button className="primary" onClick={()=>onSelect(hardwareCatalogEntry(selected))}>Add selected hardware</button></>}
 </div>;
}
