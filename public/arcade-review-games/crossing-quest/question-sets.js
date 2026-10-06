// Acorn Dash exposes only the approved packs declared compatible in Review Lab.
import {setsForGame} from '../../review-lab/catalog.js';
export {loadQuestionSet} from '../../review-lab/catalog.js';
export const QUESTION_SETS=Object.freeze(setsForGame('acorn-dash'));
