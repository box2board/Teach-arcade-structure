import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readDuringSlowPoll} from '../public/multiplayer/mayhem/slow-poll.js';

const move = {action:'mini-input', since:100, packet:{seq:12,boost:true}};
const snapshot = seq => ({status:200, state:{phase:'mini',since:100,
  player:{miniPlayerId:'fox'}, minigame:{boats:[{id:'fox',seq},{id:'frog',seq:20}]}}});

test('a prompt input reply uses one request', async () => {
  const actions=[];
  const reply=await readDuringSlowPoll(async request=>{
    actions.push(request.action);
    return snapshot(12);
  },move);
  assert.deepEqual(actions,['mini-input']);
  assert.deepEqual(reply,snapshot(12));
});

test('a delayed boost is sent once while fresh snapshots continue', async () => {
  const actions=[], displayed=[];
  let seq=10, primaryCancelled=false;
  const call=(request,signal)=>{
    actions.push(request.action);
    if(request.action==='state')return Promise.resolve(snapshot(++seq));
    return new Promise((_,reject)=>signal.addEventListener('abort',()=>{
      primaryCancelled=true;
      reject(new Error('cancelled'));
    }));
  };
  const reply=await readDuringSlowPoll(call,move,{
    delay:1,onSnapshot:state=>displayed.push(state.minigame.boats[0].seq)
  });
  assert.deepEqual(actions,['mini-input','state','state']);
  assert.deepEqual(displayed,[11]);
  assert.deepEqual(reply,snapshot(12));
  assert.equal(primaryCancelled,true);
});

test('a completed round releases a pending input even when its arena is gone',async()=>{
  const ended={status:200,state:{phase:'finished'}};
  const reply=await readDuringSlowPoll(request=>request.action==='state'?Promise.resolve(ended):new Promise(()=>{}),move,{delay:1});
  assert.equal(reply,ended);
});

test('a failed recovery read cannot replace a successful primary response',async()=>{
  let finish;
  const reply=await readDuringSlowPoll(request=>{
    if (request.action==='mini-input') return new Promise(resolve=>{finish=resolve;});
    finish(snapshot(12));
    return Promise.resolve({status:502});
  },move,{delay:1});
  assert.deepEqual(reply,snapshot(12));
});
