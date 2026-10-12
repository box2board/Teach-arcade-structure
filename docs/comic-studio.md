# Comic Studio

First creation-tool prototype at `/tools/comic-studio/`, linked from Teacher Tools. Built as browser-local HTML/CSS/JS; no account, backend, or external artwork dependency.

## Included

- 11 layouts: single, three-panel strip, two wide panels, three stacked panels, four, six, eight, nine, twelve, feature + two, and feature + four.
- Twelve panels remain in each project; layout changes do not delete hidden panels. Exports include only visible panels.
- 28 original SVG characters, 26 backgrounds, and 64 props (118 library items). Two backgrounds are generated illustrations. Human characters offer eight expressions and eight poses; animal/robot rigs offer standing and waving poses.
- Speech bubbles, thought bubbles, captions, and editable dialogue.
- Pointer/touch dragging, arrow-key movement, size and numeric position controls, character/prop flipping, layer changes, duplication, and removal.
- Copy a panel to the next panel, with fresh object IDs and undo support.
- Undo/redo, browser autosave, JSON project download/import, and a replaceable example project.
- Full comic preview, PNG download, and direct PDF download without a print dialog. PDF embeds the rendered comic page as an image; selectable-text PDF output is not part of this version.

## Files

`catalog.js` owns asset names, categories, palettes, expressions, and poses. `library-art.js` supplies expanded original drawings. `model.js` owns project creation and strict import validation. `art.js` owns original artwork and scene/page SVG generation, with XML escaping of all user text. `studio.js` owns UI, history, editing, persistence, and exports. No third-party character or franchise artwork is used. The existing local jsPDF bundle handles PDF creation.

Project limits: twelve panels, 80 objects per panel, 240 characters per bubble/caption, 120-character title, 80-character author, 2 MB import limit. Panel edges crop objects, including oversized speech bubbles; the editor and export apply the same cropping. The interface explicitly explains this behavior. Browser drafts do not sync between devices; project files do.

## Validation

`TEACH_ARCADE_JSDOM=/path/to/jsdom/lib/api.js node scripts/test-comic-studio.mjs` exercises assets, expressions/poses, dialogue escaping, sizing, duplication/removal, undo/redo, panel copying, layout preservation, import rejection, pointer/keyboard movement, PNG/PDF download requests, and blocked-storage fallback.

A complete four-panel sample was rendered from the actual SVG artwork and visually inspected. DOM tests mock browser canvas/download mechanics, so they do not prove native Safari/iPad downloads or pointer behavior. Browser visual QA is outstanding in this environment. Preview only; merge is a separate user action.

Graphic Organizer Studio remains independent. Comic Studio precedes Map Maker, Museum Maker, and Choose Your Path Studio in the agreed creation-tool sequence.

## Expanded library

Character categories: People, Jobs, Adventure, History & fantasy, Animals. Background groups: School, Outdoors, Places, History & fantasy, Adventure, Basics. Prop groups: School, Science, Everyday, Nature, History & adventure, Transport & symbols. Search matches names and categories; character and prop category filters narrow results. The selected background remains available during searches. Scrollable asset grids keep the larger library manageable.

Every new asset was rendered and import-validated. Catalog contact sheets were inspected. Tests cover the full library inventory, search/filter behavior, new expression/pose settings, and persistence of new characters/props/backgrounds. Existing asset IDs and project format remain compatible.

## Library browsing refinement

People, Scenes, and Props tabs show filtered counts. Scenes offer thumbnail previews and a selected-state indicator; the quick background dropdown stays complete while thumbnail filters apply. Search reveals the first matching artwork tab when the current tab has no results. Tabs support Left/Right/Home/End navigation.

Each artwork tile has a separate favorite button, avoiding nested interactive controls. Favorites and the 16 most recently used items are stored under a separate library-preferences key and do not change project files or undo history. Preference identifiers are checked against the known catalog. When storage is blocked, favorites and recents continue to work for the session. These preferences do not sync across devices.

Library thumbnail DOM is reused when only comic-object selection changes. Tests cover thumbnails, tabs/keyboard navigation, favorites, recent ordering, search discovery, DOM reuse, and blocked-storage behavior. Native browser visual and iPad verification remain outstanding.

## Creative tools expansion

Objects have a proportional size slider (15–400%), width/height inputs, and a blue resize handle. The handle remains visible within the panel when an object is large. Backgrounds have zoom (100–300%) and horizontal/vertical framing controls. Blank panels have a paper color. Characters support primary/outfit, skin, and hair overrides where appropriate; props and speech/caption boxes have primary-color overrides. Original colors can be restored.

Pencil, line, rectangle, and ellipse drawings are editable vector objects, with ink color, brush width, and optional shape fill. Erase stroke removes an entire drawn object; Clear drawings affects only drawn objects in the selected panel. Drawing operations participate in undo/redo and portable project files. A blank-layout PDF can be exported without altering the working comic.

Project format version 2 stores twelve panels, scene framing, colors, and drawings. Version 1 six-panel projects are migrated without losing content. All visible panels preserve their scene aspect ratio in exported feature layouts.

`assets.js` embeds the two illustrated-background images into SVG before raster export so browser image/PDF exports do not depend on external image references. Assets are loaded once per session with retry after failures. The illustrated scenes were generated using the built-in image-generation tool; prompts and final repository paths are in `comic-studio-assets.md`.

Expanded tests cover proportional sizing, handles, colors, framing, pencil/shapes/eraser/history, feature layout geometry, blank-template exports, version 1 migration, and image embedding/cache behavior. Rendered samples including generated backgrounds, drawings, colors, and blank templates were visually inspected. Native Safari/iPad visual interaction and downloads remain unverified.
