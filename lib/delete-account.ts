import {createClient} from '@supabase/supabase-js';
type Config={url:string;secret?:string};
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function deleteAccount(request:Request,config:Config,makeClient= createClient){
 const url=new URL(request.url);
 if(request.method!=='DELETE')return reply({error:'Method not allowed'},405);
 if(request.headers.get('origin')!==url.origin)return reply({error:'Invalid origin'},403);
 const authorization=request.headers.get('authorization');
 if(!authorization?.startsWith('Bearer ')||authorization.length>8192)return reply({error:'Sign in again before deleting your account.'},401);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return reply({error:'JSON required'},415);
 if(Number(request.headers.get('content-length')??0)>1024)return reply({error:'Request too large'},413);
 try{
  const raw=await request.text();if(raw.length>1024)return reply({error:'Request too large'},413);
  let body;try{body=JSON.parse(raw);}catch{return reply({error:'Invalid confirmation'},400);}
  if(!body||body.confirmation!=='DELETE'||typeof body.expectedUserId!=='string'||Object.keys(body).some(k=>!['confirmation','expectedUserId'].includes(k)))return reply({error:'Confirm account deletion first.'},400);
  if(!config.secret)return reply({error:'Account deletion is not available yet. Please contact the project operator.'},503);
  const client=makeClient(config.url,config.secret,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(15000)})}});
  // Resolve identity with Auth. Never trust a decoded JWT or a submitted deletion ID.
  const {data,error}=await client.auth.getUser(authorization.slice(7));
  if(error||!data.user)return reply({error:'Sign in again before deleting your account.'},401);
  if(data.user.id!==body.expectedUserId)return reply({error:'Your account changed. Reload before trying again.'},409);
  const result=await client.auth.admin.deleteUser(data.user.id,false);
  if(result.error)return reply({error:'Deletion could not be confirmed. Reload to check your account before trying again.'},502);
  return reply({deleted:true,userId:data.user.id});
 }catch{return reply({error:'Deletion could not be confirmed. Reload to check your account before trying again.'},503);}
}
