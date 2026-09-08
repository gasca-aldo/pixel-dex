export const WINDOW_MS = 15 * 60 * 1000;
export const MAX_ATTEMPTS = 10;
export function consumeAttempt(history, now) {
 const recent=history.filter(time=>time>now-WINDOW_MS).sort((a,b)=>a-b);
 if(recent.length>=MAX_ATTEMPTS)return {allowed:false,history:recent,retryAfter:Math.max(1,Math.ceil((recent[0]+WINDOW_MS-now)/1000))};
 return {allowed:true,history:[...recent,now],retryAfter:0};
}
