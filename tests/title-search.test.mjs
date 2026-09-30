import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeTitle,
  titleSearchScore,
  matchesTitleSearch,
} from '../lib/title-search.ts';
import { rankGames, mapGame, tokenSearchBody } from '../lib/igdb-map.ts';
import {
  makeItem,
  filteredItems,
  validCollection,
  seedCollection,
} from '../lib/tracker.ts';
const title = 'Pokémon Legends: Z-A';
test('accents, case, punctuation and compact groups share search keys', () => {
  for (const query of [
    'pokemon za',
    'pokemon z-a',
    'pokemon Z A',
    '  Pokémon  Z.A  ',
  ]) {
    assert.equal(normalizeTitle(query), 'pokemon za');
    assert.equal(titleSearchScore(title, query), 80);
    assert.equal(matchesTitleSearch(query, title), true);
  }
  assert.equal(matchesTitleSearch('Pokemon', title), true);
  assert.equal(matchesTitleSearch('Pokémon', title), true);
  assert.equal(
    normalizeTitle('Assassin’s Creed: IV — Black-Flag.'),
    normalizeTitle('Assassins Creed IV Black Flag'),
  );
  assert.equal(matchesTitleSearch('ZA pokemon', title), true);
  assert.equal(
    matchesTitleSearch('assassins flag', 'Assassin’s Creed: Black Flag'),
    true,
  );
  assert.equal(normalizeTitle('神奇 寶貝'), '神奇 寶貝');
});
test('ranking is exact title, exact alias, prefix, all tokens, partial; unrelated excluded', () => {
  const games = [
    { id: 5, name: 'Pokémon Legends: Z-A' },
    { id: 4, name: 'Pokémon ZA Plus' },
    {
      id: 3,
      name: 'Pocket Monsters',
      alternative_names: [{ name: 'Pokémon ZA' }],
    },
    { id: 2, name: 'Pokémon ZA' },
    { id: 6, name: 'Pokémon Zebra Adventure' },
    { id: 7, name: 'Pokémon Bazaar' },
    { id: 8, name: 'Forza Horizon' },
    { id: 9, name: 'Pokémon Zany Cards' },
  ];
  assert.deepEqual(
    rankGames(games, 'pokemon za').map((g) => g.id),
    [2, 3, 4, 5, 9],
  );
  assert.equal(titleSearchScore(title, 'leg pokemon'), 70);
  assert.equal(titleSearchScore('Pokémon Zebra Adventure', 'pokemon za'), 0);
  assert.equal(titleSearchScore('Forza Horizon', 'za'), 0);
  assert.equal(titleSearchScore(title, 'pokemon missing'), 0);
  assert.equal(titleSearchScore(title, title), 100);
  const anchor = { id: 1, name: 'Pokémon ZA Extra', remakes: [10] };
  assert.equal(
    rankGames(
      [...games, anchor, { id: 10, name: 'Unrelated remake' }],
      'pokemon za',
      anchor,
    )[0].id,
    2,
  );
});
test('collection search combines existing fields, preserves titles and explicit sort', () => {
  const entry = mapGame({
    id: 1,
    name: title,
    alternative_names: [{ name: 'Pocket Monsters Legends ZA' }],
    platforms: [{ id: 130, name: 'Nintendo Switch' }],
  });
  const game = makeItem('game', entry.title, true, entry);
  const other = makeItem('game', 'Forza Horizon');
  const run = (query) =>
    filteredItems(
      [game, other],
      'games',
      query,
      'All',
      'All platforms',
      'All launchers',
      'Title A–Z',
    );
  for (const query of [
    'Pokemon',
    'Pokémon',
    'pokemon za',
    'pokemon z-a',
    'pokemon Z A',
    'ZA pokemon',
    'pocket monsters',
    'pokemon switch',
  ])
    assert.deepEqual(
      run(query).map((g) => g.title),
      [title],
    );
  assert.equal(run('pokemon unrelated').length, 0);
  assert.equal(game.title, title);
  const roundtrip = JSON.parse(
    JSON.stringify({ ...seedCollection(), items: [game, other] }),
  );
  assert.ok(validCollection(roundtrip));
  assert.deepEqual(roundtrip.items[0].aliases, entry.aliases);
  assert.ok(validCollection({ ...seedCollection(), items: [other] }));
  assert.equal(
    validCollection({ ...roundtrip, items: [{ ...game, aliases: [42] }] }),
    false,
  );
});
test('bounded fallback includes aliases and compact spellings; instructions stay quoted', () => {
  const body = tokenSearchBody('pokemon za');
  assert.match(body, /alternative_names.name/);
  assert.match(body, /"z-a"/);
  assert.match(body, /"z a"/);
  assert.match(body, / & /);
  assert.ok(body.endsWith('limit 50;'));
  assert.equal(tokenSearchBody(' --- '), null);
  assert.ok(!tokenSearchBody('pokemon"; limit 500;').includes('limit 500;'));
});
