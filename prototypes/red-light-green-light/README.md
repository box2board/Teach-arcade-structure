# Red Light, Green Light

Preview for Teach Arcade mini-game #21. Use the isolated prototype branch and a local Colyseus server. The source is alongside the library games; the public catalog stays at 20 until a later release.

## Launch and play

From the repository root with Node 20 or newer:

```sh
cd prototypes/red-light-green-light
npm ci
npm test
npm start
```

1. Open http://localhost:2567/ and choose **Host a round**. Add a nickname if desired.
2. Open another browser profile or a private window. Open the host's invite link, or enter its case-sensitive room code on the same start page. Enter a different nickname and choose **Join room**.
3. Choose the same Midway character on both devices to check the player-specific badge and nameplate colors. Select **Start round** in the host window.
4. Run using W/Up or touch ↑. A/S/D or the other arrows move across or back. Release all movement when the indicator says **RED · FREEZE**. Try holding W across a full red phase. Check that the other player can see the elimination and that the eliminated player can follow the race.
5. The host can start again from Results. Since switching tabs clears held movement, use two devices or have the second browser stationary when testing a held key. Other devices on a local network connect to the preview server's LAN address and port instead of localhost. For an internet-hosted test use a WebSocket-capable HTTPS review service.

A single host can start a solo practice race using the same server path. If using HTTP over a LAN, the browser may restrict clipboard access. The room code remains visible.

## Rules, observed timing and results

- The server owns the room clock, initial positions, movement, light changes, and results. It steps at 30 Hz and sends Colyseus state patches at 20 Hz. Clients send bounded directions, not positions or scored events. Client rendering smooths the latest authoritative poses.
- After a three-second countdown, the lights cycle. Default green lasts 1.7–4.2 seconds and red lasts 1.3–3.2 seconds. The green and red durations are independently drawn on the server. A round lasts 65 seconds by default and the host can select 45 or 90 seconds. The adapter accepts bounded `greenMin`, `greenMax`, `redMin`, `redMax`, and `durationMs` in milliseconds.
- The field freezes on red. Red starts with a 400 ms grace period. A fresh movement press after grace eliminates the player, even if they release immediately. A direction held through the transition is checked for 145 ms of sustained movement after grace. Red movement samples have to refer to this round and phase, include a server sample following grace, and reach the server within the freshness window. Expired inputs, stale prior-phase packets, and late packet bursts do not count as continuous input. This policy favors keeping a runner eligible if delivery gets too irregular to establish continuous input.
- Each eligible crossing earns a win. Same-tick crossings are ordered by estimated line-crossing fraction. In a multiplayer round, the final active, connected runner also wins. Red eliminations are handled as a group through the end of that red phase so two runners who both fail the same red can both be eliminated. If there are no finishers and everyone is eliminated, the round has no winner.
- At time expiry, existing win credits remain. If there is precisely one active, connected competitor in a multiplayer round, that runner receives the survivor win. Otherwise unfinished runners are ranked by forward progress, with shared places for equal progress and no win credit. Eliminated players and forfeits are listed without a placement. Solo practice requires a finish to win.
- Late arrivals watch and join the next round if there is room. An unexpected disconnect freezes the racer and reserves their seat for 12 seconds. Recovery restores the same player. Expiration or intentional leave forfeits that race. The host transfers to a connected player after their seat expires or they leave. The room and results live in memory.

## Reuse points

- `public/mini-games/games/red-light-green-light/` contains the player view, arena renderer and dependency-free `rules.js`. The preview shares the mini-game library's vendored Three.js.
- `Race` supports initialization with a character allowlist, `join`, `assign`, `connect`, `leave`, `start`, `command`, `step`, `snapshot` and `end`. The transport can dispose the round by discarding its instance. This preview runs continuously from countdown to results and does not expose pause.
- `registerRedLight(server, { capacity, characters })` registers a game-specific room on an existing Colyseus server. The preview reuses the Flagship branch's Colyseus/Schema/WebSocket stack, package versions, reconnect pattern and server/patch rates. The isolated launcher starts the room on its own process for local testing.
- The browser adapter `mountGame(root, { client, makeAvatar, avatars })` uses the preview page markup with an injected Colyseus client. It exposes current state and `dispose()` for embed cleanup. Arena renderer adapters return `{ root, labelHeight?, update(player, time, statusAge, reducedMotion), dispose? }`.
- `public/mini-games/shared/midway-characters/` contains the 20-entry Midway Mayhem catalog and original model and pose modules from the Desktop prototype's `dist/lib`. Their Three.js imports point at the existing identical vendor file. The race uses the original walking and celebration poses, combines each model's meshes into one skinned mesh, shares baked geometry for identical avatars, and adds an elimination tilt and player-specific badge and nameplate.
- Midway's Desktop room polls an HTTP/SQLite or D1 snapshot for turn-based board play. The Flagship WebSocket transport fits the race's frequent directional inputs and position updates. Universal lobby admission and launch wiring in the larger games are follow-on work.
- This branch does not add a production route, teacher-dashboard launch or persistent reporting. Room codes use the preview transport's room IDs. Use nicknames during isolated playtests.

## Test commands

```sh
npm test
npm run test:network
RLGL_TEST_CLIENTS=8 npm run test:network
RLGL_TEST_CLIENTS=40 npm run test:network
```

The rules suite covers solo play, stale and malformed movement, freeze timing, a full 40-racer simulation, all-out and last-runner outcomes, finish ordering, time limits, duplicate colors, disconnection and late join. A separate test covers all 20 animated Midway models, duplicate geometry, and cleanup. The WebSocket harness checks real SDK connections, host authority, replication, duplicate roster entries, reconnection, simultaneous red elimination and rematch. It does not measure rendered FPS, real devices or classroom Wi-Fi.
