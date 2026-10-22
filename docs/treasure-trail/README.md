# Treasure Trail engine v1

Treasure Trail is a solo Review Lab engine built from the approved woodland experiment. It uses the shared topic catalog, not an embedded curriculum. The original experiment remains intact. This version is preview-only until reviewed.

## Current experience

Choose one of the shared review topics, a 2-, 5-, or 10-minute session, and an explorer color. Traverse a compact woodland with free eight-direction movement, three question chests, and 19 irregular digging patches. Trees and rocks block movement at their bases; foliage is drawn in depth order. Keyboard and touch controls use the same commands.

Each chest offers five distinct multiple-choice questions. The deck and choices shuffle using the shared question-deck utility. Every correct answer immediately grants 12 juice. The timer continues during review. Completed chests relocate to an unoccupied spawn point. Question decks recycle indefinitely.

Each dig costs 4 juice and has a 650 ms action cooldown. A patch regrows in 6.5 seconds. Normal rolls: amethyst 30%, emerald 17%, ruby 9.5%, diamond 3.5%, empty 40%. After two empty digs, another empty roll yields amethyst, so there can be no more than two consecutive empty digs. Jewels grant 10, 20, 40, or 100 treasure value. There is no finite treasure supply.

Solo players can pause explicitly or by leaving the tab. Results include treasure value, number and types of jewels, accuracy, review attempts, missed-question feedback, replay, topic change, and a JSON download. Results are local to the session; there is no account reporting yet.

## Boundaries

- `world.js`: terrain, stable patch IDs, chest spawn points, scenery.
- `engine.js`: session state, player stats, validated gameplay commands, seeded question/reward randomness, action events, ranking, JSON-safe world snapshot.
- `renderer.js`: approved canvas artwork and animations. Effects never decide rewards.
- `game.js`: topic loading, solo clock, input adapter, questions, dialogs, feedback, reports.
- `styles.css` / `index.html`: responsive shell and accessible DOM controls.
- Shared `catalog.js`, `question-decks.js`, and `topic-picker.js`: discovery and normalized question banks. Future catalog additions are automatically available through `supportsQuestionBank`.

## Multiplayer extension contract

Multiplayer is not implemented in this version. `players` is keyed by stable player ID; commands carry a player ID; world objects have stable IDs; events have monotonic sequences; snapshots omit questions, correct answers, and RNG state. Ranking sorts by total treasure value, then jewel count, then correct answers, then player ID for deterministic ordering.

The future room service must own the clock, RNG, question selection, answer verification, juice, rewards, cooldowns, and dig/chest claims. Clients send input and display snapshots/events; clients must never submit trusted reward totals. Add authenticated room membership, request IDs for deduplication, sequence acknowledgments, reconnect/resync, rate limiting, and server validation of proximity and movement against elapsed time. The local `getSession` debug interface is not a security boundary and must not be used as server authority.

This solo implementation has one active quiz per session. Before network play, move quiz/deck state to each player, prevent duplicate simultaneous chest/patch claims, and define whether chests and dig spots are shared or personal. Do not reuse the global solo pause in competitive rooms. Room duration and topic are set by the host and locked for students.

Recommended first multiplayer release: one shared room/map, individually earned juice, shared dig spots, a server-owned session timer, live treasure-value leaderboard, and individual academic reports. Decide room capacity and chest contention through playtesting before launch.

## Verification

`node scripts/test-treasure-trail.mjs` checks shared-topic discovery, correct rewards, duplicate-answer rejection, distinct chest questions, relocation, regeneration, solo pause, expiration, snapshot separation, ranking, and WWI/math/science bank loading. Browser QA covers setup, topic loading, question rounds, pause after answering, keyboard movement, touch action, digging, expiration, and replay at desktop and iPad dimensions. It reports no JavaScript errors.
