# Teach Arcade 3D Block Builder (MVP)

This interactive is a browser-based classroom sandbox for building 3D concept models.

## Files
- `index.html` – page shell, SEO, structured data, and content sections.
- `styles.css` – layout and responsive styling for palette/canvas/inspector.
- `app.js` – Three.js scene, placement interactions, undo/redo, save/load, export/import, screenshot.
- `icons.js` – icon map used in UI and block sprites.

## Local storage
Builds save to `teacharcade_blockbuilder_v1`.

## Optional icon PNG generation
Run `node scripts/export-block-builder-icons.mjs` after installing `sharp` to generate 32px/48px icon PNG exports.
