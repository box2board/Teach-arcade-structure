// v0.9 adventure-content runtime.
// Validates the active content package and exposes a small stable API that future
// 3D adventure configs can use without knowing implementation details.

const config = window.TA3DAdventureConfig;

function assert(condition, message) {
  if (!condition) throw new Error(`3D Adventure config: ${message}`);
}

function validateAdventure(candidate) {
  assert(candidate && typeof candidate === "object", "missing TA3DAdventureConfig");
  assert(typeof candidate.id === "string" && candidate.id, "id is required");
  assert(typeof candidate.title === "string" && candidate.title, "title is required");
  assert(candidate.difficulties?.easy && candidate.difficulties?.medium && candidate.difficulties?.hard, "easy/medium/hard difficulty definitions are required");

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

  const archiveQuestion = candidate.questions?.archive;
  assert(archiveQuestion?.text, "questions.archive.text is required");
  assert(Array.isArray(archiveQuestion?.answers) && archiveQuestion.answers.length >= 2, "questions.archive.answers must contain choices");
  assert(Number.isInteger(archiveQuestion.correct) && archiveQuestion.correct >= 0 && archiveQuestion.correct < archiveQuestion.answers.length, "questions.archive.correct is invalid");

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
  color(id) {
    return config.palette?.[id] ?? 0xffffff;
  },
  relayStation(id) {
    return config.relayPuzzle?.stations?.[id] || null;
  },
  text(template, values) {
    return interpolate(template, values);
  },
  storageKey(suffix) {
    const prefix = config.storageNamespace || `teachArcade3D.${config.id}`;
    return `${prefix}.${suffix}`;
  },
  validate() {
    return validateAdventure(config);
  },
  snapshot() {
    return {
      id: config.id,
      title: config.title,
      version: config.version,
      relayOrder: [...config.relayPuzzle.order],
      checkpointCount: config.checkpoints?.length || 0,
      configuredQuestions: Object.keys(config.questions || {}).length,
    };
  },
});
