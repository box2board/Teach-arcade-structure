import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {arcadeEntries,cabinetGames,toolEntries,cabinetTools,brainEntries,cabinetBrainGames} from './build-cabinet-catalog.mjs';
import {validateCatalog} from '../public/teacher/catalog-contract.js';
import {TOOLS,CABINET_GAMES} from '../public/teacher/cabinet-catalog.js';
const url='/arcade-review-games/social-studies/wwi-trench-run.html';
const card=(image='',title='WWI Trench Run',href=url,id='arcade:'+url)=>`<article class="card theme-trench" data-resource-id="${id}"><a class="art" href="${href}">${image}<div class="icon">✦</div></a><h3 class="title">${title}</h3><p class="desc">Cross the trenches.</p><span class="badge subject">History &amp; Civics</span></article>`;
const tool=(id='timer',href='/tools/timer.html',title='Timer',image='')=>`<a class="card-link" data-resource-id="${id}" href="${href}">${image}<div class="emoji">◷</div><h3>${title}</h3><p>Time a classroom activity.</p></a>`;
test('public tile artwork and alt text flow into Cabinet; replacing artwork keeps bookmark ID',async()=>{
 const first=(await cabinetGames(arcadeEntries(card('<img src="/review-lab/acorn-dash-preview.webp" alt="Trenches &amp; wire">'))))[0];
 const next=(await cabinetGames(arcadeEntries(card("<img src='/review-lab/review-pinball-preview.webp' alt='New artwork'>",'Updated title'))))[0];
 assert.equal(first.image,'/review-lab/acorn-dash-preview.webp');assert.equal(first.imageAlt,'Trenches & wire');
 assert.equal(next.image,'/review-lab/review-pinball-preview.webp');assert.equal(next.title,'Updated title');assert.equal(first.id,next.id);
});
test('unfinished artwork keeps symbol; new public titles populate on rebuild',async()=>{
 const games=await cabinetGames(arcadeEntries(card()+card('','Survey','/arcade-review-games/survey-showdown/','survey-test')));
 assert.equal(games.length,2);assert.equal(games[0].symbol,'✦');assert.equal(games[0].image,undefined);
});
test('missing artwork fails build clearly instead of publishing broken images',async()=>{
 await assert.rejects(cabinetGames(arcadeEntries(card('<img src="/missing-cabinet-art.webp">'))),/ENOENT/);
});
test('tools come from the public library, including previously omitted cards',async()=>{
 const html=await readFile(new URL('../public/tools/index.html',import.meta.url),'utf8'),entries=toolEntries(html),generated=await cabinetTools(entries);
 assert.deepEqual(TOOLS,generated);assert.ok(entries.length>=18);
 for(const id of ['noise-meter','prompt-generator','text-randomizer','bell-ringers','exit-tickets','icebreakers'])assert.ok(TOOLS.some(t=>t.id===id));
});
test('adding a public tool card exposes it automatically without another Cabinet entry',async()=>{
 const before=await cabinetTools(toolEntries(tool())),after=await cabinetTools(toolEntries(tool()+tool('new-resource','/tools/noise-meter.html','New classroom tool')));
 assert.equal(before.length,1);assert.equal(after.length,2);assert.equal(after[1].id,'new-resource');assert.equal(after[1].title,'New classroom tool');
});
test('game and tool IDs survive launch URL changes as well as title and artwork updates',async()=>{
 const previous=(await cabinetGames(arcadeEntries(card())))[0],updated=(await cabinetGames(arcadeEntries(card('','New game title','/arcade-review-games/survey-showdown/'))))[0];
 assert.equal(previous.id,updated.id);assert.notEqual(previous.url,updated.url);
 const oldTool=(await cabinetTools(toolEntries(tool())))[0],newTool=(await cabinetTools(toolEntries(tool('timer','/tools/name-picker.html','Renamed timer','<img src="/review-lab/acorn-dash-preview.webp" alt="Tool artwork">'))))[0];
 assert.equal(oldTool.id,newTool.id);assert.equal(newTool.imageAlt,'Tool artwork');assert.equal(newTool.title,'Renamed timer');
});
test('all original tool and game bookmark IDs remain registered',async()=>{
 const oldIds=['group-maker','name-picker','wheel','timer','buzzer','graphic-organizers','flashcards','timeline-creator','graphing-calculator','pdf-workspace','citycanvas','block-builder'];
 for(const id of oldIds)assert.ok(TOOLS.some(t=>t.id===id),id);
 const originalGameIds=["arcade:/arcade-review-games/territory-takedown/", "arcade:/arcade-review-games/survey-showdown/", "arcade:/simulations/colony-builder/", "arcade:/arcade-review-games/territory-takedown/french-revolution/", "arcade:/arcade-review-games/social-studies/wwi-trench-run.html", "arcade:/arcade-review-games/social-studies/pyramid-escape-run.html", "arcade:/arcade-review-games/social-studies/cold-war-shadow-run/", "arcade:/arcade-review-games/social-studies/constitution-courthouse-run.html", "arcade:/arcade-review-games/science/volcano-ascent/", "arcade:/arcade-review-games/science/moon-mission-run.html", "arcade:/arcade-review-games/science/concept-stack-cells/", "arcade:/arcade-review-games/science/scientific-method.html", "arcade:/arcade-review-games/math/algebra-city-run.html", "arcade:/arcade-review-games/math/slope-street-sprint.html", "arcade:/arcade-review-games/math/math-track-racer.html", "arcade:/arcade-review-games/math/math-rush-genesis-addition.html", "arcade:/arcade-review-games/ela/grammar-gauntlet.html", "arcade:/arcade-review-games/ela/undertext-rifts-mood-tone.html"];
 for(const id of originalGameIds)assert.ok(CABINET_GAMES.some(g=>g.id===id),id);
});
test('missing permanent IDs, duplicate IDs/URLs, missing pages and unsafe URLs block publication',async()=>{
 await assert.rejects(cabinetTools(toolEntries(tool(''))),/permanent ID/);
 await assert.rejects(cabinetTools(toolEntries(tool()+tool('timer','/tools/noise-meter.html'))),/Duplicate permanent ID/);
 await assert.rejects(cabinetTools(toolEntries(tool()+tool('second-id'))),/Duplicate launch URL/);
 await assert.rejects(cabinetTools(toolEntries(tool('missing','/tools/nonexistent-catalog-fixture.html'))),/ENOENT/);
 await assert.rejects(cabinetGames(arcadeEntries(card()+card())),/Duplicate permanent ID/);
 for(const url of ['//other.example/tool','https://other.example/tool','/../private','/%2e%2e/private','/tools/\\secret'])assert.throws(()=>validateCatalog([{id:'test',title:'Test',description:'Test',url}]));
});
test('public tool parsing supports reordered attributes, extra classes and quote styles',()=>{
 const entries=toolEntries("<a data-resource-id='sample' href='/tools/timer.html' class='highlight card-link'><h3>Timer &amp; more</h3><p>Time things.</p></a>");assert.equal(entries.length,1);assert.equal(entries[0].title,'Timer & more');assert.equal(entries[0].id,'sample');
});

test('every public Brain Arcade game is available in Cabinet Explore without changing bookmarks',async()=>{
 const entries=brainEntries(await readFile(new URL('../public/brain-arcade/index.html',import.meta.url),'utf8'));
 const games=await cabinetBrainGames(entries);assert.ok(games.length>=21);
 for(const game of games){const actual=CABINET_GAMES.find(g=>g.id===game.id);assert.deepEqual(actual,game);assert.equal(actual.chooseTopic,undefined);}
});
