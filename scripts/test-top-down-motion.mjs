import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,undo,resetPuzzle,interact} from '../public/arcade-review-games/shared/top-down/model.js';
import {createMotion,advanceMotion,syncMotion} from '../public/arcade-review-games/shared/top-down/motion.js';
function fixture(){
 const map={start:{x:2,y:2},tiles:Array.from({length:10},(_,y)=>y===0||y===9?'##########':'#........#'),blocks:[],doors:[],objects:[],plates:[],inventory:[]};
 const state=createState(map);return {map,state,motion:createMotion(state)};
}
function travel(f,input,time){for(let t=0;t<time-1e-9;t+=.01)advanceMotion(f.map,f.state,f.motion,input,Math.min(.01,time-t));}
test('movement is fractional, diagonals have equal speed, and opposite directions stop',()=>{
 const straight=fixture(),diagonal=fixture();travel(straight,{x:1,y:0},.1);travel(diagonal,{x:1,y:1},.1);
 assert.ok(straight.motion.x>2&&straight.motion.x<3);assert.equal(straight.state.player.x,2);
 assert.ok(diagonal.motion.x>2&&diagonal.motion.y>2);
 assert.ok(Math.abs(Math.hypot(diagonal.motion.x-2,diagonal.motion.y-2)-(straight.motion.x-2))<1e-8);
 const before={x:straight.motion.x,y:straight.motion.y};travel(straight,{x:0,y:0},.3);
 assert.equal(straight.motion.x,before.x);assert.equal(straight.motion.y,before.y);
});
test('walls stop the footprint and allow sliding without cutting corners',()=>{
 const f=fixture();f.map.tiles=f.map.tiles.map((row,y)=>y>0&&y<9?row.slice(0,4)+'#'+row.slice(5):row);
 travel(f,{x:1,y:1},1);
 assert.ok(f.motion.x<=3.220001);assert.ok(f.motion.y>4);assert.equal(f.state.player.x,3);
 travel(f,{x:1,y:0},2);assert.ok(f.motion.x<=3.220001);
});
test('locked doors block passage, matching keys open on approach once',()=>{
 const f=fixture();f.map.doors=[{id:'gate',x:3,y:2,key:'key'}];
 travel(f,{x:1,y:0},.5);assert.ok(f.motion.x<=2.220001);assert.equal(f.state.opened.length,0);
 f.state.keys=['key'];travel(f,{x:1,y:0},.5);
 assert.ok(f.motion.x>3);assert.deepEqual(f.state.usedKeys,['key']);assert.deepEqual(f.state.keys,[]);assert.deepEqual(f.state.opened,['gate']);
});
test('centered block pushes stay on grid and undo restores the puzzle',()=>{
 const f=fixture();f.map.blocks=[{id:'crate',x:3,y:2}];f.state.blocks=structuredClone(f.map.blocks);
 travel(f,{x:1,y:0},.1);
 assert.deepEqual(f.state.blocks[0],{id:'crate',x:4,y:2});assert.ok(f.motion.x<3);
 undo(f.state);syncMotion(f.motion,f.state);assert.equal(f.state.blocks[0].x,3);assert.equal(f.motion.x,2);
 f.motion.y=2.3;travel(f,{x:1,y:0},.3);assert.equal(f.state.blocks[0].x,3);
 resetPuzzle(f.map,f.state);syncMotion(f.motion,f.state);assert.deepEqual({x:f.motion.x,y:f.motion.y},f.map.start);
});
test('contact pickups persist through undo and nearby faced chests still interact',()=>{
 const f=fixture();f.map.objects=[{id:'key',type:'key',key:'moss',x:3,y:2},{id:'chest',type:'challenge',x:4,y:2}];
 travel(f,{x:1,y:0},.4);assert.deepEqual(f.state.keys,['moss']);assert.ok(f.motion.x<3.3);
 assert.equal(interact(f.map,f.state).id,'chest');
 undo(f.state);syncMotion(f.motion,f.state);assert.deepEqual(f.state.keys,['moss']);
});
test('large frame gaps cannot teleport through obstacles and wins freeze movement',()=>{
 const f=fixture();advanceMotion(f.map,f.state,f.motion,{x:1,y:0},10);assert.ok(f.motion.x<=2.2);
 f.state.won=true;const x=f.motion.x;travel(f,{x:1,y:0},1);assert.equal(f.motion.x,x);
});
test('ordinary cell crossings do not request a scene rebuild; pickups do',()=>{
 const f=fixture();let crossed=false;
 for(let i=0;i<20;i++){
  const result=advanceMotion(f.map,f.state,f.motion,{x:1,y:0},.01);
  if(result.changed){crossed=true;assert.equal(result.worldChanged,false);}
 }
 assert.ok(crossed);
 f.map.objects.push({id:'pickup',type:'item',item:'lens',x:4,y:2});
 let pickupChanged=false;
 for(let i=0;i<30;i++){const result=advanceMotion(f.map,f.state,f.motion,{x:1,y:0},.01);if(result.worldChanged)pickupChanged=true;}
 assert.ok(pickupChanged);assert.deepEqual(f.state.items,['lens']);
});
