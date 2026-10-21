import { Server, Room } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { Schema, MapSchema, defineTypes } from '@colyseus/schema';
import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { STEP, initialPlayer, step, validBuild } from './physics.js';
class Player extends Schema { constructor(){super();Object.assign(this,initialPlayer(),{sessionId:'',displayName:'',connected:true});} }
defineTypes(Player,{sessionId:'string',displayName:'string',connected:'boolean',x:'number',y:'number',z:'number',vx:'number',vz:'number',vy:'number',rotation:'number',grounded:'boolean',movement:'string',animation:'string',seq:'number'});
class Build extends Schema {}
defineTypes(Build,{id:'string',ownerId:'string',classId:'string',worldId:'string',groupId:'string',missionId:'string',piece:'string',x:'number',y:'number',z:'number',rotation:'number',level:'number'});
class World extends Schema {constructor(){super();this.players=new MapSchema();this.builds=new MapSchema();this.tick=0;}}
defineTypes(World,{players:{map:Player},builds:{map:Build},tick:'number'});
export class WorldRoom extends Room {
 onCreate(options){
  if(typeof options.worldId!=='string'||!/^[-a-zA-Z0-9_]{1,80}$/.test(options.worldId))throw new Error('Invalid world code');
  this.maxClients=8;this.setState(new World());this.setPatchRate(50);this.queues=new Map();this.rates=new Map();this.worldId=options.worldId;
  this.onMessage('input',(c,i)=>{
   const q=this.queues.get(c.sessionId),p=this.state.players.get(c.sessionId);
   if(!q||!p||!i||!Number.isSafeInteger(i.seq)||i.seq<=p.seq||i.seq>(q.at(-1)?.seq??p.seq)+120||![i.x,i.z].every(Number.isFinite)||Math.abs(i.x)>1||Math.abs(i.z)>1||q.length>=12||i.seq<=(q.at(-1)?.seq??p.seq))return;
   q.push({x:i.x,z:i.z,sprint:i.sprint===true,jump:i.jump===true,seq:i.seq});
  });
  this.onMessage('ping',(c,n)=>{if(this.limit(c,'ping',150))c.send('pong',n);});
  this.onMessage('place',(c,r)=>{
   if(!this.limit(c,'build',200))return;const p=this.state.players.get(c.sessionId);
   if(this.state.builds.size>=250||!p||!validBuild(r,this.state.builds.values(),p)){c.send('notice','Placement rejected by server');return;}
   const b=new Build();Object.assign(b,{id:randomUUID(),ownerId:c.sessionId,classId:'prototype-class',worldId:this.worldId,groupId:'',missionId:'',piece:r.piece,x:r.x,y:r.level*2.5+Math.max(({wall:2.5,floor:.28,pillar:2.5,crate:1.6,beam:.55}[r.piece])/2,.14),z:r.z,rotation:r.rotation,level:r.level});this.state.builds.set(b.id,b);
  });
  this.onMessage('delete',(c,id)=>{
   if(!this.limit(c,'build',200)||typeof id!=='string')return;const b=this.state.builds.get(id),p=this.state.players.get(c.sessionId);
   if(b&&p&&b.ownerId===c.sessionId&&Math.hypot(b.x-p.x,b.z-p.z)<=8)this.state.builds.delete(id);else c.send('notice','Only the owner may remove a nearby piece');
  });
  this.setSimulationInterval(()=>{this.state.tick++;for(const [id,p]of this.state.players){const q=this.queues.get(id);const i=q?.shift();if(p.connected&&i)step(p,i,this.state.builds.values());}},STEP*1000);
 }
 limit(c,key,ms){const k=c.sessionId+key,now=Date.now();if(now-(this.rates.get(k)||0)<ms)return false;this.rates.set(k,now);return true;}
 onJoin(c,o){const p=new Player();p.sessionId=c.sessionId;p.displayName=String(o.displayName||'Explorer').replace(/[^a-zA-Z0-9 _-]/g,'').slice(0,20)||'Explorer';this.state.players.set(c.sessionId,p);this.queues.set(c.sessionId,[]);}
 async onLeave(c,consented){const p=this.state.players.get(c.sessionId);if(p)p.connected=false;this.queues.set(c.sessionId,[]);if(!consented){try{await this.allowReconnection(c,20);p.connected=true;return;}catch{}}this.state.players.delete(c.sessionId);this.queues.delete(c.sessionId);for(const k of this.rates.keys())if(k.startsWith(c.sessionId))this.rates.delete(k);}
}
export async function start(port=Number(process.env.PORT)||2567){
 const app=express(),http=createServer(app);app.get('/health',(_,res)=>res.json({ok:true,tickHz:30,patchHz:20,maxClients:8}));
 app.use('/sdk',express.static(fileURLToPath(new URL('./node_modules/colyseus.js/dist',import.meta.url))));
 for(const route of ['/','/multiplayer.html','/multiplayer-main.js','/multiplayer/physics.js'])app.get(route,(_,res)=>res.sendFile(fileURLToPath(new URL(route==='/'?'../multiplayer.html':'..'+route,import.meta.url))));
 const game=new Server({transport:new WebSocketTransport({server:http,maxPayload:4096})});game.define('world',WorldRoom).filterBy(['worldId']);await game.listen(port);return {game,http};
}
if(process.argv[1]===fileURLToPath(import.meta.url))start().then(()=>console.log('Multiplayer preview: http://localhost:'+(process.env.PORT||2567)));
