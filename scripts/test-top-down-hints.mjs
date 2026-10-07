import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdventure,layouts} from '../public/arcade-review-games/shared/top-down/outpost.js';
import {createAdventure as courthouse} from '../public/arcade-review-games/shared/top-down/map.js';
import {createState,resetPuzzle} from '../public/arcade-review-games/shared/top-down/model.js';
import {createReview} from '../public/arcade-review-games/shared/top-down/review.js';
import {createMotion} from '../public/arcade-review-games/shared/top-down/motion.js';
import {hintFor,revealHint,hintSummary} from '../public/arcade-review-games/shared/top-down/hints.js';
import {encodeSave,decodeSave} from '../public/arcade-review-games/shared/top-down/save.js';
import {buildReport,reportText} from '../public/arcade-review-games/shared/top-down/report.js';
import {validateAdventure} from '../public/arcade-review-games/shared/top-down/validate.js';
import {content} from '../public/arcade-review-games/shared/top-down/scientific-method.js';

test('progressive hints count revealed levels, not repeat views, without changing learning or puzzle state',()=>{
  const map=createAdventure(),s=createState(map);s.review=createReview(map,content.questions);const before=structuredClone(s),hint=hintFor(map,s);
  assert.equal(hint.id,'dock-key');assert.equal(revealHint(s,hint).level,1);assert.equal(revealHint(s,hint).level,1);
  assert.equal(revealHint(s,hint,{more:true}).level,2);assert.equal(revealHint(s,hint,{more:true}).level,3);assert.equal(revealHint(s,hint,{more:true}).level,3);
  const copy={...s};delete copy.hints;assert.deepEqual(copy,before);assert.deepEqual(hintSummary(s),{revealed:3,puzzles:1});
  const report=buildReport(map,content,s,12);assert.equal(report.firstTryAccuracy,null);assert.equal(report.points.totalPoints,0);assert.match(reportText(report),/Puzzle hints revealed: 3/);
});
test('all nine maps adapt guidance to layout, earned items, receiver power, gates and crossings',()=>{
  for(const mode of ['explore','medium','hard'])for(const layout of layouts){
    const map=validateAdventure(createAdventure(mode,layout.id)),s=createState(map);
    s.keys.push('moss');assert.equal(hintFor(map,s).id,'dock-gate');
    s.opened.push('dock-gate');assert.equal(hintFor(map,s).id,'dock-route');
    s.player={x:3,y:4};let hint=hintFor(map,s);assert.equal(hint.id,'optics-mirror');
    assert.ok(hint.steps[2].includes(layout.id==='westward'?'west':layout.id==='southbound'?'south':'east'));
    const mirror=s.blocks.find(b=>b.kind==='mirror'),socket=map.decorations.find(d=>d.appearance==='mirror-target');Object.assign(mirror,{x:socket.x,y:socket.y,orientation:'\\'});
    assert.equal(hintFor(map,s).id,'optics-cross');s.opened.push('east-crossing');assert.equal(hintFor(map,s).id,'optics-lens');
    s.items.push('lens');assert.equal(hintFor(map,s).id,'optics-route');s.player={x:14,y:5};assert.equal(hintFor(map,s).id,'relay-cell');
    s.items.push('cell');if(mode!=='explore'){assert.equal(hintFor(map,s).id,'relay-crank');s.tools.push('crank');}
    assert.equal(hintFor(map,s).id,'relay-weights');
    s.blocks.filter(b=>b.kind!=='mirror').forEach((b,i)=>Object.assign(b,{x:map.plates[i].x,y:map.plates[i].y}));assert.equal(hintFor(map,s).id,'relay-route');
    s.player={x:16,y:9};if(mode!=='explore'){assert.equal(hintFor(map,s).id,'beacon-lift');s.opened.push('beacon-drawbridge');}
    assert.equal(hintFor(map,s).id,'beacon-finish');s.items=[];assert.equal(hintFor(map,s).id,'beacon-lens');s.items=['lens'];assert.equal(hintFor(map,s).id,'beacon-cell');
    if(mode!=='explore'){s.items.push('cell');s.tools=[];assert.equal(hintFor(map,s).id,'beacon-crank');}
  }
});
test('hint usage survives save and reset; help-copy changes and pre-hint saves stay compatible',()=>{
  const map=createAdventure('hard','westward'),s=createState(map);s.review=createReview(map,content.questions);revealHint(s,hintFor(map,s));
  const raw=encodeSave(map,content.questions,s,createMotion(s),12);
  const restored=decodeSave(raw,createAdventure,content.questions);assert.deepEqual(restored.state.hints,s.hints);
  resetPuzzle(restored.map,restored.state);assert.deepEqual(restored.state.hints,s.hints);
  assert.ok(decodeSave(raw,(mode,layout)=>{const updated=createAdventure(mode,layout);updated.hintRules[0].steps[0]='Updated help text';return updated;},content.questions));
  const oldMap={...map};delete oldMap.hintRules;delete s.hints;
  assert.ok(decodeSave(encodeSave(oldMap,content.questions,s,createMotion(s),12),createAdventure,content.questions));
  for(const hints of [null,[],{bad:0},{bad:4},{bad:'1'}]){
    s.hints=hints;assert.equal(decodeSave(encodeSave(map,content.questions,s,createMotion(s),12),createAdventure,content.questions),null);
  }
});
test('maps without authored hints receive safe objective and recovery guidance; malformed hints fail validation',()=>{
  const map=courthouse('hard'),s=createState(map),hint=hintFor(map,s);
  assert.equal(hint.steps.length,3);assert.match(hint.steps[2],/Reset puzzle/);assert.equal(hintSummary(s).revealed,0);
  for(const mutate of [m=>m.hintRules.push(m.hintRules[0]),m=>m.hintRules[0].steps=[],m=>m.hintRules[0].room='missing',m=>m.hintRules.find(h=>h.receiver).receiver='missing']){
    const invalid=createAdventure();mutate(invalid);assert.throws(()=>validateAdventure(invalid),/hint/);
  }
});
