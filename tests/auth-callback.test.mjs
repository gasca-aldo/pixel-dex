import test from 'node:test';
import assert from 'node:assert/strict';
import {readAuthCallback} from '../lib/auth-callback.ts';
test('recovery token is read without browser storage or an initiating-browser verifier',()=>{
  assert.deepEqual(readAuthCallback('', '#token_hash=test-token&type=recovery'),{kind:'recovery',token:'test-token'});
});
test('ordinary Google callback keeps its PKCE code path',()=>{
  assert.deepEqual(readAuthCallback('?code=google-code&next=https://untrusted.example',''),{kind:'code',code:'google-code'});
});
test('missing, expired, reused and ambiguous callbacks fail closed',()=>{
  for(const [search,hash] of [['',''],['?error=otp_expired',''],['','#error=access_denied&error_code=otp_expired'],['?code=a&code=b',''],['','#token_hash=x&type=signup'],['','#token_hash=&type=recovery'],['?code=x','#token_hash=y&type=recovery'],['','#token_hash=x&token_hash=y&type=recovery']]) assert.throws(()=>readAuthCallback(search,hash),/invalid, expired, or already used/);
});
