import { piece } from "./editor.js";
import { endpoint } from "./geometry.js";
import { newTrack } from "./storage.js";

export function canyonJumpPark() {
  const track = newTrack();
  track.name = "Canyon Jump Park";
  let cursor = { x: -34, y: 2, z: 0, heading: 0 };
  function add(type, { length = 1, gap = 0, rise = 0 } = {}) {
    const next = piece(type, cursor.x + gap, cursor.y + rise, cursor.z, cursor.heading);
    next.length = length;
    track.pieces.push(next);
    cursor = endpoint(next);
    return next.id;
  }
  track.startId = add("start");
  add("long", { length: 10 / 14 });
  const launchId = add("ramp", { length: 2 });
  const landingId = add("landing", { length: 2, gap: 19, rise: 1.5 });
  track.pieces.at(-1).color = "#00db9a";
  add("long");
  add("finish");
  track.jumpChallenge = { launchId, landingId };

  for (const [type, x, z, yaw = 0] of [
    ["cliff", -15, -10, 0.4], ["cliff", -12, 9, -0.3],
    ["cliff", 20, -9, 1], ["cliff", 22, 9, -0.5],
    ["sandbank", 5, -17], ["sandbank", 4, 17, 0.4],
    ["cactus", -29, -5], ["cactus", -18, 7], ["cactus", 24, 6],
    ["cactus", 35, -5], ["cones", 19, -2.8], ["cones", 19, 2.8],
    ["scoreboard", 51, -4],
  ]) track.pieces.push(piece(`scenery-${type}`, x, 0, z, yaw));
  return track;
}
