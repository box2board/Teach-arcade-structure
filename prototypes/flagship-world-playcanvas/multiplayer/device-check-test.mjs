import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Client } from 'colyseus.js';
import { start } from './server.mjs';

const hosted=process.env.WORLD_TEST_ENDPOINT;
const expected=Number(process.env.WORLD_TEST_DEVICE_CAPACITY||20);
assert([20,40].includes(expected));
const worldId=hosted?process.env.WORLD_DEVICE_REVIEW_CODE:`device-${randomUUID()}`;
assert(worldId?.startsWith('device-'),'A device-check invite is required');
const local=hosted?null:await start(0,{deviceWorldId:worldId,deviceDurationMs:2400,scaleReview:expected===40});
const endpoint=hosted||`ws://127.0.0.1:${local.http.address().port}`;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function until(test,message){for(let i=0;i<300;i++){if(test())return;await wait(50);}throw Error(message);}
const rooms=new Set();
const deadline=setTimeout(()=>{console.error('Device-check test timed out');process.exit(1);},90000);
async function join(code){const room=await new Client(endpoint).joinOrCreate('world',{worldId:code,displayName:'Device check smoke test'});rooms.add(room);room.onLeave(()=>rooms.delete(room));return room;}
try{
 const first=await join(worldId);
 await until(()=>first.state?.deviceStatus==='running'&&first.state?.players?.size===expected,'Bots did not fill the device room');
 await until(()=>[...first.state.players.values()].filter(p=>p.sessionId!==first.sessionId&&p.seq>0).length===expected-1,'Not all bots sent authoritative movement');
 assert.equal(first.state.capacity,expected);assert.equal(first.state.builds.size,expected===40?48:0);
 await assert.rejects(()=>join(worldId),/already in use|full|needs its invite/);
 await assert.rejects(()=>join(`device-${randomUUID()}`),/unavailable/);
 if(!hosted)await until(()=>first.state.deviceStatus==='complete'&&first.state.players.size===1,'Bots did not leave after the device timer');
 const firstId=first.roomId;await first.leave();
 let second;
 for(let i=0;i<25&&!second;i++){try{second=await join(worldId);}catch(e){if(!/already in use|full/.test(e.message))throw e;await wait(200);}}
 assert(second,'Device room did not release its slot on leave');assert.notEqual(second.roomId,firstId);
 await until(()=>second.state?.deviceStatus==='running'&&second.state?.players?.size===expected,'A new device test did not start cleanly');
 console.log(`PASS: ${expected-1} moving SDK clients, ${expected}-player cap, seeded layout, wrong invite and second tester rejected, clean restart${hosted?'':' and timer cleanup'}.`);
}finally{await Promise.allSettled([...rooms].map(room=>room.leave()));if(local)await local.game.gracefullyShutdown(false);clearTimeout(deadline);}
