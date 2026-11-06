# Delayed update recovery at 20 players — November 6, 2026

Runtime commit: 734b13e0a6b82878385d476f84b7e8e1eb1271ba.
Railway review deployment 51382749-e244-4fc6-8d4e-a19db0da11e1 reached SUCCESS.
Capacity remains 20. Original prototype and Scale Contract remain preserved.
No main merge, production deployment or Supabase changes.

## Implemented

- Input gating now happens before allocating sequence numbers or consuming the
  jump buffer. Previously, a full prediction window still incremented sequence
  numbers every frame, potentially exceeding the server's allowed sequence gap.
- Initial-state waiting and stale-state waiting stop prediction input. After
  500 ms without state, position is held and the HUD indicates delayed updates.
- When state resumes after a gap, pending prediction is rebased to authority,
  the accumulated input time is cleared, and old remote interpolation samples
  are discarded. Compressed catch-up snapshots are coalesced. Remote avatars
  blend toward the new position over a short recovery window instead of
  fast-forwarding through old snapshots. No unbounded extrapolation is used.
- FPS HUD now includes p95 frame time over the latest 120 rendered frames.
- Server patches carry a monotonic generation timestamp from onBeforePatch,
  plus the room's maximum patch-generation callback gap. Client arrival intervals
  can be compared with generation intervals without synchronizing wall clocks.
- The HUD exposes stale-state recovery count and maximum delivery excess.
  The load harness retains the ten worst arrival-gap traces with paired source
  intervals. Excess includes encoding, transport and client processing; it is
  not a pure network-latency measurement or proof of a particular root cause.

## Verification

Deterministic recovery tests passed starvation holding, normal interpolation,
shortest-angle rotation, stale-history reset, compressed burst coalescing,
bounded convergence, full-window sequence gating and fresh-state resumption.
The prior performance-focused tests, eight-client regression and a local
30-second 20-client network check also passed. Syntax and whitespace checks passed.

Hosted CI run completed successfully:
https://github.com/box2board/Teach-arcade-structure/actions/runs/42248519928
Job 127997012883; five-minute workload; 20 clients; 180,502 movement inputs;
30.08 inputs/client/second. Nine concurrent build/delete/permission cycles and
four concurrent reconnects passed, along with final acknowledgement drain,
connected presence, finite positions, shared building, reconnect identity and
leave cleanup.

| Hosted measurement | Result |
|---|---:|
| Median observed tick progression | 29.96 Hz |
| Maximum simulation callback-start gap | 45.61 ms |
| Maximum simulation callback elapsed time | 2.67 ms |
| Maximum server patch-generation gap | 59.72 ms |
| Largest client patch-arrival gap | 1252.69 ms |
| Generation interval for that arrival gap | 50.25 ms |
| Excess interval for that arrival gap | 1202.43 ms |
| Median / p95 ping | 88.25 / 101.15 ms |
| Median / p95 input acknowledgement | 132.07 / 161.64 ms |
| Median / p95 patch-arrival gap | 50.09 / 51.30 ms |
| Runner maximum event-loop delay | 24.02 ms |
| Maximum server command queue depth | 3 |
| Coalesced stale commands | 85 |
| Final reconnect plus observed presence | 639 ms |

The longest observed gaps occurred after patch generation. Normal simulation and
patch-generation scheduling were maintained in this run; these measurements do
not distinguish encoder, WebSocket buffering, network path, or decoder pauses.
Median acknowledgements by minute were 134, 132, 133, 128 and 134 ms, without a
steady backlog-growth trend. Comparison with older runs is not a controlled
latency benchmark because client network paths and server regions have varied.

## Remaining review limits

The SDK load harness exercises real networking and shared-world behavior but
does not render PlayCanvas or execute its full browser input/render loop.
Recovery helpers are tested separately with simulated delayed/burst snapshots;
their visual integration still needs rendered review on a WebGL-capable device.
The cloud browser was checked once and reported WebGL not supported. Actual
Chromebook FPS, frame pacing and visual smoothness therefore remain unverified.
The underlying delivery stalls are not eliminated. Capacity stays at 20 until
the rendered/device review and remaining delivery-path investigation are accepted.
