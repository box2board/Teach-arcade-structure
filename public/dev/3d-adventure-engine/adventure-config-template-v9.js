// Teach Arcade 3D Adventure content-package template (v0.9)
// Copy this file for a new adventure, fill in the data, then load it before
// adventure-runtime-v9.js. Do not edit movement/camera/mission runtime code.

const EXAMPLE_ADVENTURE_CONFIG = {
  schemaVersion: 1,
  id: "replace-with-unique-id",
  title: "Adventure Title",
  version: "1.0",
  storageNamespace: "teachArcade3D.replaceWithUniqueId",
  defaultDifficulty: "medium",

  difficulties: {
    easy: { id: "easy", label: "Easy", summary: "More guidance.", showNextRelay: true, preserveRelayProgressOnMistake: true, academicHints: true },
    medium: { id: "medium", label: "Medium", summary: "Balanced guidance.", showNextRelay: true, preserveRelayProgressOnMistake: false, academicHints: false },
    hard: { id: "hard", label: "Hard", summary: "Environmental clues only.", showNextRelay: false, preserveRelayProgressOnMistake: false, academicHints: false },
  },

  palette: {
    cyan: 0x38bdf8,
    amber: 0xfbbf24,
    green: 0x4ade80,
    violet: 0xa78bfa,
    red: 0xef4444,
  },

  exterior: {
    start: { x: 0, z: 12 },
    energyCell: { x: -6, z: 5 },
    terminal: { x: 6, z: -3 },
    terminalWait: { x: 5, z: -2 },
    switch: { x: 3, z: -6 },
    switchWait: { x: 3, z: -5 },
    gateCheckpoint: { x: 0, z: -6 },
    missionEntry: { x: 0, z: -10 },
    entryTrigger: { maxAbsX: 7, zLessThan: -9 },
  },

  relayPuzzle: {
    panelLabel: "POWER ROUTE",
    order: ["cyan", "amber", "green"],
    stations: {
      cyan: { x: -5, z: -11, label: "CYAN", color: "cyan" },
      amber: { x: 5, z: -11, label: "AMBER", color: "amber" },
      green: { x: 0, z: -13, label: "GREEN", color: "green" },
    },
    feedback: {
      reset: "ROUTE RESET · Check the environmental clue",
      progress: "RELAY {current}/{total} ONLINE",
      complete: "POWER RESTORED",
    },
  },

  mission: {
    startPosition: { x: 0, y: 0, z: -10, yaw: Math.PI },
    zone: { x: 0, z: -14, activeDistance: 36 },
    archiveCheckpoint: { x: 0, z: -15.5 },
    coreCheckpoint: { x: 0, z: -16.5 },
    archiveConsole: { x: -4.7, z: -17.3, label: "Access archive", completeLabel: "Archive verified" },
    commandCore: { x: 4.7, z: -17.2, label: "Activate objective", completeLabel: "Objective complete", stabilizationMs: 1400 },
    objectives: {
      start: { title: "First interior objective", detail: "Environmental clue text." },
      relayProgress: { title: "Continue the sequence", detail: "Find the {next} relay next." },
      archive: { title: "Reach the academic checkpoint", detail: "Find the knowledge console." },
      core: { title: "Complete the mission", detail: "Use the final interactive objective." },
      stabilizing: { title: "Completing mission…", detail: "Final animation feedback." },
      complete: { title: "Mission complete!", detail: "Adventure-specific completion text." },
    },
    toasts: {
      start: "INTERIOR MISSION STARTED",
      archiveVerified: "KNOWLEDGE CHECKPOINT PASSED",
      stabilizing: "FINAL OBJECTIVE IN PROGRESS",
      complete: "MISSION COMPLETE",
    },
    completion: {
      eyebrow: "MISSION COMPLETE",
      heading: "Adventure complete.",
      body: "Summarize what the student accomplished.",
    },
  },

  questions: {
    exteriorTerminal: {
      id: "question-id-1",
      text: "Exterior academic question",
      answers: ["A", "B", "C", "D"],
      correct: 0,
      hint: "Optional Easy-mode hint.",
    },
    archive: {
      id: "question-id-2",
      title: "Knowledge checkpoint",
      text: "Interior academic question",
      answers: ["A", "B", "C", "D"],
      correct: 0,
      hint: "Optional Easy-mode hint.",
      correctFeedback: "Correct — objective unlocked.",
      wrongFeedback: "Not quite. Try again.",
    },
  },

  academicHints: {
    "Exterior academic question": "Optional Easy-mode hint.",
    "Interior academic question": "Optional Easy-mode hint.",
  },

  checkpoints: ["start", "cell", "terminal", "entrance", "facility", "archive", "core"],
};

// A real adventure package should assign its config with:
// window.TA3DAdventureConfig = Object.freeze(EXAMPLE_ADVENTURE_CONFIG);
