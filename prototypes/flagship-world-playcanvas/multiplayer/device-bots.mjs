import { Client } from 'colyseus.js';
import { STEP } from './physics.js';

// Real SDK clients on loopback: they exercise the room and its WebSocket
// serialization without relying on the tester to open extra tabs.
export function runDeviceBots({endpoint, reserveSeat, durationMs, onStatus, count=19}) {
 const client=new Client(endpoint), bots=[];
 let closed=false, movementTimer, expiryTimer;
 function stop(status) {
  if(closed)return;
  closed=true;clearInterval(movementTimer);clearTimeout(expiryTimer);
  if(status)onStatus(status);
  for(const {room} of bots)room.leave().catch(()=>room.connection.close());
 }
 expiryTimer=setTimeout(()=>stop('failed'),15000);
 (async()=>{
  try{
   for(let i=0;i<count&&!closed;i++){
    const seat=await reserveSeat(i);
    if(closed)return;
    const room=await client.consumeSeatReservation(seat);
    if(closed){await room.leave();return;}
    bots.push({room,seq:0});
    room.onLeave(()=>stop('failed'));
   }
   if(closed)return;
   clearTimeout(expiryTimer);
   const began=performance.now();
   onStatus('running');
   expiryTimer=setTimeout(()=>stop('complete'),durationMs);
   movementTimer=setInterval(()=>{
    const t=(performance.now()-began)/1000;
    for(const [i,bot] of bots.entries()){
     const p=bot.room.state?.players?.get(bot.room.sessionId);if(!p)continue;
     const phase=t*.7+i*Math.PI*2/count;
     const x=(count>19?12:0)+6*Math.cos(phase)-p.x,z=(count>19?-16:-5)+6*Math.sin(phase)-p.z;
     const scale=Math.max(.2,Math.hypot(x,z));
     const seq=++bot.seq;
     bot.room.send('input',{seq,x:x/scale,z:z/scale,jump:seq%120===i});
    }
   },STEP*1000);
  }catch(error){if(!closed){console.warn('Device test could not start:',error.message);stop('failed');}}
 })();
 return stop;
}
