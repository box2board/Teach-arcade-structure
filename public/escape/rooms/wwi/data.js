// Room content and learning feedback are separate from the reusable engine.
window.ROOM_DATA = {
  id: 'wwi',
  title: 'Escape from the Trenches',
  missionQuestion: 'How did a crisis in Sarajevo widen into a world war, and why did the United States enter later?',
  completion: 'You reconstructed the dispatch by weighing evidence, tracing cause and effect, and connecting events across time. The signal reaches HQ; the unit is safe.',
  finalReport: {
    question: 'How did a crisis in Sarajevo widen into a world war, and why did the United States enter later?',
    answer: 'Europe was already tense from militarism, alliances, imperial competition, and nationalism. The assassination of Archduke Franz Ferdinand in Sarajevo triggered the July Crisis; declarations of war, mobilization, and Germany’s invasion of Belgium widened the conflict. The Lusitania sinking influenced U.S. opinion but did not bring immediate entry. Renewed unrestricted submarine warfare and the Zimmermann Telegram contributed to U.S. entry in 1917. The Armistice ended the fighting on November 11, 1918.',
    clueIds: ['main-map', 'sarajevo-date', 'lusitania-date', 'telegram-year', 'armistice-year']
  },
  debrief: [
    { label: 'Long-term pressures:', text: 'Militarism, alliances, imperial competition, and nationalism made Europe tense before 1914.' },
    { label: 'The spark:', text: 'The assassination in Sarajevo began the July Crisis; decisions and alliances helped turn it into a wider war.' },
    { label: 'The United States:', text: 'The Lusitania affected public opinion, while unrestricted submarine warfare and the Zimmermann Telegram contributed to U.S. entry in 1917.' },
    { label: 'Historical thinking:', text: 'Large events usually have several causes. Evidence helps us distinguish a trigger from deeper conditions and later consequences.' }
  ],
  scenes: [
    {
      id: 'dispatch', type: 'Mission briefing', kind: 'intro', kicker: 'INCOMING TRANSMISSION', title: 'A message in the static',
      prompt: 'The field radio is failing. Headquarters needs your help before the next barrage.',
      body: 'You are a signal team on the Western Front in 1918. A damaged dispatch contains a warning about how the war began and how it spread. Reconstruct it by examining the evidence in the operations room. Your job is to explain the chain of events, not just name dates.',
      objectives: ['Distinguish a trigger from long-term causes.', 'Interpret what a historical source can and cannot prove.', 'Trace how decisions widened the war.', 'Use your evidence cards to answer HQ’s question.'],
      learn: 'This mission practices historical reasoning: reading evidence, identifying long-term causes, and explaining how one event can lead to another.',
      reflect: 'As you work, ask: what does this clue prove, and what does it not prove?',
      reward: 'Field radio', journal: 'Mission: reconstruct the dispatch by connecting evidence, causes, and consequences.'
    },
    {
      id: 'sarajevo', type: 'Evidence analysis', kind: 'choice', kicker: 'ROOM 01 · THE SPARK', title: 'The Sarajevo dossier',
      evidence: [
        { label: 'Dispatch · 28 June 1914', text: 'Archduke Franz Ferdinand and his wife were assassinated in Sarajevo by Gavrilo Princip.', source: 'Event report' },
        { label: 'Diplomatic map', text: 'Serbia and Austria-Hungary were at odds. Other European powers had alliances and competing interests.', source: 'Context note' },
        { label: 'Analyst margin note', text: 'A spark can start a fire, but it does not explain why the fire spreads.', source: 'Undated note' }
      ],
      prompt: 'Which conclusion best uses all three clues?',
      options: [
        { id: 'trigger', label: 'The assassination triggered a crisis; existing tensions help explain why it widened.' },
        { id: 'single', label: 'The assassination alone made a continent-wide war unavoidable.' },
        { id: 'usa', label: 'The assassination caused the United States to enter the war in 1914.' },
        { id: 'submarine', label: 'The assassination was a German submarine attack.' }
      ], answer: 'trigger', wrong: 'Separate the immediate trigger from the conditions that allowed the crisis to spread.',
      hints: ['The margin note distinguishes a spark from the conditions around it.', 'The assassination began the July Crisis, but it did not act alone.', 'Choose the claim that separates the trigger from the wider tensions.'],
      learn: 'The assassination was the immediate trigger of the July Crisis. It did not by itself make a world war inevitable; diplomatic choices, rivalries, and alliances shaped how the crisis spread.',
      reflect: 'What is one difference between a trigger and a long-term cause?',
      clueReward: { id: 'sarajevo-date', label: 'Sarajevo dossier', detail: 'Spark event: assassination of Franz Ferdinand in Sarajevo · 28 June 1914.' },
      journal: 'The assassination triggered the July Crisis; Europe’s deeper tensions shaped what followed.'
    },
    {
      id: 'main', type: 'Cause classification', kind: 'match', kicker: 'ROOM 02 · LONG-TERM CAUSES', title: 'The pressure map',
      requiresClues: ['sarajevo-date'],
      prompt: 'The Sarajevo dossier gives you the spark date. Now sort the pressures that were already building before that event. Match each situation to the cause it represents.',
      categories: [
        { id: 'militarism', label: 'Militarism' }, { id: 'alliances', label: 'Alliances' },
        { id: 'imperialism', label: 'Imperialism' }, { id: 'nationalism', label: 'Nationalism' }
      ],
      pairs: [
        { label: 'A government expands its army and battleship fleet to compete with rivals.', answer: 'militarism' },
        { label: 'Countries promise to support one another if attacked.', answer: 'alliances' },
        { label: 'Powerful nations compete to control colonies and resources.', answer: 'imperialism' },
        { label: 'People place intense loyalty in their nation or demand self-rule.', answer: 'nationalism' }
      ],
      wrong: 'Look at what each example focuses on: military buildup, promises between states, empire, or national identity.',
      hints: ['One clue is about armed forces; one is about promises between governments.', 'Colonies point to imperialism. National identity points to nationalism.', 'Match fleet → militarism, promises → alliances, colonies → imperialism, identity → nationalism.'],
      learn: 'M.A.I.N. is a useful way to organize four pressures: Militarism, Alliances, Imperialism, and Nationalism. They interacted; the acronym is a framework, not a claim that one factor alone caused the war.',
      reflect: 'Which two pressures could reinforce each other? Explain how.',
      clueReward: { id: 'main-map', label: 'M.A.I.N. pressure map', detail: 'Militarism · Alliances · Imperialism · Nationalism. These pressures built before the Sarajevo assassination.' },
      journal: 'M.A.I.N. organizes four interacting pressures: militarism, alliances, imperialism, and nationalism.'
    },
    {
      id: 'atlantic', type: 'Source interpretation', kind: 'choice', kicker: 'ROOM 03 · ATLANTIC INTELLIGENCE', title: 'The passenger liner',
      requiresClues: ['main-map'],
      evidence: [
        { label: 'Ship report · 7 May 1915', text: 'A German U-boat torpedoed the British passenger liner Lusitania. About 1,200 people died, including 128 U.S. citizens.', source: 'Casualty summary' },
        { label: 'Policy timeline', text: 'The United States remained neutral until April 1917, after Germany resumed unrestricted submarine warfare and other tensions grew.', source: 'U.S. timeline' }
      ],
      prompt: 'Which interpretation is best supported by the evidence?',
      options: [
        { id: 'careful', label: 'The sinking increased outrage, but it was one part of a longer path to U.S. entry.' },
        { id: 'immediate', label: 'The sinking caused the United States to declare war in May 1915.' },
        { id: 'only', label: 'The ship report proves the Lusitania was the only reason the United States joined.' },
        { id: 'end', label: 'The sinking immediately ended submarine warfare.' }
      ], answer: 'careful', wrong: 'Compare the event date with the U.S. entry date. Does the timeline support an immediate or single-cause explanation?',
      hints: ['The timeline says the U.S. remained neutral after the sinking.', 'The event influenced opinion, but U.S. entry came later.', 'Choose the interpretation that treats the sinking as significant without calling it the only cause.'],
      learn: 'The Lusitania’s sinking caused outrage, especially because U.S. citizens died. The United States did not enter the war immediately, though; unrestricted submarine warfare resumed in 1917 and the Zimmermann Telegram also contributed to the decision.',
      reflect: 'Why is “one contributing factor” often more accurate than “the cause”?',
      clueReward: { id: 'lusitania-date', label: 'Atlantic incident report', detail: 'Lusitania sunk by a German U-boat · 7 May 1915. The U.S. remained neutral after the sinking.' },
      journal: 'The Lusitania influenced U.S. opinion but did not bring immediate entry into the war.'
    },
    {
      id: 'intercept', type: 'Telegram analysis', kind: 'choice', kicker: 'ROOM 04 · INTERCEPTED MESSAGE', title: 'Read between the lines',
      requiresClues: ['lusitania-date'],
      evidence: [
        { label: 'Intercept · January 1917', text: 'Classroom paraphrase: Germany planned to resume unrestricted submarine warfare, hoped the United States would remain neutral, and proposed an alliance with Mexico if the U.S. entered the war.', source: 'Zimmermann Telegram' },
        { label: 'Strategic context', text: 'Germany expected renewed submarine attacks could bring the United States into the conflict.', source: 'Analyst summary' }
      ],
      prompt: 'What strategy can you infer from the message and its context?',
      options: [
        { id: 'strategy', label: 'Germany hoped to keep the U.S. out while preparing a partnership with Mexico if that failed.' },
        { id: 'conquer', label: 'Germany had already conquered Mexico and wanted the U.S. to recognize it.' },
        { id: 'peace', label: 'Germany offered to end the war if the United States stayed neutral.' },
        { id: 'neutral', label: 'The message proves Germany expected the U.S. to enter in 1915.' }
      ], answer: 'strategy', wrong: 'Use both parts of the paraphrase: what Germany hoped would happen, and what it proposed if the U.S. entered.',
      hints: ['The message describes a preferred outcome and a backup plan.', 'Germany hoped the U.S. would stay neutral; the proposed alliance was conditional.', 'Choose the option that includes both neutrality and the contingency with Mexico.'],
      learn: 'The telegram shows German leaders trying to manage the risk of U.S. entry: they hoped the U.S. would remain neutral, while proposing an alliance with Mexico if it did not. The message became public in 1917 and helped turn U.S. opinion against Germany.',
      reflect: 'How does this source reveal what German leaders feared?',
      clueReward: { id: 'telegram-year', label: 'Zimmermann intercept', detail: 'Germany proposed an alliance with Mexico if the U.S. entered the war. The telegram became public in 1917.' },
      journal: 'The Zimmermann Telegram reveals Germany’s attempt to keep the U.S. neutral and its contingency plan with Mexico.'
    },
    {
      id: 'transmission', type: 'Causation sequence', kind: 'order', kicker: 'ROOM 05 · REBUILD THE TIMELINE', title: 'How the crisis widened',
      requiresClues: ['telegram-year'],
      prompt: 'Put the events in chronological order. Then use the sequence to explain how a regional crisis became a much wider war.',
      items: [
        { id: 'assassination', label: 'Franz Ferdinand is assassinated in Sarajevo.' },
        { id: 'serbia', label: 'Austria-Hungary declares war on Serbia.' },
        { id: 'russia', label: 'Russia mobilizes; Germany declares war on Russia and France.' },
        { id: 'belgium', label: 'Germany invades Belgium; Britain enters the war.' },
        { id: 'usa', label: 'The United States enters the war in 1917 after escalating tensions.' },
        { id: 'armistice', label: 'The Armistice takes effect on 11 November 1918.' }
      ], answer: ['assassination', 'serbia', 'russia', 'belgium', 'usa', 'armistice'],
      hints: ['Begin with the assassination in June 1914.', 'The U.S. entry is in 1917; the Armistice ending the fighting is in 1918.', 'Assassination → declaration against Serbia → mobilization and declarations → invasion of Belgium and British entry → U.S. entry → Armistice.'],
      learn: 'The timeline shows escalation rather than a single instant when “world war” began. The assassination triggered the crisis; declarations, mobilization, and the invasion of Belgium widened the conflict. U.S. entry came in 1917, and the Armistice ended the fighting on 11 November 1918.',
      reflect: 'Which step most clearly shows how alliances and military decisions widened the conflict? Use one event as evidence.',
      clueReward: { id: 'armistice-year', label: 'Armistice date', detail: 'The Armistice ending the fighting took effect on 11 November 1918.' },
      journal: 'The timeline connects the 1914 July Crisis to wider war, U.S. entry in 1917, and the Armistice in 1918.'
    },
    {
      id: 'combination', type: 'Combination lock', kind: 'text', kicker: 'FINAL LOCK · USE YOUR EVIDENCE', title: 'Open the transmission case',
      requiresClues: ['sarajevo-date', 'main-map', 'lusitania-date', 'telegram-year', 'armistice-year'],
      prompt: 'The case takes five numbers. Start with the number of long-term pressures on your M.A.I.N. card. Then use the last two digits of the years on the Sarajevo, Lusitania, U.S. entry / telegram, and Armistice cards—in chronological order.',
      label: 'Evidence combination', placeholder: 'Example format: 4-14-15-17-18', answers: ['414151718', '4-14-15-17-18', '4 14 15 17 18'],
      wrong: 'Use the M.A.I.N. card for the number of pressures, then add the four event years in order: Sarajevo, Lusitania, U.S. entry, Armistice.',
      hints: ['There are four long-term pressures. The clue cards hold four important years.', 'The years are 1914, 1915, 1917, and 1918.', 'Join 4 with the last two digits of each year: 4 · 14 · 15 · 17 · 18.'],
      learn: 'The final code was built from evidence collected along the way: four M.A.I.N. pressures, then Sarajevo (1914), Lusitania (1915), U.S. entry and the telegram (1917), and the Armistice (1918). Reading the cards in order turns the clues into a chronology.',
      reflect: 'Which clue changed how you understood the causes or course of the war?',
      clueReward: { id: 'final-code', label: 'Transmission case opened', detail: 'The dates form the chronology code 14 · 15 · 17 · 18.' },
      journal: 'The four clue dates opened the transmission case.'
    }
  ]
};
