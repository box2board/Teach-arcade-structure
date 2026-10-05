# Review Pinball — first playable table

Prototype route: `/arcade-review-games/review-pinball/`. No hub or live-site navigation changes.

Neon Circuit is a topic-neutral table. Select Classic or Assisted, then select an existing Scientific Method or French Revolution question bank. The first ball is free. After a drain, two correct answers earn a replacement ball. Wrong answers show the correct answer without removing earned progress. Score, bank-target lights, and multiplier persist across balls.

## Engine boundaries

- `tables.js`: table dimensions, rails, bumpers, bank targets, and flipper geometry. Physics accepts a table configuration so future tables can reuse the simulation.
- `physics.js`: fixed-step ball simulation, moving flipper contact, restitution, bumpers, slingshots, speed limits, scoring contacts, and drain callbacks. No curriculum content or DOM dependencies.
- `game.js`: session flow, review adapter, input, rendering, sound, ball saver, and scoring objectives. Existing question-bank files are loaded read-only; this prototype does not establish or migrate the future shared-bank format.
- `styles.css` / `index.html`: responsive cabinet and accessible controls.
- `renderer.js`: independent depth-styled canvas presentation with cached playfield, metallic rails, raised bumper caps, recessed inserts, ramp supports and shadows, and beveled flippers. Rendering reads game state but never changes collision geometry or physics. High-DPI drawing is capped at 2× resolution.

Keyboard: arrows or A/D for flippers, Space to launch, P to pause. Questions support arrows and Enter or number keys. Touch supports simultaneous flippers with pointer capture. Losing browser focus pauses active play.

## Player-controlled plunger and launch-lane cap

Hold Space or the PLUNGER button, then release to launch. Pull builds over 1.4 seconds and saturates at full strength, with a visible spring, power meter, and percentage. A short pull launches at 950 units/second and a full pull at 1,250; all strengths are deterministic and tested to enter the playfield. The default physics API launch still uses the approved 1,080-unit speed. Enter on the focused button offers a short-pull launch. Pause, blur, hidden tabs, pointer cancellation, and ending a session cancel a pending pull without firing.

The cap spans the shooter-lane mouth and closes only after the whole ball clears it. It prevents re-entry from above, reopening when a new ball is seated. Review-earned balls return to a stationary ready state rather than launching automatically. Saver returns also require player launch and preserve the existing saver deadline, so they do not grant a fresh saver window. Idle plunger time does not consume simulation timers; the saver starts on the first actual launch. All free-ball motion constants remain unchanged.

Classic uses a seven-second launch saver. Assisted widens the flippers and uses a twelve-second saver. Four bank targets light a 2,500-point jackpot, collected by hitting a bumper. The multiplier then rises to a maximum of five.

## Verification

`node scripts/test-pinball.mjs` verifies shooter-lane exit, finite motion, unattended drains in both modes, upward impulses from both flippers, and contact scoring debounce. Browser checks cover start, launch, natural drain, pause/resume, incorrect feedback, two-correct replacement ball, score persistence, session results, both existing banks, and narrow-phone overflow. No browser runtime errors observed.

This is a playtest candidate. Human playtesting should judge shot control, difficulty, target reachability, and whether ball movement feels entertaining before more tables are designed. Multiball is not part of this table.

## Expanded Neon Circuit

Skyline Ramp adds an elevated polyline channel entered through an actual upward shot at its left mouth. Gravity along the channel changes speed; weak shots roll back, while completed shots return above the right flipper and score 750. Every third completed ramp earns a 2,000 bonus. A ramp and full loop in either order within eight seconds earn a 1,000 combo bonus. Bonuses use the current multiplier. Ramp count persists across replacement balls; the combo window resets on a drain. The loop now requires an upward entrance, top crossing, and downward exit in the opposite lane within three seconds. Geometry and approved free-ball constants remain separate. Browser verification covers both question banks, feedback, replacement-ball score persistence, desktop layout, narrow-phone overflow, and absence of runtime errors.

## Reactor presentation and turbine contact repair

Neon Circuit now has original reactor-station floor graphics, energy conduits, and a raised core display with four illuminated sectors. This presents the existing bank-target jackpot rather than adding new collision objects or rules. The spinner is a turbine with rotating blades, a hit glow, and floating point feedback; its visible circular footprint is used for swept ball-radius-aware contact, including edge and horizontal hits. Contact latching awards once per encounter rather than repeatedly during overlap. Spin decay is slower for legible feedback, but the ball receives no new forces. Approved launch, gravity, drag, bumper, flipper, and ramp movement remain unchanged.

## Rebound tuning

The center spinner scores 150 on a swept gate crossing in either direction. Its damped rotation is visual and does not inject ball momentum. `scoring.js` tracks Circuit Rush independently of physics and question topics: complete ramp, loop, and spinner to unlock 15 seconds of double regular shot points (including targets and bumpers). Jackpot and combo bonuses retain their usual multiplier, without rush doubling. Rush time uses simulation time, freezes on pause, and ends on an unsaved drain; incomplete shot progress persists across balls. Ramp hardware is now cached as a separate raised layer; stationary screens skip redundant canvas drawing. Keyboard aliases and touch holds are tracked independently so releasing one control does not cancel another held control for the same flipper.

Bumper rebounds preserve tangent momentum, use 0.88 restitution, and add at most 75 units/second of outward speed, scaled down to 30% of incoming normal speed for light contacts. Overlap correction no longer triggers a powered impulse or scoring when the ball is already separating. Slingshot kicks follow their surface normal rather than adding arbitrary horizontal/upward velocity. Regression checks cover direct hits, glancing hits, separating overlaps, repeated contact, and slingshot tangent momentum.

The launch is restored to its original fast 1,080-unit upward speed. Gravity (620 units/second²) slows rising shots and accelerates downhill travel; rolling drag and passive wall/target rebounds dissipate energy. The old low global speed ceiling and continuous launch-lane velocity overwrite are removed. A high 1,800-unit ceiling remains only for runaway collision stability. Powered impulses retain their gentle 0.85 scale, independently of launch and gravity. Flipper animation, review flow, and ball-saver timers remain in real time. Regression checks verify upward deceleration, downhill acceleration, passive energy loss, and no ordinary-speed clipping.
