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

The high-quality source WebP sheets and the reproducible conversion script live in `assets/source/`. Stable gameplay asset IDs and collision logic are preserved; the runtime loader crops the atlases into the existing asset IDs. Legacy individual SVGs remain as fallbacks.

To rebuild the compact WebP files after replacing a source sheet, run:

```bash
python3 assets/source/build_runtime_atlases.py
```

## Visual direction

The target is a polished illustrated educational arcade game rather than primitive vector placeholder art. This pass uses the WWI Trench Run Visual Style Guide as its reference and keeps the art readable at gameplay scale.
