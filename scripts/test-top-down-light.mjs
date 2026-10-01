import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdventure} from '../public/arcade-review-games/shared/top-down/map.js';
import {createState,move,interact,lightPaths,obstacle,resetPuzzle,undo} from '../public/arcade-review-games/shared/top-down/model.js';
function setup(){const map=createAdventure('hard'),s=createState(map);return {map,s,mirror:s.blocks.find(b=>b.kind==='mirror')};}
test('pushed and rotated mirror redirects the light into the receiver',()=>{
 const {map,s,mirror}=setup();assert.deepEqual(lightPaths(map,s).powered,[]);
 s.player={x:10,y:15};assert.equal(move(map,s,'right'),true);assert.equal(mirror.x,12);
 assert.deepEqual(lightPaths(map,s).powered,[]);
 s.player={x:12,y:14};s.facing='down';assert.match(interact(map,s).text,/Mirror rotated/);
 assert.equal(mirror.orientation,'\\');assert.deepEqual(lightPaths(map,s).powered,['workshop-receiver']);
 assert.ok(lightPaths(map,s).segments.some(p=>p.to.x===12&&p.to.y===17));
 interact(map,s);assert.equal(mirror.orientation,'/');assert.deepEqual(lightPaths(map,s).powered,[]);
});
test('bridge switch requires a powered receiver; raised crossing stays safe after reset',()=>{
 const {map,s,mirror}=setup();s.player={x:9,y:16};s.facing='left';
 assert.match(interact(map,s).text,/needs light/);assert.equal(obstacle(map,s,{x:11,y:18}),true);
 assert.equal(obstacle(map,s,{x:10,y:18}),true);
 Object.assign(mirror,{x:12,y:15,orientation:'\\'});assert.match(interact(map,s).text,/Bridge raised/);
 assert.equal(obstacle(map,s,{x:11,y:18}),false);assert.equal(obstacle(map,s,{x:10,y:18}),true);
 assert.match(interact(map,s).text,/already raised/);assert.equal(s.opened.filter(id=>id==='workshop-bridge').length,1);
 s.player={x:11,y:17};assert.equal(move(map,s,'down'),true);assert.equal(move(map,s,'down'),true);
 resetPuzzle(map,s);assert.deepEqual(lightPaths(map,s).powered,[]);
 assert.equal(obstacle(map,s,{x:11,y:18}),false);assert.ok(s.activated.includes('bridge-switch'));
});
test('opaque blocks and walls stop beams; players do not interrupt light',()=>{
 const {map,s,mirror}=setup();Object.assign(mirror,{x:12,y:15,orientation:'\\'});
 s.player={x:12,y:16};assert.deepEqual(lightPaths(map,s).powered,['workshop-receiver']);
 Object.assign(s.blocks[0],{x:12,y:16});assert.deepEqual(lightPaths(map,s).powered,[]);
 assert.equal(lightPaths(map,s).segments.at(-1).to.y,16);
 s.blocks[0].y=6;const tiles=Array.from(map.tiles[16]);tiles[12]='#';map.tiles[16]=tiles.join('');
 assert.deepEqual(lightPaths(map,s).powered,[]);
});
test('mirror pushes undo and reset safely without altering earned progress',()=>{
 const {map,s}=setup();s.tools.push('hammer');s.discovered.push('signal-start');
 s.player={x:10,y:15};move(map,s,'right');undo(s);
 assert.equal(s.blocks.find(b=>b.kind==='mirror').x,11);
 move(map,s,'right');resetPuzzle(map,s);
 assert.equal(s.blocks.find(b=>b.kind==='mirror').x,11);assert.deepEqual(s.tools,['hammer']);assert.deepEqual(s.discovered,['signal-start']);
});
test('cyclic mirror rays terminate and Easy/Medium retain their original geometry',()=>{
 const map={tiles:['#######','#.....#','#.....#','#.....#','#.....#','#.....#','#######'],doors:[],plates:[],objects:[{id:'source',type:'emitter',x:3,y:1,direction:'right'}]};
 const s={opened:[],blocks:[{kind:'mirror',x:5,y:1,orientation:'\\'},{kind:'mirror',x:5,y:5,orientation:'/'},{kind:'mirror',x:1,y:5,orientation:'\\'},{kind:'mirror',x:1,y:1,orientation:'/'}]};
 const path=lightPaths(map,s);assert.ok(path.segments.length<30);
 for(const mode of ['easy','medium']){const m=createAdventure(mode);assert.ok(m.tiles.every(row=>!row.includes('~')));assert.ok(m.blocks.every(b=>b.kind!=='mirror'));}
});
