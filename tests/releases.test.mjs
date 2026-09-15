import test from 'node:test';
import assert from 'node:assert/strict';
import { makeItem, seedCollection, validCollection } from '../lib/tracker.ts';
import {
  upcomingGroups,
  upcomingSections,
  nextThirtyDays,
  releaseStatus,
  isReleaseDate,
  daysUntil,
  releaseLabel,
} from '../lib/releases.ts';
import {applyCatalogRelease} from '../lib/catalog-releases.ts';
const wish = (title, status, date, kind = 'game') => ({
  ...makeItem(kind, title, false),
  releaseStatus: status,
  releaseDate: date,
});
const partial=(title,format,date,year='2027')=>applyCatalogRelease({...wish(title,'year',year),platform:'PC',releaseSource:'catalog',releaseCatalog:{checkedAt:1,platforms:[{id:6,name:'PC'}],dates:[{platform:6,region:'Worldwide',date,year,format,status:''}]}});
test('month and quarter labels retain precision through storage without creating day-specific reminders',()=>{
 const month=partial('Month','YYYYMMMM','2027-02-01');
 const quarter=partial('Quarter','YYYYQ2','2027-04-01');
 assert.equal(releaseLabel(JSON.parse(JSON.stringify(month))),'February 2027 · Day TBA');
 assert.equal(releaseLabel(quarter),'Q2 2027 · Date TBA');
 assert.deepEqual(nextThirtyDays([month,quarter],'2027-02-01'),[]);
 assert.ok(validCollection({...seedCollection(),items:[month,quarter]}));
 assert.equal(releaseLabel({...month,releaseSource:'manual'}),'2027 · Date TBA');
});
test('partial months join the correct chronological month and quarters follow months before year and TBA',()=>{
 const items=[partial('Month','YYYYMMMM','2027-02-01'),wish('Exact','date','2027-02-20'),partial('Quarter','YYYYQ2','2027-04-01'),partial('Old quarter','YYYYQ1','2026-01-01','2026'),wish('Year','year','2027'),wish('TBA','tba','')];
 assert.deepEqual(upcomingSections(items,'2027-02-15').map(s=>[s.title,s.items.map(i=>i.title)]),[['February',['Exact','Month']],['Q2 2027',['Quarter']],['2027 · Date TBA',['Year']],['To be announced',['TBA']]]);
 assert.deepEqual(upcomingSections([partial('Past month','YYYYMMMM','2027-01-01'),partial('Past quarter','YYYYQ1','2027-01-01')],'2027-04-01'),[]);
});
test('upcoming sorts exact dates before year-only and TBA while excluding past and owned entries', () => {
  const items = [
    wish('TBA', 'tba', ''),
    wish('Next year', 'year', '2027'),
    wish('Later', 'date', '2026-10-01'),
    wish('Soon', 'date', '2026-09-08'),
    wish('Old year', 'year', '2025'),
    wish('Yesterday', 'date', '2026-09-06'),
    wish('Released', 'released', ''),
    { ...wish('Owned', 'date', '2026-09-09'), owned: true },
    wish('This year', 'year', '2026', 'console'),
  ];
  const groups = upcomingGroups(items, '2026-09-07');
  assert.deepEqual(
    groups.dates.map((i) => i.title),
    ['Soon', 'Later'],
  );
  assert.deepEqual(
    groups.years.map((i) => i.title),
    ['This year', 'Next year'],
  );
  assert.deepEqual(
    groups.tba.map((i) => i.title),
    ['TBA'],
  );
});
test('30-day reminders include today and day 30 across a year boundary, but not day 31 or year-only dates', () => {
  const items = [
    wish('Today', 'date', '2026-12-15'),
    wish('Day 30', 'date', '2027-01-14', 'console'),
    wish('Day 31', 'date', '2027-01-15'),
    wish('Year', 'year', '2027'),
  ];
  assert.deepEqual(
    nextThirtyDays(items, '2026-12-15').map((i) => i.title),
    ['Today', 'Day 30'],
  );
  assert.equal(daysUntil('2027-01-14', '2026-12-15'), 30);
});
test('old backups retain compatibility and already released sample catalog items are not advertised as future releases', () => {
  const data = seedCollection();
  assert.equal(validCollection(JSON.parse(JSON.stringify(data))), true);
  assert.equal(
    releaseStatus(data.items.find((i) => !i.owned && i.kind === 'game')),
    'released',
  );
  const legacy = makeItem('game', 'Legacy custom', false);
  legacy.releaseDate = '2027';
  assert.equal(releaseStatus(legacy), 'year');
  const dated = wish('New entry', 'date', '2027-01-01');
  assert.equal(validCollection({ ...data, items: [dated] }), true);
});
test('impossible dates never enter release ordering', () => {
  assert.equal(isReleaseDate('2027-02-29'), false);
  assert.equal(isReleaseDate('2028-02-29'), true);
  assert.equal(isReleaseDate('2027-99-99'), false);
  assert.deepEqual(
    upcomingGroups([wish('Invalid', 'date', '2027-99-99')], '2026-09-07').dates,
    [],
  );
});

test('monthly sections omit empty months, distinguish next-year months, and put year-only and TBA entries last', () => {
  const items = [
    wish('January', 'date', '2027-01-02'),
    wish('September', 'date', '2026-09-12'),
    wish('December late', 'date', '2026-12-29'),
    wish('December early', 'date', '2026-12-02'),
    wish('Year only', 'year', '2027'),
    wish('Unannounced', 'tba', ''),
  ];
  const sections = upcomingSections(items, '2026-09-07');
  assert.deepEqual(
    sections.map((s) => s.title),
    [
      'September',
      'December',
      'January 2027',
      '2027 · Date TBA',
      'To be announced',
    ],
  );
  assert.deepEqual(
    sections[1].items.map((i) => i.title),
    ['December early', 'December late'],
  );
  assert.deepEqual(upcomingSections([], '2026-09-07'), []);
});
