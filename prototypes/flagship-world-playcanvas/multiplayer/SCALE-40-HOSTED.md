# Hosted 40-client review — November 9, 2026

**Hosted protocol test passed. Chromebook rendering is pending.**

The dedicated Railway review service ran commit `93f40b729f871cfb97303108b2b06dd6bb3a13a2`. A GitHub Actions runner connected 40 Colyseus SDK clients through the public TLS WebSocket endpoint. All 40 shared one authoritative room seeded with 48 build pieces. The 41st seat was rejected. The original 20-player preview stayed on its existing deployment.

[GitHub Actions evidence](https://github.com/box2board/Teach-arcade-structure/actions/runs/42550290455/job/128944118711) · [Loopback baseline](SCALE-40.md)

| Measurement | Hosted result |
|---|---:|
| Sustained seconds | 300 |
| Movement inputs sent | 361,330 |
| Observed simulation rate | 29.96 Hz |
| App ping median / p95 | 160.27 / 174.17 ms |
| Movement acknowledgement p95 / max | 287.9 / 1282.08 ms |
| Client update interval p95 / max | 52.69 / 1066.75 ms |
| Maximum server patch generation interval | 82.45 ms |
| Maximum simulation callback elapsed time | 10.40 ms |
| Maximum input queue depth / coalesced inputs | 3 / 2,507 |
| Deliberate reconnects / longest reconnect and presence check | 4 / 976.43 ms |

All clients saw all nine placements and owner deletions. A nearby non-owner was denied each time. Four deliberate reconnects kept the same identity; no unexpected disconnects were recorded. Final checks verified acknowledgement drain, finite positions and leave cleanup.

The longest observed client update gap was 1066.75 ms between updates generated 49.63 ms apart. The five largest recorded gaps showed a similar pattern. The delay accrued between generation and client receipt; the evidence does not isolate which stage introduced it. This makes the browser recovery check valuable even though the hosted simulation held about 30 Hz.

## Private device check

The isolated device room uses the same 48-piece layout. One browser connects through Railway and renders 39 moving SDK bots; the bots connect locally inside the preview server. Keep the browser visible for the full five minutes. Move near the structures, simulate one short pause, then copy the report at completion. Track FPS, frame time, natural update gaps and recoveries. Bots leaving when the test completes is expected. The invite is shared separately.

The SDK test and device check cover different things. Neither establishes the experience of 40 independent student devices on classroom Wi-Fi. Review the Chromebook results before increasing the shared preview cap or starting the 64-client stress test.

## Repeat the hosted test

Keep the hosted service isolated and pin it to the desired test commit. Set `WORLD_SCALE_NETWORK_UNTIL` to a short future Unix epoch timestamp in milliseconds. Run `WORLD_SCALE_TEST_ENDPOINT=wss://<review-host> node scale-40-test.mjs` from an external runner. For CI, use a qualifying push to the prototype branch with `[hosted-scale-40]` in the head commit message. Set the window to `0` after the test. The device room remains invite-only.
