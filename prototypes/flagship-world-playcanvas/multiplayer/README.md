# Real multiplayer review milestone

Isolated prototype, not a production classroom service. Original `../index.html`, `../main.js`, standalone preview, and Scale Contract are preserved.

## Run

Node 20+:

```sh
cd prototypes/flagship-world-playcanvas/multiplayer
npm ci
npm test
npm start
```

Open `http://localhost:2567/`. The URL gains an unguessable `world` code. Copy the **complete URL** into a second browser. For another device, serve this Node process through a WebSocket-capable HTTPS host and share that host's full room URL. The frontend and Colyseus room use the same origin. `PORT` is configurable. This cannot run as a static Vercel deployment or ordinary Vercel Function.

## Review

1. Open the same full room URL in two independent browsers; verify two connections.
2. Move with WASD, sprint with Shift, jump with Space. Remote avatars are blue; local is gold. Move in both directions and compare motion.
3. Walk toward the gridded construction pad at x=20,z=-20. B enables building; E places; R rotates; Q/F changes level. Touch controls are retained.
4. Place a piece in A; see it in B. B cannot delete A's piece. A can delete it when nearby.
5. Reload A within 20 seconds. Its session identity and ownership should survive. Interrupt networking temporarily, then restore it. Unexpected drops hide the avatar until reconnect; expired reservations remove player state. Closing a tab may retain its seat for up to 20 seconds.
6. Test with up to eight clients. FPS, connection count, ping, and measured room tick rate are visible. Do not proceed to 20/40/64 yet.

## Authority and prediction

Colyseus 0.16, Schema 3, 30 Hz fixed simulation and 20 Hz schema patches. Browsers send bounded, sequential inputs, never authoritative transforms. Server limits its input queue and consumes at most one input per tick; malformed directions, duplicate/out-of-order inputs, and oversized messages are rejected. The client predicts with the shared physics module, discards acknowledged inputs, replays outstanding inputs, and smooths visual corrections. Remote avatars use a 100 ms interpolation buffer, shortest-path yaw, and no unbounded extrapolation. Animation state is a hook on each remote entity.

Shared builds are server-created, capped at 250, snapped to the pad, range checked, overlap checked, and rate limited. Server assigns ID, owner session, class/world/group/mission metadata. Group/mission IDs are placeholders; group editing is disabled. Deletion requires owner identity and proximity. Reconnect preserves owner identity within the reservation window.

## Verification and limits

`npm test` runs eight actual WebSocket SDK clients and checks bidirectional movement, invalid-input rejection, authoritative placement/ownership, unauthorized deletion, valid deletion, invalid placement, reconnect identity, leave cleanup, and separate-world isolation. These are network clients, not eight rendered browsers. Visual smoothness, device FPS, and real browser reconnect behavior still require the review above.

Class instances are isolated by a high-entropy URL code, which acts as a bearer invitation. Teacher authentication/rosters are not implemented. Builds live in room memory only; room disposal/server restart clears them. No local saved builds are imported or overwritten. No Supabase. No production release. No 40-player performance claim.

The external playable review gate remains pending until the Node/WebSocket process is hosted at a reachable HTTPS endpoint and tested with two real browsers.
