import test from 'node:test';
import assert from 'node:assert/strict';
import {deleteAccount} from '../lib/delete-account.ts';
const id='11111111-1111-4111-8111-111111111111';
const config={url:'https://example.supabase.co',secret:'test-only'};
function request(body={confirmation:'DELETE',expectedUserId:id},headers={},method='DELETE'){
 return new Request('https://pixel.example/api/account',{method,headers:{origin:'https://pixel.example',authorization:'Bearer valid-session','content-type':'application/json',...headers},...(method==='GET'?{}:{body:JSON.stringify(body)})});
}
function mock(options={}){
 const calls=[];
 const make=()=>({auth:{getUser:async token=>{calls.push(['verify',token]);return {data:{user:options.invalid?null:{id}},error:options.invalid?new Error('expired'):null};},admin:{deleteUser:async(...args)=>{calls.push(['delete',...args]);if(options.throw)throw new Error('private diagnostic');return {error:options.fail?new Error('private diagnostic'):null};}}}});
 return {calls,make};
}
test('deletion validates the session and hard-deletes only its verified identity',async()=>{
 const m=mock();const r=await deleteAccount(request(),config,m.make);
 assert.equal(r.status,200);assert.deepEqual(await r.json(),{deleted:true,userId:id});
 assert.deepEqual(m.calls,[['verify','valid-session'],['delete',id,false]]);
 assert.equal(r.headers.get('cache-control'),'no-store');
});
test('missing confirmation, cross-origin requests, wrong accounts, and expired sessions cannot delete',async()=>{
 for(const [r,status] of [[request({confirmation:'NO',expectedUserId:id}),400],[request(undefined,{origin:'https://evil.example'}),403],[request(undefined,{authorization:''}),401],[request(undefined,{},'GET'),405],[request({confirmation:'DELETE',expectedUserId:'someone-else'}),409],[request({confirmation:'DELETE',expectedUserId:id,userId:'someone-else'}),400]]){
  const m=mock();assert.equal((await deleteAccount(r,config,m.make)).status,status);assert.ok(!m.calls.some(c=>c[0]==='delete'));
 }
 const m=mock({invalid:true});assert.equal((await deleteAccount(request(),config,m.make)).status,401);assert.equal(m.calls.length,1);
});
test('unconfigured and failed deletion never return success or private diagnostics',async()=>{
 const m=mock();assert.equal((await deleteAccount(request(),{url:config.url},m.make)).status,503);assert.equal(m.calls.length,0);
 for(const options of [{fail:true},{throw:true}]){const m=mock(options),r=await deleteAccount(request(),config,m.make);assert.ok(r.status>=500);assert.ok(!(await r.text()).includes('private diagnostic'));}
});

test('browser cleanup preserves another account session, its draft, and the local library',async()=>{
 const {clearDeletedAccount}=await import('../lib/account-cleanup.ts');
 const key='sb-example-auth-token';
 for(const sessionOwner of [id,'other-user']){
  const data=new Map([[key,JSON.stringify({user:{id:sessionOwner}})],[key+'-code-verifier','keep if other'],['pixel-dex:account-draft:'+id,'remove'],['pixel-dex:account-draft:other-user','keep'],['pixel-tracker:v1','local']]);
  clearDeletedAccount({getItem:k=>data.get(k)??null,removeItem:k=>data.delete(k)},id,key);
  assert.equal(data.has('pixel-dex:account-draft:'+id),false);
  assert.equal(data.get('pixel-dex:account-draft:other-user'),'keep');assert.equal(data.get('pixel-tracker:v1'),'local');
  assert.equal(data.has(key),sessionOwner!==id);assert.equal(data.has(key+'-code-verifier'),sessionOwner!==id);
 }
});
