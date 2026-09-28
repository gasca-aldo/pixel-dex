export const WINDOW_MS = 15 * 60 * 1000;
export const MAX_ATTEMPTS = 10;
export function consumeAttempt(history, now, windowMs = WINDOW_MS, maxAttempts = MAX_ATTEMPTS) {
 const recent=history.filter(time=>time>now-windowMs).sort((a,b)=>a-b);
 if(recent.length>=maxAttempts)return {allowed:false,history:recent,retryAfter:Math.max(1,Math.ceil((recent[0]+windowMs-now)/1000))};
 return {allowed:true,history:[...recent,now],retryAfter:0};
}
