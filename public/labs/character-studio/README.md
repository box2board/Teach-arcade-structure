# Teach Arcade Character Studio — review prototype

Standalone route: `/labs/character-studio/`. No production navigation, engine, hosting configuration, or existing game is changed. Do not merge or promote without explicit approval.

## Repository inspection

Based on main `649b3a1d6ba048ee11bd63ccb3a50914b0825a54`.
- Main is a buildless/static public site with Node content build scripts and Vercel outputDirectory `public`.
- Existing local Three.js 0.162.0 and OrbitControls are reused. Block Builder and Snow Day Defenders use this engine. No GLB/GLTF loader or reusable humanoid rig was found on main.
- `prototype/flagship-3d-world-foundation` contains a separate PlayCanvas application under `prototypes/flagship-world-playcanvas/`, multiplayer server, and scale/engine documents. Inspected read-only; no checkout, merge, or changes to that branch.
- `prototype/3d-adventure-engine-v0` contains versioned adventure runtime/bootstrap/config modules under `public/dev/3d-adventure-engine/`. Existing branches remain separate.
- No AGENTS.md was found in the inspected main checkout.

## Implementation boundary

`recipe.js`: versioned schema, strict validator, curated randomizer; no renderer dependency.
`avatar.js`: original authored cross-section meshes, skin weights, bone hierarchy, material channels, attachments, and shared pose animation system; no DOM or studio dependency.
`studio.js`: editor controls, renderer, camera, stage, JSON import/export.
`studio.css`: desktop split layout and <=700px stacked layout.

Parts are shaped profile meshes with smooth skinning for torso, arms and legs. They are generated from authored profiles at assembly time, not imported GLB art. Face/hair/shoes/hands/accessories use rigid bone attachments. This is a first art-direction prototype, not a claim of production asset quality. Facial expressions are static; hands use a simplified palm/thumb silhouette rather than articulated fingers.

## Consumer API

```js
import { createAvatar } from '/labs/character-studio/avatar.js';
import { validateRecipe } from '/labs/character-studio/recipe.js';
const avatar = createAvatar(validateRecipe(savedRecipe));
scene.add(avatar.root);
avatar.animations.play('Walk'); // Idle, Walk, Run, Jump, Wave, Celebrate
// In the game's frame loop:
avatar.animations.update(deltaSeconds);
// Color-only changes reuse geometry and update semantic material channels:
avatar.setColors(newRecipe);
// Remove/dispose when changing part styles or ending a scene:
avatar.dispose();
```

A consumer receives the assembled root, `rig.bones`, `rig.skeleton`, animation interface, normalized recipe, `stats()` and disposal. `setColors` updates colors only; use a new `createAvatar` for structural changes. The studio disposes replaced geometry/materials/skeletons. Animations are in-place shared poses with exponential transitions, not imported motion-capture clips. Jump repeats in the studio. Games control movement separately.

Three.js consumers can use this API directly. PlayCanvas cannot consume a Three.js Object3D directly: future integration needs an engine-neutral mesh/rig adapter or a GLB export/import pipeline. This prototype does not pretend that adapter already exists. GLB export is intentionally deferred.

## Rig contract: ta-humanoid-1

Y-up, Z-forward, meters. Character left is +X. Default height is approximately 2.03 m (stylized proportions). Height changes apply to the assembled root. Limb-length changes update both bind-pose joints and mesh profiles. Head scale remains local to the head attachment. All four proportions are restricted to 0.85–1.15.

```
root
└── hips
    ├── spine → chest → neck → head
    │            ├── shoulder.L → upperArm.L → forearm.L → hand.L
    │            └── shoulder.R → upperArm.R → forearm.R → hand.R
    ├── thigh.L → shin.L → foot.L → toe.L
    └── thigh.R → shin.R → foot.R → toe.R
```

22 bones; names and hierarchy are stable across all parts. `shoulder` serves as clavicle, `hand` as wrist, `foot` as ankle. No external character-specific rig. Skin weights are normalized, at most two active influences per vertex. Root is available for game placement. Gameplay collision bounds are not supplied by the studio.

## Recipe contract

Version 1 includes rig, body, face, eyeColor, brows, skin, hair, top, bottom, shoes, accessories, accessoryColor and animation. Export captures appearance and selected animation, not orbit camera or animation phase. Import rejects missing/unknown identifiers, invalid color values, unsupported versions, and out-of-range/nonfinite proportions. Unknown extra object properties are discarded. Imports use parsed data only, never executable code. File imports are capped at 20 KB. No account, cloud save, student information, or multiplayer persistence is involved.

## Performance and limits

- Default ~7,512 triangles, no character textures, no physics, no shadow maps, one 128×128 generated floor-shadow texture.
- Geometry merged by bone/material and skinned material to reduce draws. Materials shared by semantic color channel. Color edits do not rebuild geometry.
- Shape edits rebuild one avatar; cross-avatar geometry caching/instancing is not implemented yet. A multiplayer world needs LOD, pooling and batching beyond this editor.
- Pixel ratio capped at 1.5. Rendering skips hidden documents. Reduced-motion preference starts paused.
- UI shows measured frame rate, current triangle count, material count and render calls (including the stage). ~1.36 MB is an uncompressed source estimate including the already-vendored Three.js and OrbitControls; HTTP compressed transfer will differ.
- School Chromebook/iPad hardware performance has NOT been measured. FPS in a cloud browser is not a device benchmark.

## Verification

Run `node --test tests/character-studio/avatar.test.mjs` from repository root. Tests cover validated recipe round-trips, rejected invalid inputs, stable bone names, finite mesh positions, normalized skin weights, all animation modes at proportion extremes, disposal, and color-only updates.

The first review must still judge silhouette, clothing deformation, face/hair quality, camera framing and touch ergonomics in the live preview. Automated geometry checks do not establish commercial visual quality. No production acceptance is implied by passing tests.

## Color-pop customization update

Adds four illustrated look presets (Electric, Bubblegum, Sunburst, Pixel pop), Ponytail/Mohawk hair, Headphones/Wristbands accessories, None/Bolt/Star/Arcade chest graphics with a separate color channel, vivid outfit/hair palettes, and four local studio backdrops. Presets preserve skin, body proportions and face. Backdrops are editor presentation only and are not exported as avatar appearance.

Version 1 recipes remain supported: missing `top.graphic` defaults to `None`, missing `top.graphicColor` to white. New recipes include both fields. All new parts attach to the existing rig. Hair/headphone overlap remains a visual-review consideration for extreme silhouettes.

## Additional wardrobe pass

Adds Jersey and Striped tee tops, Cargo pants with side pockets, and a Scarf. Each equipped accessory now has its own color override in optional `accessoryColors`; omitted overrides use the existing shared `accessoryColor`, preserving old recipes. Eight model/recipe tests pass; rendered appearance still requires live WebGL review.

## Browser collection and history

My characters saves up to 24 named recipes in this origin's localStorage. This is browser-local, not account or cloud persistence; clearing browser data removes the collection, and different preview origins have different collections. JSON export remains the portable backup. Loading a saved character enters the 60-state appearance undo/redo history. Removing a save can be reversed with Undo last removal during the editor session. Storage failures are reported without claiming success; unreadable collection data is not overwritten. Keyboard undo/redo uses Ctrl/Cmd+Z and Shift+Ctrl/Cmd+Z outside form fields and dialogs. Camera/backdrop changes are not appearance history. Ten model/recipe/storage/history tests pass.
