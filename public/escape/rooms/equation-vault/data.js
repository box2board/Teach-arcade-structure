window.ROOM_DATA = {
  id: 'equation-vault',
  title: 'The Equation Vault',
  topic: 'Algebra · Equations',
  subject: 'Mathematics',
  gradeBand: 'Grades 7–9',
  description: 'Restore a robotics lab by solving and checking algebra equations in this classroom escape room.',
  missionStamp: 'LAB DISPATCH · POWER FAILURE',
  missionQuestionLabel: 'SYSTEM OBJECTIVE',
  insightLabel: 'ALGEBRA INSIGHT · WHAT THE EQUATION SHOWS',
  victoryTitle: 'Lab restored',
  missionQuestion: 'Can your team restore the lab’s power by solving equations, checking a faulty solution, and using the results to calculate the final access code?',
  completion: 'The vault is open. You balanced equations, diagnosed an error, and combined the values from your evidence cards to restore the lab safely.',
  difficultyLevels: [
    { id: 'easy', label: 'Easy', description: 'A guided route through inverse operations and one-step reasoning. Notes are optional.' },
    { id: 'medium', label: 'Medium', description: 'Solve multi-step equations, diagnose a mistake, and support each decision with a reasoning note.' },
    { id: 'hard', label: 'Hard', description: 'Work with distribution, variables on both sides, and a multi-part code. Reasoning notes are required.' }
  ],
  difficultyProfiles: {
    easy: {
      label: 'Easy', requireReasoning: false,
      sceneOrder: ['dispatch', 'inverse-map', 'balance-sequence', 'error-check', 'easy-final']
    },
    medium: {
      label: 'Medium', requireReasoning: true, minReasoningLength: 25,
      sceneOrder: ['dispatch', 'inverse-map', 'balance-sequence', 'error-check', 'variable-lock', 'model-match', 'medium-final']
    },
    hard: {
      label: 'Hard', requireReasoning: true, minReasoningLength: 50,
      sceneOrder: ['dispatch', 'inverse-map', 'error-check', 'distribution-lock', 'balance-sequence', 'variable-lock', 'model-match', 'hard-final']
    }
  },
  finalReport: {
    label: 'LAB RESTORATION REPORT · THE ALGEBRA',
    question: 'How did the team know the final code was reliable?',
    answer: 'Each code value came from a solved equation. The team used inverse operations to preserve equality, checked each result by substitution, and combined the verified values only after collecting the clues.',
    clueIds: ['relay-a', 'relay-b']
  },
  debrief: [
    { label: 'Balance:', text: 'An equation stays equivalent when the same operation is applied to both sides.' },
    { label: 'Reason:', text: 'Inverse operations undo the operations applied to the variable; the order matters in multi-step equations.' },
    { label: 'Check:', text: 'Substituting a solution into the original equation is a quick way to detect an algebra error.' },
    { label: 'Connect:', text: 'The final code used values earned from earlier locks, so each solved equation became evidence for the next step.' }
  ],
  scenes: [
    {
      id: 'dispatch', type: 'Mission briefing', kind: 'intro', kicker: 'POWER FAILURE · LAB WING B', title: 'The equation vault',
      prompt: 'The lab’s emergency system is locked behind a sequence of algebra controls. The backup battery is draining, and the vault will seal when it reaches zero.',
      body: 'Your robotics team was calibrating a prototype power cell when the lab’s control system failed. The equations on its safety console are the only way to restart the system without damaging the equipment. Inspect each control, solve carefully, and save the values you earn: the last lock uses them together.',
      objectives: ['Use inverse operations to keep equations balanced.', 'Find and explain an algebra error.', 'Check solutions in the original equation.', 'Use recovered values to calculate the final code.'],
      learn: 'Solving an equation means finding a value that makes both sides equal. Use inverse operations on both sides, then check by substitution.',
      reflect: 'What does it mean for an equation to stay balanced?',
      reward: 'Lab access', journal: 'Mission: restore the control system by solving and checking the equations on its safety console.'
    },
    {
      id: 'inverse-map', type: 'Operation map', kind: 'match', kicker: 'CONTROL 01 · MAP THE RELEASE KEYS', title: 'Find the inverse',
      prompt: 'The first console asks which operation would undo the operation attached to the variable. Match each equation to the first operation that isolates the variable.',
      categories: [
        { id: 'subtract', label: 'Subtract 6 from both sides' },
        { id: 'divide', label: 'Divide both sides by 4' },
        { id: 'multiply', label: 'Multiply both sides by 3' }
      ],
      pairs: [
        { label: 'x + 6 = 19', answer: 'subtract' },
        { label: '4x = 28', answer: 'divide' },
        { label: 'x ÷ 3 = 5', answer: 'multiply' }
      ],
      wrong: 'Choose the inverse operation and apply it to both sides. The goal is to undo the operation acting on x.',
      hints: ['Addition is undone by subtraction; multiplication is undone by division.', 'For division by 3, use multiplication by 3 to undo it.', 'Match +6 with subtract 6, ×4 with divide 4, and ÷3 with multiply 3.'],
      learn: 'Inverse operations undo one another. Applying the inverse to both sides preserves equality while moving toward an isolated variable.',
      reflect: 'Why must the same inverse operation be applied to both sides of an equation?',
      clueReward: { id: 'inverse-map', label: 'Release key map', detail: 'Addition ↔ subtraction · multiplication ↔ division. Apply the same inverse operation to both sides.' },
      journal: 'The release-key map paired each operation with its inverse.'
    },
    {
      id: 'balance-sequence', type: 'Equation sequence', kind: 'order', kicker: 'CONTROL 02 · RESTORE THE BALANCE', title: 'Unlock the relay value',
      requiresClues: ['inverse-map'],
      prompt: 'The relay uses the equation 3x + 7 = 31. Put the steps in order to isolate x without changing the equation’s balance.',
      items: [
        { id: 'subtract-seven', label: 'Subtract 7 from both sides: 3x = 24.' },
        { id: 'divide-three', label: 'Divide both sides by 3: x = 8.' },
        { id: 'check-eight', label: 'Check: 3(8) + 7 = 31, so the solution is valid.' }
      ],
      answer: ['subtract-seven', 'divide-three', 'check-eight'],
      hints: ['Undo the addition before undoing the multiplication.', 'First remove 7; then isolate x by dividing by 3.', 'Subtract, divide, then check the value in the original equation.'],
      wrong: 'The order matters: undo the addition first, undo multiplication second, then verify the result.',
      learn: 'For 3x + 7 = 31, undo +7 before undoing ×3. Substitution confirms that x = 8 makes the original equation true.',
      reflect: 'Why would dividing by 3 before removing 7 fail to isolate x in one step?',
      clueReward: { id: 'relay-a', label: 'Relay A value', detail: 'The equation 3x + 7 = 31 gives x = 8. Substitution checks: 3(8) + 7 = 31.' },
      journal: 'Relay A is calibrated. Its verified value is saved to the evidence board.'
    },
    {
      id: 'error-check', type: 'Error analysis', kind: 'choice', kicker: 'CONTROL 03 · INSPECT THE FAILED TEST', title: 'Where did the solution drift?',
      evidence: [
        { label: 'Technician’s work', text: 'Solve 5x − 8 = 22. The technician’s first line is 5x = 14.', source: 'Console scratchpad' },
        { label: 'Safety rule', text: 'An operation used to isolate a variable must preserve equality.', source: 'Algebra control guide' }
      ],
      prompt: 'Which diagnosis correctly identifies the mistake and repairs the first step?',
      options: [
        { id: 'subtract-error', label: 'The technician subtracted 8. Add 8 to both sides instead, giving 5x = 30.' },
        { id: 'divide-first', label: 'The technician should divide by 5 first, giving x − 8 = 22.' },
        { id: 'change-one-side', label: 'The technician should add 8 only to the left side, giving 5x = 22.' },
        { id: 'no-error', label: 'There is no error; 5x = 14 follows from subtracting 8.' }
      ], answer: 'subtract-error',
      wrong: 'Check what operation undoes subtracting 8, and remember that equality requires the same change on both sides.',
      hints: ['The left side contains −8, so ask what removes it.', 'Adding 8 to both sides changes 22 to 30.', 'The correct first line is 5x = 30; then divide both sides by 5.'],
      learn: 'The inverse of subtracting 8 is adding 8. Adding 8 to both sides gives 5x = 30, then x = 6; substitution confirms 5(6) − 8 = 22.',
      reflect: 'What makes the technician’s first line invalid, and how can substitution confirm the repaired solution?',
      clueReward: { id: 'error-repair', label: 'Repair record', detail: 'For 5x − 8 = 22, add 8 to both sides, then divide by 5. The solution is x = 6.' },
      journal: 'The failed test came from using the wrong inverse operation.'
    },
    {
      id: 'variable-lock', type: 'Numeric lock', kind: 'text', kicker: 'CONTROL 04 · ENTER THE CELL READING', title: 'Calibrate the second relay',
      evidence: [
        { label: 'Relay B equation', text: '4(y − 2) = 20', source: 'Power-cell display' },
        { label: 'Lock instruction', text: 'Enter the value of y. The display accepts a number; check your result in the original equation.', source: 'Relay keypad' }
      ],
      prompt: 'Solve the equation and enter the value that makes both sides equal.',
      label: 'Value of y', placeholder: 'Enter a number', answers: ['7'],
      wrong: 'Undo the multiplication first, then undo subtraction. Check by substituting your value for y.',
      hints: ['Divide both sides by 4 to undo the outside multiplication.', 'After dividing, you have y − 2 = 5.', 'Add 2 to both sides, then verify 4(7 − 2) = 20.'],
      learn: 'Undo the outside operation first: divide by 4 to get y − 2 = 5, then add 2 to get y = 7. Substitution verifies the solution.',
      reflect: 'Why do you undo the multiplication before undoing the subtraction in 4(y − 2) = 20?',
      clueReward: { id: 'relay-b', label: 'Relay B value', detail: 'The equation 4(y − 2) = 20 gives y = 7. Substitution checks: 4(7 − 2) = 20.' },
      journal: 'Relay B is calibrated. Its verified value is saved to the evidence board.'
    },
    {
      id: 'model-match', type: 'Equation modeling', kind: 'match', kicker: 'CONTROL 05 · TRANSLATE THE SENSOR LOG', title: 'Match the words to the model',
      prompt: 'A sensor logged three situations. Match each description to the equation that represents it.',
      categories: [
        { id: 'twice-plus-five', label: '2n + 5 = 17' },
        { id: 'split-three', label: 'n ÷ 3 = 8' },
        { id: 'triple-minus-four', label: '3n − 4 = 20' }
      ],
      pairs: [
        { label: 'Five is added to twice a number; the result is 17.', answer: 'twice-plus-five' },
        { label: 'A number is divided into 3 equal groups; each group has 8.', answer: 'split-three' },
        { label: 'Four is subtracted from three times a number; the result is 20.', answer: 'triple-minus-four' }
      ],
      wrong: 'Pay attention to the order in the language: “five more than twice a number” differs from “twice the sum.”',
      hints: ['Translate the operation words before looking at the result.', '“Twice a number” is 2n. “Five is added” makes 2n + 5.', 'Match the phrases to 2n + 5 = 17, n ÷ 3 = 8, and 3n − 4 = 20.'],
      learn: 'An equation model preserves the relationships in a situation. Translate each operation and its order before solving.',
      reflect: 'How does the order of the words help distinguish 2n + 5 from 2(n + 5)?',
      clueReward: { id: 'model-check', label: 'Sensor model check', detail: 'The wording determines the operation and its order; parentheses change which quantity is multiplied.' },
      journal: 'The team translated each sensor description into an equation before using it.'
    },
    {
      id: 'distribution-lock', type: 'Multi-part lock', kind: 'multi', kicker: 'CONTROL 04 · RECOVER THE BOARD’S WORK', title: 'The distribution lock',
      evidence: [
        { label: 'Board equation', text: '2(3x − 4) = 4x + 10', source: 'Prototype calibration board' },
        { label: 'Lock protocol', text: 'The console requires the distributed equation and the final value of x.', source: 'Two-part safety keypad' }
      ],
      prompt: 'Distribute first, then solve. The lock accepts the coefficient on x after distribution and the value of x as separate entries.',
      parts: [
        { label: 'Coefficient on x after distribution', placeholder: 'Enter the coefficient', answers: ['6'] },
        { label: 'Solution for x', placeholder: 'Enter the value of x', answers: ['9'] }
      ],
      hints: ['Multiply 2 by each term inside the parentheses.', 'After distributing, collect variable terms on one side and constants on the other.', '6x − 8 = 4x + 10; subtract 4x, add 8, then divide by 2.'],
      wrong: 'Check both parts: distribute to every term, then use the same operation on both sides as you isolate x.',
      learn: 'Distribute 2 to both terms: 6x − 8 = 4x + 10. Subtract 4x, add 8, and divide by 2 to get x = 9.',
      reflect: 'Why must the 2 multiply both terms inside the parentheses, and how can you check x = 9?',
      clueReward: { id: 'distribution-check', label: 'Calibration verified', detail: 'Distributing gives 6x − 8 = 4x + 10; solving gives x = 9.' },
      journal: 'The prototype’s distribution lock was solved and checked.'
    },
    {
      id: 'easy-final', type: 'Final relay', kind: 'text', kicker: 'FINAL CONSOLE · RESTORE POWER', title: 'Enter the relay code',
      requiresClues: ['relay-a', 'error-repair'],
      prompt: 'The evidence board holds Relay A = a and the repaired-test value = c. The final console asks for 2a + c. Calculate the code from the two verified results.',
      label: 'Final relay code', placeholder: 'Calculate from the evidence board', answers: ['22'],
      wrong: 'Use the two values on your evidence board: double Relay A, then add the repaired-test value.',
      hints: ['Relay A and the repaired-test value are both recorded on your evidence board.', 'Substitute a = 8 and c = 6 into 2a + c.', 'Calculate 2 × 8 + 6.'],
      learn: 'The final code is 2(8) + 6 = 22. It depends on two values earned and checked in earlier rooms.',
      reflect: 'How did you use both recovered values to calculate the code?',
      clueReward: { id: 'power-restored', label: 'Power restored', detail: 'The final code combined twice Relay A with the repaired-test value: 2a + c.' },
      journal: 'The final code combined the Relay A clue with the repaired-test value.'
    },
    {
      id: 'medium-final', type: 'Final relay', kind: 'multi', kicker: 'FINAL CONSOLE · RESTORE POWER', title: 'Prove the relay code',
      requiresClues: ['relay-a', 'relay-b', 'error-repair', 'model-check'],
      prompt: 'The console uses the two verified relay values. Enter the value of 2a + b, then enter the value of c from the repaired equation 5c − 8 = 22. Both parts are needed to release the final key.',
      parts: [
        { label: 'Combined relay value · 2a + b', placeholder: 'Use Relay A and Relay B', answers: ['23'] },
        { label: 'Repaired equation value · c', placeholder: 'Use the repair record', answers: ['6'] }
      ],
      hints: ['Use the evidence board; do not guess at either value.', 'Relay A is 8 and Relay B is 7. The repair record comes from 5c − 8 = 22.', 'Calculate 2(8) + 7, then solve 5c − 8 = 22.'],
      wrong: 'One part needs another look. Recheck the two relay values and the repaired equation in your evidence board.',
      learn: 'The relay expression gives 2(8) + 7 = 23. The repaired equation gives c = 6. Using both verified results opens the final key.',
      reflect: 'Which evidence-board clues support each part of the final code, and how did you verify them?',
      clueReward: { id: 'power-restored', label: 'Power restored', detail: 'The combined relay value and repaired equation both checked out.' },
      journal: 'The final console accepted two independently verified results.'
    },
    {
      id: 'hard-final', type: 'Final relay', kind: 'multi', kicker: 'FINAL CONSOLE · RESTORE POWER', title: 'Rebuild the master code',
      requiresClues: ['relay-a', 'relay-b', 'error-repair', 'distribution-check', 'model-check'],
      prompt: 'The master code has two parts: calculate 2a + b from the relay clues, then solve 2(3x − 4) = 4x + 10 for x. Use the evidence board and show the numeric result of each calculation.',
      parts: [
        { label: 'Relay expression · 2a + b', placeholder: 'Combine the two relay values', answers: ['23'] },
        { label: 'Calibration equation · x', placeholder: 'Solve the equation from the distribution record', answers: ['9'] }
      ],
      hints: ['The first part uses Relay A and Relay B; the second uses the distribution record.', 'Relay A = 8 and Relay B = 7. For the equation, distribute before collecting variable terms.', '2(8) + 7 = 23. The calibration equation simplifies to 6x − 8 = 4x + 10, so x = 9.'],
      wrong: 'Recheck each clue separately. The final lock needs the relay expression and the solved calibration equation.',
      learn: 'The relay expression gives 23. The calibration equation becomes 6x − 8 = 4x + 10, which solves to x = 9. Each part can be checked in its original equation.',
      reflect: 'Why is it useful to solve and verify each part separately before entering a combined code?',
      clueReward: { id: 'power-restored', label: 'Power restored', detail: 'The master code combined the relay expression with the verified calibration solution.' },
      journal: 'The master code joined two verified algebra results.'
    }
  ]
};
