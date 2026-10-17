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
      panorama: null,
      startYaw: -6,
      startPitch: -5,
      hfov: 90,
      minHfov: 82,
      maxHfov: 98,
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
