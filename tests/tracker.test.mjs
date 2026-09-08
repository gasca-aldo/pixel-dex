import test from 'node:test';
import assert from 'node:assert/strict';
import {
  seedCollection,
  validCollection,
  filteredItems,
  inSection,
  updateComponents,
  makeItem,
} from '../lib/tracker.ts';
test('a persisted collection round-trips with records, reviews, and upgrade history intact', () => {
  const original = seedCollection();
  const restored = JSON.parse(JSON.stringify(original));
  assert.equal(validCollection(restored), true);
  assert.deepEqual(restored, original);
  assert.ok(restored.items.some((i) => i.history.length));
  assert.ok(restored.items.some((i) => i.notes.length));
});
test('invalid and duplicated backup records are rejected without accepting partial data', () => {
  const collection = seedCollection();
  assert.equal(
    validCollection({
      ...collection,
      items: [collection.items[0], collection.items[0]],
    }),
    false,
  );
  assert.equal(
    validCollection({
      ...collection,
      items: [{ ...collection.items[0], rating: 99 }],
    }),
    false,
  );
  assert.equal(
    validCollection({
      ...collection,
      items: [{ ...collection.items[0], components: [null] }],
    }),
    false,
  );
  assert.equal(validCollection({ version: 2 }), false);
});
test('launcher filters, status filters and title search combine without leaking wishlist items', () => {
  const data = seedCollection();
  const result = filteredItems(
    data.items,
    'games',
    'ELDEN',
    'Playing',
    'PC',
    'Steam',
    'Title A–Z',
  );
  assert.deepEqual(
    result.map((i) => i.title),
    ['Elden Ring'],
  );
  assert.equal(
    filteredItems(
      data.items,
      'games',
      'ELDEN',
      'Completed',
      'PC',
      'Steam',
      'Title A–Z',
    ).length,
    0,
  );
  assert.ok(
    filteredItems(
      data.items,
      'games',
      '',
      'All',
      'All platforms',
      'All launchers',
      'Recently added',
    ).every((i) => i.owned && i.kind === 'game'),
  );
});
test('marking a wished-for console owned moves it between collection sections', () => {
  const data = seedCollection();
  const item = data.items.find((i) => i.kind === 'console' && !i.owned);
  assert.ok(inSection(item, 'wishlist'));
  const acquired = { ...item, owned: true };
  assert.equal(inSection(acquired, 'wishlist'), false);
  assert.equal(inSection(acquired, 'consoles'), true);
});
test('component replacement and removal preserve dated upgrade history without mutating the original', () => {
  const item = seedCollection().items.find((i) => i.id === 'sample-build-1');
  const before = structuredClone(item);
  const next = item.components
    .filter((c) => c.type !== 'Cooling')
    .map((c) => (c.type === 'GPU' ? { ...c, name: 'Replacement GPU' } : c));
  const updated = updateComponents(item, next, '2026-09-07');
  assert.deepEqual(item, before);
  assert.equal(updated.history.length, item.history.length + 2);
  assert.deepEqual(updated.history[0], {
    date: '2026-09-07',
    type: 'GPU',
    from: 'NVIDIA GeForce RTX 4070 Super',
    to: 'Replacement GPU',
  });
  assert.equal(updated.history[1].to, 'Removed');
  assert.deepEqual(
    updateComponents(updated, updated.components, '2026-09-08').history,
    updated.history,
  );
});
test('editing a planned build does not invent an installed-component history', () => {
  const item = makeItem('build', 'Future setup', false);
  const updated = updateComponents(
    item,
    [{ id: 'new', type: 'CPU', name: 'Planned CPU' }],
    '2026-09-07',
  );
  assert.equal(updated.components.length, 1);
  assert.equal(updated.history.length, 0);
});

test('software and hardware wishlists partition legacy saved items without losing entries', () => {
  const data = seedCollection();
  const legacy = data.items.filter((i) => inSection(i, 'wishlist'));
  const software = data.items.filter((i) => inSection(i, 'gameWishlist'));
  const hardware = data.items.filter((i) => inSection(i, 'hardwareWishlist'));
  assert.ok(software.every((i) => i.kind === 'game'));
  assert.ok(hardware.some((i) => i.kind === 'console'));
  assert.ok(hardware.some((i) => i.kind === 'build'));
  assert.deepEqual(
    [...software, ...hardware].map((i) => i.id).sort(),
    legacy.map((i) => i.id).sort(),
  );
  const old = structuredClone(data);
  delete old.visibility.gameWishlist;
  delete old.visibility.hardwareWishlist;
  assert.equal(validCollection(old), true);
  assert.ok(
    filteredItems(
      data.items,
      'hardwareWishlist',
      '',
      'build',
      'All platforms',
      'All launchers',
      'Recently added',
    ).every((i) => i.kind === 'build' && !i.owned),
  );
});
test('launcher filtering applies only to PC games', () => {
  const pc = makeItem('game', 'PC game');
  const consoleGame = {
    ...makeItem('game', 'Console game'),
    platform: 'PlayStation 5',
    launcher: 'Steam',
  };
  assert.deepEqual(
    filteredItems(
      [pc, consoleGame],
      'games',
      '',
      'All',
      'All platforms',
      'Steam',
      'Recently added',
    ).map((i) => i.id),
    [pc.id],
  );
});
