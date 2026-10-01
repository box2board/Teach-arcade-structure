# Teach Arcade Side-Scroller Engine V1.2

Version: **1.2.0**  
Status: **Stable production engine**

V1.2 is a production mechanic library designed to support mechanically distinct side-scrollers rather than one repeated platforming formula. V1.1 remains supported for existing approved games; they do not need to migrate.

## Mechanic library

### True sloped terrain
Levels may define `slopes` with `x1, y1, x2, y2`.
- Smooth uphill/downhill player movement.
- Flat-to-slope transitions.
- Grade-based momentum.
- Ground enemies can patrol supported slopes.
- QA checks bounds and excessive grade.

### Enemy interaction types
Movers may define `interaction`.
- `stompable`: landing from above defeats the enemy and bounces the player.
- `hazard`: contact from any direction respawns the player.
- `bounce`: retained for moving bounce objects.
- Side contact with a stompable enemy is still dangerous.

### Breakable objects
Levels may define `breakables`.
- Current break mode is `headbutt`.
- A sufficiently fast upward hit breaks the object, awards a small score bonus, and removes its collision.
- Breakables can be used for hidden routes, shortcuts, gates, or optional collectibles.

### Bounce / spring surfaces
Levels may define `bounceSurfaces`.
- Landing on one immediately launches the player upward.
- Bounce strength is configurable per surface.
- These can support vertical routes, timing sections, and alternate traversal.

### Climbable / ladder zones
Levels may define `climbables`.
- Up/Down enters and traverses the climbable.
- Gravity is suspended while climbing.
- The player centers on the climbable automatically.
- Space jumps off; Left/Right controls jump-off direction.
- A climbable can lead to upper routes without requiring a sequence of normal platforms.

## Compatibility
Do not migrate V1.1 production games simply because V1.2 exists. Engine generations may coexist. Existing approved games should move only for a genuine shared bug or a deliberate redesign.

## Design rule
New games should select mechanics because they fit the concept. A game does not need to use every mechanic. Reuse the engine and mechanic library — not the same level structure.


## Level Identity and long-form design framework (alpha.3)

V1.2 separates **mechanic capability** from **level identity**. A production game should define its identity before its geometry is finalized.

Recommended `design` metadata:

```js
design: {
  kind: 'production',
  identity: 'One sentence describing what playing this game feels like.',
  targetMinutes: [6, 10],
  routeStyle: 'continuous-forward',
  pacing: 'momentum-with-set-pieces',
  verticality: 'medium',
  primaryMechanics: ['slopes', 'stompableEnemies'],
  signatureMechanic: 'slopes',
  signatureSetPiece: 'long downhill run into a steep final climb'
}
```

Zones describe gameplay beats, not merely visual regions. Each zone can declare a `role` and a `mechanics` list.

The level-design validator checks required identity fields, meaningful multi-zone structure, target play-time metadata, declared mechanic use, zone coverage, repeated zone roles/mechanic combinations, question distribution, prototype-scale layouts, and mechanic mix.

It also produces a **geometry/gameplay fingerprint** and exposes `LevelDesignValidator.similarity(a,b)`. Before promotion, compare a candidate fingerprint with existing games. High similarity triggers human review rather than automatic rejection.

### Geometry-only diversity test
Before publishing, ignore theme/art and ask: **Would this level still feel recognizably different from our other games if every surface were gray boxes and lines?** If not, redesign the route or mechanic emphasis before polishing the art.

### Length rule
Do not make levels longer by stretching empty horizontal distance. Long-form levels gain time through additional gameplay zones, vertical travel, alternate traversal, mechanic-specific set pieces, and well-spaced review moments. A normal production target is roughly **6–10 minutes for a first classroom play**, unless the concept intentionally calls for something different.


## V1.2.0 production release

First production game: **Slope Street Sprint**.

Production validation includes true slope traversal and flat/slope seams, world-anchored rendering, stompable and non-stompable enemies, breakables, bounce surfaces, climbables, difficulty presets, randomized questions and choices, keyboard/touch input, gameplay QA, visual QA, and Level Identity QA.

Existing V1.1 games remain on V1.1 intentionally. Engine generations may coexist to preserve gameplay variety and avoid unnecessary migrations.
