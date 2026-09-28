import test from 'node:test';
import assert from 'node:assert/strict';
import {authEmailError} from '../lib/auth-email-error.ts';
test('email throttling gives actionable guidance without promising a retry time',()=>{
 for(const e of [{code:'over_email_send_rate_limit'},{code:'over_request_rate_limit'},{status:429}])assert.match(authEmailError(e),/wait.*later.*Google/);
});
test('provider and network failures never expose upstream details',()=>{
 for(const e of [{status:500,message:'smtp credential secret'},new TypeError('Failed to fetch'),null]){
  const message=authEmailError(e);assert.match(message,/try again later/);assert.doesNotMatch(message,/secret|smtp credential/);
 }
});
test('CAPTCHA and validation failures retain specific safe guidance',()=>{
 assert.match(authEmailError({code:'captcha_failed'}),/Security check/);
 assert.match(authEmailError({code:'weak_password'}),/stronger password/);
 assert.match(authEmailError({code:'email_address_invalid'}),/valid email/);
});
