import assert from 'node:assert/strict';
import { CrossingWorld } from '../public/arcade-review-games/crossing-quest/engine.js';
import bank from '../public/arcade-review-games/crossing-quest/questions.js';

// Search with real move/update calls. No teleports, injected acorns, protection,
// slowdown, or collision losses. Questions are answered incorrectly so academic
// rewards cannot hide an impossible route.
function copy(w) {
  return Object.assign(Object.create(CrossingWorld.prototype), {
    ...w, player: {...w.player}, from: {...w.from}, collected: new Set(w.collected), records: [...w.records]
  });
}
function settleQuestions(w) {
  while(w.state==='question') {
    w.answer((w.question.answer+1)%4);w.continueAnswer();
  }
}
function search(start,goal,score) {
  let frontier=[{world:start,path:[]}];const seen=new Set();
  for(let depth=0;depth<120;depth++) {
    const next=[];
    for(const node of frontier) {
      if(goal(node.world))return node;
      for(const direction of ['up','down','left','right','wait']) {
        const w=copy(node.world);
        if(direction!=='wait'&&!w.move(direction))continue;
        for(let tick=0;tick<7;tick++)w.update(.025);
        if(w.lives!==start.lives||w.shield!==0||w.state==='lost')continue;
        settleQuestions(w);w.invulnerable=0;
        const key=[w.stage,w.player.row,w.player.x,Math.round(w.time/.175),w.returning,[...w.collected].sort().join(',')].join(':');
        if(seen.has(key))continue;seen.add(key);
        next.push({world:w,path:[...node.path,direction]});
      }
    }
    next.sort((a,b)=>score(a.world)-score(b.world));frontier=next.slice(0,100);
    if(!frontier.length)break;
  }
  throw new Error('No collision-free path found');
}
for(const difficulty of ['relaxed','classic','challenge']) {
  let w=new CrossingWorld(bank,difficulty,()=>.72);w.start();w.shield=0;w.invulnerable=0;
  for(let stage=0;stage<3;stage++) {
    let steps=0;
    for(const [row,x,goal] of [
      [4,416,v=>v.checkpoint===4],
      [4,224,v=>v.collected.has(3)],
      [4,672,v=>v.collected.has(4)],
      [0,416,v=>v.returning],
      [8,416,v=>v.state==='transition'||v.state==='won']
    ]) {
      const result=search(w,goal,v=>Math.abs(v.player.row-row)*3+Math.abs(v.player.x-x)/64);
      w=result.world;steps+=result.path.length;
    }
    assert(w.stashed>=3*(stage+1));
    console.log(`PASS: ${difficulty}, ${w.route.name}, outbound + pickups + return, ${steps} moves/waits, no collisions`);
    if(stage<2){w.nextStage();w.invulnerable=0;}
  }
  assert.equal(w.state,'won');assert.equal(w.records.length,12);assert.equal(w.correct,0);
}
