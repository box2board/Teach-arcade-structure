// Room content and learning feedback are separate from the reusable escape engine.
window.ROOM_DATA = {
  id: 'scientific-method',
  title: 'The Last Light Lab',
  missionQuestion: 'What can the seedling experiment show, and what evidence is still needed before the vault can be safely reset?',
  completion: 'You restored the seed vault by interpreting the experiment carefully, checking how the test was designed, and separating a supported result from a claim the evidence cannot yet prove.',
  difficultyLevels: [
    { id: 'easy', label: 'Easy', description: 'A guided investigation with core experiment clues. Reasoning notes are optional.' },
    { id: 'medium', label: 'Medium', description: 'Evaluate evidence quality and plan a stronger follow-up test. Save a short evidence-based note after every puzzle.' },
    { id: 'hard', label: 'Hard', description: 'Inspect limitations, decode a multi-part methods lock, and defend a cautious conclusion in writing.' }
  ],
  difficultyProfiles: {
    easy: {
      label: 'Easy', requireReasoning: false,
      sceneOrder: ['dispatch', 'trial-results', 'variable-map', 'fair-test', 'final-decision']
    },
    medium: {
      label: 'Medium', requireReasoning: true, minReasoningLength: 25,
      sceneOrder: ['dispatch', 'trial-results', 'variable-map', 'fair-test', 'source-check', 'replication', 'final-decision']
    },
    hard: {
      label: 'Hard', requireReasoning: true, minReasoningLength: 50,
      sceneOrder: ['dispatch', 'trial-results', 'variable-map', 'fair-test', 'source-check', 'replication', 'claim-lock', 'final-decision']
    }
  },
  finalReport: {
    question: 'What can this seedling test support, and what should researchers do next?',
    answer: 'In this test, seedlings receiving more hours of light had greater average height after five days. The result supports a relationship under these conditions, but a single short experiment does not establish that longer light always causes better growth. Repeating the test with more seedlings and keeping other conditions constant would provide stronger evidence.',
    clueIds: ['trial-evidence', 'variable-card', 'fair-test-card']
  },
  debrief: [
    { label: 'Observation:', text: 'The 10-hour group had the greatest average height in the recorded five-day test.' },
    { label: 'Test design:', text: 'Hours of light were changed while seed type, soil, water, and temperature were kept constant.' },
    { label: 'Limit of the evidence:', text: 'A result from one short trial supports a cautious conclusion about these conditions, not a universal rule.' },
    { label: 'Next step:', text: 'Repeat with more seedlings and multiple trials before making a broader recommendation.' }
  ],
  scenes: [
    {
      id: 'dispatch', type: 'Mission briefing', kind: 'intro', kicker: 'GREENHOUSE ALERT · NIGHT SHIFT', title: 'The last light lab',
      prompt: 'The seed vault has entered emergency mode. Its reset terminal will not accept guesses; it needs a conclusion supported by the experiment log.',
      body: 'You are the overnight research team at a school seed bank. A power fault locked the backup system, and the greenhouse will lose its stable temperature if the system is not restored. The previous team was testing how light exposure relates to seedling growth. Review their records, check whether the test was fair, and tell the terminal what the evidence supports.',
      objectives: ['Identify what the experiment changed and measured.', 'Use results to make a careful claim.', 'Notice what a single trial cannot prove.', 'Choose a follow-up test that improves the evidence.'],
      learn: 'Scientific investigations connect a question, a controlled test, recorded observations, and a conclusion limited to what the evidence can support.',
      reflect: 'Keep asking: what was measured, what was changed, and what stayed the same?',
      reward: 'Vault access', journal: 'Mission: recover the experiment record and make an evidence-based recommendation.'
    },
    {
      id: 'trial-results', type: 'Evidence analysis', kind: 'choice', kicker: 'ROOM 01 · READ THE GROWTH LOG', title: 'Three trays, one test',
      evidence: [
        { label: 'Greenhouse trial · Day 5', text: 'Average seedling height: 2 hours of light = 3 cm; 6 hours = 8 cm; 10 hours = 12 cm. Five seedlings were measured at each setting.', source: 'Digital growth log' },
        { label: 'Conditions record', text: 'All trays used the same seed type, soil, water amount, and temperature. This was one five-day trial.', source: 'Lab notebook' }
      ],
      prompt: 'Which conclusion is best supported by these records?',
      options: [
        { id: 'cautious', label: 'In this trial, the longer-light groups had greater average height; more testing is needed before making a general rule.' },
        { id: 'always', label: 'The results prove that every plant grows best with exactly 10 hours of light.' },
        { id: 'water', label: 'The seedlings grew taller because the 10-hour group received more water.' },
        { id: 'no-pattern', label: 'The records show no relationship between light time and average height.' }
      ], answer: 'cautious',
      wrong: 'Compare the recorded heights, then limit your claim to this test. The log does not prove a rule for every plant or every setting.',
      hints: ['The averages rise across the three light settings.', 'Use wording that describes this trial rather than all plants everywhere.', 'Choose the claim that reports the pattern and still calls for more testing.'],
      learn: 'The data show a pattern in this trial: the groups with more hours of light had greater average height. One trial does not establish a universal rule or rule out every possible explanation.',
      reflect: 'What does the height data show directly? What would be too strong a claim?',
      clueReward: { id: 'trial-evidence', label: 'Growth log', detail: 'Average heights rose from 3 cm to 8 cm to 12 cm across the 2-, 6-, and 10-hour light settings. It is one five-day trial.' },
      journal: 'The growth log shows a pattern, but the conclusion must stay within the limits of one trial.'
    },
    {
      id: 'variable-map', type: 'Variable analysis', kind: 'match', kicker: 'ROOM 02 · MAP THE VARIABLES', title: 'Inside the test chamber',
      requiresClues: ['trial-evidence'],
      prompt: 'The vault terminal needs to know whether the team changed one factor at a time. Match each part of the setup to its role.',
      categories: [
        { id: 'independent', label: 'Independent variable · changed' },
        { id: 'dependent', label: 'Dependent variable · measured' },
        { id: 'controlled', label: 'Controlled variables · kept the same' }
      ],
      pairs: [
        { label: 'Hours of light each tray received', answer: 'independent' },
        { label: 'Average seedling height on Day 5', answer: 'dependent' },
        { label: 'Seed type, soil, water amount, and temperature', answer: 'controlled' }
      ],
      wrong: 'Ask what the researchers deliberately changed, what they measured as an outcome, and what they held steady.',
      hints: ['The independent variable is the factor the team changed on purpose.', 'Height is the outcome recorded in the growth log.', 'Light time changed; height was measured; the other listed conditions stayed the same.'],
      learn: 'A controlled test changes the independent variable, measures a dependent variable, and keeps other relevant conditions steady so the comparison is meaningful.',
      reflect: 'Why would changing water amount along with light make the height results harder to interpret?',
      clueReward: { id: 'variable-card', label: 'Variable map', detail: 'Changed: hours of light. Measured: average seedling height. Held constant: seed type, soil, water, and temperature.' },
      journal: 'The variable map identifies light time as the changed factor and seedling height as the measured outcome.'
    },
    {
      id: 'fair-test', type: 'Investigation sequence', kind: 'order', kicker: 'ROOM 03 · RESTORE THE PROTOCOL', title: 'Rebuild the test procedure',
      requiresClues: ['variable-card'],
      prompt: 'The procedure card was scrambled during the power fault. Put the steps in a sequence that produces usable evidence.',
      items: [
        { id: 'question', label: 'Ask a testable question about light time and seedling growth.' },
        { id: 'prediction', label: 'Make a prediction that can be checked with measurements.' },
        { id: 'test', label: 'Change only the planned light exposure while holding other conditions steady.' },
        { id: 'record', label: 'Measure the seedlings consistently and compare the recorded results.' }
      ],
      answer: ['question', 'prediction', 'test', 'record'],
      hints: ['Start with the question; data cannot answer a question that has not been set.', 'A prediction comes before running the test.', 'Ask → predict → test one changed factor → measure and compare.'],
      wrong: 'Use Undo to revise the order. The question and prediction come before the controlled test and its measurements.',
      learn: 'A clear question and prediction guide the investigation. A fair test changes the planned factor, records measurements consistently, and compares results.',
      reflect: 'Why should the team decide how to measure growth before it begins the next trial?',
      clueReward: { id: 'fair-test-card', label: 'Fair-test protocol', detail: 'Ask a testable question, make a prediction, change one factor while controlling others, then measure and compare.' },
      journal: 'The rebuilt procedure changes one factor and measures the result consistently.'
    },
    {
      id: 'source-check', type: 'Source evaluation', kind: 'choice', kicker: 'ROOM 04 · CHECK THE RECORD', title: 'Log or opinion?',
      evidence: [
        { label: 'Sensor export', text: 'A timestamped file records light settings and daily height measurements for each tray.', source: 'Automated greenhouse record' },
        { label: 'Shift note', text: '“Ten hours is definitely the perfect amount of light for every seed.” No supporting measurements are attached.', source: 'Research assistant note' }
      ],
      prompt: 'Which statement best describes what the sensor export can support?',
      options: [
        { id: 'records', label: 'It can support claims about the recorded settings and measurements; the broad “perfect for every seed” claim needs more evidence.' },
        { id: 'proves-all', label: 'It proves that 10 hours is perfect for every kind of seed.' },
        { id: 'opinion-equal', label: 'The shift note and sensor export are equally strong evidence for a universal claim.' },
        { id: 'no-use', label: 'A digital record cannot be used as evidence because a machine created it.' }
      ], answer: 'records',
      wrong: 'Separate the measurements the file records from the assistant’s much broader claim about every seed.',
      hints: ['The export records this test; the note makes a claim beyond this test.', 'Evidence can support a narrow statement without proving a universal one.', 'Choose the statement that respects what was measured and what was not.'],
      learn: 'A source can be useful for some claims but not others. Recorded measurements support statements about this test; they do not automatically validate a broad recommendation.',
      reflect: 'What additional evidence would you want before accepting the shift note’s claim?',
      clueReward: { id: 'source-review', label: 'Source review', detail: 'The sensor export documents this test. It does not establish what is best for every seed.' },
      journal: 'The team separated recorded measurements from an unsupported universal claim.'
    },
    {
      id: 'replication', type: 'Follow-up design', kind: 'choice', kicker: 'ROOM 05 · STRENGTHEN THE EVIDENCE', title: 'Run it again?',
      requiresClues: ['trial-evidence', 'variable-card'],
      prompt: 'The terminal asks for the strongest next step before researchers make a greenhouse-wide recommendation.',
      options: [
        { id: 'repeat', label: 'Repeat the test with more seedlings and several trials at each light setting, keeping the other conditions constant.' },
        { id: 'change-many', label: 'Change light, water, and temperature together so the next test is faster.' },
        { id: 'stop', label: 'Stop testing because the tallest group already proves the best setting.' },
        { id: 'hide-data', label: 'Use only the 10-hour results and leave out the other trays.' }
      ], answer: 'repeat',
      wrong: 'A stronger follow-up should improve reliability while preserving a fair comparison.',
      hints: ['Repeated measurements help show whether the pattern is consistent.', 'Keep the other variables steady so light exposure can still be compared.', 'Choose the plan that adds more observations without changing several factors at once.'],
      learn: 'Repeating a test with more observations can make a result more reliable. Keeping other relevant factors constant preserves a fair comparison.',
      reflect: 'How would multiple trials make the team’s conclusion more convincing?',
      clueReward: { id: 'repeat-plan', label: 'Replication plan', detail: 'Repeat each light setting with more seedlings and several trials while keeping other conditions constant.' },
      journal: 'The proposed follow-up adds observations while preserving a controlled comparison.'
    },
    {
      id: 'claim-lock', type: 'Methods lock', kind: 'multi', kicker: 'ROOM 06 · VERIFY THE TEST DESIGN', title: 'Two facts to unlock the console',
      evidence: [
        { label: 'Methods summary', text: 'The team assigned different light durations to the trays and recorded average seedling height after five days.', source: 'Experiment protocol' }
      ],
      prompt: 'Enter the factor the team changed and the outcome it measured. Use short scientific terms from the methods summary.',
      parts: [
        { label: 'Factor changed · independent variable', placeholder: 'What did the team change?', answers: ['hours of light', 'light hours', 'light duration', 'light exposure', 'duration of light', 'amount of light'] },
        { label: 'Outcome measured · dependent variable', placeholder: 'What did the team measure?', answers: ['seedling height', 'plant height', 'average seedling height', 'height', 'growth height'] }
      ],
      hints: ['One answer is a setting; the other is a measurement.', 'The changed setting is written as a number of hours. The measured result is in centimeters.', 'Think: light duration was changed; seedling height was measured.'],
      wrong: 'One part needs another look. Identify the setting assigned to each tray and the result recorded in centimeters.',
      learn: 'Correctly identifying the independent and dependent variables helps researchers interpret the results and design a valid follow-up.',
      reflect: 'How could mixing up the changed factor and measured outcome lead to a flawed conclusion?',
      clueReward: { id: 'methods-check', label: 'Methods verified', detail: 'Independent variable: light duration. Dependent variable: seedling height.' },
      journal: 'The methods lock confirms what the team changed and what it measured.'
    },
    {
      id: 'final-decision', type: 'Evidence-based decision', kind: 'choice', kicker: 'FINAL CONSOLE · RESTORE THE VAULT', title: 'Make the call',
      requiresClues: ['trial-evidence', 'variable-card', 'fair-test-card'],
      evidence: [
        { label: 'Recovered evidence', text: 'The 10-hour group had the greatest average height in one five-day trial. Other listed conditions were held constant.', source: 'Growth log + variable map' },
        { label: 'Safety protocol', text: 'The reset must preserve the seed collection and label a conclusion as provisional if evidence is limited.', source: 'Vault operations rule' }
      ],
      prompt: 'Which report should the team submit before restarting the backup system?',
      options: [
        { id: 'supported', label: 'The longer-light groups grew taller in this trial. Repeat the controlled test before recommending a best setting for all seeds.' },
        { id: 'universal', label: 'Ten hours is proven to be the ideal light duration for every seed and every greenhouse.' },
        { id: 'unsupported', label: 'The data prove water caused the height difference, even though water was kept constant.' },
        { id: 'discard', label: 'The results should be discarded because one test can never provide useful evidence.' }
      ], answer: 'supported',
      wrong: 'The report needs to use the observed pattern, avoid a claim beyond the test, and identify a useful next step.',
      hints: ['The evidence can be useful even though it is limited.', 'Keep the conclusion specific to the test and include a way to strengthen it.', 'Report the observed pattern, then repeat the fair test before making a broad recommendation.'],
      learn: 'A sound scientific conclusion uses the observed pattern, states the limits of the test, and proposes a next step that can strengthen the evidence.',
      reflect: 'Which specific result supports your report, and what limitation keeps the team from making a universal claim?',
      clueReward: { id: 'vault-reset', label: 'Backup restored', detail: 'The team reported the observed pattern and scheduled repeated trials before making a broader recommendation.' },
      journal: 'The evidence-based report restored the vault without overstating what the experiment proved.'
    }
  ]
};
