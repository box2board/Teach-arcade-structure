// v0.8 data-driven adventure configuration.
// Future 3D adventures can provide a different config object while reusing the
// same difficulty, checkpoint, interaction, and mission-support systems.

window.TA3DAdventureConfig = Object.freeze({
  id: "lost-facility",
  title: "The Lost Facility",
  version: "0.8",
  defaultDifficulty: "medium",

  difficulties: Object.freeze({
    easy: Object.freeze({
      id: "easy",
      label: "Easy",
      summary: "More guidance and forgiving puzzle mistakes.",
      showNextRelay: true,
      preserveRelayProgressOnMistake: true,
      academicHints: true,
    }),
    medium: Object.freeze({
      id: "medium",
      label: "Medium",
      summary: "The intended balance of exploration, puzzles, and guidance.",
      showNextRelay: true,
      preserveRelayProgressOnMistake: false,
      academicHints: false,
    }),
    hard: Object.freeze({
      id: "hard",
      label: "Hard",
      summary: "Rely on the environment. Fewer HUD hints and full puzzle resets.",
      showNextRelay: false,
      preserveRelayProgressOnMistake: false,
      academicHints: false,
    }),
  }),

  relayPuzzle: Object.freeze({
    order: Object.freeze(["cyan", "amber", "green"]),
    stations: Object.freeze({
      cyan: Object.freeze({ x: -4.75, z: -10.65, label: "CYAN" }),
      amber: Object.freeze({ x: 4.75, z: -11.55, label: "AMBER" }),
      green: Object.freeze({ x: 0, z: -13.1, label: "GREEN" }),
    }),
  }),

  academicHints: Object.freeze({
    "Which layer of Earth is liquid and surrounds the inner core?":
      "Think about the metallic layer that is molten rather than solid.",
    "Which process helps move heat through Earth's mantle and contributes to plate motion?":
      "Think about what happens when warmer material rises and cooler material sinks.",
  }),

  checkpoints: Object.freeze([
    "start",
    "cell",
    "terminal",
    "entrance",
    "facility",
    "archive",
    "core",
  ]),
});
