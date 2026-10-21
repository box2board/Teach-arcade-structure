import "../adventure-config-v10.js";

const base = window.TA3DAdventureConfig;

window.TA3DAdventureConfig = Object.freeze({
  ...base,
  id: "silent-observatory",
  title: "The Silent Observatory",
  version: "1.0-reuse-test",
  storageNamespace: "teachArcade3D.silentObservatory",
  defaultDifficulty: "medium",

  player: Object.freeze({
    start: Object.freeze({ x: 0, y: 0, z: 12.5, yaw: 0 }),
  }),

  exterior: Object.freeze({
    ...base.exterior,
    labels: Object.freeze({
      energyCell: "Recover the star prism",
      terminalNeedsCell: "Star console needs the prism",
      terminalReady: "Calibrate star console",
      terminalOnline: "Star console calibrated",
      switchNoPower: "Observatory seal has no power",
      switchReady: "Release observatory seal",
      switchOpen: "Observatory seal released",
    }),
    feedback: Object.freeze({
      terminalNeedsCell: "The star console cannot calibrate without the prism.",
      terminalOnline: "Calibration complete. The observatory seal can now be released.",
      switchNoPower: "The seal is unpowered. Calibrate the star console first.",
      gateUnlocked: "Seal released. Enter the observatory.",
    }),
    objectives: Object.freeze({
      start: Object.freeze({
        title: "Recover the star prism.",
        detail: "Search the desert courtyard for the glowing observatory prism.",
      }),
      terminal: Object.freeze({
        title: "Calibrate the star console.",
        detail: "Bring the prism to the blue console and verify the lunar tracking record.",
      }),
      gate: Object.freeze({
        title: "Release the observatory seal.",
        detail: "The entrance control beside the observatory now has power.",
      }),
      entrance: Object.freeze({
        title: "Enter the silent observatory.",
        detail: "The seal is open. Move inside and restore the celestial array.",
      }),
    }),
  }),

  palette: Object.freeze({
    cyan: 0x4dd9ff,
    amber: 0xffbf47,
    green: 0x62e6a7,
    violet: 0xb18cff,
    red: 0xff5d63,
  }),

  relayPuzzle: Object.freeze({
    panelLabel: "CELESTIAL ALIGNMENT",
    order: Object.freeze(["solar", "lunar", "stellar"]),
    stations: Object.freeze({
      solar: Object.freeze({ x: 4.8, z: -10.7, label: "SOLAR", color: "amber" }),
      lunar: Object.freeze({ x: -4.7, z: -12.0, label: "LUNAR", color: "violet" }),
      stellar: Object.freeze({ x: 0.25, z: -13.0, label: "STELLAR", color: "cyan" }),
    }),
    feedback: Object.freeze({
      reset: "ALIGNMENT LOST · Recheck the celestial sequence",
      progress: "ARRAY {current}/{total} ALIGNED",
      complete: "CELESTIAL ARRAY ALIGNED · Star archive unlocked",
    }),
  }),

  mission: Object.freeze({
    ...base.mission,
    startPosition: Object.freeze({ x: 0, y: 0, z: -10.15, yaw: Math.PI }),
    zone: Object.freeze({ x: 0, z: -14, activeDistance: 36 }),
    archiveCheckpoint: Object.freeze({ x: 0.8, z: -15.6 }),
    coreCheckpoint: Object.freeze({ x: -0.8, z: -16.15 }),
    archiveConsole: Object.freeze({
      x: 4.7,
      z: -17.25,
      label: "Access star archive",
      completeLabel: "Star archive verified",
    }),
    commandCore: Object.freeze({
      x: -4.6,
      z: -17.15,
      label: "Stabilize telescope drive",
      completeLabel: "Telescope drive stabilized",
      stabilizationMs: 1400,
    }),
    objectives: Object.freeze({
      start: Object.freeze({
        title: "Align the celestial array.",
        detail: "Read the alignment panel, then activate the three celestial relays in order.",
      }),
      relayProgress: Object.freeze({
        title: "Align the celestial array.",
        detail: "The array is responding. Locate the {next} relay next.",
      }),
      archive: Object.freeze({
        title: "Access the star archive.",
        detail: "The rear observatory chamber is open. Find the violet archive console.",
      }),
      core: Object.freeze({
        title: "Stabilize the telescope drive.",
        detail: "Archive verification unlocked the telescope drive across the chamber.",
      }),
      stabilizing: Object.freeze({
        title: "Stabilizing telescope drive…",
        detail: "Tracking motors and observatory systems are returning online.",
      }),
      complete: Object.freeze({
        title: "Observatory restored!",
        detail: "The celestial array is aligned and the telescope is tracking again.",
      }),
    }),
    toasts: Object.freeze({
      start: "SILENT OBSERVATORY · Celestial systems offline",
      archiveVerified: "STAR ARCHIVE VERIFIED · Telescope drive unlocked",
      stabilizing: "TELESCOPE DRIVE STABILIZING",
      complete: "MISSION COMPLETE · Observatory tracking restored",
    }),
    completion: Object.freeze({
      eyebrow: "MISSION COMPLETE",
      heading: "The Silent Observatory is tracking again.",
      body: "You recovered the star prism, calibrated the observatory, aligned the celestial array, verified the star archive, and restored the telescope drive.",
    }),
  }),

  questions: Object.freeze({
    exteriorTerminal: Object.freeze({
      id: "moon-synchronous-rotation",
      title: "Calibrate lunar tracking",
      text: "Why does nearly the same side of the Moon always face Earth?",
      answers: Object.freeze([
        "The Moon does not rotate",
        "The Moon rotates once in about the same time it orbits Earth",
        "Earth's gravity stops the Moon from moving",
        "The Sun always lights the same half of the Moon",
      ]),
      correct: 1,
      hint: "Compare the Moon's rotation period with its orbital period.",
      correctFeedback: "Correct — lunar tracking calibrated.",
      wrongFeedback: "Not quite. Think about rotation time compared with orbital time.",
    }),
    archive: Object.freeze({
      id: "earth-seasons-axial-tilt",
      title: "Verify the seasonal record",
      text: "What is the main cause of Earth's seasons?",
      answers: Object.freeze([
        "Earth moves much closer to the Sun each summer",
        "Earth's axial tilt changes sunlight angle and day length during its orbit",
        "The Sun becomes hotter during part of the year",
        "The Moon blocks some sunlight during winter",
      ]),
      correct: 1,
      hint: "Think about Earth's 23.5° tilt and how each hemisphere faces the Sun during the year.",
      correctFeedback: "Correct — seasonal tracking record verified.",
      wrongFeedback: "Not quite. Focus on Earth's tilt rather than its distance from the Sun.",
    }),
  }),

  academicHints: Object.freeze({
    "Why does nearly the same side of the Moon always face Earth?":
      "Compare the Moon's rotation period with its orbital period.",
    "What is the main cause of Earth's seasons?":
      "Think about Earth's axial tilt and how sunlight angle changes during the year.",
  }),
});