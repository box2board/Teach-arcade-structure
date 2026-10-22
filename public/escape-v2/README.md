# Teach Arcade Escape Room V2

Escape Room V2 is a reusable, data-driven browser engine. It separates the shared player systems from each educational room pack.

## Architecture

- `js/engine.js` owns story flow, timer, puzzle dispatch, journal, solution gating, completion and learning review.
- `js/viewer-3d.js` owns the Three.js renderer, room shell, camera, touch/mouse/keyboard look controls, raycast interaction, focus feedback, resize handling and renderer cleanup.
- `js/boot.js` loads the selected room pack, installs the viewer adapter, then starts the engine.
- `rooms/<pack-id>/data.js` owns narrative, learning content, clue answers, scene dimensions, shell openings, materials, prop placement, lighting and interactable world positions.

Launch a pack with `/escape-v2/?room=<pack-id>`. The renderer consumes a room's `scene` definition and its interactable IDs; puzzle/journal systems consume the separate `hotspots` data. Puzzle rendering is dispatched by `type`, so new puzzle types can be added without changing room geometry or curriculum data.

## Current test pack: French Revolution

Room 1 — The Prison Cell is the proving ground. It uses a real 3D room shell with connected stone surfaces, floor and ceiling. Its room-pack configuration defines the barred door, barred window, cool daylight, warm torch light, props and five world-space clue zones.

The five existing questions and rewards remain in the French Revolution pack. Completing the phrase ends at the Room 1 completion/review screen. Rooms 2 and 3 are planning data only and are not implemented.

## Controls and performance

- Drag or swipe to look; touch gestures are captured by the room canvas so the page does not scroll.
- Arrow keys rotate the view; Enter/Space interact with the object at the center reticle.
- Tap/click a highlighted world-space clue zone to investigate.
- The renderer caps pixel ratio at 1.5, reuses scene materials, responds to element resizing and disposes renderer resources when the room ends.
- Three.js is loaded as a pinned browser ES module from jsDelivr.

The former panorama/cubemap files remain as archived experiment artifacts and are not loaded by the V2 page.


## Extending puzzle types

Puzzle renderers are registered independently in `js/puzzles.js`. The core engine only dispatches by the puzzle's `type`, tracks attempts, and supplies shared answer/feedback helpers. A room pack can list additional renderer scripts in its optional `puzzleModules` array; each script calls `window.ESCAPE_V2_PUZZLES.register(type, render)` after the built-in registry loads.

A renderer receives `(puzzle, context)`, where context includes `container`, `onAttempt()`, `onCorrect()`, `setFeedback(message, isCorrect)`, and `matchesAnswer(value, acceptedAnswers)`. Use DOM text properties for room content. The built-in `choice` and `text` renderers demonstrate the contract. This lets future sequencing, matching, code-entry, or evidence-selection interactions be added as modules without changing the game loop or 3D scene.


## Room-pack scene props

The 3D viewer provides room-shell rendering and generic box, sphere, and cylinder primitives. Room-specific prop builders live with their room pack. A scene can load optional ES modules through `scene.propModules`; each exports `registerEscapeRoomProps(registry)` and registers named builders. Builders receive the Three.js namespace, scene group, shared materials, and primitive helpers. Room packs can therefore define themed props while the renderer stays independent of any one setting. Simple configured geometry remains available for packs that do not need custom models.


## Room pack contract

Before the game starts, the bootstrap validates required pack and room fields, positive scene dimensions, unique clue and interactable IDs, world positions, and matching clue/interactable IDs. Built-in `choice` and `text` puzzles receive type-specific answer checks. The validator leaves other puzzle types open for registered renderer modules. Run `node scripts/test-escape-v2-pack.mjs` after changing the contract or room data.
