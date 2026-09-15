type HealthConfig = {url?: string; key?: string};
export function createHealthCheck(checkFetch: typeof fetch = (input, init) => fetch(input, init), now = Date.now) {
  let cached: {ok: boolean; until: number} | undefined;
  let pending: Promise<boolean> | undefined;
  return async (request: Request, config: HealthConfig) => {
    const headers = {'Cache-Control':'no-store'};
    if (!['GET','HEAD'].includes(request.method)) return new Response(null,{status:405,headers:{...headers,Allow:'GET, HEAD'}});
    if (!cached || cached.until <= now()) {
      pending ??= (async () => {
        let ok = false;
        try {
          if (config.url && config.key) {
            const response = await checkFetch(config.url + '/auth/v1/settings', {headers:{apikey:config.key},signal:AbortSignal.timeout(3000),redirect:'manual'});
            const settings = await response.json() as {external?: {email?: boolean}};
            ok = response.ok && typeof settings.external?.email === 'boolean';
          }
        } catch { /* Report availability, never provider bodies or credentials. */ }
        cached = {ok,until:now() + (ok ? 30000 : 5000)};
        return ok;
      })().finally(() => {pending = undefined;});
      await pending;
    }
    const status = cached?.ok ? 200 : 503;
    return new Response(request.method === 'HEAD' ? null : JSON.stringify({service:'pixel-dex',status:status===200?'ok':'unavailable'}),{status,headers:{...headers,'Content-Type':'application/json'}});
  };
}

export async function observeService(request: Request, run: () => Promise<Response>, report: (record: object) => void = console.error): Promise<Response> {
  const path = new URL(request.url).pathname;
  const area = path === '/api/health' ? 'health' : path === '/api/login' ? 'login' : path === '/api/account' ? 'account' : path.startsWith('/api/catalog') ? 'catalog' : path.startsWith('/p/') ? 'sharing' : 'app';
  let response: Response;
  try { response = await run(); }
  catch { response = Response.json({error:'The service is temporarily unavailable. Please try again.'},{status:503,headers:{'Cache-Control':'no-store'}}); }
  if(response.status >= 500) report({event:'pixel_dex_service_failure',area,status:response.status});
  return response;
}
