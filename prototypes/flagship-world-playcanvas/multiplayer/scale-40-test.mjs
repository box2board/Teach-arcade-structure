import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { performance, monitorEventLoopDelay } from 'node:perf_hooks';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { Client } from 'colyseus.js';
import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { WorldRoom } from './server.mjs';

const COUNT = 40;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

if (process.argv[2] === '--server') {
  const http = createServer((_, res) => { res.writeHead(404); res.end(); });
  const game = new Server({ transport: new WebSocketTransport({ server: http, maxPayload: 4096 }), greet: false });
  // The real room, with a capacity override confined to this disposable process.
  game.define('world', class extends WorldRoom {
    onCreate(options) { super.onCreate(options); this.maxClients = COUNT; this.state.capacity = COUNT; }
  }).filterBy(['worldId']);
  await game.listen(0, '127.0.0.1');
  console.log('scale-ready '+http.address().port);
} else {
  await run();
}

async function run() {
  const duration = Number(process.env.WORLD_TEST_SECONDS ?? 300);
  assert(Number.isInteger(duration) && duration >= 30 && duration <= 300, 'Use 30–300 seconds');
  const child = spawn(process.execPath, [fileURLToPath(import.meta.url),'--server'], { env: { NODE_ENV: 'test' }, stdio:['ignore','pipe','inherit'] });
  const stdout=createInterface({input:child.stdout});
  const items = [], open = new Set(), acks = [], gaps = [], ping = [];
  const runnerDelay = monitorEventLoopDelay({ resolution: 20 }); runnerDelay.enable();
  let movement, began, inputs = 0, builds = 0, reconnects = 0;
  const reconnectMs = [];
  const deadline = setTimeout(() => { console.error('40-client test timed out'); child.kill(); process.exit(1); }, (duration + 90) * 1000);
  const until = async (condition, label) => {
    const end = performance.now() + 15000;
    while (!condition()) { if (performance.now() >= end) throw Error('Timed out: ' + label); await wait(25); }
  };
  const observe = room => {
    const i = { room, seq: 0, sent: new Map(), last: 0, paused: false };
    open.add(room);
    room.onLeave(() => { open.delete(room); if (!i.paused) i.disconnected = true; });
    room.onMessage('notice', value => { i.notice = value; });
    room.onMessage('pong', value => { if (began) ping.push(performance.now() - value); });
    room.onStateChange(state => {
      const now = performance.now();
      if (began && i.last) gaps.push(now - i.last);
      i.last = now;
      const p = state.players.get(room.sessionId); if (!p) return;
      i.seq = Math.max(i.seq, p.seq);
      if (i.sent.has(p.seq)) acks.push(now - i.sent.get(p.seq));
      for (const n of i.sent.keys()) if (n <= p.seq) i.sent.delete(n);
    });
    return i;
  };
  const allSee = predicate => items.every(({room}) => predicate(room.state));
  try {
    const { port } = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(Error('Test server did not start')), 12000);
      stdout.on('line', line => { const match=/^scale-ready (\d+)$/.exec(line); if(match){clearTimeout(timeout);resolve({port:Number(match[1])});} });
      child.once('error', error => { clearTimeout(timeout); reject(error); });
      child.once('exit', code => { clearTimeout(timeout); reject(Error('Test server exited: ' + code)); });
    });
    const endpoint = 'ws://127.0.0.1:' + port, worldId = 'scale40-' + crypto.randomUUID();
    const client = () => new Client(endpoint);
    for (let n=0; n<COUNT; n++) items.push(observe(await client().joinOrCreate('world',{worldId,displayName:`Load ${n+1}`})));
    const roomId = items[0].room.roomId;
    assert(items.every(i => i.room.roomId === roomId), 'Clients must all share a room');
    await until(() => allSee(s => s.players?.size === COUNT && s.capacity === COUNT), '40 clients receive the initial state');
    await assert.rejects(() => client().joinById(roomId,{worldId}), /locked|full/);
    console.log(`40 clients in one isolated room; 41st seat rejected. Running ${duration}s.`);
    const firstTick = items[0].room.state.tick;
    began = performance.now(); let lastPing = 0;
    movement = setInterval(() => {
      const now = performance.now(), t = (now - began) / 1000;
      items.forEach((i,n) => {
        if (i.paused || i.disconnected) return;
        const p = i.room.state.players.get(i.room.sessionId);
        const angle = t*.8 + n*.31;
        let x = Math.cos(angle), z = Math.sin(angle);
        if (n < 2) {
          const dx = 20 - n*2 - p.x, dz = -22 - p.z, d = Math.hypot(dx,dz);
          x = d > 1 ? dx/d : 0; z = d > 1 ? dz/d : 0;
        }
        const seq = ++i.seq;
        i.sent.set(seq,now); inputs++;
        i.room.send('input',{seq,x,z,sprint:n%3===0,jump:n>=2&&seq%120===n});
        if (now-lastPing>=1000) i.room.send('ping',now);
      });
      if (now-lastPing>=1000) lastPing=now;
    },1000/30);
    const cycles = duration === 300 ? 9 : 2;
    const owner = items[0], intruder = items[1], piece = {piece:'pillar',x:20,z:-18,level:0,rotation:0};
    const near = i => { const p=i.room.state.players.get(i.room.sessionId); return Math.hypot(p.x-piece.x,p.z-piece.z)<7; };
    for (let n=0;n<cycles;n++) {
      await wait(Math.max(0,began+(n+1)*duration*1000/(cycles+1)-performance.now()));
      await until(() => near(owner)&&near(intruder),'both players within building reach');
      owner.room.send('place',piece);
      await until(() => allSee(s => s.builds.size===1),'all 40 see shared placement');
      const b = [...owner.room.state.builds.values()][0];
      assert(allSee(s => s.builds.get(b.id)?.ownerId===owner.room.sessionId),'all clients agree on owner');
      intruder.notice = undefined; intruder.room.send('delete',b.id);
      await until(() => /Only the owner/.test(intruder.notice),'nearby non-owner deletion rejected');
      assert(allSee(s=>s.builds.has(b.id)));
      await wait(225);
      owner.room.send('delete',b.id);
      await until(() => allSee(s => s.builds.size===0),'all 40 see owner deletion'); builds++;
      if (n%2===1) {
        const old=items[COUNT-1], id=old.room.sessionId, token=old.room.reconnectionToken;
        assert(!old.disconnected,'No unexpected disconnect before the deliberate drop');
        old.paused=true; old.room.connection.close();
        await until(()=>owner.room.state.players.get(id)?.connected===false,'disconnect seen by peers');
        const t=performance.now(), restored=await client().reconnect(token);
        assert.equal(restored.sessionId,id);
        const next=observe(restored); next.paused=true; items[COUNT-1]=next;
        await until(()=>restored.state.players?.get(id)&&allSee(s=>s.players.get(id)?.connected),'reconnect presence');
        next.paused=false; reconnectMs.push(performance.now()-t); reconnects++;
      }
      console.log(`Cycle ${n+1}/${cycles}: shared build and ownership passed; ${reconnects} reconnects so far.`);
    }
    await wait(Math.max(0,began+duration*1000-performance.now()));
    clearInterval(movement);
    const elapsed=(performance.now()-began)/1000, state=owner.room.state;
    const tickHz=(state.tick-firstTick)/elapsed;
    await until(()=>items.every(i=>i.sent.size===0),'all movement acknowledgements drain');
    assert(allSee(s=>s.players.size===COUNT&&[...s.players.values()].every(p=>p.connected&&p.seq>0&&[p.x,p.y,p.z].every(Number.isFinite))));
    assert(items.every(i=>!i.disconnected),'No unexpected disconnects');
    assert(state.maxQueueDepth>0&&state.maxQueueDepth<=3,'Bounded server input queue');
    const exiting=items.at(-1); exiting.paused=true; await exiting.room.leave();
    await until(()=>items.slice(0,-1).every(i=>i.room.state.players.size===39),'leave cleanup');
    const stats = values => {
      assert(values.length); values.sort((a,b)=>a-b);
      return { median:+values[Math.floor(values.length*.5)].toFixed(2), p95:+values[Math.floor(values.length*.95)].toFixed(2), max:+values.at(-1).toFixed(2) };
    };
    console.log(JSON.stringify({result:'PASS',clients:COUNT,durationSeconds:+elapsed.toFixed(2),inputs,inputHzPerClient:+(inputs/COUNT/elapsed).toFixed(2),tickHz:+tickHz.toFixed(2),buildCycles:builds,reconnects,reconnectMs:stats(reconnectMs),ackMs:stats(acks),patchGapMs:stats(gaps),pingMs:stats(ping),serverMaxTickGapMs:state.maxTickGapMs,serverMaxStepMs:state.maxStepMs,serverMaxPatchGapMs:state.maxPatchGapMs,serverMaxQueueDepth:state.maxQueueDepth,coalescedInputs:state.coalescedInputs,runnerMaxLoopDelayMs:runnerDelay.max/1e6},null,2));
  } finally {
    clearInterval(movement); runnerDelay.disable();
    for (const room of open) room.connection.close();
    stdout.close();
    if (child.exitCode===null && child.signalCode===null) {
      child.kill();
      await Promise.race([once(child,'exit'),wait(3000).then(()=>{if(child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');})]);
    }
    clearTimeout(deadline);
  }
}
