// Network load only: this does not measure rendered FPS or Chromebook graphics.
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { Client } from 'colyseus.js';
import { start } from './server.mjs';

const endpoint=process.env.WORLD_TEST_ENDPOINT||'ws://127.0.0.1:2570';
const duration=Number(process.env.WORLD_TEST_SECONDS)||60;
assert(duration>=30&&duration<=300,'Duration must be 30–300 seconds');
const local=process.env.WORLD_TEST_ENDPOINT?null:await start(2570);
const worldId='load20-'+crypto.randomUUID(), rooms=[], samples={rtt:[],ack:[],patchGap:[],tickHz:[]};
let timer, draining=false;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(fn,label)=>{for(let i=0;i<300;i++){if(fn())return;await wait(50);}throw Error('Timeout: '+label);};
const deadline=setTimeout(()=>{console.error('Load test deadline');process.exit(1);},(duration+120)*1000);
function observe(room){
 const item={room,seq:0,sent:new Map(),sentCount:0,patches:0,lastPatch:0,lastTick:0,lastTickTime:0};
 room.onMessage('notice',()=>{});
 room.onMessage('pong',n=>samples.rtt.push(performance.now()-n));
 room.onLeave(()=>{if(!draining&&!item.expectedLeave)item.unexpectedLeave=true;});
 room.onStateChange(state=>{
  const now=performance.now();item.patches++;
  if(item.lastPatch)samples.patchGap.push(now-item.lastPatch);item.lastPatch=now;
  if(item.lastTickTime&&now-item.lastTickTime>=1000){samples.tickHz.push((state.tick-item.lastTick)*1000/(now-item.lastTickTime));item.lastTickTime=now;item.lastTick=state.tick;}
  if(!item.lastTickTime){item.lastTickTime=now;item.lastTick=state.tick;}
  const p=state.players.get(room.sessionId);if(!p)return;
  item.seq=Math.max(item.seq,p.seq);
  if(item.sent.has(p.seq))samples.ack.push(now-item.sent.get(p.seq));
  for(const n of item.sent.keys())if(n<=p.seq)item.sent.delete(n);
 });
 return item;
}
try{
 for(let i=0;i<20;i++)rooms.push(observe(await new Client(endpoint).joinOrCreate('world',{worldId,displayName:'Load '+i})));
 assert.equal(new Set(rooms.map(i=>i.room.roomId)).size,1);
 await until(()=>rooms.every(i=>i.room.state.players.size===20),'20-client state');
 console.log('20 clients in one room; starting sustained movement');
 const began=performance.now();let lastPing=0;
 timer=setInterval(()=>{
  const now=performance.now(),t=(now-began)/1000;
  rooms.forEach((item,index)=>{
   if(item.paused)return;
   const phase=t*.8+index*.31;
   const input={seq:++item.seq,x:Math.cos(phase),z:Math.sin(phase),sprint:index%3===0,jump:Math.floor(t*30)%90===index};
   item.sent.set(input.seq,now);item.sentCount++;item.room.send('input',input);
  });
  if(now-lastPing>1000){for(const i of rooms)if(!i.paused)i.room.send('ping',now);lastPing=now;}
 },1000/30);
 await wait(duration*1000);
 // Keep 19 clients moving while one reconnects with its identity intact.
 const original=rooms[19],id=original.room.sessionId,token=original.room.reconnectionToken;
 original.paused=true;original.expectedLeave=true;original.room.connection.close();
 await until(()=>rooms[0].room.state.players.get(id)?.connected===false,'disconnected presence');
 const reconnectStart=performance.now(),restored=await new Client(endpoint).reconnect(token);
 assert.equal(restored.sessionId,id);rooms[19]=observe(restored);
 await until(()=>rooms[0].room.state.players.get(id)?.connected,'reconnected presence');
 const reconnectMs=performance.now()-reconnectStart;
 await wait(2000);clearInterval(timer);await wait(1000);
 for(const item of rooms){assert(!item.unexpectedLeave,'Unexpected disconnect');assert.equal(item.room.state.players.size,20);assert.equal([...item.room.state.players.values()].filter(p=>p.connected).length,20);assert.equal(item.sent.size,0,'Unacknowledged movement');for(const p of item.room.state.players.values()){assert(p.seq>0,'Missing remote movement');assert([p.x,p.y,p.z].every(Number.isFinite),'Invalid position');}}
 // Shared building and permissions in the populated room, using authoritative movement.
 const a=rooms[0],b=rooms[1];await until(()=>a.sent.size===0,'input drain');
 for(let n=0;n<400;n++){
  const p=a.room.state.players.get(a.room.sessionId),dx=20-p.x,dz=-18-p.z,d=Math.hypot(dx,dz);
  if(d<3)break;
  a.room.send('input',{seq:++a.seq,x:dx/Math.max(d,1),z:dz/Math.max(d,1),sprint:true});await wait(34);
 }
 a.room.send('place',{piece:'pillar',x:20,z:-18,level:0,rotation:0});
 await until(()=>rooms.every(i=>i.room.state.builds.size===1),'shared build on all 20');
 const build=[...b.room.state.builds.values()][0];assert.equal(build.ownerId,a.room.sessionId);
 b.room.send('delete',build.id);await wait(350);assert.equal(a.room.state.builds.size,1);
 a.room.send('delete',build.id);await until(()=>rooms.every(i=>i.room.state.builds.size===0),'owner deletion on all 20');
 draining=true;await rooms[19].room.leave();await until(()=>rooms[0].room.state.players.size===19,'leave cleanup');
 const stats=arr=>{arr.sort((a,b)=>a-b);assert(arr.length,'Missing samples');return {count:arr.length,p50:+arr[Math.floor(arr.length*.5)].toFixed(2),p95:+arr[Math.floor(arr.length*.95)].toFixed(2),max:+arr.at(-1).toFixed(2)};};
 console.log(JSON.stringify({endpoint,clients:20,durationSeconds:duration,sentInputs:rooms.reduce((n,i)=>n+i.sentCount,0),rttMs:stats(samples.rtt),inputAckMs:stats(samples.ack),patchGapMs:stats(samples.patchGap),serverTickHz:stats(samples.tickHz),reconnectMs:Math.round(reconnectMs),checks:'PASS: same room, sustained movement, presence, reconnect identity, all-client builds, ownership, leave cleanup',limitation:'Network clients only; rendered FPS and device smoothness not measured'},null,2));
}catch(error){console.error(error);process.exitCode=1;}
finally{clearInterval(timer);clearTimeout(deadline);draining=true;for(const i of rooms)i.room.connection.close();if(local)await local.game.gracefullyShutdown(false);process.exit(process.exitCode||0);}
