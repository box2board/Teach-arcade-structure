# WWI Trench Run v2 — Art Prototype

This directory is an isolated visual-development prototype for Teach Arcade's WWI Trench Run.

## Safety

- The live/current WWI Trench Run is not modified by this prototype.
- All work remains under `public/dev/wwi-trench-run-v2-art-prototype/` on the isolated prototype branch.
- Do not merge this prototype to production until it has been explicitly approved.

## Runtime artwork

The prototype uses five optimized WebP runtime atlases extracted from the approved illustrated source sheets:

- `assets/runtime/character-atlas.webp` — 12 consistent soldier poses
- `assets/runtime/obstacle-atlas.webp` — barrier, barbed wire, crater, broken timber
- `assets/runtime/terrain-atlas.webp` — trench wall, duckboards, checkpoint, sandbags
- `assets/runtime/props-atlas.webp` — dead tree, ammo crate, ladder, lantern, signs, damaged sandbags
- `assets/runtime/background-atlas.webp` — four battlefield and trench layers
- `assets/runtime/side-floor.webp` — seamless side-view muddy duckboard ground strip

The high-quality source WebP sheets and the reproducible conversion script live in `assets/source/`. The prototype is rendered as a horizontal side-scroller: the soldier runs across a shared ground plane while layered battlefield art moves at different parallax rates. Hazards sit on that same ground plane and are cleared by jumping. The current live game remains untouched. Legacy individual SVGs remain available for fallback use.

To rebuild the compact WebP files after replacing a source sheet, run:

```bash
python3 assets/source/build_runtime_atlases.py
```

## Visual direction

The art direction follows the supplied illustrated WWI assets: side-profile soldier sprites, a horizontal duckboard floor, layered battlefield scenery, and readable side-view obstacles. The prototype is a visual replacement study for the live side-scrolling Trench Run; its purpose is to make the existing game style feel like a cohesive illustrated game.
