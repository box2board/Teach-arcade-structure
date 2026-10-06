import assert from 'node:assert/strict';
import {PinballPhysics} from '../public/review-lab/review-pinball/physics.js';
import {TABLES} from '../public/review-lab/review-pinball/tables.js';
const dist=(p,a,z)=>{const dx=z[0]-a[0],dy=z[1]-a[1],t=Math.max(0,Math.min(1,((p.x-a[0])*dx+(p.y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-a[0]-t*dx,p.y-a[1]-t*dy);};
function clear(t,p){return t.bumpers.every(b=>Math.hypot(p.x-b.x,p.y-b.y)>b.r+10)&&t.rails.every(r=>dist(p,r.slice(0,2),r.slice(2))>14)&&t.targets.every(a=>dist(p,[a.x-7,a.y-12],[a.x+7,a.y+12])>15)&&t.slings.every(s=>dist(p,...s.edge)>15)&&t.flippers.every(f=>dist(p,[f.x,f.y],[f.x+Math.cos(f.side===1?.35:Math.PI-.35)*(f.length+8),f.y+Math.sin(f.side===1?.35:Math.PI-.35)*(f.length+8)])>18);}
// Regression: the photographed pocket and its Neon Circuit equivalent must feed downhill.
for(const table of TABLES)for(const assist of [false,true])for(const vx of [-100,0,100]){
 const e=new PinballPhysics({table,assist});const y=table.id==='pirate'?450.48:402.4;e.launchGateClosed=true;e.ball={x:423.95,y,vx,vy:0,r:10};
 for(let i=0;i<240*3&&e.ball;i++)e.step(1/240);
 assert.ok(!e.ball||e.ball.y>y+80,`${table.id}: former target pocket must release naturally`);
}
// Sample all collision-free grid starts. A trapped ball stays within one unit for two seconds.
for(const table of TABLES){for(const assist of [false,true]){const trapped=[];let tested=0;
for(let x=57.3;x<424;x+=9)for(let y=61.7;y<742;y+=11){if(!clear(table,{x,y}))continue;tested++;const e=new PinballPhysics({table,assist});e.launchGateClosed=true;e.ball={x,y,vx:0,vy:0,r:10};let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
for(let i=0;i<240*12&&e.ball;i++){e.step(1/240);if(i>=240*10&&e.ball){minX=Math.min(minX,e.ball.x);maxX=Math.max(maxX,e.ball.x);minY=Math.min(minY,e.ball.y);maxY=Math.max(maxY,e.ball.y);}}
if(e.ball&&!e.ride&&maxX-minX<1&&maxY-minY<1)trapped.push({start:{x,y},end:{...e.ball}});
}assert.equal(trapped.length,0,JSON.stringify({table:table.id,assist,trapped:trapped.slice(0,3)}));console.log(JSON.stringify({table:table.id,assist,tested,count:trapped.length,examples:trapped.slice(0,8),positions:[...new Set(trapped.map(p=>`${p.end.x.toFixed(1)},${p.end.y.toFixed(1)}`))]}));}}
