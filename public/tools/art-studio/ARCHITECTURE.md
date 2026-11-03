# The Art Studio — isolated prototype

Route: `/tools/art-studio/`. Branch: `prototype/art-studio`. No navigation, analytics, backend, existing route, or production configuration changes.

## Rendering decision

Native SVG + DOM controls, with a versioned JSON document as the source of truth. Compared with Canvas API (manual hit testing, text editing, selection), Fabric/Konva (excellent transforms but another runtime dependency and text editing bridge), SVG offers native hit testing, vector classroom elements, accessible object labels, crisp text, and no package/CDN requirement. Explicit transform handles and inline HTML text editing keep the renderer replaceable. System fonts make Chromebook rendering predictable. Objects never contain arbitrary HTML or SVG imports.

## Modules

- `state.js`: versioned project, pages, selection-independent history and transactions.
- `objects.js`: object factories and safe SVG rendering for text, shapes, uploaded raster images, classroom elements, ink.
- `templates.js`: fully editable teacher designs.
- `canvas.js`: viewport, pointer manipulation, snapping, selection, drawing, inline editing.
- `storage.js`: local browser project library and portable validated JSON.
- `export.js`: clean SVG rasterization to PNG/JPEG; raster multi-page PDF writer, no dependency.
- `ui.js`: contextual inspector, library, layer/page controls, commands and shortcuts.
- `app.js`: composition root; no backend assumptions.

## Document contract

`{ schemaVersion: 1, id, name, updatedAt, pages: [{id, name, width, height, background, objects: [...]}] }`. All geometry uses page pixels. Objects have stable IDs, type, name, geometry, angle, opacity, visibility, lock, optional groupId and type-specific properties. Embedded raster assets are data URLs; future adapters can replace them with Art Library asset IDs. Page dimensions and export scale are bounded to cap memory. SVG output escapes user strings and accepts only local raster data URLs. Project import validates version, size, counts, geometry, and image sources.

History stores bounded document snapshots (up to 60, reduced for large projects to target a 24 MB serialized history budget), only commits completed gestures, and handles whole-document changes including page operations. Image data stays immutable during structured clones; large projects can later migrate to asset references and command history. Storage adapter is intentionally independent of Teacher HQ/Supabase. Integration targets are documented, not dead interactive buttons.

## Interaction

Shift-click multi-select; group IDs expand selection. Drag selected objects, corner resize preserves image proportions with Shift, top handle rotates. Group resizing scales geometry/font/ink points; nested groups are deliberately excluded. Locked objects are selectable in layers but cannot be manipulated. Hidden objects are excluded from selection and export. Snap tolerances are screen-relative, with visible guide lines. Space-drag or Pan moves the workspace; wheel + Ctrl/Command zooms. Delete and arrow keys operate outside editable fields.

## Boundaries

Prototype only. Local saves belong to this browser/origin; portable JSON supports backup. No authentication, cloud sync, AI, masks, blend modes, or production integration. Text wraps into SVG tspans; inline edit uses a temporary DOM textarea. Crop is nondestructive normalized inset crop. Eraser deletes entire ink strokes. Groups are flat. PDF is raster at page resolution, with all pages and correct page aspect; PNG/JPEG export current page. Export does not include controls, guides, or hidden layers.

## Future adapters

Teacher HQ, PDF Workspace, Question Sets, Games, Escape Rooms, Presentations, Classroom Activities and My Art Library can consume versioned project JSON and clean raster exports. Add asset reference resolution at the storage boundary, and additional object renderers/effects without changing editor UI modes.
