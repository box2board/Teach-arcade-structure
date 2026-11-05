window.ESCAPE_V2_DATA = {
  id: "engine-prototype",
  title: "The Sealed Archive",
  eyebrow: "ESCAPE ROOM V2 ENGINE TEST",
  story: [
    "You have entered an old archive to recover a document before the building is sealed. The room itself is your puzzle: useful evidence has been left among ordinary objects, and every discovery contributes to the final way out.",
    "Look around the entire room. Open each marked object, solve its challenge, and record the clue it reveals. When every clue has been recovered, combine what you learned to unlock the room solution."
  ],
  timeLimitSeconds: 900,
  settings: {
    roomCountMin: 3,
    roomCountMax: 5,
    roomSizes: { small: 3, medium: 4, large: 5 },
    failureMode: "timer-only"
  },
  rooms: [
    {
      id: "prototype-room",
      label: "ROOM 1",
      title: "The Sealed Archive",
      size: "medium",
      objective: "Recover all four clue fragments and determine the phrase that opens the exit.",
      panorama: "/escape-v2/rooms/prototype/assets/prototype-panorama.svg",
      startYaw: 0,
      fov: 100,
      hotspots: [
        {
          id: "ledger",
          label: "1",
          yaw: 320,
          pitch: 2,
          title: "Dusty Ledger",
          kicker: "OBJECT 1 OF 4",
          prompt: "A note beside the ledger says: ‘The archive opens with understanding, not guessing.’ Which action best represents historical inquiry?",
          type: "choice",
          choices: [
            "Accept the first explanation you hear",
            "Compare evidence before reaching a conclusion",
            "Ignore sources that disagree",
            "Choose the answer with the most dramatic story"
          ],
          answer: 1,
          clueTitle: "Clue Fragment I",
          clue: "OPEN",
          learning: "Historical inquiry depends on comparing evidence and evaluating sources before reaching a conclusion."
        },
        {
          id: "clock",
          label: "2",
          yaw: 42,
          pitch: 19,
          title: "Stopped Clock",
          kicker: "OBJECT 2 OF 4",
          prompt: "The clock face is frozen at 8:15. A scratched message reads: ‘Write the time using four digits.’",
          type: "text",
          answer: ["0815", "8:15", "815"],
          placeholder: "Enter the time",
          clueTitle: "Clue Fragment II",
          clue: "THE",
          learning: "Clues can communicate information through numbers, symbols, and context rather than direct statements."
        },
        {
          id: "map",
          label: "3",
          yaw: 128,
          pitch: 9,
          title: "Pinned Map",
          kicker: "OBJECT 3 OF 4",
          prompt: "A card on the map reads: ‘Context tells you where an event fits.’ Which question is most useful for establishing historical context?",
          type: "choice",
          choices: [
            "What else was happening at the same time?",
            "Was the paper folded neatly?",
            "Is the title written in large letters?",
            "How many sentences are on the page?"
          ],
          answer: 0,
          clueTitle: "Clue Fragment III",
          clue: "WAY",
          learning: "Historical context connects an event to the conditions, ideas, people, and events surrounding it."
        },
        {
          id: "cabinet",
          label: "4",
          yaw: 221,
          pitch: -4,
          title: "Locked Cabinet",
          kicker: "OBJECT 4 OF 4",
          prompt: "Three labels appear on the cabinet: SOURCE, CLAIM, EVIDENCE. Which one should support a historical claim?",
          type: "text",
          answer: ["evidence"],
          placeholder: "Type one word",
          clueTitle: "Clue Fragment IV",
          clue: "FORWARD",
          learning: "Historical claims should be supported by relevant evidence from reliable sources."
        }
      ],
      solution: {
        title: "Unlock the Exit",
        kicker: "ROOM SOLUTION",
        prompt: "Arrange the four recovered clue fragments into the phrase that opens the archive door.",
        type: "text",
        answer: ["open the way forward"],
        placeholder: "Enter the phrase",
        successMessage: "The mechanism releases. The test room is complete."
      }
    }
  ],
  review: {
    title: "Prototype escaped",
    summary: "This vertical slice confirms the core V2 loop: explore a 360-degree scene, investigate objects, solve challenges, collect persistent clues, and use those clues to complete a room.",
    outro: "Future room packs can replace the prototype art and content without changing the engine."
  }
};
