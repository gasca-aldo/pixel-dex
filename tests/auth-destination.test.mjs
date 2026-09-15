import test from 'node:test';
import assert from 'node:assert/strict';
import {destinationAfterAuth} from '../lib/auth-destination.ts';
test('Google and ordinary sign-ins open My collection',()=>{for(const type of [null,undefined,'signup','signin'])assert.equal(destinationAfterAuth(type),'/');});
test('password recovery continues to the password form',()=>assert.equal(destinationAfterAuth('recovery'),'/login'));
test('external values cannot become redirect destinations',()=>assert.equal(destinationAfterAuth('https://example.com'),'/'));
