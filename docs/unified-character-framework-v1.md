# Teach Arcade Unified Character Framework — Stage 1

## Repository observations (12 Nov 2026)
- `main`: static public site under `public/`, with Vercel and teacher systems. No Quaternius model has been checked in.
- `prototype/character-studio-20261027`: existing procedural Three.js character editor at `public/labs/character-studio/`. Its `ta-humanoid-1` 22-bone rig and appearance recipes are **not** automatically equivalent to Quaternius.
- `prototype/flagship-3d-world-foundation`: PlayCanvas multiplayer client under `prototypes/flagship-world-playcanvas/multiplayer-main.js`. Visual avatars are currently capsule/head primitives; the client separately imports existing physics and recovery modules.
- No confirmed canonical implementation of the recently discussed multiplayer Arcade Review Game was found on the inspected `main` branch. Locate its active development branch before any game integration.

## Boundary (no gameplay modifications)
This branch introduces an engine-neutral **character identity contract** and **asset catalog** only. It does not alter physics, camera, spawn points, server-authoritative updates, networking, Teacher HQ, navigation, or existing player meshes.

- Client receives `{version, characterId, appearanceId}` only.
- Game/server movement code determines the action; the character visual layer may map `idle | walk | run | jump | interact | celebrate` to animation clips.
- The game owns collision bounds, movement speed, jump capabilities and input.
- PlayCanvas uses a future GLB asset renderer; Three.js Character Studio needs a separate adapter if its appearance recipes are reused.
- Always validate character IDs against the active catalog; do not accept arbitrary asset URLs or user-supplied code.
- Session data should not require accounts. No student identities or profile storage added.

## Asset procurement and technical acceptance
Proposed source: Quaternius Universal Base Characters. The initial catalog uses a **placeholder** `ta-starter-01` with `glb:null`. Download the pack, archive its exact license file, and inspect both Regular and Teen proportions. Then test a real GLB with PlayCanvas; confirm rig mapping, scale, forward axis, texture/material counts, draw calls, animation clips and commercial license before changing status to `ready`.

Do not assume the older `ta-humanoid-1` skeleton or animation clips transfer directly to Quaternius. Any remapping/retargeting must be independently validated.

## Acceptance tests for Stage 2
1. Original primitive-player multiplayer route still works (no existing code modified).
2. A local PlayCanvas sandbox loads the validated Quaternius GLB and preserves current movement behavior with visual-only attachment.
3. Test idle/walk/run/jump blends and turning; verify no character-space rotation offset.
4. Measure real Chromebook performance with 1/20/40 animated characters, not just the existing primitive-actor simulation.
5. Confirm distant-player visibility and reconnection, and test the disappearing-remotes regression.
6. Promote only after visual, licensing and performance review.

## Run contract tests
`node --test tests/character-framework.test.mjs`
