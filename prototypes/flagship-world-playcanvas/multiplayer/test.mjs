import assert from 'node:assert/strict';
import { Client } from 'colyseus.js';
import { start } from './server.mjs';
const {game}=await start(2569);
setTimeout(()=>{console.error('TEST DEADLINE');process.exit(1)},20000).unref();const rooms=[];
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(fn)=>{for(let n=0;n<100;n++){if(fn())return;await wait(50);}throw Error('Timed out');};
try{
 for(let i=0;i<8;i++)rooms.push(await new Client('ws://127.0.0.1:2569').joinOrCreate('world',{worldId:'test-private',displayName:'Tester '+i}));
 console.log('joined 8');const [a,b]=rooms;await until(()=>a.state.players.size===8&&b.state.players.size===8);assert.equal(new Set(rooms.map(r=>r.roomId)).size,1);
 a.send('input',{seq:1,x:1,z:0});b.send('input',{seq:1,x:-1,z:0});await until(()=>b.state.players.get(a.sessionId).seq===1&&a.state.players.get(b.sessionId).seq===1);
 assert(b.state.players.get(a.sessionId).x>0);assert(a.state.players.get(b.sessionId).x<0);
 a.send('input',{seq:2,x:999,z:0});await wait(150);assert.equal(a.state.players.get(a.sessionId).seq,1);
 console.log('movement and input passed');
 // Walk authoritative inputs to the build pad.
 let seq=2;for(let n=0;n<80;n++){a.send('input',{seq:seq++,x:1,z:-.6,sprint:true});await wait(34);}
 await wait(200);const p=a.state.players.get(a.sessionId);assert(p.x>15&&p.z< -11,JSON.stringify(p));
 console.log('walked',p.x,p.z);a.send('place',{piece:'pillar',x:20,z:-18,level:0,rotation:0,ownerId:'forged'});
 await until(()=>b.state.builds.size===1);const build=[...b.state.builds.values()][0];assert.equal(build.ownerId,a.sessionId);assert.equal(build.worldId,'test-private');
 b.send('delete',build.id);await wait(300);assert.equal(a.state.builds.size,1);
 a.send('delete',build.id);await until(()=>b.state.builds.size===0);
 a.send('place',{piece:'wall',x:0,z:0,level:0,rotation:0});await wait(300);assert.equal(b.state.builds.size,0);
 console.log('builds passed');const token=a.reconnectionToken,id=a.sessionId;a.connection.close();await until(()=>!b.state.players.get(id).connected);
 const restored=await new Client('ws://127.0.0.1:2569').reconnect(token);rooms[0]=restored;await until(()=>b.state.players.get(id).connected);assert.equal(restored.sessionId,id);
 console.log('reconnected');await rooms[7].leave();await until(()=>b.state.players.size===7);
 const separate=await new Client('ws://127.0.0.1:2569').joinOrCreate('world',{worldId:'different-private'});rooms.push(separate);await until(()=>separate.state.players?.size===1);assert.notEqual(separate.roomId,b.roomId);
 console.log('PASS: 8 network clients; bidirectional movement; invalid input; shared builds; owner-only deletion; reconnect identity; leave cleanup; world isolation.');
}catch(e){console.error(e);process.exitCode=1;}finally{for(const room of rooms)try{room.connection.close();}catch{}await game.gracefullyShutdown(false);process.exit(process.exitCode||0);}
