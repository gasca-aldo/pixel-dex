import test from 'node:test';
import assert from 'node:assert/strict';
import {samePayload, clearMatchingDraft, reconcileConflict, settleSave} from '../lib/library-recovery.ts';
const payload = {version:1,items:[{id:'one',notes:'Keep my notes'}]};
function storage(value) {
  const values = new Map([['draft',value],['other-account','preserve']]);
  return {values,getItem:k=>values.get(k)??null,removeItem:k=>values.delete(k)};
}
test('recovery comparison tolerates database key ordering but preserves item order and notes',()=>{
  assert.ok(samePayload(payload,{items:[{notes:'Keep my notes',id:'one'}],version:1}));
  assert.equal(samePayload(payload,{...payload,items:[{id:'one',notes:'Different'}]}),false);
  assert.equal(samePayload([1,2],[2,1]),false);
  assert.equal(samePayload({a:null},{b:null}),false);
});
test('successful saves and discard actions cannot erase another tab recovery copy',()=>{
  for (const raw of [JSON.stringify({payload:{...payload,items:[]},revision:1}),JSON.stringify({payload,revision:2}),'damaged JSON']) {
    const store=storage(raw);
    assert.equal(clearMatchingDraft(store,'draft',payload,1),false);
    assert.equal(store.getItem('draft'),raw);
  }
  const store=storage(JSON.stringify({payload,revision:1}));
  assert.equal(clearMatchingDraft(store,'draft',payload,1),true);
  assert.equal(store.getItem('draft'),null);
  assert.equal(store.getItem('other-account'),'preserve');
});
test('retry recognizes a committed save whose response was lost without writing again',async()=>{
  const remote={payload:{items:payload.items,version:1},revision:2};
  assert.equal(await reconcileConflict(payload,async()=>remote),2);
  for(const state of [null,{payload:{...payload,items:[]},revision:3}]) {
    await assert.rejects(reconcileConflict(payload,async()=>state),/changed on another device/);
  }
  await assert.rejects(reconcileConflict(payload,async()=>{throw new Error('offline');}),/offline/);
});
test('failed and timed-out saves keep their recovery copy until a confirmed retry',async()=>{
  const store=storage(JSON.stringify({payload,revision:1}));
  const failures=[];
  for(const error of [new Error('offline'),new DOMException('Timed out','TimeoutError')]) {
    await settleSave(async()=>{throw error;},()=>true,()=>assert.fail('must not confirm'),e=>failures.push(e));
    assert.ok(store.getItem('draft'));
  }
  assert.equal(failures.length,2);
  await settleSave(async()=>2,()=>true,()=>clearMatchingDraft(store,'draft',payload,1),()=>assert.fail('must succeed'));
  assert.equal(store.getItem('draft'),null);
});
test('late success or failure after an account change or unmount cannot update the new page or erase drafts',async()=>{
  for(const fail of [false,true]) {
    let finish;
    let epoch=1;
    const store=storage(JSON.stringify({payload,revision:1}));
    const promise=new Promise((resolve,reject)=>{finish=()=>fail?reject(new Error('expired')):resolve(2);});
    const pending=settleSave(()=>promise,()=>epoch===1,()=>assert.fail('stale success'),()=>assert.fail('stale failure'));
    epoch=2;finish();await pending;
    assert.ok(store.getItem('draft'));
  }
});
