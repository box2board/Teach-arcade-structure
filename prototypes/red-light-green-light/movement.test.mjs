import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMovementPreview } from '../../public/mini-games/games/red-light-green-light/movement-preview.js';
import { FIELD } from '../../public/mini-games/games/red-light-green-light/rules.js';

test('visual movement responds before a server patch and stays bounded during delay', () => {
  const preview = createMovementPreview();
  const player = {x: 0, z: 1, vx: 0, vz: 0, facing: 0, motion: 'idle', status: 'racing', connected: true};
  const state = {roundId:1, phaseId:2, phase:'green'};
  preview.sample(player, state, {x:0,z:0}, 1000, 0);
  const first = preview.sample(player, state, {x:0,z:1}, 1016, 16);
  assert(first.z > player.z);
  assert.equal(first.motion, 'run');
  let predicted;
  for (let elapsed = 32; elapsed < 250; elapsed += 16) {
    predicted = preview.sample(player, state, {x:0,z:1}, 1000 + elapsed, elapsed);
    assert(predicted.z - player.z <= FIELD.speed * .15);
  }
  const stale = preview.sample(player, state, {x:0,z:1}, 1300, 300);
  assert.equal(stale.z, player.z);
  const red = preview.sample(player, {...state, phase:'red',phaseId:3}, {x:0,z:1}, 1316, 0);
  assert.equal(red.z, player.z);
  assert.equal(red.motion, 'idle');
  assert.equal(player.z, 1);
});

test('server correction and rematch discard previous visual progress', () => {
  const preview = createMovementPreview();
  const player = {x: 0, z: 50, vx: 0, vz: 0, facing: 0, motion: 'idle', status: 'racing', connected: true};
  const state = {roundId:1, phaseId:2, phase:'green'};
  preview.sample(player,state,{x:0,z:1},1000,0);
  const after = preview.sample({...player,z:-.8},{...state,roundId:2}, {x:0,z:1},1016,0);
  assert.equal(after.z,-.8);
  preview.reset();
  assert.equal(preview.sample({...player,z:5},state,{x:0,z:0},1032,0).z,5);
});

test('red movement preview follows held input until the server eliminates the runner', () => {
  const preview = createMovementPreview();
  const player = {x:0,z:2,vx:0,vz:11,facing:0,motion:'run',status:'racing',connected:true};
  const state = {roundId:1,phaseId:3,phase:'red'};
  preview.sample(player,state,{x:0,z:1},1000,0);
  const moving = preview.sample(player,state,{x:0,z:1},1016,16);
  assert(moving.z > player.z);
  assert.equal(moving.motion,'run');
  const eliminated = preview.sample({...player,status:'out',motion:'idle'},state,{x:0,z:1},1032,0);
  assert.equal(eliminated.z,player.z);
  assert.equal(eliminated.motion,'idle');
});
