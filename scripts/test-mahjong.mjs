import assert from 'node:assert/strict';
import{fresh,free,pairs,deal}from'../public/brain-arcade/mahjong/engine.js';
for(const [name,count]of[['garden',72],['terrace',108],['tower',144]])for(let run=0;run<100;run++){
 const ts=fresh(name);assert.equal(ts.length,count);assert.ok(pairs(ts).length);
 const before=ts.map(t=>t.face).sort((a,b)=>a-b);const order=deal(ts);assert.deepEqual(ts.map(t=>t.face).sort((a,b)=>a-b),before);
 for(const [a,b]of order){const x=ts[a],y=ts[b];assert.ok(free(x,ts)&&free(y,ts));assert.equal(x.face,y.face);x.removed=y.removed=true;}
 assert.ok(ts.every(t=>t.removed));
 // Shuffle a partially completed board, preserving removed positions and faces.
 order.slice(-10).flat().forEach(id=>ts[id].removed=false);const remaining=ts.filter(t=>!t.removed).map(t=>t.face).sort((a,b)=>a-b);const next=deal(ts);assert.deepEqual(ts.filter(t=>!t.removed).map(t=>t.face).sort((a,b)=>a-b),remaining);assert.equal(next.length,10);
}
const ts=[{id:0,x:0,y:0,z:0},{id:1,x:1,y:0,z:0},{id:2,x:2,y:0,z:0},{id:3,x:0,y:0,z:1}];assert.equal(free(ts[0],ts),false);assert.equal(free(ts[1],ts),false);assert.equal(free(ts[2],ts),true);assert.equal(free(ts[3],ts),true);
console.log('Passed: 300 solvable deals, 300 partial-board shuffles, coverage and side-blocking rules.');
