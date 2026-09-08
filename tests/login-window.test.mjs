import test from 'node:test';
import assert from 'node:assert/strict';
import {consumeAttempt, WINDOW_MS} from '../lib/login-window.mjs';
test('allows ten attempts then blocks the eleventh until oldest attempt expires',()=>{
 let history=[];for(let i=0;i<10;i++){const result=consumeAttempt(history,1000+i);assert.equal(result.allowed,true);history=result.history;}
 const denied=consumeAttempt(history,2000);assert.equal(denied.allowed,false);assert.equal(denied.retryAfter,899);
 assert.equal(consumeAttempt(history,1000+WINDOW_MS).allowed,true);
});
test('rejected attempts do not extend the original window and idle windows clear',()=>{
 const history=Array(10).fill(1000);assert.deepEqual(consumeAttempt(history,5000).history,history);
 assert.deepEqual(consumeAttempt(history,1000+WINDOW_MS).history,[1000+WINDOW_MS]);
});
