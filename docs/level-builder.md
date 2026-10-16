# Teach Arcade Level Builder (V1.4 development)

Editor: `/dev/level-editor/`. Showcase file running through the website loader: `/dev/level-editor/play.html?level=creator-showcase.json`.

## Authoring workflow

Choose an object category → choose appearance/type in Placement options → place it → select it to adjust settings. A prominent options bar above the map offers platform material/style, dimensions and moving-platform speed/direction/range/path controls. It updates for the object you select. The inspector offers additional appearance, position, rewards and behavior settings without JSON editing. The editor and playable creator renderer use the same original canvas artwork library. Advanced JSON remains available for less common engine properties.

- Platforms and moving platforms: stone, wood, roof, sand and metal materials.
- Enemies: walking scarab, flying bat, crawler, drone, falling stone presets. Movement and stompable/hazard/bounce interactions are runtime properties; preset selection fills in sensible defaults.
- Breakables: crate, cracked wall, cracked floor. Dash, stomp, heavy gear or headbutt; empty, collectible or bonus-point contents.
- Collectibles: scarab, gem, star, book, gear. Configurable score plus points/protection/gear reward. Ability pickups offer protection or climbing/heavy gear separately from appearance.
- Question objects: tablet, sign, terminal, scroll. Correct-answer rewards: boost, checkpoint, disable next trap/enemy. Question gates link to an existing question point and open after it is answered. Finish still requires all question points to be answered.
- Traps: spikes, dart trap, energy; ropes/ladders/vines and spring/pad bounce surfaces.
- Scenery: tree, palm, house, column, cloud, rock; background or foreground layer. Scenery has no collision.
- Scene themes: tomb, forest, rooftops. Search and select from the existing Review Lab question-bank catalogue; references are saved in the JSON and fetched for playtesting.

Blank level, original Pyramid sample, creator showcase, and a four-screen-high vertical climb are available. Width is 960–32000px; height is 480–7680px with earth physics. Add 480px above or enter a height. Expansion adds empty rows at the top and shifts objects, tile markers, question art and path points together; shrinking refuses to discard upper content. Growing extends the terrain edge. Shortening trims terrain beyond the new edge but refuses to discard objects, marker tiles, or path nodes. The finish moves to fit. Undo restores changes.

Select/drag, paint terrain/checkpoints, erase, duplicate/delete, zoom, optional snap, Pan, position slider, Start/Finish navigation, browser drafts, JSON import/export. Canvas backing dimensions and total pixel area are bounded for long/tall levels on tablets. Top/Bottom sliders and Pan navigate tall layouts. The playtest remains a 960×480 viewport; the camera follows the player in both axes and resets vertically at checkpoints.

## Movement routes

Select moving platform/enemy → Draw/edit route → tap map points → drag numbered handles or edit their coordinates → Done. Choose speed, pause duration and loop/back-and-forth mode. Preview motion uses the same `PathMotion` implementation as the runtime. Use simple movement to clear the path and restore axis/range controls. Moving the whole object translates its entire path. Duplication preserves the path.

The path marks the object's **top-left** position. Custom paths bypass ground/falling behaviors, so keep them clear of terrain. Loop closure travels back to the first point; it does not teleport. Path motion is an opt-in V1.4 extension. No existing production engine or game is modified.

## Level format and website import

Envelope: `{format:'teach-arcade-level', version:1, engine:'side-scroller-v1.4', scene, questionSet, level:{...}}`. The parser also accepts earlier V1.3 exports. Editing upgrades the engine field to V1.4. Unknown versions reject explicitly.

Expanded `level.layers` are authoritative. Source terrainSegments are retained from the original sample for provenance, but do **not** rebuild an edited file with LevelBuilder.build: it would overwrite painted tiles.

To put an exported level on the website:

1. Store its JSON with a game's files.
2. Load the existing V1.2 core/physics and V1.3 abilities/core, then V1.4 path-motion and creator-runtime.
3. Load object-library.js, the creator renderer, level-format.js, loader.js and question-bank.js (currently under `/dev/level-editor/`). These shared creator modules can move to stable engine paths when the builder is approved.
4. Await `const doc = await TALoadCreatorDocument('./my-level.json')` and `const questions = await TALoadCreatorQuestions(doc.questionSet, fallbackQuestions)`.
5. Set `TA_GAME` from `doc.level`, the selected questions and a theme carrying `scene:doc.scene`. Load/boot the shell only after that data is ready. The loader rejects V1.4 exports if the creator runtime is missing.

The existing creator play page performs that whole flow already, including direct JSON URL loading. `?draft=...` runs an editor session; `?level=filename.json` demonstrates a deployed static level file. Refer to play.html/play.js as the working page template. No direct publishing or production game replacement occurs from the builder.

## Verification and boundaries

Run:

- `node scripts/test-level-editor.mjs`
- `node scripts/test-level-editor-controls.mjs`
- `node scripts/test-creator-paths.mjs`
- `node scripts/test-creator-vertical.mjs`

Checks cover lossless JSON, editing, asset paths, runtime loading, collectible/finish behavior, blank creation, resizing, pointer handlers, invalid input, undo/redo, pan, bounded canvas, zoom, style selection, drawn routes, pause/loop reversal, frame-rate invariance, rider carry, enemy routes, rewards, question gates, vertical expansion/shrinking, two-axis camera tracking/reset, high placement, canvas area bounds, and a physics jump between ascending shelves. DOM controls are simulated; no real-browser/touch QA claim is made. The managed environment lacks the required control-browser skill. Playtest every route before release; data validation does not prove reachability.

This release implements object/style/behavior authoring and waypoint routes. It is not yet a universal editor for every V1.3 property: mount placement, full starting-ability configuration, multiple stages, custom art uploads remain future work. Existing levels preserve those properties on round trip. Unsupported behaviors are not advertised as editable options. Current terrain platforms are solid; one-way platforms are not exposed because the runtime does not support them yet.

## Editing optimization pass: selection, resize and layers

- Choose **Select** and tap an object. Drag the orange bottom-right handle to resize it. Platform/path dimensions stay within world bounds, including every point of a moving object's route. Slopes, surface zones and the start marker retain numeric controls rather than corner resizing.
- Turn on **Add to selection** (or hold Shift/Ctrl/Command) and tap objects to add/remove them. Turn it off to drag the group. **Box select** selects objects intersecting the rectangle and returns to Select so the group can be dragged immediately. Group moves translate all route nodes and question visual coordinates together, using common bounds to preserve spacing.
- Duplicate/Delete operates on the whole selection as one undoable action. Duplicating a question plus its gate or a secret plus its breakable remaps the copies' internal links to new IDs. Copied questions receive unused indices. Start/finish cannot be duplicated or deleted. Deleting a question still used by an unselected gate is rejected; select both to delete the pair.
- **Editor layers** offers Show/Lock for background scenery, terrain/platforms (including moving platforms), gameplay objects, and foreground scenery. Hidden/locked objects cannot be selected, moved, resized, erased, or included in box selection. Terrain paint/erase respects its layer state. These are temporary editing controls: every layer is preserved in export and shown in gameplay. Layer visibility/locks are not saved in the level file.
- Clear selection removes highlights without changing the level. Pointer cancellation restores the pre-gesture layout. Selection clicks that do not edit an object preserve Redo.

Tests: `node scripts/test-level-editor-selection.mjs` plus the expanded `test-level-editor-controls.mjs` exercise resize gestures, group/path dragging, box selection, copied internal links, safe deletion, visibility/locking, undo/redo and cancelled gestures. The control suite simulates DOM/pointer events; browser and iPad QA remain outstanding.

## Named projects and reusable sections

**Saved projects** stores separate named designs in this browser. Save as new creates a separate entry; Update open project updates the project explicitly opened/saved in this session. Rename uses the Project name field. New blank/imported/sample levels detach from the current project to avoid overwriting it. Opening a saved project preserves the previous level in the browser draft and starts a fresh Undo history; Restore browser draft recovers that previous work as an unnamed level. Projects may retain unfinished question gates, but playable export and playtest still require valid gate links. Other schema validation remains strict.

**Reusable sections** saves the selected objects, their artwork/settings, waypoint paths and internal question/gate or secret/breakable links. Include every linked question or secret when saving a section. Start/finish, surface zones and horizontal level zones are not section objects. Old sample objects without IDs receive section-local IDs. Optional painted tiles include terrain, hazards and checkpoint cells within the selected objects' complete bounds (including path extents). Empty cells are included, so placing a tile section replaces tiles inside that area. Legacy grid-based question triggers must be converted to question objects before capturing painted tiles.

Choose a saved section, click Place selected section, then tap the map. A ghost outline shows its bounds; Cancel placement or Escape cancels. It must fit completely inside the level, and all of its editor layers must be visible/unlocked. Sections containing tiles snap to the tile grid and need a matching tile size. Placement uses fresh IDs, remaps internal links, and assigns unused question indices from the target level's question set. The entire placement is one geometry Undo action. Appearance and routes are preserved; the source topic and scene theme do not replace the target level's topic/theme.

Export/import a standalone section to transfer a pattern. Export saved library backs up named projects and sections (not unsaved current edits). Import merges new IDs, leaving existing records untouched, so repeated imports do not duplicate records or overwrite a newer local save. Saves are browser-local, not synced to a teacher account. Export a backup before changing devices or moving from a preview URL to another website origin.

Remove selected save/section affects saved items only, not objects already in the current level. Undo last saved-library change reverses one save/list change in the current session; it is separate from geometry Undo. This also lets a removed save be restored immediately. Storage writes validate first and preserve the old saved collection on failure. Storage-full errors direct the user to backup; unreadable library data is not reset or overwritten automatically. Limits: 100 projects, 200 sections, 2 MB per level/section import and 10 MB per backup import, subject to the browser's storage quota.

Checks: `node scripts/test-creator-library.mjs` verifies project persistence and updates, section paths/styles/links, tile replacement, unique IDs/question indices, backup merge, malformed inputs, draft-gate handling and atomic storage failure. The control simulation additionally covers the save/open/rename/restore and place/undo flows. Real-browser and iPad QA remain outstanding.


## Environment packs and art library

The shared canvas art library now includes eight environment packs: desert ruins, forest trail, city rooftops, jungle canopy, frozen peaks, volcanic cavern, underwater ruins, and sky islands. Each pack changes the sky, distant landscape, midground, near silhouettes, ground colors, and terrain edge. The playtest scrolls these background layers at different rates as the camera moves. Four checkboxes control sky details and the far, middle, and near layers; these choices are saved in the level JSON and named projects.

The scenery library includes trees, palms, pine and snow-pine trees, cactus, bush/grass, houses, columns, ruined arches, torches, lanterns, banners, rooftop vents, chimneys, crystal clusters, coral, waterfalls, clouds, and rocks. Choose Scenery, tap an illustrated thumbnail, then choose behind-player or foreground placement. The same thumbnail browser can replace the artwork of an already selected object. Platform and moving-platform appearances now include moss stone, brick, ice, crystal, and cloud in addition to stone, wood, roof, sand, and metal. The same `TAObjectLibrary` artwork and palette rendering is used by the editor and the V1.4 playtest.
