// Shared multiple-choice contract for Review Lab games. No gameplay imports.
export function validateQuestionBank(bank,minimum=12){
  if(!bank||!Array.isArray(bank.questions)||bank.questions.length<minimum)throw new Error(`Question packs need at least ${minimum} questions.`);
  const ids=new Set();
  for(const q of bank.questions){
    if(!q.id||ids.has(q.id)||typeof q.question!=='string'||!q.question.trim()||!Array.isArray(q.choices)||q.choices.length!==4||q.choices.some(c=>typeof c!=='string'||!c.trim())||!Number.isInteger(q.answer)||q.answer<0||q.answer>3||new Set(q.choices.map(c=>c.normalize('NFKC').trim().toLowerCase())).size!==4||(q.explanation!==undefined&&typeof q.explanation!=='string'))throw new Error('Each question needs a unique ID, a prompt, four answers, a correct answer index, and an optional explanation.');
    ids.add(q.id);
  }
}
