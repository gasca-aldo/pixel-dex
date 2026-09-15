import test from 'node:test';
import assert from 'node:assert/strict';
import {hardwareCatalog,hardwareCategory} from '../lib/hardware-catalog.ts';
import {makeItem,seedCollection,validCollection,inSection,filteredItems} from '../lib/tracker.ts';
test('catalog has unique identifiers and preserves existing model references',()=>{
 assert.ok(hardwareCatalog.length>150);assert.equal(new Set(hardwareCatalog.map(x=>x.id)).size,hardwareCatalog.length);
 for(const id of ['switch-oled','ps5','series-x','steam-deck','switch-lite','ps2','gameboy','series-s'])assert.ok(hardwareCatalog.some(c=>c.id===id));
 assert.equal(hardwareCategory({kind:'console',catalogId:'steam-deck'}),'Handhelds');
 assert.equal(hardwareCategory({kind:'console',catalogId:'ps5'}),'Consoles');
});
test('special editions and custom hardware categories survive cloud payload round-trips',()=>{
 const entry=hardwareCatalog.find(c=>c.title.includes('Astro Bot'));
 const item=makeItem('console',entry.title,true,entry);
 assert.equal(item.hardwareCategory,'Controllers');assert.equal(item.edition,'Astro Bot Limited Edition');
 const data=JSON.parse(JSON.stringify({...seedCollection(),items:[item]}));assert.ok(validCollection(data));
 assert.equal(hardwareCategory(data.items[0]),'Controllers');
 assert.equal(validCollection({...data,items:[{...item,hardwareCategory:'Invalid'}]}),false);
});
test('hardware contains owned PCs and devices while wishlists remain separate',()=>{
 const pc=makeItem('build','My PC'),wish=makeItem('build','Planned PC',false),controller=makeItem('console','Controller');
 assert.equal(inSection(pc,'consoles'),true);assert.equal(inSection(wish,'consoles'),false);assert.equal(inSection(wish,'hardwareWishlist'),true);
 assert.equal(hardwareCategory(pc),'PCs');
 assert.equal(filteredItems([pc,wish,controller],'consoles','','All','All platforms','All launchers','Title A–Z').length,2);
});
