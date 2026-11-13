# Teach Arcade — Race Track Studio

Isolated Phase 1 vertical slice. **Do not merge or promote to production.**

Branch: `prototype/3d-race-track-studio`.
Base: `df90844c2e878d03a79071c54a55e9b97e96bfed`.
Review route: `/prototypes/race-track-studio/`.

## Inspection and technical choice

Main is a static site with a `public` output directory, content-generation scripts, and bundled Three.js 0.162.0 / OrbitControls. No AGENTS.md was found. Read-only inspection of `prototype/flagship-3d-world-foundation` found its separate PlayCanvas application and multiplayer server. Read-only inspection of `prototype/character-studio-20261027` found an independent Three.js avatar studio. Neither project was changed or merged.

Reuse the local Three.js distribution to avoid another runtime dependency or CDN requirement. PlayCanvas remains independent. Rapier was considered but is deferred: this version has one car on analytically sampled ribbon surfaces, so a small fixed-step arcade controller is sufficient for the initial surface/jump experiment. It is not a general rigid-body simulator. Loops, physical roll, complex collisions, and multiplayer need further work and may justify a dedicated physics backend.

## Architecture

| Module | Responsibility |
| --- | --- |
| catalog.js | 60 asset definitions, categories, dimensions, connection metadata, interactions and relative cost |
| geometry.js | Parametric ribbon surfaces, smooth rails, engineered supports, gates, per-piece mesh batching and disposal |
| connections.js | Endpoint alignment, slope checks, magnetic snapping, graph traversal and disconnected-piece reporting |
| editor.js | Creation state, immutable history snapshots, starter construction |
| renderer.js | Lighting, garden environment, instanced foliage, orbit/pan/zoom, camera views, resize and graphics quality |
| vehicle.js | Original sculpted vehicle, wheel animation, 120 Hz simulation, throttle, brake/reverse, steering, surface/rail/floor collision, gravity and airborne motion |
| storage.js | Version 1 JSON contract, validation, local creations and serialization |
| app.js | Editor input, inspector, library UI, test lifecycle, input controls, creation management and draft recovery |
| studio.css | Desktop/tablet layout and touch controls |

App state and vehicle state are separate. Testing clones the construction; leaving test mode does not rebuild or mutate the user's saved track. Teacher accounts, cloud services, and multiplayer are not dependencies.

## Implemented scope

- 60 functional pieces, including the original start, short/normal/long straight, left/right/gentle curves, hairpin, banked bend, climb, descent, jump and landing ramps, bridge, booster and finish.
- Ground placement preview; near-exit magnetic alignment; click/tap placement; repeatable Attach Piece action; select, translate by inspector, rotate, duplicate, delete, undo and redo.
- Length/radius scaling, base elevation and color editing. Edits intentionally do not move downstream pieces; validation reveals resulting gaps.
- Automatically generated supports for elevated sampled surfaces. Decorative structures are independent from collision surfaces.
- Orbit/pan/zoom, perspective/top/ground views, focus, grid toggle, balanced/low graphics options, follow/orbit vehicle cameras.
- Automatic powered guidance and manual throttle/brake/reverse/steering; pause, reset and return to editor. Motor force, gravity, slope acceleration, friction, boosters, rail boundary response, floor collision and ballistic flight.
- Starter construction, start assignment and finish gate timing feedback.
- New, rename, save, reopen, duplicate and delete local creations; JSON export/import and automatic draft recovery. Import validates version, component IDs, bounds, numeric values and colors. Unsupported future versions fail with an explicit message; no silent migration.
- One independently authored vehicle and one garden workspace. No mandatory questions.

## Controls / first review

1. Start with the Garden Circuit and choose **Test track**. Automatic mode uses a motor and follows track direction; it is not a gravity-only release.
2. Return to editor. Select a piece in the library. Click near an exit to preview/snap, then place it. Alternatively, select a built piece, choose an asset and press **Attach piece** to connect at that exit.
3. Press Esc / Select to leave placement. Click a built piece for its inspector. On tablets use the **Inspector** button to show/hide that panel.
4. Inspector controls move X/Z, change elevation, scale length/radius, rotate, duplicate, color, delete, or set vehicle start. Undo/redo includes creation replacements.
5. In manual testing use arrows/WASD or the on-screen buttons. R resets; Esc returns to the editor.
6. Save locally, reopen, or export JSON. Export important creations because browser storage can be cleared or unavailable.

One finger or mouse drag orbits in select mode; two fingers pan/pinch. Right drag pans; scroll zooms. In placement mode a tap places, so cancel placement before moving the camera.

## Verification

Run `node --test tests/race-track-studio/foundation.test.mjs`.

Ten automated tests pass: every asset produces finite geometry and snap endpoints; disconnected/invalid connections; delete/undo/redo; storage/JSON property round trip and malformed imports; automatic straight/curve/climb/descent traversal; manual throttle/brake/steering/pause/reset/gravity; ramp flight; and 250-piece validation/simulation.

The starter contains 14 components and produces 53 batched track meshes / 11,206 track triangles (excluding car/environment). A 250 short-piece CPU sample contains 4,000 collision segments. CPU timings vary with host load and are not Chromebook GPU/frame-rate evidence. Runtime FPS/draw counters and a low quality option are provided. The import/build cap is 250 components; begin device reviews around 25–80 pieces until hardware profiling supports a larger recommendation.

**Browser acceptance remains blocked, so Phase 1 is not certified complete.** The available cloud Chrome returns `GL_VENDOR = Disabled`, `GL_RENDERER = Disabled`, and cannot create a WebGL context. The page loads and the explicit WebGL fallback appears, but rendered appearance, click-to-place, real keyboard/touch input, screen resizing, and GPU frame pacing could not be verified. Do not label those end-to-end checks passed. Vercel preview project creation also returned 403; no production deployment was attempted.

Generate an offline review file with:

```sh
python scripts/export-race-track-studio.py /absolute/path/Race_Track_Studio_Playable.html
```

The export embeds the exact modular code, styles, Three.js and OrbitControls as an import map with data modules; no server or CDN is needed in a modern browser with WebGL and import-map support. Local storage behavior for file URLs is browser-specific. Download and open in a full browser rather than a file thumbnail/quick-look viewer.

For development, serve `public` with a static HTTP server and visit `/prototypes/race-track-studio/`. No production navigation, build configuration, existing engines or shared infrastructure was modified.

## Known limits / next work

- Browser/device end-to-end review is required before claiming the Phase 1 completion criterion.
- Physics is an arcade surface controller. Rail collision is a lateral constraint; there is no chassis tipping, general mesh collision, car-to-car collision, suspension solver or moving obstacle support.
- Automatic mode has powered directional guidance. A failed landing or disconnected exit can stop the car; use Reset. Jump reachability is not predicted.
- Banked meshes visually roll and the car tilts, but lateral tire force/downforce and physical rollover are not simulated.
- Loop, corkscrew, free spline editing, terrain sculpting, grouped/multiselect transforms, cloud sharing and racing opponents are deferred.
- Endpoint checks identify close gaps/direction/slope mismatch and disconnected graph islands; they do not exhaustively detect intersecting surfaces, duplicate occupied sockets, structural feasibility, or impossible jumps.
- Supports are generated decoration and cannot be selected separately. Curves retain fixed catalog banking; length scaling changes their radius.
- Full scene rebuild happens on committed edits, not on every frame. Large-track editing and pointer previews still need actual device profiling. The graph check is quadratic, bounded by the 250-piece cap.
- One environment and one vehicle only. Procedural authored art establishes a direction, not a verified final flagship art pass.

Priority before Phase 2: verify the complete build → snap → drive → edit → save → reopen loop on a WebGL-capable laptop and iPad, correct observed input/physics issues, then profile 25/80/150-piece scenes on a Chromebook. Phase 2 should add downstream connected transforms, occupied socket prevention, clearer joint markers and error selection, transition smoothing, improved tire/slope/banking behavior, and further art polish. Expand assets only after those foundations are reliable.

## Bright palette and expanded library revision

The library now has 60 components in seven categories (43 additions). New catalog entries cover compact/broad 45°–180° turns, mirrored banked bends, additional climbs/descents, three launch/landing pairs, rolling hills, camelback, speed humps, mirrored S-bends, slalom, turbo straight/bend, a brake zone and two tunnel arch lengths. Search filters the active category. Tunnel arches are decorative frames; their roof is not a separate collision object. Loops and interactive scenery are still deferred.

Category colors now use orange, blue, purple, pink, gold, turquoise and coral. Sky, grass, supports, car and editor colors are brighter. Legacy default teal pieces adopt their category color on load; custom colors are preserved. Existing asset IDs and schema version 1 remain valid. New saves containing expanded IDs require this revision. Offline export also fixes a malformed font-import removal that previously damaged the opening CSS rule.

Ten tests pass, including finite geometry and snapped endpoints for all 60 assets, serialization and simulation smoke tests for every component, plus brake-zone slowdown without trapping the car. Smoke tests do not certify every stunt at every speed. Browser visual, pointer/touch and GPU verification remain blocked by the previously observed WebGL-disabled review environment. No production deployment.

## Vertical loop revision

The Stunts category now includes a vertical loop (61 components total), approximately 10m tall at default scale, with an offset exit to separate the crossing legs. Length scaling scales the full loop. Place a booster before its entry. Both automatic and manual tests use a guided loop traversal: momentum, throttle, braking, slope gravity and drag determine progress while steering is constrained through the inversion. This is an arcade loop guide, not a free tire-contact/centripetal-force solver. Too little speed can stall and release the car; Reset remains available.

Eleven automated tests pass, including inversion, reaching the top, leaving the loop and reaching a downstream finish in both driving modes, plus reset. Existing WebGL visual/device verification limitations still apply.

## Construction workflow revision

Open exits are green rings, occupied exits gray, invalid joints red, and the current snap target gold. Invalid placement previews turn red and show an explanation; occupied sockets and mismatched endpoint directions/slopes cannot be placed through free placement, Attach Piece or snap-selection. Duplicate-entry sockets in imported tracks are reported. This remains socket validation, not full mesh-overlap detection.

Select **Move / rotate entire connected section** in the inspector to apply X/Z translation, elevation, rotation and snap-to-exit to the whole connected graph component. Disconnected islands stay put. Bounds/floor and socket checks reject an invalid operation atomically. Each accepted operation is one undo/redo step. Geometry resizing and duplication still apply to the selected piece only. Connection markers are rebuilt after edits; pointer movement updates their colors without rebuilding their geometry.

Thirteen automated tests cover the earlier systems plus occupied exits/entries, rigid connected-section translation/rotation, preserved joints, unrelated islands, rejected out-of-bounds moves and undo/redo. Visual/pointer/touch checks remain pending in a WebGL-capable browser.

## Play-first presentation revision

A playful opening menu offers build/resume, a ready-made connected booster/loop/finish demo, and local creations. Illustrated piece cards are larger, the everyday build view has no permanent inspector, and Tools opens the drawer. Precision position/elevation/connected-section controls live in an Advanced Builder disclosure. Existing construction, serialization and custom track data are unchanged.

Driving expands the workspace and uses a 3–2–1–GO countdown before simulation advances, a speed/time HUD, pause, replay countdown, and a finish card with elapsed time/top speed. Placement gets a brief star pulse. Synthesized clicks/countdown/finish tones are opt-in and default off; no music or external audio assets. Reduced-motion preferences disable decorative CSS animation. The opening car is a CSS illustration, not a replacement for the in-game car.

Fifteen automated tests cover the existing systems plus countdown/pause/finish/replay state and the connected loop demo. The run timer in the summary uses simulation finish time; the live HUD uses running frame time. Browser visuals/input/audio/device checks still require an available WebGL-capable browser. Environment props and challenge missions are not part of this pass.

## Physical track art and library miniature revision

The library now projects each catalog asset's actual shared geometry profile into an isometric miniature, including left/right curves, wave hills, ramps, loop, tunnels and functional strips. It no longer uses generic straight/curve icons. Miniatures have depth, inset lanes, bright shoulders, shape badges and distinct proportions. An actual rendered contact sheet was visually inspected for representative pieces.

In-world geometry now includes thick sidewalls, a contrasting inset driving lane, molded exterior clips with pins, category-colored shoulders, ramp hazard markings and booster/brake chevrons. Collision geometry, track dimensions and saved data remain unchanged. Sixteen automated tests pass, including finite miniature generation for all 61 assets and distinct previews for key profiles. In-world WebGL appearance remains unverified in the available review browser; thumbnail inspection is not a claim of full 3D visual acceptance.
