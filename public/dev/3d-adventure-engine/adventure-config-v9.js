// v0.9 Lost Facility content package.
// The 3D engine owns movement, camera, interaction, checkpoints, difficulty and
// rendering. This object owns the adventure-specific content and mission rules.

window.TA3DAdventureConfig = Object.freeze({
  schemaVersion: 1,
  id: "lost-facility",
  title: "The Lost Facility",
  version: "0.9",
  storageNamespace: "teachArcade3D.lostFacility",
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

  palette: Object.freeze({
    cyan: 0x38bdf8,
    amber: 0xfbbf24,
    green: 0x4ade80,
    violet: 0xa78bfa,
    red: 0xef4444,
  }),

  relayPuzzle: Object.freeze({
    panelLabel: "AUX POWER ROUTE",
    order: Object.freeze(["cyan", "amber", "green"]),
    stations: Object.freeze({
      cyan: Object.freeze({ x: -4.75, z: -10.65, label: "CYAN", color: "cyan" }),
      amber: Object.freeze({ x: 4.75, z: -11.55, label: "AMBER", color: "amber" }),
      green: Object.freeze({ x: 0, z: -13.1, label: "GREEN", color: "green" }),
    }),
    feedback: Object.freeze({
      reset: "POWER ROUTE RESET · Follow the color sequence",
      progress: "RELAY {current}/{total} ONLINE",
      complete: "AUXILIARY POWER RESTORED · Archive unlocked",
    }),
  }),

  mission: Object.freeze({
    startPosition: Object.freeze({ x: 0, y: 0, z: -10.15, yaw: Math.PI }),
    zone: Object.freeze({ x: 0, z: -14, activeDistance: 36 }),

    archiveConsole: Object.freeze({
      x: -4.7,
      z: -17.35,
      label: "Access knowledge archive",
      completeLabel: "Archive verified",
    }),

    commandCore: Object.freeze({
      x: 4.65,
      z: -17.2,
      label: "Stabilize command core",
      completeLabel: "Core stabilized",
      stabilizationMs: 1400,
    }),

    objectives: Object.freeze({
      start: Object.freeze({
        title: "Restore auxiliary power.",
        detail: "Read the color route on the wall, then activate the three matching relays in order.",
      }),
      relayProgress: Object.freeze({
        title: "Restore auxiliary power.",
        detail: "Power is routing correctly. Find the {next} relay next.",
      }),
      archive: Object.freeze({
        title: "Access the research archive.",
        detail: "The rear bulkhead is open. Find the violet knowledge console.",
      }),
      core: Object.freeze({
        title: "Stabilize the facility core.",
        detail: "Archive verification unlocked the command core on the opposite side of the chamber.",
      }),
      stabilizing: Object.freeze({
        title: "Stabilizing facility core…",
        detail: "Power is returning throughout the Lost Facility.",
      }),
      complete: Object.freeze({
        title: "Facility restored!",
        detail: "The complete 3D adventure mission is working.",
      }),
    }),

    toasts: Object.freeze({
      start: "LOST FACILITY · Interior systems offline",
      archiveVerified: "ARCHIVE VERIFIED · Command core unlocked",
      stabilizing: "CORE STABILIZATION IN PROGRESS",
      complete: "MISSION COMPLETE · Lost Facility restored",
    }),

    completion: Object.freeze({
      eyebrow: "MISSION COMPLETE",
      heading: "The Lost Facility is online.",
      body: "You restored external power, solved the auxiliary routing puzzle, verified the archive, and stabilized the command core.",
    }),
  }),

  questions: Object.freeze({
    exteriorTerminal: Object.freeze({
      id: "earth-layers-outer-core",
      text: "Which layer of Earth is liquid and surrounds the inner core?",
      answers: Object.freeze(["Crust", "Mantle", "Outer core", "Inner core"]),
      correct: 2,
      hint: "Think about the metallic layer that is molten rather than solid.",
    }),
    archive: Object.freeze({
      id: "mantle-convection",
      title: "Verify the archive record",
      text: "Which process helps move heat through Earth's mantle and contributes to plate motion?",
      answers: Object.freeze([
        "Convection currents in the mantle",
        "Erosion by rivers",
        "Radiation from the Sun",
        "Weathering at Earth's surface",
      ]),
      correct: 0,
      hint: "Think about what happens when warmer material rises and cooler material sinks.",
      correctFeedback: "Correct — command authorization restored.",
      wrongFeedback: "Not quite. Use the archive clues and try again.",
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
