# Review Pinball — first playable table

Prototype route: `/arcade-review-games/review-pinball/`. No hub or live-site navigation changes.

Neon Circuit is a topic-neutral table. Select Classic or Assisted, then select an existing Scientific Method or French Revolution question bank. The first ball is free. After a drain, two correct answers earn a replacement ball. Wrong answers show the correct answer without removing earned progress. Score, bank-target lights, and multiplier persist across balls.

## Engine boundaries

- `tables.js`: table dimensions, rails, bumpers, bank targets, and flipper geometry. Physics accepts a table configuration so future tables can reuse the simulation.
- `physics.js`: fixed-step ball simulation, moving flipper contact, restitution, bumpers, slingshots, speed limits, scoring contacts, and drain callbacks. No curriculum content or DOM dependencies.
- `game.js`: session flow, review adapter, input, rendering, sound, ball saver, and scoring objectives. Existing question-bank files are loaded read-only; this prototype does not establish or migrate the future shared-bank format.
- `styles.css` / `index.html`: responsive cabinet and accessible controls.

Keyboard: arrows or A/D for flippers, Space to launch, P to pause. Questions support arrows and Enter or number keys. Touch supports simultaneous flippers with pointer capture. Losing browser focus pauses active play.

Classic uses a seven-second launch saver. Assisted widens the flippers and uses a twelve-second saver. Four bank targets light a 2,500-point jackpot, collected by hitting a bumper. The multiplier then rises to a maximum of five.

## Verification

`node scripts/test-pinball.mjs` verifies shooter-lane exit, finite motion, unattended drains in both modes, upward impulses from both flippers, and contact scoring debounce. Browser checks cover start, launch, natural drain, pause/resume, incorrect feedback, two-correct replacement ball, score persistence, session results, both existing banks, and narrow-phone overflow. No browser runtime errors observed.

This is a first playtest candidate. Human playtesting should judge shot control, difficulty, target reachability, and whether ball movement feels entertaining before more tables are designed. Ramps and multiball are not part of this first table.

## Rebound tuning

Bumper rebounds preserve tangent momentum, use 0.88 restitution, and add at most 75 units/second of outward speed, scaled down to 30% of incoming normal speed for light contacts. Overlap correction no longer triggers a powered impulse or scoring when the ball is already separating. Slingshot kicks follow their surface normal rather than adding arbitrary horizontal/upward velocity. Regression checks cover direct hits, glancing hits, separating overlaps, repeated contact, and slingshot tangent momentum.
