'use client';
import {useEffect,useRef,useState} from 'react';
type Turnstile = {render:(element:HTMLElement,options:Record<string,unknown>)=>string;remove:(id:string)=>void};
const api = () => (window as Window & {turnstile?:Turnstile}).turnstile;
let loading:Promise<Turnstile>|undefined;
function loadTurnstile() {
  if(api()) return Promise.resolve(api()!);
  loading ??= new Promise<Turnstile>((resolve,reject)=>{
    const script=document.createElement('script');
    script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;
    const timeout=window.setTimeout(fail,15000);
    function fail(){window.clearTimeout(timeout);script.remove();loading=undefined;reject(new Error('Security check unavailable'));}
    script.onerror=fail;
    script.onload=()=>{window.clearTimeout(timeout);if(api())resolve(api()!);else fail();};
    document.head.appendChild(script);
  });
  return loading;
}
export function AuthCaptcha({sitekey,onToken}:{sitekey:string;onToken:(token:string)=>void}) {
  const container=useRef<HTMLDivElement>(null);
  const [error,setError]=useState(false);
  const [retry,setRetry]=useState(0);
  useEffect(()=>{
    let active=true,id:string|undefined,widget:Turnstile|undefined;
    onToken('');setError(false);
    void loadTurnstile().then(service=>{
      if(!active||!container.current)return;
      widget=service;
      id=service.render(container.current,{sitekey,theme:document.documentElement.classList.contains('dark')?'dark':'light',size:'compact',
        callback:(token:string)=>{if(active){onToken(token);setError(false);}},
        'expired-callback':()=>{if(active)onToken('');},
        'error-callback':()=>{if(active){onToken('');setError(true);}},
        'timeout-callback':()=>{if(active){onToken('');setError(true);}},
      });
    }).catch(()=>{if(active){onToken('');setError(true);}});
    return ()=>{active=false;if(id!==undefined)widget?.remove(id);};
  },[sitekey,onToken,retry]);
  return <div aria-label="Security check"><div ref={container}/>{error&&<p role="alert">Security check could not load. <button type="button" onClick={()=>setRetry(n=>n+1)}>Retry security check</button></p>}</div>;
}
