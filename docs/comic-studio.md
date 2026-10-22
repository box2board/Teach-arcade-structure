# Comic Studio

First creation-tool prototype at `/tools/comic-studio/`, linked from Teacher Tools. Built as browser-local HTML/CSS/JS; no account, backend, or external artwork dependency.

## Included

- 11 layouts: single, three-panel strip, two wide panels, three stacked panels, four, six, eight, nine, twelve, feature + two, and feature + four.
- Twelve panels remain in each project; layout changes do not delete hidden panels. Exports include only visible panels.
- 96 original SVG characters, 88 backgrounds, and 216 props (400 library items). Two backgrounds are generated illustrations. Human characters offer eight expressions and eight poses; animal/robot rigs offer standing and waving poses.
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

## Editor foundation refinement — October 22, 2026

Isolated branch: `prototype/comic-studio-editor-foundation`, based on the existing `codex/comic-studio` implementation. No merge to main or Teach Arcade production deployment.

The editor now has a compact project toolbar, a canvas-focused three-column workspace, a horizontal storyboard rail, a dedicated page-preview dialog, and a selectable front-to-back object list. Text creation stays beside the canvas instead of below the artwork library. Drawing and numerical transforms are disclosed when needed. Laptop columns remain at 1024px; tablet layouts move properties below the canvas, and phone layouts put the canvas first.

Speech/thought/caption objects can carry optional `box` metadata: width, height (zero means automatic), font size, tail style, and tail endpoint. Existing v1/v2 files migrate through defaults; new metadata is validated on import. Width/height controls and bubble handles resize the text container without changing font size. Characters and props retain proportional scaling. Text reflows with a visible overflow notice when a deliberately small container needs more room. Double-click text objects to edit on the canvas; the inspector remains available for touch and keyboard use. Speech and thought tails have presets and a draggable orange endpoint.

Undo/redo covers geometry and dialogue; Ctrl/Cmd+D duplicates, Ctrl/Cmd+S saves a portable project, and Ctrl/Cmd+Z / Shift+Z handles history. Adding artwork returns drawing tools to selection mode. Pointer capture/cancellation is handled and secondary pointers are ignored during a gesture. Storyboard thumbnails and full-page preview do not rerender on every drag movement.

Validation: existing automated interaction suite plus regressions for text reflow, independent resize, font sizes, custom tails, direct text editing, preview, layer selection, overflow, malformed geometry imports, and pointer cancellation. A four-panel SVG sample was rasterized and visually inspected. These are DOM-level interaction tests; canvas/download APIs are mocked. Browser security policy blocked native interactive QA, so actual Chromebook/iPad dragging, layout, and downloads remain unverified. The private Sites preview is a separate copy of these same editor files, with no backend or account integration.

## Expanded classroom library — 200 items

Added 24 character roles, 18 scene backgrounds, and 40 props (82 original SVG assets). Characters include civic roles, historical occupations, and modern careers, with distinct costume/accessory rendering on the existing pose/expression rig. Scenes include a colonial town, assembly chamber, factory, printing workshop, trading harbor, Nile landscape, classical forum, medieval market, trench shelter, newsroom, hospital, workshop, polling place, town square, greenhouse, volcano, river, and polar camp. Props cover civics, historical writing, engineering, science, nature, and economics. Historical costumes and scenes are simplified storytelling artwork, not authenticated period reconstructions.

Asset IDs from existing projects are preserved. New catalog entries use the existing category/search/favorite/recent systems; metadata keywords are searchable. No external assets, downloads, accounts, or backend are needed for the vector expansion. All 82 new assets were rendered to contact sheets and visually inspected; the full editor interaction and asset-validation suites cover the 200-item catalog. Native browser/tablet verification remains outstanding.

## Second library expansion — 300 items

Added 24 characters, 24 backgrounds, and 52 props, bringing the catalog to 76 characters, 68 scenes, and 156 props. `expansion-art.js` provides modular original vector renderers for this pack; `library-art.js` delegates supported IDs to it while retaining the original pose/expression rig and all existing renderers. It loads before `library-art.js` in both the editor and test harness. New roles include STEM specialists, community workers, and historical storytelling characters. New settings include Renaissance/Enlightenment interiors, ecosystems, a dig site, lunar camp, school arts spaces, civic/community locations, and workplaces. Props cover arts/literature, engineering, science, civics, commerce, historical tools, and nature.

Historical artwork and scientific models are simplified storytelling illustrations, not authenticated reconstructions or precise scientific diagrams. All old asset identifiers and portable projects remain supported. No third-party graphics or additional runtime dependencies were added. All 100 assets were rendered into contact sheets and visually inspected. Automated catalog and editor validation covers 300 items, including role poses and expressions, project import/export validation, search, favorites, history, and object transforms. Native browser/tablet verification remains outstanding after the earlier browser-policy block.

## World-building expansion — 400 items

Added 20 characters, 20 backgrounds, and 60 props: 96 characters, 88 backgrounds, and 216 props total. `expansion-worlds.js` composes with `expansion-art.js` to add geography, field science, historical technology, humanities, community, and stage/storytelling artwork without changing old IDs. Geography and science props are schematic illustrations for comics, not measurement tools or authoritative diagrams. Character appearances and historical settings remain stylized.

The expansion includes cartographer/historian/poet roles, field researchers, ancient and industrial occupations, early aviation, coastal/alpine/canyon/island scenery, research stations, archives and workshops, civic/community interiors, and literature/performance spaces. All 100 additions were rendered to contact sheets and visually inspected; the full catalog and interaction checks cover the 400-item collection. Native browser/tablet verification remains pending due to the previously reported browser-policy block.
