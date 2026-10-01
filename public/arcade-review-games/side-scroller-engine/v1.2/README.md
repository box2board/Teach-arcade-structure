# Teach Arcade Side-Scroller Engine V1.2 Candidate

Version: **1.2.0-alpha.1**  
Status: **Candidate — do not migrate production games yet**

V1.2 evolves the side-scroller from a reusable rectangular-platform engine into a mechanic-capable platformer foundation.

## New candidate mechanics

### True sloped terrain
Levels may define `slopes` with `x1, y1, x2, y2`.
- Player feet follow the interpolated surface instead of a rectangular approximation.
- Flat-to-slope and slope-to-flat transitions are supported.
- Downhill grade adds modest momentum; uphill travel resists it naturally.
- Ground-patrol movers can follow supported slope surfaces.
- Gameplay and visual QA validate slope length, bounds, and excessive grade.

### Enemy interaction types
Movers may define `interaction`.
- `stompable`: landing from above eliminates the enemy, awards score, and bounces the player upward.
- `hazard`: contact from any direction respawns the player.
- `bounce`: retained for spring/bounce objects.
- A stompable enemy is still dangerous from the side.

This is intentionally data-driven so each game can choose which enemies can be defeated.

## Compatibility
V1.1 remains the stable production engine. V1.2 is isolated in its own directory and should be tested in the mechanics playground before any existing game migrates.

## Next mechanic-library candidates
Pits and rectangular platforms remain available. Future opt-in mechanics can include climbables, breakables, conveyors, switches/doors, water, vehicles, and other game-specific systems without forcing every game to use the same level formula.
