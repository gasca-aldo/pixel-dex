// Reuse the existing limiter namespace, with separate IDs from password login.
export const CATALOG_WINDOW_MS = 60_000;
export const CATALOG_MAX_ATTEMPTS = 60;
export const COVER_MAX_ATTEMPTS = 120;
const reply = (error: string, status: number, retryAfter?: number) => Response.json(
  {error, ...(retryAfter ? {retryAfter} : {})},
  {status, headers: {'Cache-Control':'no-store', ...(retryAfter ? {'Retry-After':String(retryAfter)} : {})}},
);
export async function limitCatalog(request: Request, limiter: DurableObjectNamespace): Promise<Response | null> {
  const url = new URL(request.url);
  if(request.method !== 'GET') return new Response(null, {status:405, headers:{Allow:'GET','Cache-Control':'no-store'}});
  const ip = request.headers.get('CF-Connecting-IP') ?? (['localhost','127.0.0.1'].includes(url.hostname) ? 'local' : null);
  if(!ip) return reply('Unable to verify request.',403);
  try {
    const digest = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip));
    const key = Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
    const bucket = /^\/api\/catalog\/cover\/[1-9]\d{0,9}$/.test(url.pathname) ? 'cover' : 'catalog';
    const response = await limiter.get(limiter.idFromName(`${bucket}:${key}`)).fetch(`https://limiter/${bucket}`);
    if(!response.ok) throw new Error('Limiter unavailable');
    const decision = await response.json() as {allowed?:boolean;retryAfter?:number};
    if(decision.allowed === true) return null;
    if(decision.allowed !== false || !Number.isFinite(decision.retryAfter) || decision.retryAfter! <= 0) throw new Error('Invalid limiter response');
    return reply('Too many catalog requests. Please wait a moment and try again.',429,Math.ceil(decision.retryAfter!));
  } catch { return reply('Catalog is temporarily unavailable. Please try again.',503); }
}
