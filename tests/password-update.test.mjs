import test from 'node:test';
import assert from 'node:assert/strict';
import {updatePasswordForOwner} from '../lib/password-update.ts';
const session = {access_token:'token-a',user:{id:'a'}};
const auth = {getSession:async()=>({data:{session},error:null}),getUser:async()=>({data:{user:session.user},error:null})};
test('rejects expired, missing, unverified and mismatched identities before password mutation',async()=>{
  for(const client of [
    {...auth,getSession:async()=>({data:{session:null},error:null})},
    {...auth,getUser:async()=>({data:{user:null},error:new Error('expired')})},
    {...auth,getUser:async()=>({data:{user:{id:'b'}},error:null})},
    {...auth,getSession:async()=>({data:{session:{...session,user:{id:'b'}}},error:null})},
  ]) await assert.rejects(updatePasswordForOwner(client,'a','secret',()=>true,async()=>assert.fail('must not write')),/session changed/);
});
test('account switch during verification prevents password update',async()=>{
  let current=true;
  const client={...auth,getUser:async()=>{current=false;return {data:{user:session.user},error:null};}};
  await assert.rejects(updatePasswordForOwner(client,'a','secret',()=>current,async()=>assert.fail('must not write')),/session changed/);
});
test('in-flight password request stays bound to original token and cannot redirect the new account',async()=>{
  let current=true; let sent;
  await assert.rejects(updatePasswordForOwner(auth,'a','secret',()=>current,async token=>{sent=token;current=false;}),/session changed/);
  assert.equal(sent,'token-a');
});
test('verified current account can update its password',async()=>{
  let sent;
  await updatePasswordForOwner(auth,'a','secret',()=>true,async(token,password)=>{sent={token,password};});
  assert.deepEqual(sent,{token:'token-a',password:'secret'});
});
