// v1.1 adventure runtime with world/layout validation.

const config = window.TA3DAdventureConfig;

function assert(condition, message) {
  if (!condition) throw new Error(`3D Adventure config: ${message}`);
}

function validateAdventure(candidate) {
  assert(candidate && typeof candidate === "object", "missing TA3DAdventureConfig");
  assert(typeof candidate.id === "string" && candidate.id, "id is required");
  assert(typeof candidate.title === "string" && candidate.title, "title is required");
  assert(candidate.difficulties?.easy && candidate.difficulties?.medium && candidate.difficulties?.hard, "easy/medium/hard difficulty definitions are required");

  const world = candidate.world;
  assert(world && typeof world === "object", "world package is required in v1.1");
  assert(Array.isArray(world.elements) && world.elements.length > 0, "world.elements must contain layout definitions");
  assert(world.scene?.background != null, "world.scene.background is required");
  const bounds = world.bounds;
  assert(bounds && [bounds.minX, bounds.maxX, bounds.minZ, bounds.maxZ].every(Number.isFinite), "world.bounds requires numeric min/max X/Z");

  const exterior = candidate.exterior;
  for (const key of ["energyCell", "terminal", "switch", "missionEntry"]) {
    const point = exterior?.[key];
    assert(point && Number.isFinite(point.x) && Number.isFinite(point.z), `exterior.${key} requires numeric x/z`);
  }
  const requiredObjects = ["gateDoor", "gateStripe", "energyCell", "energyCellRing", "terminalGlow", "switchGlow"];
  requiredObjects.forEach((key) => assert(typeof exterior?.objects?.[key] === "string", `exterior.objects.${key} is required`));

  const names = new Set();
  function collect(elements = []) {
    for (const item of elements) {
      if (item?.name) names.add(item.name);
      if (item?.type === "group") collect(item.children || []);
    }
  }
  collect(world.elements);
  requiredObjects.forEach((key) => assert(names.has(exterior.objects[key]), `world package does not provide named gameplay object '${exterior.objects[key]}'`));

  const puzzle = candidate.relayPuzzle;
  assert(Array.isArray(puzzle?.order) && puzzle.order.length > 0, "relayPuzzle.order must contain at least one relay");
  puzzle.order.forEach((id) => {
    const station = puzzle.stations?.[id];
    assert(station, `relay station '${id}' is missing`);
    assert(Number.isFinite(station.x) && Number.isFinite(station.z), `relay station '${id}' needs numeric x/z coordinates`);
    assert(candidate.palette?.[station.color || id] != null, `relay station '${id}' needs a palette color`);
  });

  const mission = candidate.mission;
  assert(mission?.startPosition, "mission.startPosition is required");
  assert(mission?.archiveConsole, "mission.archiveConsole is required");
  assert(mission?.commandCore, "mission.commandCore is required");
  assert(mission?.objectives?.start && mission?.objectives?.archive && mission?.objectives?.core, "mission objective copy is incomplete");

  for (const id of ["exteriorTerminal", "archive"]) {
    const question = candidate.questions?.[id];
    assert(question?.text, `questions.${id}.text is required`);
    assert(Array.isArray(question?.answers) && question.answers.length >= 2, `questions.${id}.answers must contain choices`);
    assert(Number.isInteger(question.correct) && question.correct >= 0 && question.correct < question.answers.length, `questions.${id}.correct is invalid`);
  }
  return true;
}

function interpolate(template, values = {}) {
  return String(template ?? "").replace(/\{(\w+)\}/g, (_, key) => values[key] ?? `{${key}}`);
}

validateAdventure(config);

window.TA3DAdventure = Object.freeze({
  config,
  id: config.id,
  title: config.title,
  version: config.version,
  color(id) { return config.palette?.[id] ?? 0xffffff; },
  relayStation(id) { return config.relayPuzzle?.stations?.[id] || null; },
  text(template, values) { return interpolate(template, values); },
  storageKey(suffix) {
    const prefix = config.storageNamespace || `teachArcade3D.${config.id}`;
    return `${prefix}.${suffix}`;
  },
  validate() { return validateAdventure(config); },
  snapshot() {
    return {
      id: config.id,
      title: config.title,
      version: config.version,
      relayOrder: [...config.relayPuzzle.order],
      checkpointCount: config.checkpoints?.length || 0,
      configuredQuestions: Object.keys(config.questions || {}).length,
      worldElements: config.world?.elements?.length || 0,
      worldBounds: { ...(config.world?.bounds || {}) },
    };
  },
});
