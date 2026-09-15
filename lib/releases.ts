import type { Item } from './tracker';
import {catalogReleaseWindow} from './catalog-releases.ts';
export type ReleaseStatus = 'date' | 'year' | 'tba' | 'released';
export function isReleaseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function releaseStatus(item: Item): ReleaseStatus {
  if (item.releaseStatus) return item.releaseStatus;
  if (/^\d{4}-\d{2}-\d{2}$/.test(item.releaseDate)) return 'date';
  if (/^\d{4}$/.test(item.releaseDate)) return 'year';
  // Every entry in the bundled sample catalog has already released.
  return item.catalogId ? 'released' : 'tba';
}
export function releaseLabel(item: Item) {
  const window=catalogReleaseWindow(item);
  if(window)return `${window.label} · ${window.kind==='month'?'Day':'Date'} TBA`;
  const status = releaseStatus(item);
  return status === 'released'
    ? 'Released'
    : status === 'tba'
      ? 'Date TBA'
      : status === 'year'
        ? `${item.releaseDate} · Date TBA`
        : new Date(item.releaseDate + 'T12:00:00').toLocaleDateString(
            undefined,
            { month: 'short', day: 'numeric', year: 'numeric' },
          );
}
export function daysUntil(date: string, today = todayKey()) {
  return Math.round(
    (Date.parse(date + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) /
      86400000,
  );
}
export function upcomingGroups(items: Item[], today = todayKey()) {
  const wishes = items.filter((i) => !i.owned);
  return {
    dates: wishes
      .filter(
        (i) =>
          releaseStatus(i) === 'date' &&
          isReleaseDate(i.releaseDate) &&
          i.releaseDate >= today,
      )
      .sort(
        (a, b) =>
          a.releaseDate.localeCompare(b.releaseDate) ||
          a.title.localeCompare(b.title),
      ),
    years: wishes
      .filter(
        (i) =>
          releaseStatus(i) === 'year' &&
          /^\d{4}$/.test(i.releaseDate) &&
          Number(i.releaseDate) >= Number(today.slice(0, 4)),
      )
      .sort(
        (a, b) =>
          a.releaseDate.localeCompare(b.releaseDate) ||
          a.title.localeCompare(b.title),
      ),
    tba: wishes
      .filter((i) => releaseStatus(i) === 'tba')
      .sort((a, b) => a.title.localeCompare(b.title)),
  };
}
export function nextThirtyDays(items: Item[], today = todayKey()) {
  return upcomingGroups(items, today).dates.filter(
    (i) => daysUntil(i.releaseDate, today) <= 30,
  );
}

export function upcomingSections(items: Item[], today = todayKey()) {
  const groups = upcomingGroups(items, today);
  const sections: {
    key: string;
    title: string;
    dated: boolean;
    items: Item[];
  }[] = [];
  const months = new Map<string, Item[]>();
  for (const item of groups.dates) {
    const month = item.releaseDate.slice(0, 7);
    const entries = months.get(month) || [];
    entries.push(item);
    months.set(month, entries);
  }
  const partials=groups.years.filter(i=>catalogReleaseWindow(i));
  for(const item of partials){
    const window=catalogReleaseWindow(item)!;
    if(window.kind==='month'&&window.end>=today)months.set(window.key,[...(months.get(window.key)||[]),item]);
  }
  for (const [month, entries] of [...months].sort(([a],[b])=>a.localeCompare(b))) {
    const date = new Date(`${month}-01T12:00:00`);
    const title = date.toLocaleDateString('en-US', {
      month: 'long',
      ...(month.slice(0, 4) !== today.slice(0, 4)
        ? { year: 'numeric' as const }
        : {}),
    });
    sections.push({ key: month, title, dated: true, items: entries });
  }
  const quarters=new Map<string,Item[]>();
  for(const item of partials){
    const window=catalogReleaseWindow(item)!;
    if(window.kind==='quarter'&&window.end>=today)quarters.set(window.key,[...(quarters.get(window.key)||[]),item]);
  }
  for(const [key,entries] of [...quarters].sort(([a],[b])=>a.localeCompare(b)))sections.push({key,title:catalogReleaseWindow(entries[0])!.label,dated:false,items:entries});
  const years = new Map<string, Item[]>();
  for (const item of groups.years) {
    if(catalogReleaseWindow(item))continue;
    const entries = years.get(item.releaseDate) || [];
    entries.push(item);
    years.set(item.releaseDate, entries);
  }
  for (const [year, entries] of years) {
    sections.push({
      key: `year-${year}`,
      title: `${year} · Date TBA`,
      dated: false,
      items: entries,
    });
  }
  if (groups.tba.length)
    sections.push({
      key: 'tba',
      title: 'To be announced',
      dated: false,
      items: groups.tba,
    });
  return sections;
}
