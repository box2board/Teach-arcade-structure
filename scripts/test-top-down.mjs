import test from 'node:test';
import assert from 'node:assert/strict';
import { adventure as map } from '../public/arcade-review-games/shared/top-down/map.js';
import {createState,move,interact,doorOpen,completeChallenge,undo,resetPuzzle,shuffle,exitReady,obstacle,inventoryEntries,adventureResults} from '../public/arcade-review-games/shared/top-down/model.js';
const walk=(state,dir,count=1)=>{for(let i=0;i<count;i++)assert.equal(move(map,state,dir),true,`${dir} at ${JSON.stringify(state.player)}`);};
function walkTo(s,x,y) {
 const queue=[{x:s.player.x,y:s.player.y,path:[]}], seen=new Set();
 while(queue.length) {
   const here=queue.shift();if(here.x===x&&here.y===y){for(const dir of here.path)walk(s,dir);return;}
   for(const [dir,dx,dy] of [['up',0,-1],['down',0,1],['left',-1,0],['right',1,0]]) {
     const next={x:here.x+dx,y:here.y+dy}, key=next.x+','+next.y;
     if(seen.has(key)||obstacle(map,s,next)||s.blocks.some(b=>b.x===next.x&&b.y===next.y))continue;
     seen.add(key);queue.push({...next,path:[...here.path,dir]});
   }
 }
 throw Error('No walking route to '+x+','+y);
}
function collectVaultCrystal(s) {
 walkTo(s,12,9);
 assert.deepEqual(s.tools,['hammer']);
 walkTo(s,4,5);walk(s,'up');
 assert.equal(s.opened.includes('vault-wall'),true);
 walkTo(s,4,2);
 assert.deepEqual(s.items,['seal-crystal']);
}
function firstSeal(state){walk(state,'up',3);walk(state,'right',2);assert.equal(doorOpen(map,state,map.doors[0]),true);walk(state,'up');walk(state,'right',2);walk(state,'down');walk(state,'right',2);}
test('full adventure can be completed using real movement and interactions',()=>{
 const s=createState(map);firstSeal(s);
 walk(s,'up',3);walk(s,'right');assert.deepEqual(interact(map,s),{type:'challenge',id:'archive'});
 s.attempts.archive=1;assert.equal(completeChallenge(map,s,'archive'),true);assert.equal(completeChallenge(map,s,'archive'),false);assert.equal(s.score,100);
 collectVaultCrystal(s);walkTo(s,13,6);walk(s,'right');assert.equal(s.opened.includes('east'),true);assert.equal(s.keys.length,0);
 walk(s,'right');walk(s,'up',3);assert.equal(move(map,s,'right'),false);interact(map,s);
 walk(s,'down',3);walk(s,'right',2);assert.equal(move(map,s,'right'),false);interact(map,s);
 walk(s,'left',2);walk(s,'up',3);assert.equal(move(map,s,'right'),false);interact(map,s);
 walk(s,'down',7);walk(s,'right',3);assert.equal(interact(map,s).type,'win');assert.equal(s.won,true);assert.equal(s.items.includes('explorer-token'),false);assert.equal(move(map,s,'left'),false);
});
test('locked gates cannot be bypassed and final exit needs both switches',()=>{
 const s=createState(map);walk(s,'up',3);walk(s,'up');walk(s,'right',4);walk(s,'down');assert.equal(move(map,s,'right'),false);
 s.player={x:18,y:10};assert.equal(interact(map,s).type,'message');assert.equal(s.won,false);
});
test('undo restores a pushed block and resetting a stuck puzzle preserves rewards',()=>{
 const s=createState(map);walk(s,'up',3);walk(s,'right');assert.equal(s.blocks[0].x,4);undo(s);assert.equal(s.blocks[0].x,3);assert.deepEqual(s.player,{x:2,y:6});
 s.attempts.archive=2;completeChallenge(map,s,'archive');s.activated.push('north-switch');resetPuzzle(map,s);
 assert.deepEqual(s.player,map.start);assert.deepEqual(s.blocks,map.blocks);assert.deepEqual(s.keys,['archive']);assert.deepEqual(s.activated,['north-switch']);assert.equal(s.score,50);
 const fresh=createState(map);assert.equal(fresh.score,0);assert.equal(fresh.keys.length,0);assert.equal(fresh.history.length,0);
});
test('question shuffling preserves correct-answer identity and source data',()=>{
 const items=['answer','b','c'];const result=shuffle(items,()=>0);assert.deepEqual(items,['answer','b','c']);assert.deepEqual(new Set(result),new Set(items));assert.notDeepEqual(result,items);
});

test('signal sequence rejects wrong order and does not open after only two signals',()=>{
 const s=createState(map);s.items.push('seal-crystal');const exit=map.objects.find(o=>o.type==='exit');
 s.player={x:17,y:6};s.facing='right';interact(map,s);
 assert.equal(s.sequences.signals,0);
 s.player={x:15,y:3};s.facing='right';interact(map,s);
 s.player={x:17,y:6};interact(map,s);
 assert.equal(s.sequences.signals,2);assert.equal(exitReady(map,s,exit),false);
 s.player={x:15,y:3};interact(map,s);
 assert.equal(exitReady(map,s,exit),true);
 interact(map,s);assert.equal(s.sequences.signals,3);
});

test('hammer gate cannot be bypassed; collection and recovery preserve the tool and crystal',()=>{
 const s=createState(map);
 walk(s,'up',3);walk(s,'right',2);walk(s,'up');s.facing='up';
 assert.equal(interact(map,s).type,'message');assert.equal(move(map,s,'up'),false);
 assert.equal(s.opened.includes('vault-wall'),false);
 walk(s,'right',2);walk(s,'down');walk(s,'right',2);
 collectVaultCrystal(s);
 const tools=s.tools.length,items=s.items.length;interact(map,s);
 assert.equal(s.tools.length,tools);assert.equal(s.items.length,items);
 resetPuzzle(map,s);
 assert.deepEqual(s.tools,['hammer']);assert.deepEqual(s.items,['seal-crystal']);
 assert.equal(doorOpen(map,s,map.doors.find(d=>d.id==='vault-wall')),true);
 const fresh=createState(map);assert.equal(fresh.tools.length,0);assert.equal(fresh.items.length,0);
});
test('signals alone cannot win without the recovered seal crystal',()=>{
 const s=createState(map);s.activated=['north-switch','south-switch'];s.sequences.signals=3;
 const exit=map.objects.find(o=>o.type==='exit');assert.equal(exitReady(map,s,exit),false);
 s.player={x:18,y:10};assert.equal(interact(map,s).type,'message');assert.equal(s.won,false);
 s.items.push('seal-crystal');assert.equal(interact(map,s).type,'win');
});

test('door light feedback follows progress and clears all lights after a mistake',()=>{
 const s=createState(map);s.items.push('seal-crystal');
 s.player={x:15,y:3};s.facing='right';
 let result=interact(map,s);assert.equal(result.tone,'correct');assert.match(result.text,/light 1.*BOTTOM/);
 result=interact(map,s);assert.equal(result.tone,'wrong');assert.equal(s.sequences.signals,0);assert.deepEqual(s.activated,[]);
 assert.match(result.text,/all three door lights reset/);
 interact(map,s);s.player={x:17,y:6};interact(map,s);
 assert.equal(s.sequences.signals,2);
 s.player={x:15,y:3};result=interact(map,s);assert.match(result.text,/exit is unlocked/);
 assert.equal(exitReady(map,s,map.objects.find(o=>o.type==='exit')),true);
});

test('loose pickups collect only on contact, once, and stay collected after undo',()=>{
 const s=createState(map);firstSeal(s);walkTo(s,11,9);s.facing='right';
 assert.match(interact(map,s).text,/Walk over/);assert.deepEqual(s.tools,[]);
 walk(s,'right');assert.deepEqual(s.tools,['hammer']);assert.ok(s.collected.includes('hammer-pickup'));
 undo(s);assert.deepEqual(s.player,{x:11,y:9});assert.deepEqual(s.tools,['hammer']);
 walk(s,'right');assert.equal(s.tools.length,1);assert.equal(s.collected.filter(id=>id==='hammer-pickup').length,1);
});
test('loose keys collect on contact while chests and switches require interaction',()=>{
 const custom=structuredClone(map);custom.objects.push({id:'loose-key',type:'key',key:'bonus',x:3,y:9,label:'Bonus key'});
 const s=createState(custom);assert.equal(move(custom,s,'right'),true);assert.deepEqual(s.keys,['bonus']);
 s.player={x:9,y:3};s.facing='right';assert.equal(move(custom,s,'right'),false);assert.deepEqual(s.solved,[]);
 assert.equal(interact(custom,s).type,'challenge');
 s.player={x:15,y:3};s.facing='right';assert.equal(move(custom,s,'right'),false);assert.equal(s.sequences.signals,undefined);
 assert.equal(interact(custom,s).tone,'correct');
});
test('pushing a block cannot bury an uncollected pickup',()=>{
 const custom=structuredClone(map);custom.objects.push({id:'loose-crystal',type:'item',item:'extra',x:4,y:6});
 const s=createState(custom);s.player={x:2,y:6};assert.equal(move(custom,s,'right'),false);
 assert.deepEqual(s.items,[]);assert.equal(s.blocks[0].x,3);
});

test('matching key unlocks on entry, is consumed once, and remains Used after undo',()=>{
 const s=createState(map);completeChallenge(map,s,'archive');
 s.player={x:13,y:5};move(map,s,'down');assert.deepEqual(s.keys,['archive']);assert.deepEqual(s.usedKeys,[]);
 assert.equal(move(map,s,'right'),true);assert.deepEqual(s.player,{x:14,y:6});
 assert.deepEqual(s.keys,[]);assert.deepEqual(s.usedKeys,['archive']);assert.ok(s.opened.includes('east'));
 assert.equal(inventoryEntries(map,s).find(i=>i.id==='archive-key').status,'Used');
 undo(s);assert.deepEqual(s.player,{x:13,y:6});assert.ok(s.opened.includes('east'));
 move(map,s,'right');assert.deepEqual(s.usedKeys,['archive']);
 resetPuzzle(map,s);assert.equal(inventoryEntries(map,s).find(i=>i.id==='archive-key').status,'Used');
});
test('wrong or absent key blocks entry and leaves inventory intact',()=>{
 const s=createState(map);s.player={x:13,y:6};s.keys.push('other');
 assert.equal(move(map,s,'right'),false);assert.match(s.moveFeedback.text,/Archive key required/);
 assert.deepEqual(s.player,{x:13,y:6});assert.deepEqual(s.keys,['other']);assert.deepEqual(s.usedKeys,[]);
});
test('hammer opens a cracked wall on entry and stays Ready in inventory',()=>{
 const s=createState(map);s.player={x:4,y:5};
 assert.equal(move(map,s,'up'),false);assert.match(s.moveFeedback.text,/Hammer required/);
 s.tools.push('hammer');assert.equal(move(map,s,'up'),true);assert.ok(s.opened.includes('vault-wall'));
 assert.deepEqual(s.tools,['hammer']);assert.equal(inventoryEntries(map,s)[0].status,'Ready');
 undo(s);assert.ok(s.opened.includes('vault-wall'));
 const fresh=createState(map);assert.deepEqual(inventoryEntries(map,fresh),[]);
});
test('key stays held when another obstruction prevents entering the door tile',()=>{
 const custom=structuredClone(map);custom.objects.push({id:'obstruction',type:'sign',x:14,y:6});
 const s=createState(custom);s.player={x:13,y:6};s.keys.push('archive');
 assert.equal(move(custom,s,'right'),false);assert.deepEqual(s.keys,['archive']);assert.deepEqual(s.opened,[]);
});
test('inventory lists only collected items and records keys used through Interact too',()=>{
 const s=createState(map);assert.deepEqual(inventoryEntries(map,s),[]);
 completeChallenge(map,s,'archive');s.tools.push('hammer');s.items.push('seal-crystal');
 assert.deepEqual(inventoryEntries(map,s).map(i=>[i.label,i.status]),[['Archive key','Ready'],['Hammer','Ready'],['Seal crystal','Ready']]);
 s.player={x:13,y:6};s.facing='right';interact(map,s);
 assert.equal(inventoryEntries(map,s)[0].status,'Used');
});

test('optional Archive nook is reachable with the hammer and preserves its treasure after recovery',()=>{
 const s=createState(map);firstSeal(s);
 walkTo(s,12,3);s.facing='up';assert.equal(move(map,s,'up'),false);assert.deepEqual(s.items,[]);
 walkTo(s,12,9);assert.deepEqual(s.tools,['hammer']);
 walkTo(s,12,3);walk(s,'up',2);assert.ok(s.items.includes('explorer-token'));
 assert.equal(inventoryEntries(map,s).find(i=>i.id==='explorer-token').optional,true);
 undo(s);assert.ok(s.items.includes('explorer-token'));
 resetPuzzle(map,s);assert.ok(s.items.includes('explorer-token'));
 assert.equal(createState(map).items.includes('explorer-token'),false);
});
test('room scenery blocks movement while the required pickups and chamber remain reachable',()=>{
 const s=createState(map);
 for(const item of map.objects.filter(o=>o.type==='obstacle'))assert.equal(obstacle(map,s,item),true,item.id);
 firstSeal(s);walkTo(s,9,3);s.facing='right';assert.equal(interact(map,s).type,'challenge');completeChallenge(map,s,'archive');
 collectVaultCrystal(s);walkTo(s,13,6);walk(s,'right');walkTo(s,15,3);walkTo(s,17,6);walkTo(s,18,10);
 assert.deepEqual(s.player,{x:18,y:10});
});

test('optional treasure adds its bonus exactly once, preserves review points, and survives recovery',()=>{
 const s=createState(map);firstSeal(s);s.attempts.archive=1;completeChallenge(map,s,'archive');
 assert.deepEqual(adventureResults(map,s),{treasureFound:0,treasureTotal:1,reviewPoints:100,bonusPoints:0,totalPoints:100});
 walkTo(s,12,9);walkTo(s,12,3);walk(s,'up',2);
 assert.deepEqual(adventureResults(map,s),{treasureFound:1,treasureTotal:1,reviewPoints:100,bonusPoints:50,totalPoints:150});
 undo(s);walk(s,'up');assert.equal(adventureResults(map,s).totalPoints,150);
 resetPuzzle(map,s);assert.equal(adventureResults(map,s).bonusPoints,50);assert.equal(s.score,100);
 assert.deepEqual(adventureResults(map,createState(map)),{treasureFound:0,treasureTotal:1,reviewPoints:0,bonusPoints:0,totalPoints:0});
});
