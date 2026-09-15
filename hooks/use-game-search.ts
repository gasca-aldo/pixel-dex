 'use client';
import {useEffect,useState} from 'react';
import type {CatalogItem} from '@/lib/tracker';
import {readSearchResponse} from '@/lib/search-response';
const recentSearches=new Map<string,{until:number;results:CatalogItem[]}>();
// Let an issued request finish. Obsolete queued queries never reach the server.
let active:Promise<void>=Promise.resolve();
function cache(key:string,results:CatalogItem[]){recentSearches.delete(key);recentSearches.set(key,{until:Date.now()+300000,results});if(recentSearches.size>30)recentSearches.delete(recentSearches.keys().next().value!);}
async function fetchResults(url:string){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);
 try{return await readSearchResponse(await fetch(url,{signal:controller.signal}));}finally{clearTimeout(timeout);}
}
export function useGameSearch(query:string,enabled=true) {
 const [state,setState]=useState<{results:CatalogItem[];loading:boolean;error:string}>({results:[],loading:false,error:''});
 useEffect(()=>{
  const q=query.trim(),key=q.toLowerCase();let cancelled=false;
  if(!enabled||q.length<2){setState({results:[],loading:false,error:''});return;}
  const cached=recentSearches.get(key);
  if(cached&&cached.until>Date.now()){setState({results:cached.results,loading:false,error:''});return;}
  setState({results:[],loading:true,error:''});
  const timer=setTimeout(()=>{
   active=active.catch(()=>{}).then(async()=>{
    if(cancelled)return;
    let shown=false;
    try{
     const url='/api/catalog?q='+encodeURIComponent(q);
     const first=await fetchResults(url);
     cache(key,first.results);
     if(cancelled)return;
     shown=true;setState({results:first.results,loading:false,error:''});
     if(first.enrich){
      // Optional enrichment must not hold the next direct search in the queue.
      setTimeout(()=>{
       if(cancelled)return;
       void fetchResults(url+'&related=1').then(related=>{
        cache(key,related.results);
        if(!cancelled)setState({results:related.results,loading:false,error:''});
       }).catch(()=>{/* Direct matches remain usable. */});
      },300);
     }
    }catch{if(!cancelled&&!shown)setState({results:[],loading:false,error:'Game search could not load. Please try again.'});}
   });
  },300);
  return()=>{cancelled=true;clearTimeout(timer);};
 },[query,enabled]);
 return state;
}
