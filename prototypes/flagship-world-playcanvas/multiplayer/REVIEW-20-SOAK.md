# Five-minute hosted 20-client test — November 4, 2026

Functional result: PASS. Performance gate: still open; remain capped at 20.

Evidence: https://github.com/box2board/Teach-arcade-structure/actions/runs/41846109535
Job: 126629915099. Test commit: cd8522a9c684b7ea219bdb72ab895fe7d7152d01.
The test ran against the existing isolated Railway preview; no runtime change,
main merge, production deployment or capacity increase was needed.

Twenty SDK network clients joined one room and sent 180,555 movement inputs
over 300 seconds, averaging 30.09 inputs/client/second. While movement continued:

- Nine placements reached all 20 clients, followed by nine owner deletions.
- Nine attempted deletions by another player were rejected.
- Four deliberate network drops reconnected with the same player identity,
  while the remaining 19 clients continued moving.

The final post-load checks also passed movement acknowledgement drain, finite
positions and connected presence on all clients, another reconnect with identity
preserved, shared placement/deletion and consented-leave cleanup. No unexpected
disconnect assertion failed. Final reconnect plus observed presence took 924 ms.

| Measurement | Median | p95 | Maximum |
|---|---:|---:|---:|
| Observed tick progression | 29.97 Hz | 30.97 Hz | 62.74 Hz |
| Round-trip ping | 153.51 ms | 167.30 ms | 666.22 ms |
| Input acknowledgement | 208.27 ms | 451.60 ms | 1349.69 ms |
| State patch arrival gap | 50.09 ms | 51.25 ms | 1172.49 ms |
| Runner event-loop delay | — | 21.12 ms | 70.84 ms |

Observed tick progression measures ticks between client receipts, not server
callback timing. Values above 30 can reflect delivery catch-up. It is not evidence
that the simulation ran faster than its configured 30 Hz.

| Minute | Median ack | p95 ack | Median outstanding inputs | p95 outstanding inputs |
|---|---:|---:|---:|---:|
| 1 | 205.22 ms | 233.78 ms | 6 | 7 |
| 2 | 201.80 ms | 486.19 ms | 6 | 14 |
| 3 | 210.24 ms | 443.92 ms | 6 | 13 |
| 4 | 223.24 ms | 496.13 ms | 7 | 15 |
| 5 | 211.07 ms | 407.50 ms | 6 | 12 |

Outstanding inputs include network transit, server processing and state-patch
delivery, not just the server queue. The last bucket includes post-load drain
and final reconnect checks. Typical backlog did not grow steadily across this
run, but transient backlog and stalls remain. The runner's maximum scheduling
delay is much smaller than the longest patch gap; aggregate data cannot isolate
the remaining cause between server pauses and network delivery. No speculative
movement rewrite was made based on these measurements.

The sampled Railway resource window during the run peaked at 0.0411 GB memory
and CPU_USAGE 0.0781. These one-hour coarse samples include idle periods and
are not a precise test-only CPU benchmark.

## Limits and next work

This is a reproducible hosted network test, not a rendered-client benchmark.
Actual Chromebook FPS, frame pacing and visual interpolation remain unmeasured.
Before expanding to 40, instrument server callback delays and queue depth,
correlate them with client patch gaps, and investigate the >1-second outliers.
Classroom Wi-Fi and actual device testing remain required for classroom-readiness
claims. Existing two-browser functional approval is preserved.

The CI workflow now runs the five-minute workload when its branch-scoped workflow
or load harness changes. It has read-only repository permissions, an eight-minute
job limit and seven-day artifact retention. The summary here remains in git after
artifact expiration. No schedules or production deployment steps were added.
