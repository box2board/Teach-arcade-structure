# Creator runtime V1.4 (development)

Opt-in extension to V1.2 movement + V1.3 abilities. Existing games do not load it.

Load after V1.3 core:

1. `path-motion.js`
2. `creator-runtime.js`

This registers `TASideScroller.CreatorEngine` and replaces `TASideScroller.Engine` in that page only. Ordinary levels retain the base movement. Custom-path platforms carry a standing player in both axes. Custom-path enemies use the existing interaction rules (stompable, hazard, bounce). Authored paths bypass ground patrol and falling behaviors; place their routes clear of obstacles.

Paths are absolute **top-left** coordinates, beginning at the object's `x,y`. Use 2–64 points. `speed` is pixels/second; `pathPause` is seconds at each point, including the initial point. A point may override its pause using `pause`. `pathMode` is `pingpong` (reverse at the endpoints) or `loop` (travel continuously from last point back to first). Loop closure never teleports.

`PathMotion.advance(object, dt, speed)` is also used by the editor's live motion preview. Runtime state `_route` lives on cloned runtime objects, never on the authored level.

Collectible options: `score` amount (default 100), `reward: 'score'|'power'|'gear'`, `hits` for power, `abilities` for gear (default climb/heavy). Power/gear still use the V1.3 ability system. This extension also preserves platform style data discarded by the base parser. Styles affect artwork, not collision geometry.

Tests: `node scripts/test-creator-paths.mjs`. Browser and touch QA remain outstanding.

Vertical worlds: the creator camera follows x and y within world bounds, resets to the spawn/checkpoint on restart, and retains y=0 for 480px-high legacy levels. The renderer translates world objects and player art by both axes while HUD stays fixed. Upward expansion is performed by the editor model before export; the runtime simply consumes the expanded coordinates/layers.
