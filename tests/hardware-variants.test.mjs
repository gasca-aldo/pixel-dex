import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {hardwareVariants,hardwarePhotos,hardwarePhotoFor,variantFor,selectHardwareVariant} from '../lib/hardware-variants.ts';
import {catalog,makeItem,seedCollection,validCollection} from '../lib/tracker.ts';
test('special edition selection persists the matching color and photo through a cloud round-trip',()=>{
 const base=makeItem('console','Nintendo Switch OLED',true,catalog.find(c=>c.id==='switch-oled'));
 const selected=selectHardwareVariant(base,'Zelda: Tears of the Kingdom Edition');
 assert.equal(selected.color,'Gold / White / Green');
 assert.equal(selected.edition,'The Legend of Zelda: Tears of the Kingdom Edition');
 const restored=JSON.parse(JSON.stringify({...seedCollection(),items:[selected]}));
 assert.ok(validCollection(restored));
 assert.equal(hardwarePhotoFor(restored.items[0]).src,'/hardware/oled-zelda.jpg');
 assert.equal(restored.items[0].id,base.id);
});
test('custom and uncataloged colors never borrow another variant photo',()=>{
 const base={catalogId:'switch-oled',edition:'Standard',color:'White'};
 assert.ok(hardwarePhotoFor(base));
 assert.equal(hardwarePhotoFor(selectHardwareVariant(base,'Custom / other')),undefined);
 assert.equal(hardwarePhotoFor({...base,color:'Transparent purple'}),undefined);
 assert.equal(hardwarePhotoFor(selectHardwareVariant(base,'Mario Red Edition')),undefined);
 assert.equal(variantFor({catalogId:'unknown'}),undefined);
});
test('catalog preview defaults do not overwrite older edition and color details',()=>{
 assert.ok(hardwarePhotoFor({catalogId:'switch-oled'}));
 const old={catalogId:'switch-oled',edition:'OLED model',color:'White'};
 assert.equal(hardwarePhotoFor(old),undefined);
 assert.equal(old.edition,'OLED model');
});
test('all variants reference a real catalog model and every photo has an asset and credit',()=>{
 for(const [id,variants] of Object.entries(hardwareVariants)){
  assert.ok(catalog.some(c=>c.id===id));
  assert.equal(new Set(variants.map(v=>v.label)).size,variants.length);
  for(const v of variants)if(v.photo)assert.ok(hardwarePhotos[v.photo]);
 }
 for(const photo of Object.values(hardwarePhotos)){
  assert.ok(existsSync(new URL('../public'+photo.src,import.meta.url)));
  assert.ok(photo.author);assert.ok(photo.source.startsWith('https://commons.wikimedia.org/'));
  assert.ok(photo.licenseUrl.startsWith('https://creativecommons.org/') || (photo.license==='Public domain' && photo.licenseUrl===photo.source+'#Licensing'));
 }
});

 test('the first five Nintendo search results have model photos and saved variant photos',()=>{
 for(const id of ['hw-nintendo-entertainment-system','hw-super-nintendo-entertainment-system','hw-nintendo-64','hw-nintendo-gamecube','hw-nintendo-wii']){
  const entry=catalog.find(c=>c.id===id);
  assert.ok(hardwarePhotoFor({catalogId:id}));
  assert.ok(hardwarePhotoFor(makeItem('console',entry.title,true,entry)));
 }
});
