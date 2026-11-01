# Trench Run v2 prototype asset contract

This directory is the source of truth for the improved prototype. The live Trench Run files are not modified.

## Stable-path rule
Game code must reference files under `assets/individual/`. Art can be replaced later without changing filenames or gameplay code.

## Character
All character frames use a 256x256 viewBox and the same nominal anchor: bottom center (`0.5, 0.92`). The run animation is six frames at 12 fps. Jump/recovery is four frames at 8 fps.

## Terrain
Terrain modules use a 256x256 nominal tile. Repeatable surfaces may overlap by 2 px to hide seams. Forks and turns are structural modules, not decorative props.

## Hazards
Collision and behavior are data-driven in `game-config.json`; artwork must never determine collision boundaries by pixel inspection.

## Backgrounds
Four parallax layers are ordered from sky to foreground trench silhouettes. Scroll multipliers are defined in `game-config.json`.

## Replacement workflow
1. Keep the filename and viewBox/nominal dimensions stable.
2. Replace the artwork inside that asset.
3. Validate silhouette/readability at gameplay scale.
4. Verify the prototype viewer and collision overlay.
5. Do not copy changes into the live game until the prototype is approved.
