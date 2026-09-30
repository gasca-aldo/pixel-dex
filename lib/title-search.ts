/** Search-only keys: never rewrite displayed or saved titles. */
export function normalizeTitle(value: string): string {
  const words = value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[’'ʼ]/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(/\s+/u);
  const tokens: string[] = [];
  for (let i = 0; i < words.length; i++) {
    let word = words[i];
    if (/^[a-z]$/.test(word)) {
      while (i + 1 < words.length && /^[a-z]$/.test(words[i + 1]))
        word += words[++i];
    }
    if (word) tokens.push(word);
  }
  return tokens.join(' ');
}
export function titleSearchScore(
  title: string,
  query: string,
  aliases: readonly string[] = [],
): number {
  const q = normalizeTitle(query),
    name = normalizeTitle(title);
  if (!q) return 0;
  if (name === q) return 100;
  const alternatives = aliases.map(normalizeTitle);
  if (alternatives.includes(q)) return 95;
  const names = [name, ...alternatives];
  if (names.some((n) => n.startsWith(q + ' '))) return 90;
  const tokens = q.split(' ');
  if (names.some((n) => tokens.every((t) => n.split(' ').includes(t))))
    return 80;
  // All query tokens must still match; no cross-word substrings or typo guessing.
  if (
    names.some((n) =>
      tokens.every((t) => n.split(' ').some((w) => w.startsWith(t))),
    )
  )
    return 70;
  return 0;
}
export function matchesTitleSearch(
  query: string,
  ...fields: (string | undefined)[]
): boolean {
  const q = normalizeTitle(query);
  if (!q) return true;
  const words = fields.flatMap((field) =>
    normalizeTitle(field ?? '').split(' '),
  );
  return q
    .split(' ')
    .every((token) => words.some((word) => word.startsWith(token)));
}
