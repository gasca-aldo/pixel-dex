import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {makeItem,seedCollection,validCollection,filteredItems} from '../lib/tracker.ts';
const source=readFileSync(new URL('../components/rating.tsx',import.meta.url),'utf8');
let compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext}}).outputText;
for(const name of ['react/jsx-runtime','react','lucide-react']) compiled=compiled.replaceAll(`from "${name}"`,`from "${import.meta.resolve(name)}"`).replaceAll(`from '${name}'`,`from '${import.meta.resolve(name)}'`);
const {RatingStars,RatingControl}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
test('half ratings create/edit and persistence/export/import preserve decimals and legacy integers',()=>{
 const collection=seedCollection(); const item=makeItem('game','Rating test');collection.items=[item];
 for(const rating of [3.5,4,4.5,0,.5,1,1.5,2,2.5,3,5]) {
  item.rating=rating; const restored=JSON.parse(JSON.stringify(collection));
  assert.equal(validCollection(restored),true);assert.equal(restored.items[0].rating,rating);
 }
 for(const rating of [-.5,.1,3.25,5.5,NaN,Infinity,'3.5']) {item.rating=rating;assert.equal(validCollection(collection),false);}
 assert.equal(validCollection(seedCollection()),true);
});
test('rating sorting stays numeric across fractional and full values',()=>{
 const items=[3.5,5,4,4.5,0].map(rating=>({...makeItem('game',String(rating)),rating}));
 assert.deepEqual(filteredItems(items,'games','','All','All platforms','All launchers','Highest rated').map(i=>i.rating),[5,4.5,4,3.5,0]);
});
test('shared display component renders a half star and accessible numeric value',()=>{
 const html=renderToStaticMarkup(React.createElement(RatingStars,{value:3.5}));
 assert.match(html,/aria-label="3.5 out of 5"/);assert.equal((html.match(/width:100%/g)||[]).length,3);assert.match(html,/width:50%/);
 const whole=renderToStaticMarkup(React.createElement(RatingStars,{value:4}));assert.doesNotMatch(whole,/width:50%/);
});
test('rating editor offers ten native keyboard radio choices and explicit clearing',()=>{
 const html=renderToStaticMarkup(React.createElement(RatingControl,{value:3.5,onChange:()=>{}}));
 assert.equal((html.match(/type="radio"/g)||[]).length,10);assert.match(html,/aria-label="0.5 out of 5"/);assert.match(html,/aria-label="5 out of 5"/);assert.match(html,/Clear rating/);
});
