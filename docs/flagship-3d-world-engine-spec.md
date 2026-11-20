# Teach Arcade Flagship 3D World Engine

**Status:** Foundation specification / Prototype 0
**Branch:** `prototype/flagship-3d-world-foundation`
**Production impact:** None. This work must remain isolated until explicitly approved for integration.

## 1. Product Vision

Teach Arcade will develop a browser-based, third-person, 3D multiplayer world that can eventually support subject-specific educational adventures, long-form quests, exploration, creation, collaboration, and teacher-assigned missions.

The world itself must be enjoyable before academic content is layered on top. Prototype development therefore focuses first on player feel, world quality, multiplayer presence, interaction, construction, persistence, and performance.

The long-term product should feel like a real game platform rather than an educational worksheet presented in 3D.

## 2. Core Design Principles

1. **World first, curriculum second.** The initial prototype proves that moving through, exploring, building in, and sharing the world is enjoyable.
2. **Browser native.** No install should be required for students. Chromebook, desktop, iPad, and modern mobile browsers are first-class targets.
3. **Multiplayer by architecture, not retrofit.** Player state, ownership, interactions, and world changes must be designed from the beginning for multiple simultaneous users.
4. **Server authority.** Important multiplayer state cannot be trusted solely to a student browser.
5. **Expandable world.** The world must be region/chunk based so it can grow without loading everything at once.
6. **Hybrid construction.** Natural terrain and authored environments use normal 3D geometry; player construction uses a structured modular/grid system.
7. **Persistent creations.** Player builds and meaningful progression should eventually survive across sessions.
8. **School-safe communication.** The design must not depend on unrestricted public text chat.
9. **Graceful device scaling.** Visual fidelity may change by device, but the game loop and controls should remain intact.
10. **No giant-content expansion before systems pass.** We do not build a huge map until movement, networking, interaction, building, saving, and performance are proven.

## 3. Prototype 0 Goal

Create one polished, compact region that proves the engine can support the eventual flagship product.

A successful Prototype 0 allows a player to:

- enter the world quickly from a browser;
- control a third-person avatar smoothly;
- run, sprint, jump, rotate the camera, and interact with objects;
- explore a visually coherent outdoor area and at least one interior;
- see other connected players moving in the same world;
- identify players by a safe display identity;
- collect and use at least one item;
- interact with one NPC or world object;
- complete one placeholder non-academic quest;
- enter a designated build area;
- place, rotate, move, duplicate, and delete modular construction pieces;
- see another player's placed structure;
- leave and return without losing an approved persistent build;
- maintain acceptable performance on target school hardware.

The placeholder quest is intentionally simple: find three artifacts, return them to a central structure, and open a gate or portal. Its purpose is to validate mission hooks, not curriculum.

## 4. Prototype Region

The prototype should be approximately one small game district rather than an empty open field.

Suggested layout:

- **Central Plaza:** primary spawn, landmark, multiplayer gathering point.
- **Settlement:** several exterior buildings and one enterable interior.
- **Forest Trail:** exploration route with vertical variation and hidden pickup.
- **Lake or River:** environmental landmark and traversal boundary.
- **Tower / Ruin:** destination used by the placeholder quest.
- **Build Yard:** designated construction zone with clear ownership rules.
- **Portal Gate:** future transition hook to other regions/worlds.
- **Hidden Area:** one optional discovery to test exploration rewards.

The region should use sightlines and landmarks so a student can navigate without constantly opening a map.

## 5. Player System

### Prototype requirements

- third-person controller;
- walk/run;
- sprint;
- jump;
- grounded-state detection;
- slope handling;
- step-up handling for small obstacles;
- basic collision;
- orbit camera;
- camera collision avoidance;
- adjustable camera distance within safe bounds;
- idle, walk, run, jump/fall, land, and interaction animation states;
- keyboard/mouse controls;
- touch controls suitable for iPad;
- gamepad architecture considered but not required for Prototype 0.

### Feel target

Movement should favor responsiveness over strict realism. Input latency, camera jerk, delayed jumping after landing, and over-physical movement are unacceptable. The player should feel capable and agile.

### Player state

Minimum synchronized state:

- player id;
- display name or generated classroom-safe alias;
- avatar selection id;
- position;
- rotation;
- locomotion/animation state;
- current interaction state;
- selected emote;
- build-mode state where relevant.

## 6. Camera System

The camera is a core game system, not a polish item.

Requirements:

- third-person follow camera;
- smooth rotation;
- mouse/touch orbit;
- zoom limits;
- collision handling so walls do not fully obscure the player;
- automatic recenter option;
- no violent snapping when traversing uneven terrain;
- configurable sensitivity;
- touch behavior tested independently from desktop behavior.

## 7. World Architecture

The long-term world must be split into regions and local streaming units.

Conceptual hierarchy:

```text
World
  Region
    Zone
      Stream Cell / Chunk
        Static environment
        Interactive entities
        Spawn points
        Build plots
        Mission hooks
```

Prototype 0 may load one compact region at once, but entity definitions and file organization should already assume later streaming.

World content must distinguish:

- **static environment:** terrain, rocks, authored buildings, roads;
- **interactive environment:** doors, pickups, switches, NPCs, portals;
- **dynamic multiplayer entities:** players, temporary objects;
- **persistent player creations:** approved build data;
- **mission entities:** objective markers and trigger volumes.

## 8. Multiplayer Architecture

### Direction

Use an authoritative multiplayer server rather than peer-to-peer player authority.

The server is responsible for validating important state changes and distributing world state to connected clients. Clients send movement/input and interaction intentions; they do not get unrestricted authority to rewrite shared world state.

### Prototype multiplayer requirements

- join/create a world room;
- synchronize multiple players;
- spawn/despawn correctly;
- interpolate remote movement;
- tolerate normal school-network latency;
- reconnect after short connection loss when practical;
- synchronize avatar state and emotes;
- synchronize construction placement/removal;
- reject invalid/out-of-bounds build actions;
- support a configurable room population limit.

### Initial scale target

Prototype target: **8-16 concurrent players per room** with architecture that does not prevent future larger instances.

This is not a claim that 16 is the final classroom limit. The number is intentionally conservative until profiling provides evidence.

### Networking candidate

**Primary candidate: Colyseus.** It provides authoritative Node.js game rooms, server-owned synchronized state, matchmaking/room concepts, and prediction-oriented netcode. A technical spike must validate it with the selected renderer before final adoption.

## 9. Construction System

The construction system should capture the accessibility and creativity of block-building games without forcing the entire world to be voxel terrain.

### Prototype approach

Use designated build plots and modular pieces.

Minimum piece categories:

- foundation/floor;
- wall;
- doorway;
- window wall;
- roof;
- stairs/ramp;
- column;
- platform;
- basic decorative object;
- terrain-adjacent block such as stone or wood cube.

Minimum build operations:

- preview/ghost placement;
- valid/invalid placement feedback;
- grid snap;
- optional surface snap;
- rotate;
- place;
- select;
- move;
- duplicate;
- delete;
- undo last action where feasible;
- exit build mode cleanly.

### Ownership and validation

Each placed object needs:

- persistent object id;
- owner id;
- plot id;
- asset/type id;
- position;
- rotation;
- scale only if explicitly supported;
- creation timestamp/version;
- server validation status.

The server must verify placement rules before a build becomes authoritative.

### Future expansion

Later systems may include:

- material palette;
- block destruction;
- collaborative build permissions;
- blueprint saving;
- teacher-owned plots;
- class projects;
- historical reconstruction challenges;
- machinery or logic components;
- terrain modification where technically safe.

These are explicitly out of scope for Prototype 0.

## 10. Interaction System

All interactable objects should use a shared interaction interface rather than one-off scripts.

An interactable entity should be able to expose:

- interaction prompt;
- range;
- required item/condition;
- interaction type;
- animation hook;
- server action hook;
- local feedback;
- mission event hook.

Prototype interaction types:

- collect;
- open/close;
- talk/inspect;
- activate;
- enter/exit;
- build/select.

## 11. Inventory and Item System

Prototype inventory should remain small and structural.

Required concepts:

- item definition id;
- display metadata;
- quantity where stackable;
- icon;
- optional world model;
- pickup behavior;
- use behavior;
- persistence flag.

Prototype UI can use a compact quick inventory rather than a large RPG inventory screen.

## 12. Mission Hook System

Academic content is out of scope, but the engine needs mission hooks now so later missions do not require an engine rewrite.

Minimum objective types:

- reach location;
- collect item(s);
- interact with object;
- speak to/inspect entity;
- place/build object;
- complete ordered sequence;
- unlock gate/portal.

A mission should be data-driven rather than hard-coded to one map.

## 13. Persistence

Separate transient real-time state from durable account/world data.

### Real-time state

Handled by the multiplayer game server:

- positions;
- immediate movement state;
- active interactions;
- temporary world entities;
- active room membership.

### Durable state

Handled by a persistence layer/database:

- player profile;
- avatar configuration;
- progression flags;
- persistent inventory where appropriate;
- owned builds;
- build object transforms;
- world/plot ownership;
- moderation/admin metadata;
- later teacher/class assignment relationships.

Supabase is a strong candidate for durable application data because Teach Arcade is already moving toward account-backed infrastructure, but persistence integration should be introduced only after the local build and multiplayer loops are stable.

## 14. School-Safe Multiplayer Rules

Prototype development must avoid creating systems that will later be difficult to make classroom-safe.

Default direction:

- no unrestricted public global text chat;
- use emotes and curated quick messages initially;
- room codes/private sessions as a primary classroom model;
- teacher/admin authority hooks reserved in the room model;
- player reporting/muting architecture considered before public multiplayer;
- display-name rules must not depend on unmoderated arbitrary public identity;
- build ownership and deletion permissions must be explicit.

## 15. Rendering Engine Technical Spike

Do not permanently select a renderer until a short controlled comparison is completed.

### Candidate A: PlayCanvas

Reasons to test first:

- web-first 3D engine;
- modern WebGL 2 support;
- WebGPU path with fallback;
- strong browser/device focus;
- editor tooling available;
- well suited to lightweight browser distribution.

### Candidate B: Babylon.js

Reasons to retain as the comparison candidate:

- mature browser 3D/game engine;
- broad engine feature set;
- strong WebGL/WebGPU capabilities;
- established TypeScript workflow.

### Spike scene

Both candidates should render the same small test scene:

- one animated third-person character;
- terrain/ground;
- 50-100 repeated environmental meshes using sensible instancing/batching;
- lighting and shadows;
- one interior or dense prop cluster;
- simple physics/collision;
- touch controls;
- remote-player dummies;
- basic build-placement preview.

Measure:

- load time;
- bundle/runtime footprint;
- frame rate;
- frame-time stability;
- memory behavior;
- touch responsiveness;
- implementation complexity;
- asset workflow;
- debugging experience;
- compatibility on ChromeOS-class hardware, desktop Safari/Chrome, and iPad Safari.

### Current default hypothesis

PlayCanvas is the initial favorite for the technical spike, not the irreversible final selection.

## 16. Performance Budget

Prototype targets should be enforced early.

Initial targets:

- **Desktop/modern Chromebook:** target 60 FPS; acceptable floor 30 FPS under normal prototype load.
- **iPad:** target stable 30+ FPS with adaptive graphics.
- no long main-thread freezes during normal traversal;
- progressive or staged asset loading;
- texture sizes and materials governed by an asset budget;
- repeated props should use instancing/batching where appropriate;
- distant objects should use LOD/culling strategies;
- dynamic resolution/pixel ratio may scale on weaker devices;
- shadows and post-processing must have quality tiers.

Exact budgets will be revised after the technical spike produces real measurements.

## 17. Graphics Quality Tiers

The same world may render differently by device.

Suggested tiers:

### Low

- reduced pixel ratio;
- limited shadow distance;
- fewer shadow-casting lights;
- reduced vegetation density;
- simplified post-processing;
- aggressive LOD.

### Medium

- balanced shadows;
- normal vegetation;
- moderate effects;
- standard draw distance.

### High

- higher shadow quality;
- expanded effects;
- increased draw distance;
- higher environmental density where safe.

Gameplay visibility and collision must remain consistent across tiers.

## 18. Asset Rules

Before large asset production begins, define:

- common unit scale;
- up-axis/orientation convention;
- naming convention;
- collision-mesh convention;
- pivot convention;
- texture-size limits;
- material-count limits;
- polygon guidance by asset class;
- LOD rules;
- animation naming;
- export format, preferably glTF/GLB where appropriate;
- license/source tracking for every third-party asset.

AI-generated visual assets may be used where appropriate, but they still need optimization, consistent art direction, and provenance/licensing review.

## 19. UI/HUD Prototype

Keep the first HUD sparse.

Prototype HUD:

- player identity;
- interaction prompt;
- small quest/objective tracker;
- compact quick inventory;
- build-mode toolbar when active;
- connection/reconnect state;
- settings/pause.

Avoid surrounding the 3D world with website chrome while actively playing.

## 20. Repository / Deployment Direction

The current Teach Arcade repository is primarily a static-site product. The 3D multiplayer world should therefore be treated as an isolated application during prototyping.

Short term:

- work only on an isolated prototype branch/workspace;
- do not wire the prototype into production navigation;
- do not alter existing games to depend on the new stack;
- use a separate prototype application directory or ultimately a dedicated repository if tooling/deployment warrants it.

Long term architecture may look like:

```text
teacharcade.com
    -> launches world experience

3D client application
    -> renderer / game client
    -> multiplayer SDK

multiplayer service
    -> authoritative world rooms
    -> validation
    -> matchmaking/session management

persistent data service
    -> accounts
    -> profiles
    -> builds
    -> progression
    -> classroom ownership
```

## 21. Prototype Development Gates

Do not advance simply because a feature technically exists.

### Gate 1 — Player Feel

Pass when movement, jump, camera, animation, collision, keyboard/mouse, and touch controls feel reliably responsive.

### Gate 2 — Multiplayer Presence

Pass when multiple players can join, move smoothly, leave/rejoin, and see consistent authoritative state.

### Gate 3 — World Interaction

Pass when pickups, doors/objects, one NPC/inspect interaction, inventory, and a placeholder objective function through shared systems.

### Gate 4 — Construction

Pass when two players can build in valid plots, see each other's updates, cannot perform invalid placement, and can save/reload structures.

### Gate 5 — Visual/World Pass

Pass when the prototype region has coherent art direction, landmarks, lighting, environmental density, and at least one polished interior.

### Gate 6 — Performance

Pass when target devices maintain acceptable frame rate, load behavior, memory use, and network stability.

### Gate 7 — Vertical Slice

Pass when a new user can enter, understand controls, explore, interact, build, see another player, finish the placeholder quest, and leave with a clear sense of a complete game loop.

Only after Gate 7 should we meaningfully expand world size or begin large academic mission production.

## 22. Explicit Prototype 0 Non-Goals

Do not build these yet:

- giant seamless continent;
- hundreds of players in one instance;
- unrestricted global chat;
- full combat system;
- advanced economy;
- marketplace/trading;
- complex crafting;
- procedural infinite terrain;
- user scripting;
- full voxel terrain destruction;
- dozens of avatars;
- large academic question libraries;
- teacher dashboards inside the 3D client;
- final lore;
- final monetization;
- production deployment.

## 23. Immediate Implementation Sequence

1. Create PlayCanvas technical spike.
2. Create equivalent minimal Babylon.js spike only to the level needed for a fair engine decision.
3. Record device/performance findings and select the renderer.
4. Build the production-quality player controller and camera.
5. Establish shared asset/import conventions.
6. Build the prototype region graybox.
7. Add multiplayer room and remote-player synchronization.
8. Add shared interaction framework.
9. Add minimal inventory and placeholder quest hooks.
10. Add modular build system.
11. Add server validation for builds.
12. Add persistence for player builds.
13. Replace graybox with first coherent art pass.
14. Run desktop/Chromebook/iPad performance pass.
15. Run complete vertical-slice playtest.
16. Only then design the first subject-specific version.

## 24. Definition of Success

Prototype 0 succeeds when a student can open a link on normal school hardware, enter a visually appealing 3D world, immediately understand how to move, encounter other players, explore something interesting, interact with the environment, construct something meaningful, complete a simple objective, and want to continue exploring.

The key success question is not yet: **Did the student learn the academic material?**

The key success question for this phase is: **Have we created a technically sound world that students genuinely want to inhabit, and that can later carry rigorous educational missions without being rebuilt?**
