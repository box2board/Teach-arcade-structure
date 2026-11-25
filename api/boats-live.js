import {createServer} from 'node:http';
import {WebSocketServer} from 'ws';
import {forwardRoom} from '../lib/multiplayer/vercel.js';

export function createBoatGateway(forward=forwardRoom) {
  const server=createServer((_req,res)=>res.writeHead(426).end());
  const sockets=new WebSocketServer({noServer:true,maxPayload:2048,perMessageDeflate:false});
  server.on('upgrade',(request,socket,head)=>{
    const origin=request.headers.origin;
    if(origin!=='https://'+request.headers.host){
      socket.destroy();
      return;
    }
    sockets.handleUpgrade(request,socket,head,ws=>sockets.emit('connection',ws,origin));
  });
  sockets.on('connection',(ws,origin)=>{
    let seat, busy=false;
    const timeout=setTimeout(()=>ws.close(1008),5000);
    ws.on('error',()=>{});
    ws.on('close',()=>clearTimeout(timeout));
    ws.on('message',async raw=>{
      if(busy)return ws.close(1008);
      busy=true;
      try {
        const message=JSON.parse(raw);
        const first=!seat;
        if(first && (message.action!=='hello'||!/^\d{6}$/.test(message.code)||
           typeof message.token!=='string'||message.token.length>128))return ws.close(1008);
        if(!first && !['state','mini-input'].includes(message.action))return ws.close(1008);
        const identity=seat??{code:message.code,token:message.token};
        const action=first?'state':message.action;
        const payload={...identity,action,...(action==='mini-input'?{phase:'mini',since:message.since,packet:message.packet}:{})};
        const result=await forward('/api/mayhem',origin,payload);
        const data=await result.json();
        const state=data.state;
        if(first&&(!result.ok||!state?.boatsPilot||!state.player||state.phase!=='mini'||state.game!=='bumper-boats')){
          return ws.close(1008);
        }
        seat=identity;
        clearTimeout(timeout);
        if(ws.readyState===1)ws.send(JSON.stringify({...data,status:result.status}));
        if(state?.phase!=='mini')ws.close(1000);
      }catch{ws.close(1011);}finally{busy=false;}
    });
  });
  return server;
}
export default createBoatGateway();
