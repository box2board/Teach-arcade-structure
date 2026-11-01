# WWI Trench Run v2 — prototype art asset system

This directory is intentionally isolated from the live WWI Trench Run v2 implementation. Nothing here is wired into production.

## Source of truth
The source of truth is now the set of individual files under `assets/individual/`.

- `assets/individual/character/` — player animation frames
- `assets/individual/terrain/` — trench modules and surfaces
- `assets/individual/obstacles-props/` — hazards and set dressing
- `assets/individual/effects-ui/` — HUD, feedback and atmosphere assets
- `assets/individual/backgrounds/` — parallax layers
- `assets/manifest.json` — stable registry and path rules
- `assets/game-config.json` — animation, collision, tiling and parallax metadata
- `assets/ASSET_CONTRACT.md` — rules for replacing art without breaking game code
- `index.html` — prototype viewer that loads the individual files directly

`assets/asset-library.svg` remains only as the current prototype drawing source used by the individual SVG wrappers. Game/prototype code should not reference its symbol IDs directly.

## Why this structure
The final illustrated art can be replaced asset-by-asset while keeping stable filenames. Gameplay code therefore does not need to change when a rough prototype drawing is replaced by a polished production asset.

Example:
```html
<img src="assets/individual/obstacles-props/barbed-wire.svg" alt="Barbed wire">
```

Animation frames are listed in `game-config.json`, so the renderer can preload them without hard-coding names.

## Implementation rules
1. Do not point the live game at this directory until the prototype is approved.
2. Do not rename stable individual asset files after gameplay code begins using them.
3. Keep character anchor and nominal dimensions compatible with `game-config.json`.
4. Keep collision data separate from artwork.
5. Replace rough prototype drawings in place rather than creating new filenames for visual upgrades.
6. Validate every replacement through the prototype viewer before any production integration.

## Current status
The structural correction is complete: each catalogue element has a stable individual game-facing file path and the prototype viewer loads those files directly. The next visual-development work can improve the artwork in place without changing the game-facing API.