# Performance pass at 20 players — November 4, 2026

Capacity stays at 20 on the isolated review service. No main merge or production deployment.

## Changes

- Movement queues retain three commands instead of twelve: roughly 100 ms rather
  than 400 ms of simulation work at 30 Hz. Older movement commands are coalesced
  under bursts, with a buffered jump preserved. Only one command is simulated per
  tick; sending bursts cannot increase the simulation's movement budget.
- Existing sequence acknowledgements let prediction discard coalesced commands.
  Bursts may cause position reconciliation; rendered smoothness still needs review.
- Server simulation takes one build snapshot per tick for all players, rather
  than repeatedly allocating obstacle arrays in collision checks.
- Physics snapshots one-shot iterators once before scanning both axes. Previously
  scanning X could exhaust the iterator before checking Z, including prediction.
- World state exposes maximum tick gap, simulation callback elapsed time, queue
  depth and coalesced-command count. These are room-lifetime maxima/counters.

Deployed runtime commit: 5f0fb7d45f73d00d0e73cf0e8e229115c066527b.
Railway deployment 07788188-502f-4139-97de-a0e77975d0e2 reached SUCCESS.
The current deployment is in iad; earlier preview deployments were in sfo.
Ping comparisons across those runs are not a controlled code benchmark.

## Verification completed

- Focused tests passed: twelve-command burst becomes latest three, buffered jump
  survives once, one simulation step cannot consume a burst as extra movement,
  and iterator/array collisions produce the same result on both axes.
- Eight-client regression passed movement, validation, building/ownership,
  reconnect identity, leave cleanup and world isolation.
- Short local 20-client test passed after correcting a harness assertion that
  wrongly required the queue to reach exactly three rather than stay at or below it.
- Full local five-minute test passed nine build/delete/permission cycles and
  four reconnects during movement, plus final acknowledgement/presence/building/
  reconnect/leave checks. It sent 165,144 movement inputs (27.49/client/second).

Local five-minute measurements:

| Metric | Result |
|---|---:|
| Median observed server tick progression | 29.88 Hz |
| Input acknowledgement median / p95 / maximum | 73.83 / 100.50 / 1611.89 ms |
| Patch gap median / p95 / maximum | 50.16 / 53.70 / 1583.99 ms |
| Runner event-loop delay p95 / maximum | 21.36 / 1539.31 ms |
| Server maximum callback-start gap | 1549.03 ms |
| Server maximum simulation callback elapsed time | 430.52 ms |
| Maximum server queue depth | 2 |
| Coalesced inputs | 0 |
| Final reconnect plus observed presence | 85 ms |

The local process hosts both server and clients. Scheduling pauses affect both,
and even elapsed callback timing includes OS preemption. These results do not
prove that the callback itself consumed 430 ms of CPU. The local workload did
not trigger coalescing; burst behavior is covered by the focused test. No claim
of improved hosted latency is made from local results.

## Hosted comparison pending

Latest hosted test: https://github.com/box2board/Teach-arcade-structure/actions/runs/41863528593
GitHub reported the job queued, with no steps executed, at the end of this pass.
Both ubuntu-latest and the alternate ubuntu-24.04 runner were tried; no settings
or account changes were made to force scheduling. The workflow runs only the
latest review and waits for performanceVersion queue3-v1 before starting load.
Harness/readiness changes remain on the prototype branch; the runtime is pinned.

The earlier five-minute hosted result remains the baseline in REVIEW-20-SOAK.md.
Do not describe >1-second stalls as resolved, raise capacity to 40, or claim
Chromebook FPS based on this pass. Finish the hosted comparison and inspect its
server timing/queue diagnostics, then perform rendered device testing.
