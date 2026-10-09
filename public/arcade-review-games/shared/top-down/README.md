# Quest Arcade engine

The Three Seals and Mosslight Outpost load the same `game.js`, `model.js`, artwork, styles and review manager. Their pages select a map module and a question module using `data-map` and `data-question-set`. Neither adventure needs a branch in the shared gameplay code.

Mosslight Outpost also supplies `data-topics`, a local module exporting `topics` entries with `id`, `label`, `description`, `questionSet` and `content`. Students choose a topic before difficulty; the map, chest rewards and puzzles stay independent of curriculum. Each topic has its own unfinished save keyed by map and question-module path. Pause offers topic switching, and results identify the selected topic. A catalog bank must support the largest mode (currently twelve unique questions). Pages without a catalog retain their original startup flow.

## Creating an adventure

The Hint button pauses play and offers progressively clearer puzzle guidance. Maps can supply `hintRules` with unique `id`, `room`, `title`, `when` conditions and one to three `steps`; an optional `receiver`/`powered` pair distinguishes powered light circuits. The first matching rule in the current room wins. Without authored rules, the engine gives the current objective and general control/recovery advice, never undiscovered clues or review answer keys. Mosslight rules account for each layout’s starting pushes, earned rewards, counterweights and crossings. Strong push guidance explicitly names the starting arrangement and suggests Undo/Reset when objects have moved elsewhere.

Hint usage records the highest revealed tier per puzzle task. Reopening a hint does not increase that count; More guidance reveals another tier. Usage survives Continue and Reset but clears on Restart/new games. Reports list revealed tiers and assisted tasks separately from question accuracy and points. Hint wording is excluded from the save’s puzzle signature so help-copy edits do not invalidate compatible progress.

Export `createAdventure(mode)` from a map module. Return fresh data each call. Export `{content: {questions: [...]}}` from the curriculum module. Each question has a unique `id`, `text`, unique `choices`, an `answer` matching a choice, and an `explanation`.

Maps may export `chooseAdventure(mode, random)` to select a curated layout for a new adventure. `createAdventure(mode, layout)` must recreate a layout deterministically for saves. Mosslight Outpost offers Eastbound Light, Westward Relay and Southbound Signal in all three difficulties. New adventure and Play again choose a layout; Restart, Undo and Reset keep the current layout. The save records the layout ID and verifies its map signature; reports show the layout name. Pre-layout Outpost saves retain the classic geometry. Each offered layout has a complete gameplay-route test.

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
node --test scripts/test-top-down-camera.mjs
node --test scripts/test-top-down-save.mjs
node --test scripts/test-top-down-report.mjs
node --test scripts/test-top-down-outpost-modes.mjs
```

The UI scripts use a simulated DOM, not a browser. Browser/mobile visual and interaction verification remains necessary.

`report.js` builds a student report from the current adventure and review state. Pause offers an in-progress report; completion offers a final report. Students can add an optional name and download a plain text file for submission. First-try accuracy divides questions correct on the first try by questions attempted; unanswered questions are listed separately. Retries count responses beyond the first response for each attempted question. The report includes question prompts and the student's response history without an answer key. Review and treasure points remain separate. Report creation pauses play and does not change progress. Student names are neither saved nor sent to a server, and restart clears the name field. Reports are downloaded by the student; they are not automatically submitted to teachers.

`save.js` stores one unfinished adventure per map/question module pair in localStorage. Position, difficulty, puzzle state, inventory, shuffled review questions, attempts, undo history and elapsed play time persist. Gameplay saves at most once per second plus immediate answer/interaction/recovery writes and page-hide writes. Continue restores the map with no held inputs or open question dialog; reopen a chest to continue. Winning removes the unfinished save. Restart replaces it. Version, content signature, integrity checksum and shape checks reject incompatible or damaged saves. Storage failures do not interrupt play; Pause reports saving availability. Saves stay in the same browser and site origin and do not transfer between preview URLs, devices or accounts.

The shared viewport layout fits the active room into the available stage with square tiles, recalculating on resize. Laptops place controls and objectives beside the map; portrait phones place compact controls below it. Bag & clues, Help, and full-message dialogs keep longer information accessible without extending the gameplay page. Tall rooms still use a tall footprint: design wider camera bounds and room geometry for adventures intended to fill a laptop horizontally.

Mosslight Outpost demonstrates 13-by-9 room cameras on a 25-by-17 world. Its reward chests span the wider rooms, the crossing is on the east boundary, and the relay crate travels four tiles to its floor switch. All four room views keep the same aspect ratio at transitions.

Outpost Easy (`explore`, the default) retains the original one-crate route and six questions. Medium has eight questions, two crate counterweights, and a crank chest. Hard has twelve questions, three counterweights, and a mirror requiring northward and eastward pushes. Medium/Hard split Beacon with an impassable canal and one drawbridge. The crank remains a reusable tool after LIFT opens that route. Reset retains the tool, rewards, and opened bridges but returns counterweights to their original positions; gates close until their switches are occupied again. The mode route tests exercise continuous controls, all review rewards, crossing activation, report downloads and save/resume.

A `bridgeSwitch` can require `receiver`, `requiresTool`, or both. Validation requires at least one of those prerequisites and a valid `bridge`. Activation checks each configured prerequisite and latches the bridge open without consuming the tool. `lockedText`, `raiseText`, and `openText` explain a specific mechanism. A `bridge` can set `lockedText` and an `appearance` with matching active and `-down` artwork. Doors with a `plates` array require every plate to be occupied; they remain sensitive to block movement rather than latching open.

`motion.js` drives a continuous player position at four tiles per second with normalized diagonal input, a small circular collision footprint, short collision substeps, and sliding along walls. The nearest occupied tile remains the model's logical position for review interactions, pickups, and room ownership. Grid model moves commit cell crossings and centered block pushes; inventory doors open on approach. Rendering updates the explorer through a composited transform every frame. Ordinary cell crossings preserve entity and inventory DOM; full updates occur when puzzle state changes or the camera enters another room. Undo and reset synchronize the continuous position back to the restored tile. Dialogs, blur, and hidden tabs release held input.

Interaction targeting uses the continuous position, facing, nearby distance, lateral tolerance and a clear path to the object. The nearest available target is outlined and named on the Interact button. Exits require standing on their tile. Slightly off-center straight pushes gradually align the explorer with the block; diagonal approaches and distant side approaches do not trigger pushes.

Room changes use a 260 ms composited camera glide without blocking movement or review controls. Interrupted transitions start from the visible position; same-room puzzle redraws do not restart the glide. Resizing cancels the flight, and new adventures start immediately. Reduced-motion preferences and browsers without Web Animations use instant camera changes.
