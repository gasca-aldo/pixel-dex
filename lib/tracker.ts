export type Kind = 'game' | 'console' | 'build';
export type Status = 'Backlog' | 'Playing' | 'Paused' | 'Completed' | 'Dropped';
export type Visibility = 'Private' | 'Unlisted' | 'Public';
export type Component = { id: string; type: string; name: string };
export type Upgrade = { date: string; type: string; from: string; to: string };
export type Item = {
  id: string;
  catalogId?: string;
  kind: Kind;
  title: string;
  owned: boolean;
  platform: string;
  launcher: string;
  format: string;
  status: Status;
  rating: number;
  notes: string;
  priority: string;
  releaseDate: string;
  releaseStatus?: 'date' | 'year' | 'tba' | 'released';
  edition: string;
  color: string;
  components: Component[];
  history: Upgrade[];
  createdAt: number;
};
export type CatalogItem = {
  id: string;
  title: string;
  kind: 'game' | 'console';
  platform: string;
  subtitle: string;
  cover?: string;
};
export type GameRef = { id: string; title: string; catalogId?: string };
export type GameListEntry = { game: GameRef; note: string };
export type GameList = {
  id: string;
  title: string;
  description: string;
  visibility: Visibility;
  ranked: boolean;
  entries: GameListEntry[];
  createdAt: number;
  updatedAt: number;
};
export type PlayerProfile = { name: string; bio: string; topGames: GameRef[] };
export type Collection = {
  version: 1;
  lists?: GameList[];
  profile?: PlayerProfile;
  collectionVisibility?: 'Private' | 'Public';
  items: Item[];
  visibility: Record<string, Visibility>;
  theme: 'dark' | 'light';
  view: 'grid' | 'list';
};
export const statuses: Status[] = [
  'Backlog',
  'Playing',
  'Paused',
  'Completed',
  'Dropped',
];
export const priorities = ['High', 'Medium', 'Low'];
export const componentTypes = [
  'CPU',
  'GPU',
  'Memory',
  'Motherboard',
  'Storage',
  'Power supply',
  'Case',
  'Cooling',
  'Other',
];
export const catalog: CatalogItem[] = [
  ['1245620', 'Elden Ring', 'FromSoftware · Action RPG'],
  ['1145360', 'Hades', 'Supergiant Games · Roguelike'],
  ['367520', 'Hollow Knight', 'Team Cherry · Metroidvania'],
  ['1091500', 'Cyberpunk 2077', 'CD PROJEKT RED · RPG'],
  ['413150', 'Stardew Valley', 'ConcernedApe · Life sim'],
  ['1174180', 'Red Dead Redemption 2', 'Rockstar Games · Adventure'],
  ['504230', 'Celeste', 'Maddy Makes Games · Platformer'],
  ['1086940', 'Baldur’s Gate 3', 'Larian Studios · RPG'],
  [
    '1850570',
    'Death Stranding Director’s Cut',
    'KOJIMA PRODUCTIONS · Adventure',
  ],
  ['632470', 'Disco Elysium', 'ZA/UM · RPG'],
  ['275850', 'No Man’s Sky', 'Hello Games · Exploration'],
  ['620', 'Portal 2', 'Valve · Puzzle'],
  ['2379780', 'Balatro', 'LocalThunk · Roguelike'],
  ['22320', 'The Elder Scrolls III: Morrowind', 'Bethesda · RPG'],
  ['105600', 'Terraria', 'Re-Logic · Sandbox'],
  ['1057090', 'Ori and the Will of the Wisps', 'Moon Studios · Platformer'],
].map(([id, title, subtitle]) => ({
  id,
  title,
  subtitle,
  kind: 'game' as const,
  platform: 'PC',
}));
catalog.push(
  ...[
    ['switch-oled', 'Nintendo Switch OLED', 'Nintendo', 'Hybrid console'],
    ['ps5', 'PlayStation 5', 'PlayStation', 'Home console'],
    ['series-x', 'Xbox Series X', 'Xbox', 'Home console'],
    ['steam-deck', 'Steam Deck OLED', 'PC', 'Handheld PC'],
    ['switch-lite', 'Nintendo Switch Lite', 'Nintendo', 'Handheld console'],
    ['ps2', 'PlayStation 2', 'PlayStation', 'Home console'],
    ['gameboy', 'Game Boy Advance SP', 'Nintendo', 'Handheld console'],
    ['series-s', 'Xbox Series S', 'Xbox', 'Home console'],
  ].map(([id, title, platform, subtitle]) => ({
    id,
    title,
    platform,
    subtitle,
    kind: 'console' as const,
  })),
);
export function makeItem(
  kind: Kind,
  title: string,
  owned = true,
  entry?: CatalogItem,
): Item {
  return {
    id: globalThis.crypto.randomUUID(),
    ...(entry ? { catalogId: entry.id } : {}),
    kind,
    title,
    owned,
    platform: entry?.platform || (kind === 'game' ? 'PC' : ''),
    launcher: kind === 'game' ? 'Steam' : '',
    format: 'Digital',
    status: 'Backlog',
    rating: 0,
    notes: '',
    priority: 'Medium',
    releaseDate: '',
    edition: 'Standard',
    color: '',
    components: [],
    history: [],
    createdAt: Date.now(),
  };
}
export function seedCollection(): Collection {
  const items: Item[] = catalog.slice(0, 16).map((entry, i) => ({
    ...makeItem('game', entry.title, i < 12, entry),
    id: `sample-game-${i}`,
    createdAt: 1000 - i,
    status:
      (
        [
          'Playing',
          'Playing',
          'Completed',
          'Playing',
          'Paused',
          'Backlog',
          'Completed',
          'Backlog',
          'Backlog',
          'Completed',
          'Backlog',
          'Completed',
        ] as Status[]
      )[i] || 'Backlog',
    launcher: i === 6 ? 'Epic Games' : i === 9 ? 'DRM Free' : 'Steam',
    rating: [5, 5, 5, 4, 4, 0, 5, 0, 0, 5, 0, 5][i] || 0,
    priority: i === 12 ? 'High' : 'Medium',
    notes:
      i === 0
        ? 'Taking my time with the Lands Between. Every detour feels worth it.'
        : i === 12
          ? 'Pick this up for the next long weekend.'
          : '',
  }));
  items.push(
    ...catalog
      .filter((x) => x.kind === 'console')
      .slice(0, 5)
      .map((entry, i) => ({
        ...makeItem('console', entry.title, i < 3, entry),
        id: `sample-console-${i}`,
        color: ['White', 'White', 'Carbon black', 'Black', 'Turquoise'][i],
        edition: i === 0 ? 'OLED model' : 'Standard',
        priority: i === 3 ? 'High' : 'Medium',
        createdAt: 900 - i,
      })),
  );
  items.push(
    {
      ...makeItem('build', 'The daily driver'),
      id: 'sample-build-1',
      notes: 'Work, worlds, and everything in between.',
      components: [
        { id: 'c1', type: 'CPU', name: 'AMD Ryzen 7 7800X3D' },
        { id: 'c2', type: 'GPU', name: 'NVIDIA GeForce RTX 4070 Super' },
        { id: 'c3', type: 'Memory', name: '32 GB DDR5-6000' },
        { id: 'c4', type: 'Motherboard', name: 'MSI B650 Tomahawk WiFi' },
        { id: 'c5', type: 'Storage', name: 'Samsung 990 Pro · 2 TB' },
        { id: 'c6', type: 'Power supply', name: 'Corsair RM750e · 750 W' },
        { id: 'c7', type: 'Case', name: 'Fractal Design North' },
        { id: 'c8', type: 'Cooling', name: 'Noctua NH-D15' },
      ],
      history: [
        {
          date: '2026-08-14',
          type: 'Storage',
          from: 'Samsung 970 EVO · 1 TB',
          to: 'Samsung 990 Pro · 2 TB',
        },
      ],
    },
    {
      ...makeItem('build', 'Living room build', false),
      id: 'sample-build-2',
      notes: 'A compact build for the TV. Quiet cooling is the priority.',
      components: [
        { id: 'p1', type: 'Case', name: 'Fractal Design Terra' },
        { id: 'p2', type: 'CPU', name: 'To be decided' },
        { id: 'p3', type: 'GPU', name: 'To be decided' },
      ],
    },
  );
  return {
    version: 1,
    items,
    visibility: {
      games: 'Private',
      consoles: 'Private',
      builds: 'Private',
      wishlist: 'Private',
      gameWishlist: 'Private',
      hardwareWishlist: 'Private',
    },
    theme: 'dark',
    view: 'grid',
  };
}
export function validCollection(value: unknown): value is Collection {
  if (!value || typeof value !== 'object') return false;
  const v = value as Collection;
  return (
    v.version === 1 &&
    validSocialData(v) &&
    ['dark', 'light'].includes(v.theme) &&
    ['grid', 'list'].includes(v.view) &&
    !!v.visibility &&
    ['games', 'consoles', 'builds', 'wishlist'].every((k) =>
      ['Private', 'Unlisted', 'Public'].includes(v.visibility[k]),
    ) &&
    Array.isArray(v.items) &&
    v.items.length <= 5000 &&
    new Set(v.items.map((i) => i?.id)).size === v.items.length &&
    v.items.every(
      (i) =>
        i &&
        typeof i.id === 'string' &&
        ['game', 'console', 'build'].includes(i.kind) &&
        typeof i.owned === 'boolean' &&
        [
          'title',
          'platform',
          'launcher',
          'format',
          'notes',
          'priority',
          'releaseDate',
          'edition',
          'color',
        ].every((k) => typeof i[k as keyof Item] === 'string') &&
        (!i.catalogId || typeof i.catalogId === 'string') &&
        (i.releaseStatus === undefined ||
          ['date', 'year', 'tba', 'released'].includes(i.releaseStatus)) &&
        statuses.includes(i.status) &&
        Number.isFinite(i.rating) &&
        i.rating >= 0 &&
        i.rating <= 5 &&
        Number.isFinite(i.createdAt) &&
        Array.isArray(i.components) &&
        i.components.every(
          (c) =>
            c &&
            ['id', 'type', 'name'].every(
              (k) => typeof c[k as keyof Component] === 'string',
            ),
        ) &&
        Array.isArray(i.history) &&
        i.history.every(
          (h) =>
            h &&
            ['date', 'type', 'from', 'to'].every(
              (k) => typeof h[k as keyof Upgrade] === 'string',
            ),
        ),
    )
  );
}
export function inSection(item: Item, section: string) {
  if (section === 'gameWishlist') return !item.owned && item.kind === 'game';
  if (section === 'hardwareWishlist')
    return !item.owned && (item.kind === 'console' || item.kind === 'build');
  return section === 'wishlist'
    ? !item.owned
    : item.owned &&
        item.kind ===
          { games: 'game', consoles: 'console', builds: 'build' }[section];
}
export function filteredItems(
  items: Item[],
  section: string,
  query: string,
  tab: string,
  platform: string,
  launcher: string,
  sort: string,
) {
  return items
    .filter((i) => inSection(i, section))
    .filter(
      (i) =>
        !query ||
        `${i.title} ${i.platform} ${i.launcher} ${i.edition} ${i.color}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .filter(
      (i) =>
        tab === 'All' ||
        (section === 'games' ? i.status === tab : i.kind === tab),
    )
    .filter((i) => platform === 'All platforms' || i.platform === platform)
    .filter(
      (i) =>
        launcher === 'All launchers' ||
        (i.platform === 'PC' && i.launcher === launcher),
    )
    .sort((a, b) =>
      sort === 'Title A–Z'
        ? a.title.localeCompare(b.title)
        : sort === 'Highest rated'
          ? b.rating - a.rating
          : sort === 'Priority'
            ? priorities.indexOf(a.priority) - priorities.indexOf(b.priority)
            : b.createdAt - a.createdAt,
    );
}
export function updateComponents(item: Item, next: Component[], date: string) {
  const changes: Upgrade[] = item.owned
    ? next
        .filter(
          (c) =>
            !item.components.some(
              (old) =>
                old.id === c.id && old.name === c.name && old.type === c.type,
            ),
        )
        .map((c) => ({
          date,
          type: c.type,
          from:
            item.components.find((old) => old.id === c.id)?.name ||
            'Not installed',
          to: c.name,
        }))
    : [];
  if (item.owned)
    item.components
      .filter((old) => !next.some((c) => c.id === old.id))
      .forEach((c) =>
        changes.push({ date, type: c.type, from: c.name, to: 'Removed' }),
      );
  return { ...item, components: next, history: [...changes, ...item.history] };
}

export function validGameRef(value: unknown): value is GameRef {
  if (!value || typeof value !== 'object') return false;
  const g = value as GameRef;
  return (
    typeof g.id === 'string' &&
    g.id.length > 0 &&
    g.id.length <= 200 &&
    typeof g.title === 'string' &&
    g.title.trim().length > 0 &&
    g.title.length <= 180 &&
    (g.catalogId === undefined || typeof g.catalogId === 'string')
  );
}
function distinctGames(games: GameRef[]) {
  return (
    new Set(games.map((g) => (g.catalogId ? `catalog:${g.catalogId}` : g.id)))
      .size === games.length
  );
}
export function validGameList(value: unknown): value is GameList {
  if (!value || typeof value !== 'object') return false;
  const l = value as GameList;
  return (
    typeof l.id === 'string' &&
    l.id.length > 0 &&
    typeof l.title === 'string' &&
    l.title.trim().length > 0 &&
    l.title.length <= 120 &&
    typeof l.description === 'string' &&
    l.description.length <= 3000 &&
    ['Private', 'Unlisted', 'Public'].includes(l.visibility) &&
    typeof l.ranked === 'boolean' &&
    Number.isFinite(l.createdAt) &&
    Number.isFinite(l.updatedAt) &&
    Array.isArray(l.entries) &&
    l.entries.length <= 500 &&
    l.entries.every(
      (e) =>
        e &&
        validGameRef(e.game) &&
        typeof e.note === 'string' &&
        e.note.length <= 3000,
    ) &&
    distinctGames(l.entries.map((e) => e.game))
  );
}
export function validSocialData(data: Collection) {
  return (
    (data.collectionVisibility === undefined ||
      ['Private', 'Public'].includes(data.collectionVisibility)) &&
    (data.lists === undefined ||
      (Array.isArray(data.lists) &&
        data.lists.length <= 200 &&
        data.lists.every(validGameList) &&
        new Set(data.lists.map((l) => l.id)).size === data.lists.length)) &&
    (data.profile === undefined ||
      (!!data.profile &&
        typeof data.profile.name === 'string' &&
        data.profile.name.trim().length > 0 &&
        data.profile.name.length <= 60 &&
        typeof data.profile.bio === 'string' &&
        data.profile.bio.length <= 500 &&
        Array.isArray(data.profile.topGames) &&
        data.profile.topGames.length <= 6 &&
        data.profile.topGames.every(validGameRef) &&
        distinctGames(data.profile.topGames)))
  );
}
export function collectionAccess(data: Collection): 'Private' | 'Public' {
  if (data.collectionVisibility) return data.collectionVisibility;
  // Keep a previously private section private when adopting the single setting.
  return [
    'games',
    'consoles',
    'builds',
    'gameWishlist',
    'hardwareWishlist',
  ].every((k) => (data.visibility[k] || data.visibility.wishlist) === 'Public')
    ? 'Public'
    : 'Private';
}
export function getProfile(data: Collection): PlayerProfile {
  return data.profile || { name: 'Player', bio: '', topGames: [] };
}
export function gameReference(value: Item | CatalogItem): GameRef {
  const catalogId = 'owned' in value ? value.catalogId : value.id;
  return {
    id: catalogId ? `catalog:${catalogId}` : `custom:${value.id}`,
    title: value.title,
    ...(catalogId ? { catalogId } : {}),
  };
}
export function gameChoices(items: Item[]): GameRef[] {
  const choices = new Map<string, GameRef>();
  for (const entry of catalog.filter((c) => c.kind === 'game')) {
    const ref = gameReference(entry);
    choices.set(ref.id, ref);
  }
  for (const item of items.filter((i) => i.kind === 'game')) {
    const ref = gameReference(item);
    if (!choices.has(ref.id)) choices.set(ref.id, ref);
  }
  return [...choices.values()];
}
export function newGameList(): GameList {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: '',
    description: '',
    visibility: 'Private',
    ranked: false,
    entries: [],
    createdAt: now,
    updatedAt: now,
  };
}
export function addListGame(list: GameList, game: GameRef): GameList {
  if (
    list.entries.some(
      (e) =>
        e.game.id === game.id ||
        (game.catalogId && e.game.catalogId === game.catalogId),
    )
  )
    return list;
  if (list.entries.length >= 500)
    throw new Error('A list can contain up to 500 games.');
  return {
    ...list,
    entries: [...list.entries, { game: cleanGameRef(game), note: '' }],
  };
}
export function moveListGame(
  list: GameList,
  from: number,
  to: number,
): GameList {
  if (
    !Number.isInteger(from) ||
    !Number.isInteger(to) ||
    from < 0 ||
    to < 0 ||
    from >= list.entries.length ||
    to >= list.entries.length
  )
    return list;
  const entries = [...list.entries];
  const [entry] = entries.splice(from, 1);
  entries.splice(to, 0, entry);
  return { ...list, entries };
}
export function cleanGameRef(game: GameRef): GameRef {
  return {
    id: game.id,
    title: game.title,
    ...(game.catalogId ? { catalogId: game.catalogId } : {}),
  };
}
export function listProjection(list: GameList) {
  return {
    id: list.id,
    title: list.title,
    description: list.description,
    ranked: list.ranked,
    entries: list.entries.map((e) => ({
      game: cleanGameRef(e.game),
      note: e.note,
    })),
  };
}
export function sharedList(data: Collection, id: string) {
  const list = data.lists?.find((l) => l.id === id);
  return list && list.visibility !== 'Private' ? listProjection(list) : null;
}
export function publicProfile(data: Collection) {
  const profile = getProfile(data);
  return {
    name: profile.name,
    bio: profile.bio,
    topGames: profile.topGames.map(cleanGameRef),
    lists: (data.lists || [])
      .filter((l) => l.visibility === 'Public')
      .map(listProjection),
    collection:
      collectionAccess(data) === 'Public'
        ? data.items.map((i) => ({
            id: i.id,
            title: i.title,
            kind: i.kind,
            owned: i.owned,
            platform: i.platform,
            ...(i.catalogId ? { catalogId: i.catalogId } : {}),
          }))
        : null,
  };
}
export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!,
  );
}
export function listSnapshot(list: GameList) {
  if (list.visibility === 'Private')
    throw new Error('Make the list Unlisted or Public before sharing.');
  const p = listProjection(list);
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(p.title)} · Pixel Dex</title><style>body{max-width:780px;margin:40px auto;padding:24px;font:16px/1.7 system-ui;background:#111115;color:#eeedf5}article{padding:24px 0;border-bottom:1px solid #34323e}p{white-space:pre-wrap}small{color:#aaa}h1{font-size:36px}</style><small>Pixel Dex · List snapshot</small><h1>${escapeHtml(p.title)}</h1><p>${escapeHtml(p.description)}</p>${p.entries.map((e, i) => `<article><h2>${p.ranked ? `${i + 1}. ` : ''}${escapeHtml(e.game.title)}</h2><p>${escapeHtml(e.note)}</p></article>`).join('')}</html>`;
}
