# Power Clash Fighter Engine (Prototype)

Power Clash is a reusable, browser-based classroom review fighter prototype. It supports one player against a computer opponent or two players on one keyboard; it does not implement classroom room codes or online multiplayer.

## Current play loop

1. Choose a topic pack and one-player or local two-player mode.
2. In one-player mode, the student answers ten multiple-choice questions to earn juice before fighting the CPU. In two-player mode, each player answers a separate set of ten questions. Each correct answer earns that player 10 juice.
3. Fight in the arena. Movement, jumps, punches, kicks, and dashes consume juice. The CPU has its own energy meter and automatically recovers energy when depleted.
4. When a player runs out, the match pauses for that player to answer a recharge question. A correct answer restores 25 juice. A missed answer gives feedback and another question; the other player cannot attack during the recharge.
5. Reduce the opponent's health to zero to win.

## Reuse the engine for another topic

Add a topic object to `content/topics.js` with an `id`, `title`, `shortTitle`, arena colors, and at least 20 question records in the same format as the WWI pack. The opening round draws ten different questions for each player without repeating questions between them. The engine reads the selected pack and does not contain topic-specific question logic. Future work can move packs into individual files once the collection grows.

## Controls

- Player 1: A/D move, W jump, F punch, G kick, Q dash
- Player 2: Left/Right move, Up jump, / punch, . kick, Shift dash

## Juice costs

- Movement: 0.75 juice per second while moving
- Jump: 2 juice
- Punch: 4 juice
- Kick: 8 juice
- Dash: 3 juice
- Correct opening-round answer: +10 juice
- Correct recharge answer: +25 juice

## Next prototype checks

- Tune CPU difficulty and energy earned/spent so answering remains central without stopping the fight too often.
- Test the arena feel and whether both players can control the fighters comfortably on a shared keyboard.
- Add a computer opponent and topic-specific visual packs only after the core loop feels fun.
- Treat separate-device classroom rooms as a later shared-platform capability.
