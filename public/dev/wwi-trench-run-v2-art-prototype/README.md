# WWI Trench Run v2 — Art Prototype

This directory is an isolated visual-development prototype for Teach Arcade's WWI Trench Run.

## Safety

- The live/current WWI Trench Run is not modified by this prototype.
- All work remains under `public/dev/wwi-trench-run-v2-art-prototype/` on the isolated prototype branch.
- Do not merge this prototype to production until it has been explicitly approved.

## Runtime artwork

The prototype now uses illustrated runtime atlases for the player character and primary gameplay hazards/checkpoint. Stable individual SVG asset paths are preserved as lightweight crop wrappers so the existing game logic does not need to change when artwork is upgraded.

Runtime atlases:

- `assets/runtime/character-atlas.webp`
- `assets/runtime/obstacle-atlas.webp`

The environment, decorative terrain, UI, and background layers remain modular and can be upgraded independently while retaining their existing asset IDs.

## Visual direction

The target is a polished illustrated educational arcade game rather than primitive vector placeholder art. The current pass intentionally reduces procedural/CSS decoration so the illustrated assets remain visually dominant.
