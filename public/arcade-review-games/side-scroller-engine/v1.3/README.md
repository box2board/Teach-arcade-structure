# Teach Arcade Side-Scroller Engine V1.3

Status: development. V1.2 and all games already using V1.0–V1.2 remain intact.

## Purpose

V1.3 adds a reusable player-ability and interaction layer on top of the proven side-scroller architecture. New games may opt into abilities without forcing every game to use the same mechanics.

## Core V1.3 systems

- Dash: double-tap left/right for a short controlled burst. Can satisfy `ram` break requirements.
- Stomp: down while airborne. Can satisfy `stomp` break requirements.
- Power state: a themeable collectible can grant one or more protected hits. Themes should not assume a mushroom; books, journals, artifacts, shields, energy cells, etc. can represent the same engine state.
- Gear: themeable equipment grants an ability list such as wallJump, glide, climb, hazardResist, heavyBoots, or magnet.
- Mounts/companions: themeable rideable entities grant abilities and movement modifiers. Horse, camel, rover, raft, sled, robot suit, etc. are level/theme decisions rather than engine assumptions.
- Ability-gated secrets: routes and breakables can require an ability instead of merely a collision speed.

## Design rule

Reuse the technology, not the level formula. A game should enable only the abilities that support its identity.

## Compatibility

V1.3 is a new engine path. Do not migrate existing V1.2 production games simply because V1.3 exists. V1.2 remains the stable engine for those games.

## First development target

Build a dedicated mechanics playground demonstrating:
1. double-tap dash + RAM barrier,
2. stomp + cracked floor,
3. protected-hit power collectible,
4. one ability-granting gear item,
5. one mount/companion,
6. one genuinely optional secret route.

`ability-system.js` is intentionally separated from movement/core logic so the feature contract can be tested before it is deeply coupled to the engine.