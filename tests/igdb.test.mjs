import test from 'node:test';
import assert from 'node:assert/strict';
import {mapGame,searchBody,isOfficialCandidate,rankGames,relatedBody,prefixBody,titleScore} from '../lib/igdb-map.ts';
import {makeItem,validCollection,seedCollection,gameReference} from '../lib/tracker.ts';
import {coverFor} from '../lib/covers.ts';
test('catalog IDs cannot collide with legacy Steam IDs and survive saving',()=>{
 const entry=mapGame({id:42,name:'Example',platforms:[{id:6,name:'PC (Microsoft Windows)'}],release_dates:[{platform:6,date:1893456000,y:2030,release_region:{region:'North America'},date_format:{format:'YYYYMMMMDD'}}]});
 const item=makeItem('game',entry.title,false,entry);
 assert.equal(item.catalogId,'igdb:42');assert.equal(item.platform,'PC');assert.equal(item.launcher,'');assert.equal(item.releaseDate,'2030-01-01');
 assert.equal(gameReference(item).catalogId,'igdb:42');
 assert.ok(validCollection({...seedCollection(),items:[item]}));
 assert.equal(coverFor(item.catalogId),'/api/catalog/cover/42');
 assert.equal(coverFor('igdb:../secret'),undefined);
});
test('year-only, quarter and unknown dates never fabricate an exact day',()=>{
 for(const format of ['YYYY','YYYYQ1','YYYYMMMM']){
 const game=mapGame({id:1,name:'Future',release_dates:[{date:1893456000,y:2030,release_region:{region:'North America'},date_format:{format}}]});
 assert.equal(game.releaseStatus,'year');assert.equal(game.releaseDate,'2030');
 }
 assert.equal(mapGame({id:1,name:'Unknown'}).releaseStatus,'tba');
});
test('release date belongs to the default platform',()=>{
 const entry=mapGame({id:1,name:'Port',platforms:[{id:48,name:'PlayStation 4'},{id:6,name:'PC (Microsoft Windows)'}],release_dates:[{platform:48,date:1577836800,y:2020,release_region:{region:'North America'},date_format:{format:'YYYYMMMMDD'}},{platform:6,date:1893456000,y:2030,release_region:{region:'North America'},date_format:{format:'YYYYMMMMDD'}}]});
 assert.equal(entry.platform,'PC');assert.equal(entry.releaseDate,'2030-01-01');
});
test('search text stays inside its quoted literal',()=>{
 const query='test"; limit 500; search "';
 assert.ok(searchBody(query).startsWith('search '+JSON.stringify(query)+';'));
 assert.ok(searchBody(query).endsWith('limit 50;'));
});

test('current IGDB date format preserves a confirmed day',()=>{
 const game=mapGame({id:1,name:'Dated',release_dates:[{date:1893456000,y:2030,release_region:{region:'North America'},date_format:{format:'YYYY-MM-DD'}}]});
 assert.equal(game.releaseDate,'2030-01-01');assert.equal(game.releaseStatus,'date');
});

test('unofficial types and keyword variants are excluded without guessing from names',()=>{
 for(const type of ['Mod','Standalone Mod','Fork']) assert.equal(isOfficialCandidate({id:1,name:'Example',game_type:{type}}),false);
 for(const name of ['unofficial','Fan Game','rom-hack','homebrew','unlicensed','bootleg']) assert.equal(isOfficialCandidate({id:1,name:'Example',keywords:[{name}]}),false);
 for(const type of ['Main Game','Port','Remake','Remaster','Expansion','DLC Addon']) assert.equal(isOfficialCandidate({id:1,name:'Official',game_type:{type}}),true);
 assert.equal(isOfficialCandidate({id:1,name:'ModNation Racers'}),true);
 assert.equal(isOfficialCandidate({id:1,name:'Official',keywords:[{name:'mod support'}]}),true);
});

test('exact game leads, followed by remake and nearby series entries, without fan games or duplicates',()=>{
 const gold={id:1,name:'Pokémon Gold Version',collections:[10],remakes:[2],first_release_date:100};
 const heart={id:2,name:'Pokémon HeartGold Version',collections:[10],first_release_date:400};
 const silver={id:3,name:'Pokémon Silver Version',collections:[10],first_release_date:100};
 const crystal={id:4,name:'Pokémon Crystal',collections:[10],first_release_date:130};
 const stadium={id:5,name:'Pokémon Stadium 2',first_release_date:130};
 const fan={id:6,name:'Pokémon Gold',keywords:[{name:'romhack'}]};
 assert.deepEqual(rankGames([stadium,crystal,fan,silver,heart,gold,gold],'pokemon gold',gold).map(g=>g.id),[1,2,3,4,5]);
 assert.ok(relatedBody(gold).includes('id = (2) | collections = (10)'));
 assert.equal(relatedBody({id:7,name:'Standalone'}),null);
});
test('ranking also works outside Pokémon and keeps direct matches ahead of related games',()=>{
 const original={id:1,name:'Resident Evil 4',remakes:[2],collections:[9]};
 const remake={id:2,name:'Resident Evil 4 Remake',collections:[9]};
 const sequel={id:3,name:'Resident Evil 5',collections:[9]};
 assert.deepEqual(rankGames([sequel,remake,original],'Resident Evil 4',original).map(g=>g.id),[1,2,3]);
});

test('unfinished titles work with and without accents',()=>{
 for(const query of ['pokémon g','pokémon gol','pokemon gol']) {
  assert.equal(titleScore('Pokémon Gold Version',query),90);
  assert.ok(prefixBody(query).includes('slug ~ "'+query.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ /g,'-')+'"*'));
 }
 assert.equal(titleScore('The Legend of Zelda: Breath of the Wild','the legend of zel'),90);
 assert.ok(prefixBody('zel').includes('slug ~ "zel"*'));
});
test('prefix inputs are quoted and cannot introduce query instructions',()=>{
 const query='abc"; limit 500;';
 assert.ok(prefixBody(query).includes('slug ~ \"abc-limit-500\"*'));
 assert.ok(!prefixBody(query).includes('limit 500;'));
 assert.ok(prefixBody('神奇').includes('name ~ '+JSON.stringify('神奇')+'*'));
 assert.ok(prefixBody(query).endsWith('limit 50;'));
 assert.ok(!prefixBody('神奇').includes('slug ~ ""'));
});
