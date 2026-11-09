import { Server, Room, ServerError, matchMaker } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { Schema, MapSchema, defineTypes } from '@colyseus/schema';
import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { STEP, initialPlayer, step, validBuild } from './physics.js';
import { enqueueInput } from './input-queue.js';
import { performance } from 'node:perf_hooks';
import { runDeviceBots } from './device-bots.mjs';
// Explicit review opt-in; capacity above 20 remains gated.
const capacity = process.env.WORLD_MAX_CLIENTS === '20' ? 20 : 8;
class Player extends Schema { constructor(){super();Object.assign(this,initialPlayer(),{sessionId:'',displayName:'',connected:true});} }
defineTypes(Player,{sessionId:'string',displayName:'string',connected:'boolean',x:'number',y:'number',z:'number',vx:'number',vz:'number',vy:'number',rotation:'number',grounded:'boolean',movement:'string',animation:'string',seq:'number'});
class Build extends Schema {}
defineTypes(Build,{id:'string',ownerId:'string',classId:'string',worldId:'string',groupId:'string',missionId:'string',piece:'string',x:'number',y:'number',z:'number',rotation:'number',level:'number'});
class World extends Schema {constructor(){super();this.players=new MapSchema();this.builds=new MapSchema();this.tick=0;this.capacity=capacity;this.maxTickGapMs=0;this.maxStepMs=0;this.maxQueueDepth=0;this.coalescedInputs=0;this.sampleTimeMs=0;this.maxPatchGapMs=0;this.deviceStatus='';}}
defineTypes(World,{players:{map:Player},builds:{map:Build},tick:'number',capacity:'number',maxTickGapMs:'number',maxStepMs:'number',maxQueueDepth:'number',coalescedInputs:'number',sampleTimeMs:'number',maxPatchGapMs:'number',deviceStatus:'string'});
export class WorldRoom extends Room {
 onCreate(options){
  const refuse=(code,message)=>{this.setPatchRate(null);this.autoDispose=false;throw new ServerError(code,message);};
  if(typeof options.worldId!=='string'||!/^[-a-zA-Z0-9_]{1,80}$/.test(options.worldId))refuse(4216,'Invalid world code');
  this.deviceMode=options.worldId.startsWith('device-');
  const config=this.deviceReview, roomCapacity=config?.capacity??capacity;
  if(config?.scaleReview&&!(options.worldId===config.worldId||
    (options.worldId==='scale40-network'&&Date.now()<config.networkUntil)))refuse(4216,'Scale review room unavailable');
  if(this.deviceMode){
   if(roomCapacity<20||options.worldId!==config?.worldId)refuse(4216,'Device check unavailable');
   this.deviceBotKey=randomUUID();this.deviceBotIds=new Set();this.setPrivate(true);
  }
  if(this.deviceMode||config?.scaleReview){
   if(config.activeRoom)refuse(4216,'Device check already in use');
   config.activeRoom=this;
  }
  this.maxClients=roomCapacity;this.setState(new World());this.state.capacity=roomCapacity;this.setPatchRate(50);this.queues=new Map();this.rates=new Map();this.worldId=options.worldId;
  if(this.deviceMode)this.state.deviceStatus='waiting';
  if(config?.scaleReview){
   for(const x of [12,16,24,28])for(const z of [-28,-26,-24,-22])for(const level of [0,1,2]){
    const b=new Build();Object.assign(b,{id:`review-${x}-${z}-${level}`,ownerId:'review-layout',classId:'prototype-class',worldId:this.worldId,groupId:'',missionId:'',piece:'pillar',x,y:1.25+level*2.5,z,rotation:0,level});this.state.builds.set(b.id,b);
   }
   if(!this.deviceMode)this.clock.setTimeout(()=>this.disconnect(),480000);
  }
  this.onMessage('input',(c,i)=>{
   const q=this.queues.get(c.sessionId),p=this.state.players.get(c.sessionId);
   if(!q||!p||!i||!Number.isSafeInteger(i.seq)||i.seq<=p.seq||i.seq>(q.at(-1)?.seq??p.seq)+120||![i.x,i.z].every(Number.isFinite)||Math.abs(i.x)>1||Math.abs(i.z)>1||q.length>=12||i.seq<=(q.at(-1)?.seq??p.seq))return;
   if(q.length===3)this.state.coalescedInputs++;
   enqueueInput(q,{x:i.x,z:i.z,sprint:i.sprint===true,jump:i.jump===true,seq:i.seq});
   this.state.maxQueueDepth=Math.max(this.state.maxQueueDepth,q.length);
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
  let previousTick=performance.now();
  this.setSimulationInterval(()=>{
   const began=performance.now();this.state.maxTickGapMs=Math.max(this.state.maxTickGapMs,began-previousTick);previousTick=began;
   this.state.tick++;
   const builds=[...this.state.builds.values()];
   for(const [id,p]of this.state.players){const i=this.queues.get(id)?.shift();if(p.connected&&i)step(p,i,builds);}
   this.state.maxStepMs=Math.max(this.state.maxStepMs,performance.now()-began);
  },STEP*1000);
 }
 onBeforePatch(){if(!this.state)return;const now=performance.now();if(this.state.sampleTimeMs)this.state.maxPatchGapMs=Math.max(this.state.maxPatchGapMs,now-this.state.sampleTimeMs);this.state.sampleTimeMs=now;}
 limit(c,key,ms){const k=c.sessionId+key,now=Date.now();if(now-(this.rates.get(k)||0)<ms)return false;this.rates.set(k,now);return true;}
 onJoin(c,o){
  if(this.deviceMode){
   if(o.deviceBotKey===this.deviceBotKey)this.deviceBotIds.add(c.sessionId);
   else{
    if(o.worldId!==this.worldId||this.deviceClientId)throw new ServerError(4216,'Device check needs its invite link and one tester');
    this.deviceClientId=c.sessionId;
    this.state.deviceStatus='warming';
    this.stopDeviceBots=runDeviceBots({
     endpoint:this.deviceReview.endpoint,durationMs:this.deviceReview.durationMs,count:this.maxClients-1,
     reserveSeat:i=>matchMaker.reserveSeatFor(this.listing,{deviceBotKey:this.deviceBotKey,displayName:`Simulated ${i+1}`}),
     onStatus:status=>{this.state.deviceStatus=status;}
    });
   }
  }
  const p=new Player();p.sessionId=c.sessionId;p.displayName=String(o.displayName||'Explorer').replace(/[^a-zA-Z0-9 _-]/g,'').slice(0,20)||'Explorer';this.state.players.set(c.sessionId,p);this.queues.set(c.sessionId,[]);
 }
 async onLeave(c,consented){
  const p=this.state.players.get(c.sessionId);if(!p)return;
  p.connected=false;this.queues.set(c.sessionId,[]);
  const bot=this.deviceBotIds?.delete(c.sessionId);
  if(!bot&&!consented){try{await this.allowReconnection(c,20);p.connected=true;return;}catch{}}
  if(c.sessionId===this.deviceClientId)this.stopDeviceBots?.();
  this.state.players.delete(c.sessionId);this.queues.delete(c.sessionId);for(const k of this.rates.keys())if(k.startsWith(c.sessionId))this.rates.delete(k);
 }
 onDispose(){this.stopDeviceBots?.();if(this.deviceReview?.activeRoom===this)this.deviceReview.activeRoom=null;}
}
export async function start(port=Number(process.env.PORT)||2567,{deviceWorldId=process.env.WORLD_DEVICE_REVIEW_CODE,deviceDurationMs=300000,scaleReview=false,networkUntil=0}={}){
 const inviteValid=/^device-[a-zA-Z0-9_-]{20,73}$/.test(deviceWorldId||'');
 if(scaleReview&&!inviteValid)throw Error('Scale review requires a private device invite');
 const roomCapacity=scaleReview?40:capacity;
 const deviceReview={worldId:deviceWorldId,endpoint:null,durationMs:deviceDurationMs,activeRoom:null,capacity:roomCapacity,scaleReview,networkUntil};
 const app=express(),http=createServer(app);app.get('/health',(_,res)=>res.json({ok:true,tickHz:30,patchHz:20,maxClients:roomCapacity,performanceVersion:'recovery-v1',deviceCheckEnabled:roomCapacity>=20&&inviteValid,scaleReview,networkReview:scaleReview&&Date.now()<networkUntil}));
 app.use('/sdk',express.static(fileURLToPath(new URL('./node_modules/colyseus.js/dist',import.meta.url))));
 for(const route of ['/','/multiplayer.html','/multiplayer-main.js','/multiplayer/physics.js','/multiplayer/recovery.js'])app.get(route,(_,res)=>res.sendFile(fileURLToPath(new URL(route==='/'?'../multiplayer.html':'..'+route,import.meta.url))));
 const game=new Server({transport:new WebSocketTransport({server:http,maxPayload:4096})});
 game.define('world',class extends WorldRoom { get deviceReview(){return deviceReview;} }).filterBy(['worldId']);
 await game.listen(port);deviceReview.endpoint='ws://127.0.0.1:'+http.address().port;return {game,http};
}
if(process.argv[1]===fileURLToPath(import.meta.url))start(undefined,{scaleReview:process.env.WORLD_SCALE_REVIEW==='1',networkUntil:Number(process.env.WORLD_SCALE_NETWORK_UNTIL)||0}).then(()=>console.log('Multiplayer preview: http://localhost:'+(process.env.PORT||2567)));
