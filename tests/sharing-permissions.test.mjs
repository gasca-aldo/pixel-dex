import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const owner='11111111-1111-4111-8111-111111111111';
const stranger='22222222-2222-4222-8222-222222222222';
test('Supabase sharing enforces owner, public, unlisted and private boundaries', async t=>{
 const db=new PGlite();
 try {
 await db.exec(`create role anon; create role authenticated; create schema auth;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;
 insert into auth.users values('${owner}'),('${stranger}');`);
 for(const name of ['202609080001_account_libraries.sql','202609080002_shared_pages.sql']) await db.exec(await readFile(new URL('../supabase/migrations/'+name,import.meta.url),'utf8'));
 async function as(role,id=''){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role '+role);}
 const makeList=(id,visibility)=>({id,title:'Best games',description:'Description',visibility,ranked:false,entries:[{game:{id:'game',title:'Game',privateExtra:'HIDDEN'},note:id+'-note',extra:'HIDDEN'}]});
 const library={version:1,items:[{id:'item',title:'Game',kind:'game',owned:true,platform:'PC',notes:'PERSONAL_SECRET',history:['HIDDEN']}],collectionVisibility:'Private',profile:{name:'Aldo',bio:'Bio',email:'HIDDEN',topGames:[{id:'game',title:'Game',notes:'HIDDEN'}]},lists:[makeList('public','Public'),makeList('unlisted','Unlisted'),makeList('private','Private')]};
 await as('authenticated',owner);
 await db.query('select public.save_account_library($1,0,$2)',[library,owner]);
 await db.query("select public.claim_profile_handle('aldo')");
 const addresses=Object.fromEntries((await db.query('select list_id,slug from public.list_addresses')).rows.map(r=>[r.list_id,r.slug]));
 const profile=async()=> (await db.query("select public.read_shared_profile('aldo') as value")).rows[0].value;
 const list=async id=>(await db.query("select public.read_shared_list('aldo',$1) as value",[addresses[id]])).rows[0].value;
 await t.test('anonymous profile includes only public lists, no private collection or extra fields',async()=>{
  await as('anon');const p=await profile();assert.deepEqual(p.lists.map(l=>l.id),['public']);assert.equal(p.collection,null);assert(!JSON.stringify(p).includes('HIDDEN'));assert(!JSON.stringify(p).includes('PERSONAL_SECRET'));assert.equal(p.lists[0].entries[0].note,'public-note');
 });
 await t.test('unlisted direct links include their notes; private and missing links return null',async()=>{
  assert.equal((await list('unlisted')).list.entries[0].note,'unlisted-note');assert.equal(await list('private'),null);assert.equal((await db.query("select public.read_shared_list('aldo','missing') as value")).rows[0].value,null);
 });
 await t.test('anonymous callers cannot access tables or invoke writes',async()=>{
  await assert.rejects(db.query('select * from public.account_libraries'));
  await assert.rejects(db.query('select * from public.list_addresses'));
  await assert.rejects(db.query('select public.save_account_library($1,1,$2)',[library,owner]));
  await assert.rejects(db.query("select public.claim_profile_handle('intruder')"));
 });
 await t.test('another account cannot read owner rows, private lists, or impersonate owner',async()=>{
  await as('authenticated',stranger);assert.equal((await db.query('select * from public.account_libraries')).rows.length,0);assert.equal((await db.query('select * from public.profile_handles')).rows.length,0);assert.equal(await list('private'),null);
  await assert.rejects(db.query('select public.save_account_library($1,1,$2)',[library,owner]));
  await assert.rejects(db.query("select public.claim_profile_handle('aldo')"));
 });
 await t.test('two accounts save and reload different independent collections',async()=>{
  await as('authenticated',stranger);
  const separate={...library,items:[{id:'second-only',title:'Second account game'}],lists:[]};
  await db.query('select public.save_account_library($1,0,$2)',[separate,stranger]);
  let rows=(await db.query('select user_id,payload from public.account_libraries')).rows;
  assert.equal(rows.length,1);assert.equal(rows[0].user_id,stranger);assert.equal(rows[0].payload.items[0].id,'second-only');
  await as('authenticated',owner);rows=(await db.query('select user_id,payload from public.account_libraries')).rows;
  assert.equal(rows.length,1);assert.equal(rows[0].user_id,owner);assert.equal(rows[0].payload.items[0].id,'item');
 });
 await t.test('owner reads private notes and stale saves fail',async()=>{
  await as('authenticated',owner);assert.equal((await list('private')).list.entries[0].note,'private-note');
  await assert.rejects(db.query('select public.save_account_library($1,0,$2)',[library,owner]));
 });
 await t.test('privacy changes revoke old links and titles retain stable addresses',async()=>{
  library.lists[0].visibility='Private';library.lists[1].title='New title';library.collectionVisibility='Public';
  await db.query('select public.save_account_library($1,1,$2)',[library,owner]);
  await as('anon');assert.equal(await list('public'),null);assert.equal((await list('unlisted')).list.title,'New title');
  const p=await profile();assert.equal(p.lists.length,0);assert.equal(p.collection.length,1);assert(!JSON.stringify(p).includes('PERSONAL_SECRET'));
 });
 await t.test('deleted lists stop resolving through old links',async()=>{
  await as('authenticated',owner);library.lists=[];await db.query('select public.save_account_library($1,2,$2)',[library,owner]);
  await as('anon');assert.equal(await list('unlisted'),null);
 });
 } finally {await db.close();}
});
