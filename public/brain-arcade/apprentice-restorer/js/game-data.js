export const gamePillars = [
  {
    title: "Experience before labels",
    detail:
      "Players discover how a system behaves first. Vocabulary appears only after the moment of insight."
  },
  {
    title: "Multiple valid paths",
    detail:
      "Every region supports more than one working solution so players feel ownership of their thinking."
  },
  {
    title: "No punishments",
    detail:
      "There are no wrong-answer screens, timers, or score. Feedback is visual and calm."
  },
  {
    title: "Quiet by design",
    detail:
      "The game is fully readable and playable with sound off and in a classroom setting."
  }
];

export const coreSystems = [
  {
    title: "Player + Input Layer",
    points: [
      "Keyboard and touch controls map to the same move + interact verbs.",
      "Press-and-hold actions charge tools instead of relying on rapid tapping.",
      "Every action has a readable on-screen response, no hidden prompts."
    ]
  },
  {
    title: "Physics-lite World Rules",
    points: [
      "Push, glide, slow, stop are consistent across regions.",
      "Objects have visible weight and surface cues that hint at inertia and friction.",
      "Motion continues until something absorbs or redirects it."
    ]
  },
  {
    title: "System State Engine",
    points: [
      "Each room is a closed system with inputs, transfers, and outputs.",
      "State changes persist so players can revisit and reflect.",
      "Soft checkpoints allow retries without loss."
    ]
  },
  {
    title: "Learning Feedback",
    points: [
      "Observation prompts appear after a surprising outcome.",
      "Short NPC questions replace tutorials.",
      "Notebook entries auto-fill after an experience is completed."
    ]
  },
  {
    title: "Classroom Mode",
    points: [
      "Teacher settings lock regions, adjust hints, and delay vocabulary.",
      "Reflection prompts can be toggled on for station work.",
      "Progress is tracked as milestones, not scores."
    ]
  }
];

export const regions = [
  {
    name: "Kinetic Plains",
    theme: "Forces & Motion",
    concepts: ["Force", "Mass", "Inertia", "Friction"],
    tools: ["Force Rod", "Force Rod Mk II"],
    enemy: "Speedling (motion misconception)",
    experiences: [
      "Push light crates to reach switch islands.",
      "Glide stones across slick paths until they meet a stopper.",
      "Compare how the same push moves light versus heavy boulders.",
      "Find a friction strip that slows the drifting carts."
    ],
    reflection: "What made one object move farther than another?"
  },
  {
    name: "Flux Canyons",
    theme: "Energy & Transfer",
    concepts: [
      "Energy",
      "Energy transfer",
      "Energy transformation",
      "Energy loss",
      "Efficiency"
    ],
    tools: ["Energy Relay", "Energy Relay Mk II"],
    enemy: "Drainling (energy loss)",
    experiences: [
      "Route wind power through rotating gates to lift platforms.",
      "Compare a long chain of transfers versus a short, direct route.",
      "Use the Mk II relay to watch energy fade over distance.",
      "Balance outputs so every machine gets enough to run."
    ],
    reflection: "Where did the energy feel strongest?"
  },
  {
    name: "Lumen Woods",
    theme: "Waves & Light",
    concepts: [
      "Light as energy",
      "Reflection",
      "Refraction",
      "Absorption",
      "Light carrying information"
    ],
    tools: ["Mirror Plate", "Lens Array"],
    enemy: "Shadowkin (absorbs light)",
    experiences: [
      "Send beams through clear paths to reveal hidden bridges.",
      "Rotate mirrors to redirect a signal to a gate.",
      "Split a beam to power two symbols at once.",
      "Pulse light to send a message across the grove."
    ],
    reflection: "How did the light change when it touched a surface?"
  },
  {
    name: "Polar Ridge",
    theme: "Electricity & Magnetism",
    concepts: [
      "Circuits",
      "Directional flow",
      "Magnetism",
      "Fields",
      "Electricity–magnetism connection"
    ],
    tools: ["Conductor Wand", "Magnetic Poles", "Flux Node"],
    enemy: "Arc Wisp (follows field rules)",
    experiences: [
      "Complete circuits to wake bridges and lifts.",
      "Reverse flow to open alternate routes.",
      "Pull and push metallic blocks with magnetic poles.",
      "Link electric flow to magnetic fields with the Flux Node."
    ],
    reflection: "What changed when the circuit loop was broken?"
  },
  {
    name: "Archive of Balance",
    theme: "System Synthesis",
    concepts: ["Systems thinking", "Balance", "Efficiency"],
    tools: ["All prior tools"],
    enemy: "No new enemies",
    experiences: [
      "Combine motion, energy, light, and flow to restore the Archive.",
      "Solve layered rooms with multiple valid configurations.",
      "Choose the most balanced route rather than the loudest output.",
      "The final gate accepts more than one true setup."
    ],
    reflection: "How did changing one system shift the others?"
  }
];

export const notebookTemplate = [
  {
    section: "What I Observed",
    entries: [
      "Objects move only when I push them.",
      "Some paths slow things down faster than others.",
      "Light can show me a route I could not see before."
    ]
  },
  {
    section: "What I Learned",
    entries: [
      "A bigger push is not the only way to move something farther.",
      "Energy feels weaker after it passes through many steps.",
      "Electric flow needs a complete loop to keep going."
    ]
  },
  {
    section: "Why It Matters",
    entries: [
      "Systems stay stable when every part gets enough.",
      "Careful routing can save energy without adding more.",
      "I can test ideas safely before I name them."
    ]
  }
];

export const npcLines = [
  "That didn’t move the way you expected, did it?",
  "What changed when you pushed from another side?",
  "Is the long route really stronger?",
  "What happens if the light arrives in pulses?",
  "Why did the bridge stop when the loop broke?"
];

export const classroomModes = [
  {
    title: "Guided",
    description: "Frequent hints, quick notebook prompts, vocabulary revealed early."
  },
  {
    title: "Standard",
    description: "Hints after a few tries, vocabulary appears after success moments."
  },
  {
    title: "Challenge",
    description: "Minimal hints, vocabulary only in the notebook after reflection."
  }
];
