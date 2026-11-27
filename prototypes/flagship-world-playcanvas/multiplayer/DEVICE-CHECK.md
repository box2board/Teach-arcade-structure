# Chromebook device check

An invite-only review room runs one human client and 19 moving SDK clients.
The SDK clients connect via the real authoritative server over loopback. This
puts 20 avatars and real multiplayer state on the Chromebook without requiring
19 other people. It does not model 20 devices sharing classroom Wi-Fi.

1. Open the invite on a Chromebook. Wait for **20/20 ready**.
2. Walk, sprint, jump, orbit the camera, and place a piece on the build pad.
3. Select **Simulate short pause** once. Movement should hold briefly and
   resume without replaying stale commands. This holds application of updates
   for 750 ms on the browser; it does not disrupt Wi-Fi or the server.
4. Keep the tab visible. After five minutes, select **Copy test results** and
   paste the results with any visible stutter, snapping, or input delay noted.

The copy button is also available during the run. It measures visible frames at
20 connected players, using elapsed browser callback time. FPS, frame p95, and
peak frame interval describe rendering cadence; peak update gap and recoveries
describe state delivery. The injected pause is counted separately from natural
arrival gaps. Clipboard data contains no invite, player name, or device ID.

Bots stop after five minutes at full load or when the tester leaves. A dropped
connection has the normal 20-second reconnect allowance. Close the tab and let
the room clear before reopening the link for a fresh run. Only one device check
can run on the review service at once. The link is a bearer invite; keep it private.

`WORLD_DEVICE_REVIEW_CODE` enables the invite on the isolated review service with
`WORLD_MAX_CLIENTS=20`. It is never committed to the repository. The room is
hidden from matchmaking listings, and bot seats are reserved by the server.
Run `WORLD_MAX_CLIENTS=20 node device-check-test.mjs` for a short local lifecycle
check. The same script accepts `WORLD_TEST_ENDPOINT` and the invite environment
variable for a hosted smoke check. The player cap and production remain unchanged.
