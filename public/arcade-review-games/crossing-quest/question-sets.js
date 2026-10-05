import { validateBank } from './engine.js';

// Only approved local test packs belong here. Future catalog entries load topic
// data without changing the squirrel, routes, or gameplay engine.
const packs = [
  { id: 'scientific-method', title: 'Scientific Method', subject: 'Science', description: 'Variables, experiments, evidence, and scientific reasoning.', testPack: true, load: () => import('./questions.js') }
];
export const QUESTION_SETS = Object.freeze(packs.map(({load, ...metadata}) => Object.freeze(metadata)));

export async function loadQuestionSet(id) {
  const pack = packs.find(set => set.id === id);
  if (!pack) throw new Error('That question set is not available.');
  const { default: bank } = await pack.load();
  validateBank(bank);
  if (bank.id !== id) throw new Error('The question set does not match its catalog entry.');
  return bank;
}
