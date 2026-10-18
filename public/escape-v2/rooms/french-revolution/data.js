window.ESCAPE_V2_DATA = {
  id: 'french-revolution-bastille',
  title: 'Escape the Bastille',
  eyebrow: 'FRENCH REVOLUTION ESCAPE ROOM',
  displayRoomCount: 3,
  timeLimitSeconds: 1500,
  story: [
    'Paris is on the edge of revolt. It is July 1789, and you are being held inside the Bastille while anger against royal authority spreads through the city. Shouts echo beyond the stone walls. Guards are distracted, prisoners are restless, and for the first time an escape may be possible.',
    'A fellow prisoner has found a way through part of the cell block, but he will not risk opening your door unless you can prove you understand what is happening outside. Search the cell, solve the five hidden challenges, and assemble the phrase that will convince him to let you out. If you escape the cell, you will still need to cross a guard office and the outer wall before time runs out.'
  ],
  plannedRooms: [
    { id: 'cell', title: 'The Prison Cell', size: 'large', clueCount: 5 },
    { id: 'guard-office', title: 'The Guard Office', size: 'small', clueCount: 3 },
    { id: 'outer-wall', title: 'The Outer Wall', size: 'medium', clueCount: 4 }
  ],
  rooms: [
    {
      id: 'cell',
      label: 'ROOM 1 OF 3',
      title: 'The Prison Cell',
      size: 'large',
      objective: 'Find five clues and determine the phrase that will convince the escaped prisoner to open your door.',
      scene: {
        dimensions: [10, 5.6, 10],
        textureSeed: 1789,
        background: '#151613',
        fog: '#27231d',
        lighting: {
          hemisphere: { sky: 0xaec5df, ground: 0x261e17, intensity: 1.15 },
          ambient: { color: 0xffe2c2, intensity: 0.36 },
          key: { color: 0xbdd9ff, intensity: 1.65, position: [-3.2, 5.3, -4.1], castShadow: false },
          points: [
            { color: 0xff9845, intensity: 28, distance: 10, position: [4.15, 3.0, -4.4] },
            { color: 0xffc47a, intensity: 7, distance: 7, position: [3.5, 2.1, -3.5] }
          ]
        },
        openings: [
          { kind: 'barred-window', wall: 'front', x: -2.6, y: 4.0, width: 1.65, height: 1.55 },
          { kind: 'barred-door', wall: 'front', x: 3.05, y: 1.4, width: 1.8, height: 2.8 }
        ],
        props: [
          { kind: 'table', position: [-3.0, 0, -2.15], rotation: -0.12 },
          { kind: 'crate', position: [-3.85, 0, -1.55] },
          { kind: 'torch', position: [4.35, 3.0, -4.78], rotation: -Math.PI / 2 },
          { kind: 'papers', position: [-3.0, 1.02, -2.15] },
          { kind: 'bed', position: [3.45, 0, -1.0], rotation: Math.PI / 2 },
          { kind: 'writing', position: [-4.83, 2.0, 0.15], rotation: Math.PI / 2 },
          { kind: 'chain', position: [3.45, 0.03, -3.55], rotation: -0.2 },
          { kind: 'cup', position: [3.85, 0.02, -3.35] }
        ],
        interactables: [
          { id: 'papers', position: [-3.0, 1.04, -2.15], hitRadius: 0.62, radius: 0.38 },
          { id: 'bed', position: [3.45, 0.77, -1.0], hitRadius: 0.8, radius: 0.45 },
          { id: 'window', position: [-2.6, 4.0, -4.78], hitRadius: 0.82, radius: 0.46, rotation: [0,0,0] },
          { id: 'wall', position: [-4.78, 2.0, 0.15], hitRadius: 0.8, radius: 0.44, rotation: [0,Math.PI/2,0] },
          { id: 'chain', position: [3.55, 0.36, -3.48], hitRadius: 0.72, radius: 0.42 }
        ]
      },
      hotspots: [
        {
          id: 'papers', yaw: -124, pitch: -22,
          title: 'Scattered Papers', kicker: 'CELL CLUE 1 OF 5',
          prompt: 'A smuggled pamphlet describes a society divided into three estates. Which group contained the overwhelming majority of the French population but had the least political privilege?',
          type: 'choice',
          choices: ['First Estate — clergy', 'Second Estate — nobility', 'Third Estate — everyone else', 'Royal household'],
          answer: 2,
          clueTitle: 'Phrase Fragment I', clue: 'LIBERTY',
          learning: 'The Third Estate included commoners from wealthy professionals to urban workers and peasants. It represented most of the population while the privileged estates retained important advantages.'
        },
        {
          id: 'bed', yaw: -13, pitch: -14,
          title: 'Hidden Prisoner Note', kicker: 'CELL CLUE 2 OF 5',
          prompt: 'A note hidden in the bedding mentions Enlightenment thinkers who challenged absolute authority. Which idea most directly threatened the claim that a king should rule without meaningful limits?',
          type: 'choice',
          choices: ['Political authority should rest on the consent and rights of the people', 'Nobles should pay no taxes', 'Trade should be banned', 'The monarchy should control every printed book'],
          answer: 0,
          clueTitle: 'Phrase Fragment II', clue: 'BELONGS',
          learning: 'Enlightenment arguments about natural rights, consent, and limits on government helped shape revolutionary criticism of absolute monarchy.'
        },
        {
          id: 'window', yaw: 19, pitch: 38,
          title: 'View Through the Bars', kicker: 'CELL CLUE 3 OF 5',
          prompt: 'Through the barred window you hear Parisians demanding weapons and gunpowder. Why did the Bastille become such a powerful target on July 14, 1789?',
          type: 'choice',
          choices: ['It symbolized royal authority and also held weapons or gunpowder the crowd wanted', 'It was the royal palace', 'It housed the National Assembly', 'It was France’s largest food market'],
          answer: 0,
          clueTitle: 'Phrase Fragment III', clue: 'TO',
          learning: 'The Bastille was a royal fortress and prison associated with arbitrary royal power. The attacking crowd also sought gunpowder stored there.'
        },
        {
          id: 'wall', yaw: 63, pitch: 6,
          title: 'Writing on the Wall', kicker: 'CELL CLUE 4 OF 5',
          prompt: 'Someone scratched a reminder into the stone: “The nation is more than the king.” In June 1789, members of the Third Estate declared themselves what new representative body?',
          type: 'text',
          answer: ['national assembly', 'the national assembly'],
          placeholder: 'Type the name of the body',
          clueTitle: 'Phrase Fragment IV', clue: 'THE',
          learning: 'In June 1789, deputies of the Third Estate declared themselves the National Assembly, claiming authority to represent the French nation.'
        },
        {
          id: 'chain', yaw: 9, pitch: -35,
          title: 'Broken Chain and Cup', kicker: 'CELL CLUE 5 OF 5',
          prompt: 'A final scrap asks what most directly fueled popular anger in Paris during the crisis of 1789.',
          type: 'choice',
          choices: ['Falling bread prices and plentiful food', 'Food shortages, high bread prices, taxation, and distrust of royal power', 'A successful foreign invasion', 'The abolition of all taxes before the revolution'],
          answer: 1,
          clueTitle: 'Phrase Fragment V', clue: 'PEOPLE',
          learning: 'Economic hardship, bread prices, fiscal crisis, political conflict, and fear of royal repression all contributed to unrest in 1789.'
        }
      ],
      solution: {
        kicker: 'ROOM 1 SOLUTION',
        title: 'Convince the Prisoner',
        prompt: 'The five fragments form the password. Enter the complete phrase to convince the escaped prisoner that you are an ally.',
        type: 'text',
        answer: ['liberty belongs to the people'],
        placeholder: 'Enter the five-part phrase',
        successMessage: 'A voice answers from the corridor. “You understand.” Metal scrapes against stone. The lock turns, and the cell door opens.'
      }
    }
  ],
  review: {
    title: 'Room 1 complete',
    summary: 'You escaped the Bastille prison cell by connecting five historical clues to the political and economic tensions surrounding the French Revolution.',
    outro: 'The cell door is open. This milestone intentionally ends here so the true-360 Room 1 experience can be approved before the guard office is built.'
  }
};
