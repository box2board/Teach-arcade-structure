# WWI Trench Run — Side-Scroller Visual Prototype
This isolated prototype now runs on Teach Arcade's shared Side-Scroller Engine v1.1 and retains the live game’s platforming and educational flow. All changes stay inside this prototype directory on `prototype/wwi-trench-run-v2-art-assets`; the live Trench Run, main branch, and production deployment are untouched.

## Gameplay retained
- Horizontal movement with the live engine’s acceleration, fixed-step physics, coyote time, jump buffering, and variable jump height.
- Solid terrain, raised sandbag/duckboard/roof platforms, checkpoints and respawns.
- Rat patrols, falling shells, wire hazards, collectible intelligence, question stations, answer rewards, gates, difficulty settings, and the command-post goal.
- WWI question bank and the existing gameplay/visual validators.

The prototype map adds two real terrain gaps (open collision gaps, not painted markings) with raised landing platforms on the far sides. It spaces the wire hazard more generously to keep a readable route through the course.

## Visual implementation
- The illustrated atlases in `assets/runtime/` are used by the game renderer.
- Soldier run and jump frames, trench and battlefield parallax, duckboard floor, raised platforms, glowing readable wire, checkpoints, stations, falling shells, and the rat sprite sheet are rendered at engine world coordinates.
- `rat-sprite-strip.png` contains two transparent side-view running poses and is cropped by the renderer at runtime.
- The renderer replaces only the engine's draw function; physics, collisions, questions, checkpoints, difficulty, and controls continue to come from the shared engine modules.

Playable route: `/dev/wwi-trench-run-v2-art-prototype/play.html`.
