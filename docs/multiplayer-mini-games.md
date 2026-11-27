# Multiplayer mini-game boundaries

Mini-games are reusable across modes. A game module owns its rules and client; a mode owns when a game starts and how its results affect that mode.

## Game module

The multiplayer engine registry in `lib/multiplayer/minigames.js` requires each server engine to implement `create`, `advance`, `input`, `snapshot`, `finished`, and `results`. Engines receive public player IDs and character IDs. Keep room tokens and host credentials in the room service, outside game snapshots. The browser client is loaded by `public/multiplayer/lib/minigame-host.js` only for its active round and must dispose its listeners and animation when unmounted.

When a solo version and multiplayer version use the same physical game, keep shared mechanics in a small game-owned core module. Each engine adapts its own state and input to that core. For Magnet Mayhem, `public/mini-games/games/magnet-mayhem/core.js` owns magnetic forces, ball motion, boundaries, gate placement and movement, and bumper collisions. The solo engine adds its combo and bonus scoring. The multiplayer engine adds the shared ball, player ticket ownership, snapshots, and server-authoritative timing.

## Mode policy

Midway owns the board, teams, rounds, and mini-game reward conversion. `public/multiplayer/mayhem/rewards.js` maps raw player results to Midway points. Keep those reward rules out of the shared game labels, engines, and clients. Arcade or another mode can call the same engine results and apply its own scoring policy without changing the mini-game.

Adding a mini-game should therefore require a server engine, a lazy browser client, a registry entry, and any mode-specific selection or reward configuration. Shared lobby, identity, character selection, reconnect, and transport remain platform responsibilities.
