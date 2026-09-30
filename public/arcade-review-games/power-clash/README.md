# Power Clash Fighter Engine (Prototype)

Power Clash is a reusable, browser-based classroom review fighter prototype. This first slice is local two-player play on one keyboard; it does not implement classroom room codes or online multiplayer.

## Current play loop

1. Choose a topic pack.
2. Players alternate answering ten multiple-choice questions. A correct answer earns 20 juice.
3. Fight in the arena. Walking and jumping are free; punches, kicks, and dashes consume juice.
4. When a player runs out, the match pauses for that player to answer a recharge question. A correct answer restores 25 juice. A missed answer gives feedback and another question; the other player cannot attack during the recharge.
5. Reduce the opponent's health to zero to win.

## Reuse the engine for another topic

Add a topic object to `content/topics.js` with an `id`, `title`, `shortTitle`, arena colors, and question records in the same format as the WWI pack. The engine reads the selected pack and does not contain topic-specific question logic. Future work can move packs into individual files once the collection grows.

## Controls

- Player 1: A/D move, W jump, F punch, G kick, Q dash
- Player 2: Left/Right move, Up jump, / punch, . kick, Shift dash

## Next prototype checks

- Tune energy earned and spent so answering remains central without stopping the fight too often.
- Test the arena feel and whether both players can control the fighters comfortably on a shared keyboard.
- Add a computer opponent and topic-specific visual packs only after the core loop feels fun.
- Treat separate-device classroom rooms as a later shared-platform capability.
