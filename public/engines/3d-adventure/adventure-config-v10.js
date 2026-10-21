import "./adventure-config-v9.js";

// v1.0 extends the v0.9 content package with the complete exterior progression
// contract. The engine controller no longer needs to know what a cell, terminal,
// switch, gate, or academic checkpoint means.

const previous = window.TA3DAdventureConfig;
const oldExterior = previous?.exterior || {};
const oldQuestion = previous?.questions?.exteriorTerminal || {};

window.TA3DAdventureConfig = Object.freeze({
  ...previous,
  version: "1.0",

  player: Object.freeze({
    start: Object.freeze({
      x: oldExterior.start?.x ?? 0,
      y: oldExterior.start?.y ?? 0,
      z: oldExterior.start?.z ?? 12.5,
      yaw: 0,
    }),
  }),

  exterior: Object.freeze({
    ...oldExterior,

    objects: Object.freeze({
      gateDoor: "exterior-gate-door",
      gateStripe: "exterior-gate-stripe",
      energyCell: "exterior-energy-cell",
      energyCellRing: "exterior-energy-cell-ring",
      terminalGlow: "exterior-terminal-glow",
      switchGlow: "exterior-switch-glow",
    }),

    interactionRadius: Object.freeze({
      energyCell: 2.0,
      terminal: 2.2,
      switch: 2.0,
    }),

    gateBlocker: Object.freeze({
      minX: -2.2,
      maxX: 2.2,
      minZ: -8.12,
      maxZ: -7.60,
    }),

    gateAnimation: Object.freeze({
      closedY: 2.25,
      openY: 6.7,
      damping: 5.2,
    }),

    labels: Object.freeze({
      energyCell: "Pick up energy cell",
      terminalNeedsCell: "Terminal needs an energy cell",
      terminalReady: "Use knowledge terminal",
      terminalOnline: "Terminal online",
      switchNoPower: "Switch has no power",
      switchReady: "Activate gate switch",
      switchOpen: "Gate already open",
    }),

    feedback: Object.freeze({
      terminalNeedsCell: "The terminal needs an energy cell first.",
      terminalOnline: "Terminal restored. The gate switch now has power.",
      switchNoPower: "No power. Restore the knowledge terminal first.",
      gateUnlocked: "Gate unlocked. Enter the facility.",
    }),

    objectives: Object.freeze({
      start: Object.freeze({
        title: "Find the energy cell.",
        detail: "Explore the courtyard and look for a glowing object.",
      }),
      terminal: Object.freeze({
        title: "Restore the knowledge terminal.",
        detail: "Bring the energy cell to the blue terminal and answer its question.",
      }),
      gate: Object.freeze({
        title: "Unlock the facility gate.",
        detail: "The wall switch beside the entrance now has power.",
      }),
      entrance: Object.freeze({
        title: "Enter the facility.",
        detail: "The gate is open. Move through the entrance to continue the mission.",
      }),
    }),
  }),

  questions: Object.freeze({
    ...previous.questions,
    exteriorTerminal: Object.freeze({
      ...oldQuestion,
      title: "Restore terminal power",
      correctFeedback: "Correct — terminal power restored.",
      wrongFeedback: "Not quite. Try another answer.",
    }),
  }),
});
