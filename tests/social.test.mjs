import test from 'node:test';
import assert from 'node:assert/strict';
import {
  seedCollection,
  validCollection,
  newGameList,
  gameReference,
  catalog,
  addListGame,
  moveListGame,
  publicProfile,
  sharedList,
  listSnapshot,
  collectionAccess,
} from '../lib/tracker.ts';
const game = (n) => gameReference(catalog[n]);
function list(title, visibility = 'Private') {
  return {
    ...newGameList(),
    title,
    visibility,
    description: `Description of ${title}`,
    entries: [{ game: game(0), note: `Note for ${title}` }],
  };
}
test('old backups open unchanged; lists and profile survive a complete backup round-trip', () => {
  const old = seedCollection();
  assert.equal(validCollection(old), true);
  const data = {
    ...old,
    lists: [list('Favorites')],
    profile: { name: 'Player', bio: 'My games', topGames: [game(0), game(1)] },
    collectionVisibility: 'Private',
  };
  const restored = JSON.parse(JSON.stringify(data));
  assert.equal(validCollection(restored), true);
  assert.deepEqual(restored, data);
});
test('top six remain visible with private collection while private and unlisted lists stay off profile', () => {
  const data = {
    ...seedCollection(),
    collectionVisibility: 'Private',
    profile: { name: 'Player', bio: 'Hello', topGames: [game(0), game(1)] },
    lists: [
      list('Private secrets'),
      list('For friends', 'Unlisted'),
      list('Public favorites', 'Public'),
    ],
  };
  const profile = publicProfile(data);
  assert.equal(profile.collection, null);
  assert.equal(profile.topGames.length, 2);
  assert.deepEqual(
    profile.lists.map((l) => l.title),
    ['Public favorites'],
  );
  assert.equal(sharedList(data, data.lists[0].id), null);
  assert.equal(sharedList(data, data.lists[1].id).title, 'For friends');
  assert.equal(sharedList(data, 'missing'), null);
});
test('public collection and list projections do not disclose personal reviews or private metadata', () => {
  const data = {
    ...seedCollection(),
    collectionVisibility: 'Public',
    lists: [list('Shared', 'Public')],
  };
  data.items[0].notes = 'SECRET PERSONAL REVIEW';
  data.items[0].history = [
    { date: 'today', type: 'GPU', from: 'PRIVATE PART', to: 'new part' },
  ];
  data.lists[0].entries[0].game.personalReview = 'SECRET PERSONAL REVIEW';
  const profile = publicProfile(data);
  assert.ok(profile.collection.length);
  assert.equal(
    JSON.stringify(profile).includes('SECRET PERSONAL REVIEW'),
    false,
  );
  assert.equal(JSON.stringify(profile).includes('PRIVATE PART'), false);
  assert.equal(profile.lists[0].entries[0].note, 'Note for Shared');
});
test('adding any catalog game to a list neither creates ownership nor duplicates it', () => {
  const data = seedCollection();
  const original = structuredClone(data.items);
  const starter = { ...newGameList(), title: 'Try these' };
  const next = addListGame(starter, game(15));
  assert.equal(starter.entries.length, 0);
  assert.equal(next.entries.length, 1);
  assert.equal(addListGame(next, game(15)).entries.length, 1);
  assert.deepEqual(data.items, original);
});
test('manual reordering moves each game with its own note and preserves order when ranking is disabled', () => {
  const initial = {
    ...list('A list'),
    entries: [
      { game: game(0), note: 'First note' },
      { game: game(1), note: 'Second note' },
      { game: game(2), note: 'Third note' },
    ],
    ranked: true,
  };
  const moved = moveListGame(initial, 2, 0);
  assert.deepEqual(
    moved.entries.map((e) => e.note),
    ['Third note', 'First note', 'Second note'],
  );
  assert.equal(initial.entries[0].note, 'First note');
  assert.deepEqual({ ...moved, ranked: false }.entries, moved.entries);
  assert.equal(moveListGame(initial, -1, 0), initial);
  assert.equal(moveListGame(initial, 0, 5), initial);
});
test('profile rejects more than six favorites, duplicate games, and invalid imported list data', () => {
  const base = seedCollection();
  const profile = {
    name: 'Player',
    bio: '',
    topGames: catalog.slice(0, 7).map(gameReference),
  };
  assert.equal(validCollection({ ...base, profile }), false);
  assert.equal(
    validCollection({
      ...base,
      profile: { ...profile, topGames: [game(0), game(0)] },
    }),
    false,
  );
  assert.equal(
    validCollection({
      ...base,
      lists: [{ ...list('Bad'), visibility: 'Secret' }],
    }),
    false,
  );
  assert.equal(
    validCollection({
      ...base,
      lists: [
        {
          ...list('Duplicate games'),
          entries: [
            { game: game(0), note: '' },
            { game: game(0), note: '' },
          ],
        },
      ],
    }),
    false,
  );
  assert.equal(
    validCollection({
      ...base,
      profile: { ...profile, topGames: profile.topGames.slice(0, 6) },
    }),
    true,
  );
});
test('legacy per-section settings never broaden a private section to a public whole collection', () => {
  const data = seedCollection();
  data.visibility.games = 'Public';
  assert.equal(collectionAccess(data), 'Private');
  Object.keys(data.visibility).forEach((k) => (data.visibility[k] = 'Public'));
  assert.equal(collectionAccess(data), 'Public');
  assert.equal(
    collectionAccess({ ...data, collectionVisibility: 'Private' }),
    'Private',
  );
});
test('shared snapshots escape user content, include only list notes, and reject private exports', () => {
  const l = list('<script>alert(1)</script>', 'Unlisted');
  l.entries[0].note = '<img src=x onerror=alert(1)>';
  const html = listSnapshot(l);
  assert.equal(html.includes('<script>'), false);
  assert.equal(html.includes('<img src=x'), false);
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('&lt;img'));
  assert.throws(() => listSnapshot({ ...l, visibility: 'Private' }));
});
