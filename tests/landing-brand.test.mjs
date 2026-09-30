import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Gamepad2} from 'lucide-react';
import ts from 'typescript';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
let code=ts.transpileModule(read('components/landing-page.tsx'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext}}).outputText;
for(const name of ['react/jsx-runtime','react','lucide-react'])code=code.replaceAll(`from "${name}"`,`from "${import.meta.resolve(name)}"`).replaceAll(`from '${name}'`,`from '${import.meta.resolve(name)}'`);
code=code.replace("from '@/lib/covers'",`from '${new URL('../lib/covers.ts',import.meta.url)}'`);
const {LandingPage}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const html=renderToStaticMarkup(React.createElement(LandingPage));
const text=html.replace(/<[^>]*>/g,' ').replaceAll('&#x27;',"'").replace(/\s+/g,' ');
test('reviewed landing copy retains headings and removes obsolete labels',()=>{
 for(const phrase of ["Keep the games you've played, the consoles you owned, what you're playing, your backlog, what you've dropped, and what you can't wait to see released.",'Every game is an experience to be remembered.','Keep a record of the games you have experienced across platforms and time.',"Games that you've finished but not necessarily keep.","You own these but haven't started yet.",'Games you needed a break from or just wanted to jump into something else for the moment.','No shame, just not for you.','Your current experience.','Write a quick note, leave a short review, or take the time to share the whole story you had with that game.','Consoles, handhelds and every hardware we play in can be as meaningful as the games themselves.',"Remember what you expected before release and eventually, what the game actually meant to you even if it didn't match the expectations.",'This is who you are as a player.','Build your Pixel Dex with what you’ve experienced and share it as you want.','It’s currently a WIP, so things will keep changing and improving as real players use it.'])assert.ok(text.includes(phrase),phrase);
 for(const phrase of ['Public Beta','Sample journal entries','Your gaming history','More than a checkmark','Beyond the games','Looking forward','Personal first. Shared your way.','This is who you are as a gamer.','There’s no backlog guilt in Pixel Dex.'])assert.ok(!text.includes(phrase),phrase);
 assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.equal((html.match(/<h2\b/g)||[]).length,5);
 assert.ok(!html.slice(html.indexOf('<footer')).includes('Your personal gaming journal.'));
});
test('landing navigation, accessible status controls, motion and layout safeguards remain',()=>{
 for(const url of ['/login?mode=signup','mailto:aldongasca@gmail.com','/privacy','/hardware-credits','/brand/pixel-dex-icon.svg'])assert.ok(html.includes(url));
 assert.equal((html.match(/aria-describedby="landing-status-/g)||[]).length,5);
 const css=read('app/landing.css');assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);assert.match(css,/grid-area: 1 \/ 1/);
});
test('canonical controller matches installed vector exactly and metadata shares assets',()=>{
 const expected=renderToStaticMarkup(React.createElement(Gamepad2,{size:24,color:'white'})).replace(/ class="[^"]*"/,'');
 assert.equal(read('public/brand/pixel-dex-icon.svg').trim(),expected);
 assert.match(read('app/layout.tsx'),/icons:/);assert.match(read('app/layout.tsx'),/pixel-dex-apple-touch-icon.png/);
 const manifest=JSON.parse(read('public/manifest.webmanifest'));assert.ok(manifest.icons.every(i=>i.src.startsWith('/brand/pixel-dex-app-icon')));
 for(const [name,size] of [['pixel-dex-icon-256.png',256],['pixel-dex-icon-512.png',512],['pixel-dex-app-icon-192.png',192],['pixel-dex-app-icon-512.png',512],['pixel-dex-apple-touch-icon.png',180]]){
 const bytes=readFileSync(new URL('../public/brand/'+name,import.meta.url));assert.equal(bytes.readUInt32BE(16),size);assert.equal(bytes.readUInt32BE(20),size);assert.equal(bytes[25],6,'RGBA PNG');
 }
 assert.match(read('docs/brand-workbook.md'),/A game doesn’t stop being part of your story when you finish it, drop it, or stop owning it\./);
});
