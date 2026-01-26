(() => {
  const levels = [
    {
      id: 1,
      name: "Sweet Start",
      goal: { type: "score", target: 800 },
      moves: 18,
      blockers: [],
      difficulty: { shuffleChance: 0.02 }
    },
    {
      id: 2,
      name: "Cherry Burst",
      goal: { type: "collect", tileType: 2, target: 18 },
      moves: 20,
      blockers: [],
      difficulty: { shuffleChance: 0.02 }
    },
    {
      id: 3,
      name: "Frosted Corners",
      goal: { type: "blockers", target: 6 },
      moves: 22,
      blockers: [
        { row: 0, col: 0 }, { row: 0, col: 7 },
        { row: 7, col: 0 }, { row: 7, col: 7 },
        { row: 0, col: 3 }, { row: 7, col: 4 }
      ],
      difficulty: { shuffleChance: 0.03 }
    },
    {
      id: 4,
      name: "Line Blaster",
      goal: { type: "score", target: 1400 },
      moves: 20,
      blockers: [
        { row: 3, col: 3 }, { row: 4, col: 4 }
      ],
      difficulty: { shuffleChance: 0.03 }
    },
    {
      id: 5,
      name: "Citrus Stack",
      goal: { type: "collect", tileType: 4, target: 24 },
      moves: 22,
      blockers: [
        { row: 2, col: 2 }, { row: 2, col: 5 },
        { row: 5, col: 2 }, { row: 5, col: 5 }
      ],
      difficulty: { shuffleChance: 0.04 }
    },
    {
      id: 6,
      name: "Icy Cross",
      goal: { type: "blockers", target: 10 },
      moves: 24,
      blockers: [
        { row: 1, col: 3 }, { row: 2, col: 3 }, { row: 3, col: 3 },
        { row: 4, col: 3 }, { row: 5, col: 3 },
        { row: 3, col: 1 }, { row: 3, col: 2 },
        { row: 3, col: 4 }, { row: 3, col: 5 },
        { row: 3, col: 6 }
      ],
      difficulty: { shuffleChance: 0.04 }
    },
    {
      id: 7,
      name: "Color Pop",
      goal: { type: "score", target: 2000 },
      moves: 22,
      blockers: [],
      difficulty: { shuffleChance: 0.05 }
    },
    {
      id: 8,
      name: "Berry Mix",
      goal: { type: "collect", tileType: 1, target: 28 },
      moves: 24,
      blockers: [
        { row: 1, col: 1 }, { row: 1, col: 6 },
        { row: 6, col: 1 }, { row: 6, col: 6 }
      ],
      difficulty: { shuffleChance: 0.05 }
    },
    {
      id: 9,
      name: "Frozen Path",
      goal: { type: "blockers", target: 14 },
      moves: 26,
      blockers: [
        { row: 0, col: 2 }, { row: 1, col: 2 }, { row: 2, col: 2 },
        { row: 3, col: 2 }, { row: 4, col: 2 },
        { row: 3, col: 0 }, { row: 3, col: 1 }, { row: 3, col: 3 },
        { row: 3, col: 4 }, { row: 3, col: 5 },
        { row: 5, col: 5 }, { row: 6, col: 5 }, { row: 7, col: 5 },
        { row: 2, col: 6 }
      ],
      difficulty: { shuffleChance: 0.05 }
    },
    {
      id: 10,
      name: "Teacher's Delight",
      goal: { type: "score", target: 2800 },
      moves: 26,
      blockers: [
        { row: 2, col: 3 }, { row: 2, col: 4 },
        { row: 5, col: 3 }, { row: 5, col: 4 }
      ],
      difficulty: { shuffleChance: 0.06 }
    }
  ];

  window.BrainCrushLevels = levels;
})();
