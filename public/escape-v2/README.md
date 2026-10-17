# Teach Arcade Escape Room V2

Escape Room V2 is a new reusable engine for future 360-degree classroom escape rooms. It is intentionally isolated from the existing `/public/escape/` implementation and must not replace or modify current rooms.

## Core experience

1. Pre-story/title screen with a 1–2 paragraph mission setup.
2. Student starts the timer and enters Room 1.
3. Each room is a horizontally rotatable 360-degree panoramic scene.
4. Interactive hotspots are positioned by yaw/pitch values rather than baked into engine code.
5. Solving each hotspot reveals a clue that persists in the Investigation Journal.
6. When every clue in a room is solved, the room solution unlocks.
7. A correct room solution advances to the next room.
8. The only game-over condition is the overall timer reaching zero.
9. Successful completion produces a learning review with discoveries and performance data.

## Room sizing convention

- `small`: 3 clue objects
- `medium`: 4 clue objects
- `large`: 5 clue objects

A room may contain many non-interactive visual details; only the configured hotspot objects are game interactions.

## Room packs

The engine loads room packs from:

`/escape-v2/rooms/<room-id>/data.js`

Launch a pack with:

`/escape-v2/?room=<room-id>`

If no room is specified, the engine loads the disposable `prototype` pack. Invalid or missing requested packs fall back to the prototype.

Each room pack owns its theme, story, timer, room list, panorama assets, hotspot placement, puzzle content, clues, solutions, and learning-review text. The engine owns interaction, movement, timing, journal behavior, progression, success/failure states, and the review UI.

## Current prototype

The prototype proves the reusable vertical slice with:

- story/start screen
- mouse, touch, wheel, and keyboard panorama rotation
- yaw/pitch hotspot positioning
- multiple-choice and text-answer puzzles
- persistent investigation journal
- per-room discovery progress
- locked/unlocked room solution
- multi-room continuation support in the engine
- timer-only failure
- success review with time, discoveries, answer attempts, and learning recap
- query-string room-pack loading

The prototype SVG is temporary functional art, not a production visual direction.

## French Revolution target pack

The first production room pack will be `french-revolution` with three rooms:

1. **Bastille prison cell — large — 5 clues**: assemble a phrase that convinces an escaped prisoner to open the cell.
2. **Guard office — small — 3 clues**: determine a code that opens a locked desk drawer containing a tool to pry open the window.
3. **Outer Bastille wall — medium — 4 clues**: assemble a phrase that convinces the crowd the player is a supporter and enables rescue before the Bastille falls.

Production panorama art should be AI-rendered, historically coherent, and designed as wide/equirectangular room scenes with the configured clue objects visually integrated into the environment.

## Next engine passes

Before production art is locked, expand the puzzle library beyond `choice` and `text` with reusable challenge renderers such as sequencing, matching, code locks, evidence sorting, image inspection, and multi-step riddles. Then build and classroom-test the French Revolution pack without changing the V1 escape rooms.
