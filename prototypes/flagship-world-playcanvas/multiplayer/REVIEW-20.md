# 20-client review — November 3, 2026

Status: local and hosted 20-client functional network checks passed.
Device FPS and timing-spike investigation remain open. Do not advance to 40/64 yet.

## Changes

- Server defaults to eight; only `WORLD_MAX_CLIENTS=20` enables 20.
- Capacity is synchronized into the HUD and exposed by `/health`.
- Added bounded network load harness, unique disposable world, all-client
  state/acknowledgement checks, reconnect during movement, shared building,
  owner-only deletion, leave cleanup, latency and tick diagnostics.
- Original PlayCanvas prototype, local build saves and Scale Contract preserved.

## Verification

The original eight-client regression passed movement, invalid input rejection,
building permissions, reconnect identity, leave cleanup and room isolation.

The latest local test passed all 20-client assertions over 30 seconds of
sustained movement, followed by reconnect and shared-building checks.

| Measurement | Result |
|---|---:|
| Sustained inputs | 17,560 |
| Actual inputs/client/second | 29.27 |
| Median server tick progression | 29.88 Hz |
| Fifth percentile tick progression | 27.53 Hz |
| Median / p95 round-trip latency | 1.73 / 10.49 ms |
| Median / p95 input acknowledgement | 79.26 / 98.39 ms |
| Median / p95 patch gap | 50.21 / 52.92 ms |
| Longest observed patch gap | 692.62 ms |
| Test-runner event-loop delay p95 / max | 21.28 / 515.90 ms |
| Reconnect plus observed presence | 60 ms |

This shares one machine between clients and server. Spikes cannot be assigned
to server or network from this run; they are not evidence of classroom readiness.
Acknowledgement latency includes simulation, batching, network and runner delays.

Railway review deployment `2c5335e1-50ed-498c-9f72-dac9ddfc8e33` reached SUCCESS
at commit `0e1b41372d0d7fbda7f4ed49c7c0ba4fd538fe53`.
The public health endpoint returned tickHz 30, patchHz 20 and maxClients 20.
Two hosted load attempts stopped during matchmaking with the workspace outbound
proxy error `Connection to establish proxy tunnel timed out after 5000ms`.
Neither completed the 20-client hosted movement test. Do not attribute that
failure to Railway server capacity. The service remains pinned to this reviewed
runtime commit; later harness/report changes need no runtime redeployment.

## Hosted run completed

GitHub Actions run 41656342899 completed successfully on November 3, 2026.
Evidence: https://github.com/box2board/Teach-arcade-structure/actions/runs/41656342899
The independent GitHub runner avoids the workspace proxy failure described above.
The first CI run caught a harness race reading the players map before initial
state arrived; waiting for initial state fixed it, including after reconnect.

| Hosted measurement | Result |
|---|---:|
| Connected network clients in one room | 20 |
| Sustained movement duration | 60 seconds |
| Sustained inputs | 36,080 |
| Inputs/client/second | 30.07 |
| Median / fifth percentile server tick progression | 29.91 / 29.47 Hz |
| Median / p95 ping | 74.03 / 78.76 ms |
| Median / p95 input acknowledgement | 206.04 / 343.18 ms |
| Maximum acknowledgement delay | 703.88 ms |
| Median / p95 patch gap | 50.14 / 52.43 ms |
| Maximum patch gap | 420.43 ms |
| Runner event-loop delay p95 / max | 21.17 / 22.22 ms |
| Reconnect plus observed presence | 425 ms |

All clients observed 20 connected players and valid positions, with no unexpected
disconnect or unacknowledged inputs after draining. Reconnect preserved identity
while 19 clients kept moving. Shared placement and owner deletion reached all 20;
another player's deletion was rejected. Building checks ran after sustained movement
with all 20 still connected; concurrent building stress is not established.

Railway's one-hour sampled resource window reported peak CPU_USAGE 0.0691
and memory 0.0323 GB. This includes idle time and is not a per-test CPU benchmark.
The much smaller CI event-loop delays suggest the largest previous local stalls
were influenced by the workspace runner. Hosted 420–704 ms outliers remain;
we cannot assign their cause from these aggregate measurements alone.

The browser FPS counter now uses actual frame elapsed time, rather than the
50 ms animation clamp that could hide stalls. Animation still uses its existing
clamp. Runtime preview update is pinned to commit
`1c4bba61ba5ace8241963037612f721ed2829536`; report-only commits do not redeploy it.

## Next gate

Investigate acknowledgement backlog and worst synchronization gaps in a longer
hosted run, exercise building during sustained movement, and sample rendered FPS
on an actual Chromebook. A network-client test does not validate graphics or
visual interpolation on classroom hardware.
No new two-device setup is required from the user: that earlier functional gate
has already been confirmed. No main merge, production deployment, Supabase
persistence, or capacity above 20 is included.
