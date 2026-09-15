import test from 'node:test';
import assert from 'node:assert/strict';
import {createIdentityGuard} from '../lib/auth-identity.ts';
test('delayed identity lookup is ignored after sign-out or account switching', async () => {
  for (const next of [null, 'account-b']) {
    const guard = createIdentityGuard();
    const current = guard.capture();
    let displayed = 'account-a';
    let finish;
    const lookup = new Promise(resolve => { finish = resolve; });
    const pending = lookup.then(user => { if(current()) displayed = user; });
    guard.invalidate(); displayed = next;
    finish('account-a'); await pending;
    assert.equal(displayed, next);
  }
});
test('new lookups remain usable and old work stays invalid across repeated switches', () => {
  const guard = createIdentityGuard(); const first = guard.capture();
  assert.equal(first(), true); guard.invalidate();
  const second = guard.capture(); assert.equal(first(), false); assert.equal(second(), true);
  guard.invalidate(); assert.equal(second(), false); assert.equal(first(), false);
});
