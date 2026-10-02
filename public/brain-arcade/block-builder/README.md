# 3D Block Builder
A free-build brick sandbox using the site's self-hosted Three.js and OrbitControls.

- 16 pieces across bricks, plates and tall walls, plus 12 paint colors.
- 32 × 32 baseplate; grid-snapped placement, stacking, collision and support checks.
- Tap/click builds; dragging or multi-touch gestures never place pieces. Camera controls remain available in every tool.
- Build, paint, erase, rotate; undo/redo; home/top camera views; fullscreen with CSS fallback.
- Explicit device save/load, JSON file import/export, clean PNG export.
- Builds use `teacharcade_blockbuilder_v2`; load falls back to the untouched v1 save. `legacy.js` preserves original piece geometry for older builds.
- Up to 1,500 pieces and 48 units high for new placements. Erasing supports deliberately leaves upper pieces in place for free editing.

Manual verification: place and stack each piece family, rotate rectangular pieces, reject overlaps/out-of-bounds placements, paint/erase/undo/redo, drag without building, pinch/pan on touch, export/import and load a legacy save, inspect phone/fullscreen layouts.
