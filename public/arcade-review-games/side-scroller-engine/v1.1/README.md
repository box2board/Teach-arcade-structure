# Teach Arcade Side-Scroller Engine V1.1

Version: **1.1.0**  
Status: **Candidate — regression testing before production promotion**

V1.1 is based on the stable V1.0.4 production engine and keeps game-package contract 1.

## New in V1.1

### Per-run curriculum randomization
- The game uses the same supplied question set once per run.
- Question order is shuffled when the engine is created.
- Each question's answer choices are independently shuffled.
- The engine remaps `correctIndex` after shuffling, so game authors can write questions without manually rotating A/B/C/D.
- Reload / Play Again creates a new run and a new shuffle.

### Difficulty modes
The shared shell asks the player to choose a difficulty before gameplay starts.

- **Easy:** standard hazard speed, all physical checkpoints, correct-answer gameplay bonuses.
- **Medium:** moving hazards/enemies are 15% faster, every other physical checkpoint is disabled, correct-answer gameplay bonuses remain.
- **Hard:** moving hazards/enemies are 30% faster, all physical checkpoints are disabled, and correct answers do not award gameplay bonuses such as speed boosts, hazard removal, mover removal, or question-created checkpoints.
- Correct answers still count toward accuracy and award the normal question score on every difficulty.
- Player movement/jump physics do not become less forgiving on harder modes.

## V1.0 features retained
- Fixed-timestep movement and collision.
- Coyote time, jump buffering and variable jump.
- Smooth dead-zone camera with damped look-ahead.
- Questions/results centered in viewport.
- Up/Down + Enter keyboard question answering.
- Checkpoints, hazards, movers, moving platforms, gates, collectibles and scoring.
- Gameplay and visual validators, including checkpoint obstruction QA from V1.0.4.

## Rollout rule
Test V1.1 first on a candidate game. Do not migrate the existing production Moon, Egypt, or WWI games until regression playtesting confirms randomization, answer remapping, all three difficulty modes, checkpoints, rewards, questions and finish behavior.
