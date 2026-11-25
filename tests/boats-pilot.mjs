import assert from 'node:assert/strict';
import {once} from 'node:events';
import {setTimeout as wait} from 'node:timers/promises';
import WebSocket from 'ws';
import {createBoatGateway} from '../api/boats-live.js';
import {openBoatTransport} from '../public/multiplayer/lib/boat-transport.js';
import {openRoomDatabase} from '../lib/multiplayer/database/sqlite.js';
import {serveSession} from '../lib/multiplayer/http.js';

const db=openRoomDatabase(':memory:');
const origin='https://www.teacharcade.com';
const forward=(path,_origin,input)=>serveSession(new Request(origin+path,{
  method:'POST',body:JSON.stringify(input)
}),db);
async function call(path,input){
  const response=await forward(path,origin,input);
  assert.ok(response.ok, 'Failed '+input.action+' with '+response.status);
  return response.json();
}
const server=createBoatGateway(forward);
server.listen(0,'127.0.0.1');
await once(server,'listening');
const host='127.0.0.1:'+server.address().port;
const lobby='/api/multiplayer', game='/api/mayhem';
const sockets=[];
const reports=[];
try{
  const room=await call(lobby,{action:'create',game:'midway-mayhem',boatsPilot:true,bank:'constitution-basics',teams:4,rounds:1});
  const code=room.state.code,teacher={code,token:room.token};
  const seats=[];
  for(let i=0;i<30;i++){
    const joined=await call(lobby,{action:'join',code,joinId:crypto.randomUUID(),name:'Pilot '+i,characterId:i%2?'fox':'frog'});
    seats.push({code,token:joined.token});
  }
  await call(lobby,{...teacher,action:'start'});
  const states=await Promise.all(seats.map(seat=>call(game,{...seat,action:'state'})));
  const since=states[0].state.since;
  const links=seats.map((seat,i)=>{
    let order=0;
    return openBoatTransport({url:'ws://'+host+'/api/boats-live',credentials:seat,initial:states[i].state,
      open(url){
        if(i>=15)throw Error('WebSocket unavailable');
        const ws=new WebSocket(url,{origin:'https://'+host});
        sockets.push(ws);
        return ws;
      },
      onMode(mode){reports.push(call(game,{...seat,action:'boat-link',since,order:++order,mode}));}
    });
  });
  await Promise.all(sockets.map(ws=>once(ws,'message')));
  const move={action:'mini-input',since,phase:'mini',packet:{seq:1,x:1,y:0,boost:false}};
  const replies=await Promise.all(links.map((link,i)=>link.request(move)??call(game,{...seats[i],...move})));
  for(const [i,reply] of replies.entries()){
    assert.equal(reply.state.minigame.boats.length,30);
    const id=states[i].state.player.miniPlayerId;
    assert.equal(reply.state.minigame.boats.find(b=>b.id===id).seq,1);
    assert.ok(reply.state.roster.every(p=>!Object.hasOwn(p,'boatLink')));
  }
  await Promise.all(reports);
  const view=async()=>(await call(game,{...teacher,action:'state'})).state.roster;
  assert.equal((await view()).filter(p=>p.boatLink==='WebSocket').length,15);
  assert.equal((await view()).filter(p=>p.boatLink==='HTTPS fallback').length,15);
  sockets[0].terminate();
  await once(sockets[0],'close');
  await wait(5);
  await Promise.all(reports);
  assert.equal(links[0].request(move),null);
  const restored=await call(game,{...seats[0],...move,packet:{...move.packet,seq:2}});
  assert.equal(restored.state.player.miniPlayerId,states[0].state.player.miniPlayerId);
  assert.equal(restored.state.player.characterId,states[0].state.player.characterId);
  assert.equal((await view()).filter(p=>p.boatLink==='HTTPS fallback').length,16);
  for(const link of links)link.stop();
  console.log('30 shared boats, 15 sockets, 15 blocked sockets, live teacher readout and mid-ride fallback passed.');
}finally{
  for(const ws of sockets)ws.terminate();
  server.close();
  db.close();
}
