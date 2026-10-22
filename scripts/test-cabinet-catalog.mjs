import {test} from 'node:test';
import assert from 'node:assert/strict';
import {arcadeEntries,cabinetGames} from './build-cabinet-catalog.mjs';
const url='/arcade-review-games/social-studies/wwi-trench-run.html';
const card=(image='',title='WWI Trench Run')=>`<article class="card theme-trench"><a class="art" href="${url}">${image}<div class="icon">✦</div></a><h3 class="title">${title}</h3><p class="desc">Cross the trenches.</p><span class="badge subject">History &amp; Civics</span></article>`;
test('public tile artwork and alt text flow into Cabinet; replacing artwork keeps bookmark ID',async()=>{
 const first=(await cabinetGames(arcadeEntries(card('<img src="/review-lab/acorn-dash-preview.webp" alt="Trenches &amp; wire">'))))[0];
 const next=(await cabinetGames(arcadeEntries(card("<img src='/review-lab/review-pinball-preview.webp' alt='New artwork'>",'Updated title'))))[0];
 assert.equal(first.image,'/review-lab/acorn-dash-preview.webp');assert.equal(first.imageAlt,'Trenches & wire');
 assert.equal(next.image,'/review-lab/review-pinball-preview.webp');assert.equal(next.title,'Updated title');assert.equal(first.id,next.id);
});
test('unfinished artwork keeps symbol; new public titles populate on rebuild',async()=>{
 const entries=arcadeEntries(card()+card('','Survey').replace(url,'/arcade-review-games/survey-showdown/'));
 const games=await cabinetGames(entries);assert.equal(games.length,2);assert.equal(games[0].symbol,'✦');assert.equal(games[0].image,undefined);
});
test('missing artwork fails build clearly instead of publishing broken images',async()=>{
 await assert.rejects(cabinetGames(arcadeEntries(card('<img src="/missing-cabinet-art.webp">'))),/ENOENT/);
});
