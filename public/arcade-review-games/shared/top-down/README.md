# Quest Arcade engine

The Three Seals and Mosslight Outpost load the same `game.js`, `model.js`, artwork, styles and review manager. Their pages select a map module and a question module using `data-map` and `data-question-set`. Neither adventure needs a branch in the shared gameplay code.

## Creating an adventure

Export `createAdventure(mode)` from a map module. Return fresh data each call. Export `{content: {questions: [...]}}` from the curriculum module. Each question has a unique `id`, `text`, unique `choices`, an `answer` matching a choice, and an `explanation`.

Maps define:

- `tiles`: equal-width rows; `#` walls, `.` floor, `~` water.
- `start`, `blocks`, `plates`, `doors`, `objects`, `inventory`, and `rooms`.
- One exit. It can require inventory items, activated switches, and/or a sequence puzzle. A sequence is optional.
- `modes`: IDs, labels and descriptions. Each mode's returned map decides its geometry and question counts.
- `startMessage`, `completion` label/title/summary, and `progressLabel`.
- `milestones`: conditions used to count progress. Different maps can have different totals.
- Rooms with world bounds (`min`, `max`, `minY`, `maxY`) and camera bounds (`viewMin`, `viewMax`, `viewMinY`, `viewMaxY`). Every floor tile belongs to exactly one room.
- A room's default `objective` plus optional `objectiveRules`. The first matching rule wins.

Conditions support lists of `tools`, `items`, `keys`, `usedKeys`, `opened`, `activated`, `discovered`, `solved` or `collected`; `doorOpen` and `exitReady` reference IDs. Combine conditions using `all`, `any` and `not`. For example:

```js
{when:{opened:['east-crossing'],items:['lens']},text:'Carry the lens east to Relay.'}
```

Reward chests specify `questionCount` and a reward `{type, value, label, message}`. Reward values must match inventory definitions. The question bank must supply enough unique questions for every chest in the selected mode. Correct answers and rewards remain earned after Undo and Reset puzzle.

Doors can reference a key, a tool, one plate or an array of plates that must all be occupied. `lockedText`, `openText` and `keyLabel` customize messages. A mirror is a movable block with `kind:'mirror'` and an orientation of `/` or `\\`. Emitters, receivers, bridge switches and bridges use IDs to connect their behavior. Raised bridges latch open and remain open after resets.

`validateAdventure` checks geometry and references before play. It does not prove puzzle solvability; add a complete-route test for every map/mode.

## Verification

```sh
node --test scripts/test-top-down.mjs scripts/test-top-down-review.mjs scripts/test-top-down-light.mjs scripts/test-top-down-reuse.mjs
node scripts/test-top-down-ui.mjs
node scripts/test-top-down-outpost-ui.mjs
node --test scripts/test-top-down-viewport.mjs
node --test scripts/test-top-down-motion.mjs
```

The UI scripts use a simulated DOM, not a browser. Browser/mobile visual and interaction verification remains necessary. Save/resume across refreshes and classroom report export are not implemented yet.

The shared viewport layout fits the active room into the available stage with square tiles, recalculating on resize. Laptops place controls and objectives beside the map; portrait phones place compact controls below it. Bag & clues, Help, and full-message dialogs keep longer information accessible without extending the gameplay page. Tall rooms still use a tall footprint: design wider camera bounds and room geometry for adventures intended to fill a laptop horizontally.

Mosslight Outpost demonstrates 13-by-9 room cameras on a 25-by-17 world. Its reward chests span the wider rooms, the crossing is on the east boundary, and the relay crate travels four tiles to its floor switch. All four room views keep the same aspect ratio at transitions.

`motion.js` drives a continuous player position at four tiles per second with normalized diagonal input, a small circular collision footprint, short collision substeps, and sliding along walls. The nearest occupied tile remains the model's logical position for review interactions, pickups, and room ownership. Grid model moves commit cell crossings and centered block pushes; inventory doors open on approach. Rendering updates the explorer through a composited transform every frame. Ordinary cell crossings preserve entity and inventory DOM; full updates occur when puzzle state changes or the camera enters another room. Undo and reset synchronize the continuous position back to the restored tile. Dialogs, blur, and hidden tabs release held input.
