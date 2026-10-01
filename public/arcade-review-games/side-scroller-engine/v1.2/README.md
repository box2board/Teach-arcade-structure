# Teach Arcade Side-Scroller Engine V1.2 Candidate

Version: **1.2.0-alpha.2**  
Status: **Candidate — do not migrate production games yet**

V1.2 is becoming a mechanic library rather than a single platforming formula. V1.1 remains the stable engine for approved games.

## Candidate mechanic library

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
