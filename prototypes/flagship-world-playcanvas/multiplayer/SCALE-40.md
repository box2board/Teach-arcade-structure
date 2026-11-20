# Isolated 40-client load check — November 8, 2026

**Passed in two independent five-minute runs.** The playable Railway preview
remains capped at 20. There were no application, production, or deployment
changes in this pass.

The test launches a disposable server in a separate process on an ephemeral
loopback port. It uses the existing authoritative WorldRoom and WebSocket
transport, with a 40-seat override only in the test room subclass. The script
is not included in the Railway image and accepts no external target endpoint.
Both the load generator and its server run on the same machine in each run.

Run `node scale-40-test.mjs` from this directory after `npm ci --omit=dev`.
Use `WORLD_TEST_SECONDS=30` for a short smoke check. The branch-scoped GitHub
workflow reruns the five-minute test on changes to the test or workflow itself.

## Results

GitHub Actions: https://github.com/box2board/Teach-arcade-structure/actions/runs/42549047134
Job 128940281712; test commit a42ded4f536a934716aeca2f6d6482ca8274a32f.

Each run put 40 SDK clients into one room and rejected a 41st seat. Nine shared
placements and deletions reached every client, and a nearby non-owner was denied
each time. Four deliberate disconnects rejoined with the same player identity
while the others continued sending inputs. Final checks verified finite player
positions, connected presence, acknowledgement drain and player removal on leave.

| Measurement | Local | GitHub runner |
|---|---:|---:|
| Sustained seconds | 300 | 300 |
| Movement inputs sent | 360,587 | 361,309 |
| Inputs per client per second | 30.05 | 30.11 |
| Observed server ticks per second | 30.18 | 30.08 |
| Maximum simulation callback elapsed time | 2.91 ms | 1.03 ms |
| Maximum server patch generation gap | 52.07 ms | 54.62 ms |
| Client update interval p95 / max | 51.23 / 92.15 ms | 51.43 / 58.77 ms |
| Input acknowledgement p95 / max | 63.67 / 91.63 ms | 120.75 / 138.08 ms |
| Maximum server queue depth | 2 | 3 |
| Coalesced old inputs | 0 | 276 |
| Longest reconnect plus presence check | 56.87 ms | 59.08 ms |

Acknowledgement timing includes queuing, simulation, patch generation and
receipt; a later acknowledged sequence can cover a coalesced older input.
These loopback times must not be compared directly with student-device Internet
latency or used as a classroom readiness claim. The test uses one build piece
at a time and does not stress a densely constructed room.

The preceding 20-player Chromebook check completed with 294 sampled seconds,
60 FPS average and 18 ms p95 frame time at standard quality. Its 749 ms natural
update gap triggered one recovery; two injected pauses were tracked separately.
The tester confirmed the 19 bots disappeared at test completion as intended.

Next: exercise 40 clients over a real network path in a separate test environment,
including at least one rendered Chromebook and a denser set of builds. Keep the
shared preview at 20 until that evidence is reviewed. The 64-client stress
target is a later milestone.
