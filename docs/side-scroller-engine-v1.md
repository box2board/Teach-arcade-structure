# Teach Arcade Side-Scroller Engine V1

Status: development only  
Branch: `side-scroller-engine-v1`  
Production protection: do not modify or replace the current WWI Trench Run on `main`.

## Reference audit

The current repository contains several arcade implementations with useful patterns:

- `wwi-trench-run-v2/`: strongest reference for classroom settings, question data separation, HUD, relay mode, difficulty, jumping, obstacle spawning, answer effects, results, and theme-specific backgrounds.
- `pyramid-escape-run.html`: reference for a strongly themed historical environment.
- `moon-mission-run.html`: reference for a science-themed runner.
- `algebra-city-run.html` and `slope-street-sprint.html`: reference for math runners.
- Other arcade games use different genres and should not be forced into this engine.

The WWI V2 implementation currently mixes reusable systems and WWI-specific presentation in the same game script. V1 will separate those responsibilities rather than refactor the production game in place.

## V1 architecture

```
public/arcade-review-games/side-scroller-engine/
  engine/
    core.js
    physics.js
    input.js
    collision.js
    camera.js
    questions.js
    scoring.js
    audio.js
    renderer.js
    effects.js
  demo/
    index.html
    game-config.js
    level-data.js
    questions.js
    theme.css
  README.md
```

### Engine owns

- fixed-timestep/update loop
- horizontal movement and acceleration
- jump physics and grounded state
- collision detection
- camera tracking
- checkpoints / respawn
- hazards and damage
- collectibles
- question triggers and answer lifecycle
- score / streak / accuracy
- pause, restart, win and lose states
- keyboard and touch input
- reduced-motion support
- hooks for sound and analytics
- rendering orchestration

### Theme/game package owns

- title and curriculum topic
- background layers and parallax speeds
- foreground art
- platform/ground art
- player sprite set
- hazard/enemy sprite set
- collectible art
- environmental particles
- UI skin
- sound set
- level geometry
- question bank
- question-trigger locations
- checkpoints
- finish location
- theme-specific gameplay events

## Design rule

The engine must never contain assumptions such as "trench", "pyramid", "moon", "scarab", or "barbed wire". It receives generic entities such as `platform`, `hazard`, `collectible`, `checkpoint`, `questionTrigger`, and `decor`. The theme config determines how those entities look and, where allowed, their configured behavior.

This is what lets WWI Trench Run and Pyramid Escape feel visually unrelated while sharing movement, collision, camera, questions, scoring, mobile controls, and accessibility.

## Config contract draft

```js
window.TA_SIDE_SCROLLER_GAME = {
  id: "engine-demo",
  title: "Side-Scroller Engine Demo",
  world: {
    width: 7200,
    height: 540,
    gravity: 1900
  },
  player: {
    speed: 300,
    acceleration: 1800,
    deceleration: 2200,
    jumpVelocity: 720,
    maxHealth: 3
  },
  camera: {
    lookAhead: 160,
    smoothing: 0.12
  },
  questions: {
    triggerMode: "level",
    correctReward: "boost",
    wrongPenalty: "none"
  },
  theme: {
    backgroundLayers: [],
    sprites: {},
    effects: {}
  }
};
```

## Level data contract draft

```js
window.TA_SIDE_SCROLLER_LEVEL = {
  spawn: { x: 120, y: 360 },
  finish: { x: 6900, y: 300 },
  platforms: [],
  hazards: [],
  collectibles: [],
  checkpoints: [],
  questionTriggers: [],
  decor: []
};
```

## Gameplay goals

V1 should feel like a platform game first and a quiz second. Questions should influence play without making the game feel like repeated interruption.

Supported answer effects should include:

- temporary speed boost
- shield / damage protection
- health recovery
- bonus collectible multiplier
- shortcut unlock
- hazard disable
- no penalty / continue
- configurable theme-specific event

Incorrect answers should be configurable and should not automatically produce harsh punishment. The teacher/game package can choose the consequence.

## Visual goals

The renderer must support:

- multiple parallax background layers
- sprite animation
- foreground layers
- environmental particles
- screen shake
- lighting/overlay effects
- theme-specific platform tiles
- animated hazards
- scalable canvas presentation

The goal is not to create a generic runner with a swapped background. Each game should be able to establish its own visual world.

## Migration plan

1. Build an isolated engine demo on this branch.
2. Tune movement until running/jumping feels polished on keyboard and touch.
3. Add camera, collisions, hazards, checkpoints and questions.
4. Add the full theme interface and parallax renderer.
5. Build a WWI-inspired development theme without changing the existing production Trench Run.
6. Build a second, visually distinct Egypt test theme against the same engine.
7. If both work without engine forks, V1 has proven reusability.
8. Only after approval consider migrating existing live games.

## Acceptance gate before production

Do not merge merely because the engine works. Before production it must:

- feel materially better than the existing runners
- work on desktop, Chromebook/tablet-sized screens and touch devices
- keep game content outside core engine code
- support two substantially different themes without engine edits
- preserve classroom-friendly question flow
- have no dependency on the existing WWI production files
- pass a Vercel preview review
