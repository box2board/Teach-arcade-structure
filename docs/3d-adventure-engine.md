# 3D Adventure Engine

The released Silent Observatory game is at /arcade-review-games/science/silent-observatory/.

Shared runtime modules live in public/engines/3d-adventure/. Keep the runtime shared when creating another adventure. Each adventure supplies its own id, save namespace, academic goal, story, questions, world layout, objects, relay stations and optional final model. The Observatory content package is in silent-observatory/; its bootstrap loads content before the runtime. Do not load its seasons-mission package for unrelated adventures.

For a new game, create a separate content folder and page on a feature branch. Configure new world geometry in world.elements and matching exterior interactions, bounds and mission coordinates. Preserve the released Observatory package. Use the existing configuration validator and keep theme-specific behavior out of movement/camera/collision modules. The seasons-model interaction is optional.

Validation commands:

- node scripts/test-3d-world-collision.mjs
- node scripts/test-3d-objective-guidance.mjs
- node scripts/test-3d-relay-progress.mjs
- node scripts/test-3d-evidence-questions.mjs
- node scripts/test-3d-seasons-mission.mjs
- MISSION_DIFFICULTY=easy node scripts/test-3d-seasons-mission.mjs
- MISSION_DIFFICULTY=hard node scripts/test-3d-seasons-mission.mjs
- node scripts/test-3d-seasons-mission.mjs --legacy

These are headless runtime checks, not rendered browser/device playtests. Evidence tasks restart at the interior checkpoint on reload; they are not silently auto-answered. The static game does not provide teacher accounts, student reporting or multiplayer.
