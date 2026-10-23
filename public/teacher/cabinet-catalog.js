import {validateCatalog} from './catalog-contract.js';
import {GAMES} from '../review-lab/catalog.js';
import {ARCADE_GAMES} from './arcade-catalog.js';
import {BRAIN_GAMES} from './brain-catalog.js';
// Both the browser and API use this same allowlist and stable bookmark IDs.
export const CABINET_GAMES=Object.freeze(validateCatalog([...ARCADE_GAMES,...BRAIN_GAMES,...GAMES.map(game=>Object.freeze({...game,collection:'Review Lab',chooseTopic:Boolean(game.supportsQuestionBank||game.questionSetIds?.length)}))],'games'));
// Generated from the public Teacher Tools catalog; shared with the account API.
export {TOOLS} from './tool-catalog.js';
