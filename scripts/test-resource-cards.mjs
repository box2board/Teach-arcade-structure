import assert from 'node:assert/strict';
import {test} from 'node:test';
import {renderPlacements} from './build-resource-cards.mjs';
import {applyLibraryAvailability, restoreLibraryLinks} from './resource-cards/library-links.mjs';
import {brainEntries} from './build-cabinet-catalog.mjs';

const id = 'brain:chess';
const game = {id, title:'Chess & strategy', url:'/brain-arcade/chess/', description:'Plan the next move.'};
const catalog = new Map([[id,game]]);
const disabled = new Map([[game.url,game]]);
const list = '<!-- resource-list {"view":"more","items":["brain:chess"]} --><!-- /resource-list -->';
const single = '<!-- resource-card {"id":"brain:chess","view":"link"} --><!-- /resource-card -->';

test('one catalog edit propagates to compact and featured placements', () => {
  const html = renderPlacements(list+single,catalog,new Map()).html;
  assert.equal(html.match(/Chess &amp; strategy/g).length,2);
  const edited = new Map([[id,{...game,title:'New Chess',url:'/new-game/'}]]);
  const updated = renderPlacements(html,edited,new Map()).html;
  assert.equal(updated.match(/href="\/new-game\/"/g).length,2);
  assert.equal(updated.match(/New Chess/g).length,2);
  assert.equal(renderPlacements(updated,edited,new Map()).html,updated);
});

test('coming-soon placements stay visible and restore their original launch links', () => {
  const original = renderPlacements(list+single,catalog,new Map()).html;
  const paused = renderPlacements(original,catalog,disabled).html;
  assert.equal(paused.match(/Coming soon/g).length,2);
  assert.doesNotMatch(paused,/href=/);
  assert.equal(renderPlacements(paused,catalog,new Map()).html,original);
});

test('disabled public listings retain their Cabinet identity and accessible name on reopening', () => {
  const original = '<a class="game-card" data-resource-id="brain:chess" href="./chess/" aria-label="Play Chess"><h3>Chess</h3><p>Plan ahead.</p></a>';
  const html = applyLibraryAvailability(original,'/brain-arcade/index.html',disabled);
  assert.match(html,/aria-disabled="true"/);
  assert.doesNotMatch(html,/ href=/);
  assert.deepEqual(brainEntries(html),brainEntries(original));
  assert.equal(applyLibraryAvailability(html,'/brain-arcade/index.html',disabled),html);
  assert.equal(restoreLibraryLinks(html),original);
});

test('unknown cards and incomplete markers fail the build', () => {
  assert.throws(()=>renderPlacements(single,new Map(),new Map()),/Unknown resource/);
  assert.throws(()=>renderPlacements(list.replace('<!-- \/resource-list -->',''),catalog,new Map()),/Unpaired/);
});
