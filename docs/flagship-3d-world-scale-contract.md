# Teach Arcade Flagship 3D World — Scale Contract

**Status:** Accepted foundation constraint

This document records the multiplayer, classroom, infrastructure, and building assumptions that should govern future Flagship World development.

## Classroom concurrency targets

- Design target: **40 simultaneous students in one class world with dependable classroom performance**.
- Stress target: **64 simultaneous students in one class world**.
- Platform concurrency is not capped at 64. The platform should scale horizontally across many independent class worlds and region servers.
- Do not advertise a higher per-class concurrency target until it has been demonstrated on representative school Chromebooks and iPads.

## World model

- Students experience one large continuous world.
- The world is divided into streamable regions/chunks; a client never loads or simulates the whole world at once.
- A class receives a private world instance by default. Unrelated classes do not share the same live simulation.
- Regions may be served by separate authoritative game rooms/processes while remaining visually seamless to players.
- Area-of-interest synchronization is required: nearby players receive high-fidelity updates; distant players receive reduced updates or no live transform data.

## Client target

The performance baseline is an ordinary school Chromebook, followed by iPad, laptop, and desktop.

Required techniques include LOD, culling, instancing/batching, texture compression, conservative dynamic lighting, object pooling, streamed assets, graphics-quality tiers, and adaptive resolution where appropriate.

## Server authority

The browser may predict local movement for responsiveness, but the multiplayer server is authoritative for player position validation, interactions, pickups, mission outcomes, build placement, build deletion, and shared world state.

Do not write continuous player transforms to the persistence database. Real-time movement belongs on the multiplayer server. Durable events and state belong in persistent storage.

## Persistence boundaries

Persist durable state such as:

- class/world identity
- student progress
- mission progress
- inventory/earned items
- group state
- placed construction objects
- ownership and permissions
- achievements
- teacher-controlled world settings

Do not persist every render frame or network transform update.

## Building is a core engine pillar

Building is not an optional side feature. It is one of the core Flagship World systems alongside movement, multiplayer, and world streaming.

The default building model is **hybrid construction**, not a fully destructible voxel planet:

- authored terrain and landmarks remain performant normal 3D geometry;
- designated build areas allow grid/snapping-based modular construction;
- specialized excavation/mining/sandbox zones may later support voxel-style destructible blocks;
- every placed object has a type, transform, owner, group, class/world, permissions, and optional mission metadata;
- build placement is server validated;
- teachers control where building is allowed, who may edit/delete, whether group editing is enabled, and whether construction persists between sessions.

## Teacher-first classroom controls

The eventual teacher console should support:

- start/stop/pause a class world session
- view student connection state and approximate region/location
- observe/teleport to a student or group
- bring a student/group back to a teacher-defined point
- respawn/reset stuck students
- enable/disable or restrict building
- set individual/group build permissions
- choose temporary vs persistent world state
- assign/activate missions
- view progress by student and group
- review contribution evidence beyond quiz scores

## Learning evidence model

The system should eventually be able to report evidence across:

- knowledge and question performance
- sources/evidence examined
- discoveries and exploration
- mission objectives
- decisions/outcomes
- creation/build requirements
- individual and group contribution
- time/attempts/checkpoints

The learning layer should be data-driven and reusable so future subjects can use the same world engine without rewriting multiplayer or construction systems.

## Privacy and safety baseline

- Private class instances by default.
- No random public strangers in a class world.
- No unrestricted public voice chat.
- Communication features must be teacher-controlled.
- Collect the minimum student-identifying information necessary.
- Ownership/moderation information must be sufficient for a teacher to manage shared construction and classroom behavior.

## Development gates

Do not scale content before the engine passes these gates in order:

1. player movement and camera feel
2. modular building/ownership model
3. authoritative multiplayer prototype
4. 8-player synchronization test
5. 20-player classroom simulation/load test
6. 40-player representative-device classroom target
7. 64-player stress test
8. region streaming and seamless transfer
9. persistent class world
10. teacher control/observation layer
11. academic mission framework

A failure at a gate should be fixed at the engine level before expanding world content.
