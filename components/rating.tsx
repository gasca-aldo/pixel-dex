'use client';
import {useId, useState} from 'react';
import {Star} from 'lucide-react';

export function RatingStars({value,compact=false}: {value: number;compact?:boolean}) {
  return <span className="rating-stars" role="img" aria-label={value ? `${value} out of 5` : 'Not rated'}>
    {(compact ? [1] : [1,2,3,4,5]).map(n => <span className="rating-star" key={n} aria-hidden="true">
      <Star size={20}/><span className="rating-star-fill" style={{width: `${Math.max(0,Math.min(1,compact ? (value % 1 || (value ? 1 : 0)) : value-n+1))*100}%`}}><Star size={20} fill="currentColor"/></span>
    </span>)}
  </span>;
}

export function RatingControl({value,onChange}: {value:number;onChange:(value:number)=>void}) {
  const name=useId();
  const [preview,setPreview]=useState<number|null>(null);
  const shown=preview ?? value;
  return <div className="half-rating-control">
    <div className="half-rating-options" role="radiogroup" aria-label="Your rating" onMouseLeave={()=>setPreview(null)} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setPreview(null)}}>
      {[1,2,3,4,5].map(n=><span className="half-rating-star" key={n}>
        <span className="half-rating-art" aria-hidden="true"><span className="rating-star"><Star size={32}/><span className="rating-star-fill" style={{width:`${Math.max(0,Math.min(1,shown-n+1))*100}%`}}><Star size={32} fill="currentColor"/></span></span></span>
        {[n-.5,n].map(v=><label key={v} className="half-rating-target" onMouseEnter={()=>setPreview(v)}>
          <input type="radio" name={name} value={v} checked={value===v} aria-label={`${v} out of 5`} onFocus={()=>setPreview(v)} onChange={()=>{onChange(v);setPreview(v)}}/>
        </label>)}
      </span>)}
    </div>
    <span className="rating-value" aria-live="polite">{shown ? `${shown} out of 5` : 'Not rated'}</span>
    {value>0 && <button type="button" className="rating-clear" onClick={()=>{onChange(0);setPreview(null)}}>Clear rating</button>}
  </div>;
}
