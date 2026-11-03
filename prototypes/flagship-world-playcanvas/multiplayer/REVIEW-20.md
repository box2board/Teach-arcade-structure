# 20-client review — November 3, 2026

Status: local network checks passed; hosted 20-client load remains unverified.
Do not advance to 40/64 on these results.

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

## Next gate

Complete the 60-second hosted network run from a reliable network path, investigate
large synchronization gaps, and sample rendered FPS on an actual Chromebook.
No new two-device setup is required from the user: that earlier functional gate
has already been confirmed. No main merge, production deployment, Supabase
persistence, or capacity above 20 is included.
