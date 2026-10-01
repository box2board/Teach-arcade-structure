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
```

The UI scripts use a simulated DOM, not a browser. Browser/mobile visual and interaction verification remains necessary. Save/resume across refreshes and classroom report export are not implemented yet.
