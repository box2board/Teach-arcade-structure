import assert from 'node:assert/strict';
import { relayStep, relayObjective, sequenceClue } from '../public/dev/3d-adventure-engine/relay-progress.js';
globalThis.window = {};
for (const file of ['adventure-config-v11.js', 'silent-observatory/config-v12.js']) {
  await import(new URL(`../public/dev/3d-adventure-engine/${file}`, import.meta.url));
  const config = window.TA3DAdventureConfig;
  const order = config.relayPuzzle.order;
  for (const id of ['easy','medium','hard']) {
    const settings = config.difficulties[id];
    let progress = relayStep(order,0,order[0]).progress;
    const wrong = relayStep(order,progress,order[0],settings.preserveRelayProgressOnMistake);
    assert.equal(wrong.accepted,false);
    assert.equal(wrong.progress,settings.preserveRelayProgressOnMistake ? 1 : 0);
    if (!settings.preserveRelayProgressOnMistake) assert.deepEqual(relayObjective(config,wrong.progress,settings.showNextRelay),config.mission.objectives.start);
    const objective = relayObjective(config,progress,settings.showNextRelay);
    const label = config.relayPuzzle.stations[order[1]].label;
    assert.equal(objective.detail.includes(label),settings.showNextRelay, `${config.id}/${id}: next-relay hint policy`);
    for(let i=1;i<order.length;i++) {
      const result = relayStep(order,progress,order[i],settings.preserveRelayProgressOnMistake);
      assert.equal(result.accepted,true);
      progress=result.progress;
      assert.equal(result.complete,progress===order.length);
    }
    assert.deepEqual(relayObjective(config,progress,settings.showNextRelay),config.mission.objectives.archive);
    assert.equal(relayStep(order,progress,order[0]).progress,order.length);
  }
  const clue=sequenceClue(config.relayPuzzle);
  for(const id of order) assert.ok(clue.includes(config.relayPuzzle.stations[id].label));
  console.log(`${config.id}: Easy/Medium/Hard order, mistake recovery, guidance, completion and readable clue pass`);
}
