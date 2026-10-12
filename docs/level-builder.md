# Side-scroller Level Builder: first working milestone

Development entry: `/dev/level-editor/`. No navigation or production game changes.

## Audit

The latest checked-in runtime is V1.3, layered over V1.2 core, physics and LevelBuilder. The development Pyramid Escape candidate uses that runtime. V1.3 adds dash/stomp, protection, gear, mounts, gated breakables and secrets. Existing V1.0–V1.2 editions and the original WWI Trench Run remain untouched.

LevelBuilder currently turns terrainSegments/hazardTiles/checkpointTiles into expanded tile layers. Runtime consumes expanded layers plus entity arrays; it does not rebuild procedural segments. The editor therefore preserves and exports expanded runtime data in an envelope:

`{format: 'teach-arcade-level', version: 1, engine: 'side-scroller-v1.3', theme: 'pyramid-v13', level: {...}}`

Expanded `level.layers` are authoritative. Do **not** run an edited exported level back through LevelBuilder.build: old source segments are retained for provenance, but would overwrite edited tiles. Version and engine mismatch reject explicitly.

## Supported workflow

- Starts from the Pyramid Escape V1.3 candidate. Browser draft restores on opening.
- Start from the Pyramid sample or a blank, flat level. Adjust width from 960 to 32000 pixels. Growing extends the terrain edge; shortening trims terrain beyond the new end but rejects objects/marker tiles that would be lost. The finish moves to fit. Undo restores the previous layout.
- Select and drag objects; paint terrain/checkpoints; erase tiles or objects. Pan tool, position slider, and Start/Finish navigation support touch use. Canvas backing width is capped at 12000 pixels while CSS retains the requested zoom, limiting memory for long levels.
- Add platforms, scarabs, question points, traps, breakables, bounce surfaces, ropes, power items, slopes, moving platforms, enemies and secret areas.
- Numeric inspector and dropdowns configure pickup type, break behavior, rope access, question rewards, enemy motion, and movement axis. Advanced JSON preserves other properties. Invalid numeric changes are rejected before changing history; Undo/Redo can recover intermediate layouts.
- Undo/redo, duplicate/delete, zoom, optional grid snapping, local draft, JSON import/export.
- Playtest uses an iframe with existing V1.2 + V1.3 engine, physics, Pyramid artwork and Egypt questions, including shared difficulty selection and keyboard question controls. Separate iframe lifecycle prevents accumulated engine listeners and animation loops.
- Draft passes through the same file parser as imported/exported JSON. No engine source is forked.

## Import an export into a website game

1. Store the JSON beside the new game's files.
2. Load `/dev/level-editor/level-format.js` and `/dev/level-editor/loader.js` before the game's initialization script. These modules should move to a shared stable engine path when the format is approved.
3. Await `const level = await TALoadLevel('./my-level.json')` and set `window.TA_GAME = {id, physicsPreset:'earth', level, theme, questions}` using that game's theme/question pack.
4. Only **after** that promise resolves, load the V1.2 shell or call its boot function once. Do not include an automatically booting shell before the download completes.
5. Test the game preview before merging. For a multi-stage game, a stage manager still needs to select and load successive files; this milestone exports individual stages.

The engine finishes only after all active question points are answered. The preview currently uses Egypt questions, not the Review Lab topic picker. Only 480px-high worlds / earth physics are supported in this first editor. New entity placement beyond the map is rejected on validation/export; route reachability still needs playtesting. Artwork for extra editor objects is a simple editor-only drawing extension; full theme libraries, section templates, mount placement UI, multi-stage management and publishing remain future work.

## Verification

`node scripts/test-level-editor.mjs`

`node scripts/test-level-editor-controls.mjs`

Covers lossless sample round trip, platform/collectible edits, invalid file rejection, actual V1.3 runtime instantiation, collectible interaction, question-gated completion, and HTML asset paths. The control checks simulate DOM/pointer handlers for blank creation, resize, clamping, dragging, invalid input, undo/redo, pan, canvas bounds, and zoom coordinates. They are not browser tests. JavaScript syntax checked separately. Browser interaction and touch QA not performed: the managed environment lacks the required control-browser skill. These are required before treating this as production ready.
