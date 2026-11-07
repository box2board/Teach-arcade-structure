import {icon} from "./piece-preview.js";
import { GameFeel } from "./game-feel.js";
import * as T from "../../assets/vendor/three-0.162.0/three.module.js";
import { CATALOG, asset } from "./catalog.js";
import { StudioScene } from "./renderer.js";
import { makePiece, disposeGroup, endpoint } from "./geometry.js";
import {
  validate,
  snapCandidate,
  placementIssue,
  connectedIds,
} from "./connections.js";
import {
  Editor,
  starter,
  piece,
  transformedSection,
  loopPlayground,
} from "./editor.js";
import { Vehicle } from "./vehicle.js";
import {
  newTrack,
  parseTrack,
  serialize,
  listSaves,
  saveTrack,
  deleteSave,
} from "./storage.js";
const $ = (id) => document.getElementById(id);
let scene;
try {
  scene = new StudioScene($("canvas"));
} catch (e) {
  $("stats").textContent = "WebGL unavailable";
  $("canvas").innerHTML =
    '<p style="padding:30px">This 3D studio needs WebGL. Try a browser with hardware acceleration enabled.</p>';
  throw e;
}
let selectedType = null,
  ghost = null,
  candidate = null,
  snapping = true,
  placeHeight = 0,
  placeYaw = 0,
  vehicle = null,
  follow = true,
  dirty = false,
  category = "Essentials",
  toastTimer,
  accumulator = 0;
let candidateIssue = null;
let candidateTarget = null;
const connectors = new T.Group();
scene.scene.add(connectors);
function toast(msg) {
  $("toast").textContent = msg;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 4000);
}
let initial = starter();
try {
  const raw = localStorage.getItem("teacharcade.racestudio.draft");
  if (raw) initial = parseTrack(JSON.parse(raw));
} catch {}
const editor = new Editor(initial, () => {
  dirty = true;
  renderTrack();
  try {
    localStorage.setItem(
      "teacharcade.racestudio.draft",
      JSON.stringify(serialize(editor.track)),
    );
  } catch {
    toast("Draft storage full. Export JSON to preserve your work.");
  }
});
const game = new GameFeel({
  build: () => {},
  demo: () => {
    replace(loopPlayground());
    startTest();
  },
  saves: () => {
    setInspector(true);
    $("saves").focus();
  },
  again: () => restartRun(),
  edit: () => endTest(),
});
$("game-home").onclick = () => game.menu();
// Keep precision tools available, tucked behind one optional panel.
const advanced = document.createElement("details");
advanced.className = "advanced-builder";
advanced.innerHTML = "<summary>⚙ Advanced builder</summary>";
const object = $("object");
for (const el of [
  object.querySelector(".section-toggle"),
  $("section-info"),
  $("pos-x").closest(".pair"),
  $("snap-selection"),
  $("length").parentElement,
  $("height").parentElement,
])
  if (el) advanced.append(el);
object.append(advanced);
const modeLabel = $("mode").parentElement;
modeLabel.classList.add("mode-picker");
document.querySelector(".top-actions").prepend(modeLabel);
$("mode").options[0].text = "Watch it go";
$("mode").options[1].text = "Drive it";

function renderTrack() {
  while (scene.root.children.length) {
    const g = scene.root.children[0];
    scene.root.remove(g);
    disposeGroup(g);
  }
  for (const p of editor.track.pieces)
    scene.root.add(makePiece(p, p.id === editor.selected));
  $("count").textContent = `${editor.track.pieces.length} / 250 pieces`;
  $("name").value = editor.track.name;
  $("undo").disabled = !editor.undoStack.length;
  $("redo").disabled = !editor.redoStack.length;
  inspector();
  check();
  refreshConnectors(null, true);
}
function refreshConnectors(target = null, rebuild = false) {
  if (rebuild) {
    while (connectors.children.length) {
      const child = connectors.children[0];
      connectors.remove(child);
      disposeGroup(child);
    }
    const v = validate(editor.track);
    for (const p of editor.track.pieces) {
      const q = endpoint(p),
        invalid = v.invalid.some((l) => l.from === p.id),
        occupied = v.links.some((l) => l.from === p.id),
        color = invalid ? "#ff3152" : occupied ? "#8493ad" : "#02e88a";
      const ring = new T.Mesh(
        new T.TorusGeometry(0.43, 0.1, 5, 16),
        new T.MeshBasicMaterial({ color, depthTest: false }),
      );
      ring.userData = { pieceId: p.id, baseColor: color };
      ring.rotation.x = Math.PI / 2;
      ring.position.set(q.x, q.y + 0.8, q.z);
      ring.renderOrder = 10;
      connectors.add(ring);
    }
  }
  for (const marker of connectors.children)
    marker.material.color.set(
      marker.userData.pieceId === target
        ? "#ffcb00"
        : marker.userData.baseColor,
    );
}
function inspector() {
  const p = editor.selection;
  $("object").hidden = !p;
  $("selection-title").textContent = p ? asset(p.type).name : "Your creation";
  if (p) {
    $("pos-x").value = p.x.toFixed(2);
    $("pos-z").value = p.z.toFixed(2);
    $("length").value = p.length;
    $("height").value = p.y;
    $("height-value").value = p.y.toFixed(1);
    $("color").value = p.color;
    $("section-info").textContent = $("move-connected").checked
      ? `${connectedIds(editor.track.pieces, p.id).size} pieces move as one section`
      : "Single-piece transforms";
  }
}
function check() {
  let v = validate(editor.track);
  $("validation").replaceChildren();
  for (const text of [
    `${v.links.length} aligned connections`,
    `${v.disconnected.length} disconnected pieces`,
    `${v.invalid.length} nearby invalid joints`,
    `${v.openEnds.length} open exits${v.openEnds.length ? " (may be intentional)" : ""}`,
    v.missingStart ? "Start: first piece fallback" : "Start position set",
    v.missingFinish
      ? "No finish gate — sandbox testing available"
      : "Finish gate present",
  ]) {
    let row = document.createElement("div");
    row.textContent = text;
    $("validation").append(row);
  }
  return v;
}
function renderAssets() {
  const cats = [...new Set(CATALOG.map((a) => a.category))];
  $("categories").innerHTML = cats
    .map(
      (c) =>
        `<button class="${category === c ? "active" : ""}" data-cat="${c}">${c}</button>`,
    )
    .join("");
  $("assets").innerHTML = CATALOG.filter(
    (a) =>
      a.category === category &&
      (!$("asset-search")?.value ||
        a.name.toLowerCase().includes($("asset-search").value.toLowerCase())),
  )
    .map(
      (a) =>
        `<button class="asset ${a.id === selectedType ? "chosen" : ""}" data-asset="${a.id}" title="${a.name}: click workspace to place"><span>${a.name}</span>${icon(a)}</button>`,
    )
    .join("");
}
function clearGhost() {
  if (ghost) {
    scene.scene.remove(ghost);
    disposeGroup(ghost);
    ghost = null;
  }
}
function cancel() {
  selectedType = null;
  candidate = null;
  candidateIssue = null;
  candidateTarget = null;
  refreshConnectors();
  clearGhost();
  renderAssets();
  $("hint").textContent =
    "Orbit: drag empty space · Pan: right drag / two fingers · Zoom: scroll / pinch";
}
$("categories").onclick = (e) => {
  if (e.target.dataset.cat) {
    category = e.target.dataset.cat;
    renderAssets();
  }
};
function placementError(p) {
  if (Math.abs(p.x) > 500 || Math.abs(p.z) > 500 || p.y > 40)
    return "Placement is outside the build area.";
  if (p.y + Math.min(0, asset(p.type).rise || 0) < 0)
    return "This descent needs a higher starting point.";
  return placementIssue(p, editor.track.pieces);
}
function showPlacement(p, snap) {
  const issue = (snap && !snap.valid ? snap.reason : null) || placementError(p);
  const samePreview = candidate && ghost && candidate.type === p.type &&
    candidate.x === p.x && candidate.y === p.y && candidate.z === p.z &&
    candidate.yaw === p.yaw && candidateIssue === issue;
  candidate = p;
  candidateIssue = issue;
  candidateTarget = snap?.target ?? null;
  refreshConnectors(candidateTarget);
  if (!samePreview) {
    clearGhost();
    ghost = makePiece(p, false, true);
    if (issue) ghost.traverse((o) => o.material?.color?.set("#ff3152"));
    scene.scene.add(ghost);
  }
  $("hint").textContent = issue || (snap
    ? "Snapped to exit · click or tap to place"
    : "Click or tap to place · R rotate · Esc cancel");
}
function proposal(ev) {
  const p = piece(selectedType, 0, placeHeight, 0, placeYaw);
  const rect = scene.renderer.domElement.getBoundingClientRect();
  const snap = snapping ? snapCandidate(p, editor.track.pieces, 42, (exit) => {
    const point = new T.Vector3(exit.x, exit.y + 0.8, exit.z).project(scene.camera);
    if (point.z < -1 || point.z > 1) return Infinity;
    return Math.hypot(ev.clientX - rect.left - (point.x + 1) * rect.width / 2,
      ev.clientY - rect.top - (1 - point.y) * rect.height / 2);
  }) : null;
  if (snap) {
    showPlacement(snap.piece, snap);
    return;
  }
  const hit = scene.groundPoint(ev, placeHeight);
  if (!hit) {
    candidate = null;
    candidateTarget = null;
    clearGhost();
    refreshConnectors();
    return;
  }
  showPlacement({ ...p, x: Math.round(hit.x), z: Math.round(hit.z) });
}
function nextAttachment() {
  const p = piece(selectedType, 0, placeHeight, 0, placeYaw);
  const pieces = editor.track.pieces;
  if (!pieces.length) return { piece: p, valid: true };
  const highlighted = pieces.find((other) => other.id === candidateTarget);
  const priority = [highlighted, editor.selection, ...pieces.slice().reverse()].filter(Boolean);
  const ranks = new Map();
  priority.forEach((other, index) => {
    if (!ranks.has(other.id)) ranks.set(other.id, index);
  });
  return snapCandidate(p, pieces, Infinity, (exit, other) => {
    const placed = { ...p, x: exit.x, y: exit.y, z: exit.z, yaw: exit.heading };
    return placementError(placed) ? Infinity : ranks.get(other.id);
  });
}
function placeCandidate(p) {
  const issue = placementError(p);
  if (issue) return toast(issue);
  if (editor.track.pieces.length >= 250) return toast("Prototype limit: 250 pieces.");
  editor.change((track) => {
    track.pieces.push(p);
    editor.selected = p.id;
    if (!track.startId) track.startId = p.id;
  });
  candidate = null;
  candidateTarget = null;
  clearGhost();
  game.snap();
}
$("assets").onclick = (e) => {
  let b = e.target.closest("[data-asset]");
  if (!b || vehicle) return;
  selectedType = b.dataset.asset;
  candidateTarget = null;
  renderAssets();
  $("welcome").hidden = true;
  const snap = snapping ? nextAttachment() : null;
  if (snap) showPlacement(snap.piece, snap.target ? snap : null);
  else $("hint").textContent = "Tap an open exit or place a new section.";
};
const canvas = scene.renderer.domElement;
let pointerDown;
canvas.addEventListener("pointerdown", (ev) => {
  pointerDown = { x: ev.clientX, y: ev.clientY };
  if (selectedType && !vehicle) {
    scene.controls.enabled = false;
    proposal(ev);
  }
});
canvas.addEventListener("pointermove", (ev) => {
  if (selectedType && !vehicle) proposal(ev);
});
canvas.addEventListener("pointerup", (ev) => {
  scene.controls.enabled = true;
  if (
    !pointerDown ||
    Math.hypot(ev.clientX - pointerDown.x, ev.clientY - pointerDown.y) > 7
  )
    return;
  if (vehicle) return;
  if (selectedType) {
    proposal(ev);
    if (!candidate) return;
    if (candidateIssue) {
      toast(candidateIssue);
      return;
    }
    placeCandidate(candidate);
  } else {
    let hit = scene.pick(ev)[0];
    let o = hit?.object;
    while (o && !o.userData.pieceId) o = o.parent;
    editor.selected = o?.userData.pieceId || null;
    renderTrack();

  }
});
canvas.addEventListener("pointercancel", () => {
  scene.controls.enabled = true;
});
function mutation(fn) {
  if (vehicle) return;
  const p = editor.selection;
  if (!p) {
    toast("Select a track piece first.");
    return;
  }
  editor.change(() => fn(p));
}
for (const [id, key] of [
  ["pos-x", "x"],
  ["pos-z", "z"],
])
  $(id).onchange = (e) => {
    let value = Number(e.target.value);
    if (!Number.isFinite(value) || Math.abs(value) > 500) {
      toast("Position must be between −500 and 500.");
      inspector();
      return;
    }
    transform({ [key]: value });
  };
function transform(changes) {
  if (vehicle || !editor.selection) return;
  try {
    const result = transformedSection(
      editor.track,
      editor.selected,
      changes,
      $("move-connected").checked,
    );
    editor.change((t) => (t.pieces = result.pieces));
    if (result.count > 1) toast(`${result.count} connected pieces transformed`);
  } catch (e) {
    toast(e.message);
    inspector();
  }
}
$("move-connected").onchange = inspector;
$("snap-selection").onclick = () => {
  const p = editor.selection;
  if (!p) return;
  const ids = $("move-connected").checked
    ? connectedIds(editor.track.pieces, p.id)
    : new Set([p.id]);
  const snap = snapCandidate(
    p,
    editor.track.pieces.filter((other) => !ids.has(other.id)),
    10,
  );
  if (!snap) {
    toast("No open exit nearby. Move closer to an open connector.");
    return;
  }
  if (!snap.valid) {
    toast(snap.reason);
    return;
  }
  transform(snap.piece);
};
$("rotate").onclick = () => {
  if (editor.selection) transform({ yaw: editor.selection.yaw + Math.PI / 12 });
};
$("duplicate").onclick = () =>
  mutation((p) => {
    if (editor.track.pieces.length >= 250) return;
    let copy = { ...p, id: crypto.randomUUID(), x: p.x + 4, z: p.z + 4 };
    const issue = placementIssue(copy, editor.track.pieces);
    if (issue) {
      toast(issue);
      return;
    }
    editor.track.pieces.push(copy);
    editor.selected = copy.id;
  });
$("delete").onclick = () =>
  mutation((p) => {
    editor.track.pieces = editor.track.pieces.filter((x) => x.id !== p.id);
    if (editor.track.startId === p.id)
      editor.track.startId = editor.track.pieces[0]?.id || null;
    editor.selected = null;
  });
$("length").onchange = (e) => mutation((p) => (p.length = +e.target.value));
$("height").onchange = (e) => {
  placeHeight = +e.target.value;
  transform({ y: placeHeight });
};
$("color").onchange = (e) => mutation((p) => (p.color = e.target.value));
$("name").onchange = (e) =>
  editor.change((t) => (t.name = e.target.value.trim() || "Untitled Track"));
$("start-here").onclick = () =>
  mutation((p) => {
    editor.track.startId = p.id;
    toast("Vehicle starts on this piece.");
  });
$("undo").onclick = () => {
  if (!vehicle) editor.undo();
};
$("redo").onclick = () => {
  if (!vehicle) editor.redo();
};
$("cancel").onclick = cancel;
$("snap").onclick = () => {
  snapping = !snapping;
  $("snap").classList.toggle("active", snapping);
  $("snap").textContent = snapping ? "● Snap on" : "○ Snap off";
};
$("grid").onclick = () => (scene.grid.visible = !scene.grid.visible);
let low = false;
$("quality").onclick = () => {
  low = !low;
  scene.renderer.setPixelRatio(low ? 1 : Math.min(devicePixelRatio, 1.5));
  scene.renderer.shadowMap.enabled = !low;
  $("quality").textContent = `Quality: ${low ? "low" : "balanced"}`;
};
document.querySelectorAll("[data-view]").forEach(
  (b) =>
    (b.onclick = () => {
      follow = false;
      scene.view(b.dataset.view, editor.selection);
    }),
);
$("focus").onclick = () => {
  if (editor.selection) {
    follow = false;
    scene.view("perspective", editor.selection);
  } else toast("Select a piece to focus on it.");
};
function setInspector(open, restoreFocus = false) {
  document.querySelector(".shell").classList.toggle("inspect", open);
  $("library-toggle").setAttribute("aria-expanded", String(open));
  if (restoreFocus) $("library-toggle").focus();
}
$("library-toggle").onclick = () => setInspector($("library-toggle").getAttribute("aria-expanded") !== "true");
$("close-tools").onclick = () => setInspector(false, true);
$("validate").onclick = () => {
  check();
  toast("Connection report updated.");
};
function startTest() {
  if (vehicle) return;
  if (!editor.track.pieces.length) {
    toast("Build a track first.");
    return;
  }
  cancel();
  vehicle = new Vehicle(structuredClone(editor.track), $("mode").value);
  game.start();
  $("mode").disabled = true;
  scene.scene.add(vehicle.mesh);
  connectors.visible = false;
  $("test").disabled = true;
  document
    .querySelectorAll(
      ".inspector input,.inspector button,.inspector select,.library button",
    )
    .forEach((el) => (el.disabled = true));
  $("editbar").hidden = true;
  $("editbar").style.display = "none";
  $("drivebar").hidden = false;
  $("touch").hidden = $("mode").value !== "manual";
  $("welcome").hidden = true;
  follow = true;
  scene.controls.enabled = true;
  setInspector(false);
  $("hint").textContent =
    $("mode").value === "manual"
      ? "Arrows / WASD: drive · R: reset · Esc: edit"
      : "Automatic test · gravity, motor, friction & boosters · R: reset";
  toast(
    check().disconnected.length
      ? "Test started. Disconnected pieces are reported in the inspector."
      : "Test started.",
  );
}
function endTest() {
  if (!vehicle) return;
  scene.scene.remove(vehicle.mesh);
  disposeGroup(vehicle.mesh);
  vehicle = null;
  game.stop();
  $("mode").disabled = false;
  connectors.visible = true;
  document
    .querySelectorAll(
      ".inspector input,.inspector button,.inspector select,.library button",
    )
    .forEach((el) => (el.disabled = false));
  $("test").disabled = false;
  $("editbar").hidden = false;
  $("editbar").style.display = "flex";
  $("drivebar").hidden = true;
  $("touch").hidden = true;
  scene.view("perspective", editor.selection);
  cancel();
}
$("test").onclick = startTest;
$("edit").onclick = endTest;
function restartRun() {
  if (!vehicle) return;
  vehicle.reset();
  vehicle.paused = false;
  accumulator = 0;
  game.start();
  $("pause").textContent = "Ⅱ Pause";
  reportedFinish = false;
}
$("restart").onclick = restartRun;
$("pause").onclick = () => {
  if (vehicle) {
    vehicle.paused = !vehicle.paused;
    $("pause").textContent = vehicle.paused ? "▶ Resume" : "Ⅱ Pause";
  }
};
$("follow").onclick = () => {
  follow = !follow;
  $("follow").textContent = follow ? "Camera: follow" : "Camera: orbit";
};
scene.controls.addEventListener("start", () => {
  if (vehicle) {
    follow = false;
    $("follow").textContent = "Camera: orbit";
  }
});
document.querySelectorAll("[data-key]").forEach((b) => {
  b.onpointerdown = (e) => {
    e.preventDefault();
    b.setPointerCapture(e.pointerId);
    vehicle?.keys.add(b.dataset.key);
  };
  b.onpointerup = b.onpointercancel = () => vehicle?.keys.delete(b.dataset.key);
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && $("library-toggle").getAttribute("aria-expanded") === "true") {
    setInspector(false, true);
    return;
  }
  if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (!$("game-menu").hidden) {
    if (key === "Escape") game.menu(false);
    return;
  }
  if (vehicle) {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(key))
      e.preventDefault();
    vehicle.keys.add(key);
    if (key === "r") restartRun();
    if (key === "Escape") endTest();
    return;
  }
  if (key === "Escape") cancel();
  if (key === "r") {
    if (selectedType) {
      placeYaw += Math.PI / 12;
      toast("Placement rotated 15°.");
    } else $("rotate").click();
  }
  if (key === "Delete" || key === "Backspace") {
    e.preventDefault();
    $("delete").click();
  }
  if ((e.ctrlKey || e.metaKey) && key === "z") {
    e.preventDefault();
    e.shiftKey ? editor.redo() : editor.undo();
  }
  if ((e.ctrlKey || e.metaKey) && key === "s") {
    e.preventDefault();
    $("save").click();
  }
});
window.addEventListener("keyup", (e) =>
  vehicle?.keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key),
);
window.addEventListener("blur", () => vehicle?.keys.clear());
function refreshSaves() {
  const all = listSaves();
  $("saves").replaceChildren();
  for (const [id, t] of Object.entries(all)) {
    let o = document.createElement("option");
    o.value = id;
    o.textContent = t.name;
    $("saves").append(o);
  }
}
$("save").onclick = () => {
  try {
    saveTrack(editor.track);
    dirty = false;
    refreshSaves();
    $("saves").value = editor.track.id;
    toast("Track saved in this browser.");
  } catch {
    toast("Unable to save. Export JSON to preserve this track.");
  }
};
function replace(track) {
  if (vehicle) endTest();
  cancel();
  editor.replace(track);
  scene.view("perspective");
}
$("load").onclick = () => {
  const raw = listSaves()[$("saves").value];
  if (!raw) return;
  try {
    replace(parseTrack(raw));
    toast("Saved track opened.");
  } catch (e) {
    toast(e.message);
  }
};
$("copy-track").onclick = () => {
  editor.change((t) => {
    t.id = crypto.randomUUID();
    t.name += " copy";
  });
  $("save").click();
};
$("new").onclick = () => {
  replace(newTrack());
  toast("New track. Undo restores the previous creation.");
};
$("starter").onclick = () => replace(starter());
$("delete-save").onclick = () => {
  deleteSave($("saves").value);
  refreshSaves();
  toast("Saved entry deleted. The open track is unchanged.");
};
$("export").onclick = () => {
  const blob = new Blob([JSON.stringify(serialize(editor.track), null, 2)], {
      type: "application/json",
    }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download =
    (editor.track.name.replace(/[^a-z0-9]/gi, "-") || "track") + ".json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$("import").onclick = () => $("file").click();
$("file").onchange = async (e) => {
  let file = e.target.files[0];
  if (!file) return;
  try {
    if (file.size > 2e6) throw Error("JSON exceeds the 2 MB import limit.");
    replace(parseTrack(JSON.parse(await file.text())));
    toast("Track imported.");
  } catch (err) {
    toast("Import failed: " + err.message);
  }
  e.target.value = "";
};
renderAssets();
renderTrack();
refreshSaves();
let last = performance.now(),
  frames = 0,
  fpsTime = last,
  reportedFinish = false;
function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - last) / 1000, 0.06);
  last = now;
  if (vehicle) {
    if (game.tick(dt, vehicle.speed, vehicle.paused)) accumulator += dt;
    else accumulator = 0;
    let steps = 0;
    while (accumulator >= 1 / 120 && steps++ < 8) {
      vehicle.step(1 / 120);
      accumulator -= 1 / 120;
    }
    if (follow) {
      const target = vehicle.pos.clone().add(new T.Vector3(0, 1, 0));
      const desired = target
        .clone()
        .add(
          new T.Vector3(
            -Math.cos(vehicle.yaw) * 10,
            6,
            -Math.sin(vehicle.yaw) * 10,
          ),
        );
      scene.camera.position.lerp(desired, 1 - Math.exp(-dt * 4));
      scene.controls.target.lerp(target, 1 - Math.exp(-dt * 6));
    }
    $("speed").textContent = `${Math.round(vehicle.speed * 3.6)} km/h`;
    if (vehicle.finished && !reportedFinish) {
      game.finish(vehicle.finishTime);
      reportedFinish = true;
    }
    if (!vehicle.finished) reportedFinish = false;
  } else accumulator = 0;
  scene.render();
  frames++;
  if (now - fpsTime > 1000) {
    $("stats").textContent =
      `${Math.round((frames * 1000) / (now - fpsTime))} fps · ${scene.renderer.info.render.calls} draws`;
    frames = 0;
    fpsTime = now;
  }
}
requestAnimationFrame(animate);
// Read-only QA hooks make browser verification deterministic without changing player controls.
window.raceStudio = {
  editor,
  get vehicle() {
    return vehicle;
  },
  validate: () => validate(editor.track),
  serialize: () => serialize(editor.track),
  get renderer() {
    return scene.renderer;
  },
};

$("attach").onclick = () => {
  if (vehicle) return;
  if (!selectedType) {
    toast("Choose an asset in the library first.");
    return;
  }
  const snap = nextAttachment();
  if (!snap || !snap.valid) {
    toast(snap?.reason || "Choose an open exit with enough height for this piece.");
    return;
  }
  placeCandidate(snap.piece);
};

$("asset-search").oninput = () => renderAssets();
