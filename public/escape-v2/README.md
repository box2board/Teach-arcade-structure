# Teach Arcade Escape Room V2

Escape Room V2 is a reusable, data-driven browser engine. It separates the shared player systems from each educational room pack.

## Architecture

- `js/engine.js` owns story flow, timer, puzzle dispatch, journal, solution gating, completion and learning review.
- `js/viewer-3d.js` owns the Three.js renderer, room shell, camera, touch/mouse/keyboard look controls, raycast interaction, focus feedback, resize handling and renderer cleanup.
- `js/boot.js` loads the selected room pack, installs the viewer adapter, then starts the engine.
- `rooms/<pack-id>/data.js` owns narrative, learning content, clue answers, scene dimensions, materials, prop placement and interactable world positions.

Launch a pack with `/escape-v2/?room=<pack-id>`. The renderer consumes a room's `scene` definition and its interactable IDs; puzzle/journal systems consume the separate `hotspots` data. Puzzle rendering is dispatched by `type`, so new puzzle types can be added without changing room geometry or curriculum data.

## Current test pack: French Revolution

Room 1 — The Prison Cell is the proving ground. It uses a real 3D room shell with one barred door, one barred window, connected stone surfaces, floor and ceiling, warm corridor light and cool daylight, plus room-pack props and five world-space clue zones.

The five existing questions and rewards remain in the French Revolution pack. Completing the phrase ends at the Room 1 completion/review screen. Rooms 2 and 3 are planning data only and are not implemented.

## Controls and performance

- Drag or swipe to look; touch gestures are captured by the room canvas so the page does not scroll.
- Arrow keys rotate the view; Enter/Space interact with the object at the center reticle.
- Tap/click a highlighted world-space clue zone to investigate.
- The renderer caps pixel ratio at 1.5, reuses scene materials, responds to element resizing and disposes renderer resources when the room ends.
- Three.js is loaded as a pinned browser ES module from jsDelivr.

The former panorama/cubemap files remain as archived experiment artifacts and are not loaded by the V2 page.
