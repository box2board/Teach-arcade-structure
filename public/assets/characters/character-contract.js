/**
 * Teach Arcade shared character identity contract v1.
 * No renderer, engine, database, student account, or network dependency.
 * Characters are visual only; game servers retain authority for physics.
 */
export const CHARACTER_CONTRACT_VERSION = 1;
export const CHARACTER_ACTIONS = Object.freeze(['idle','walk','run','jump','interact','celebrate']);
export const CHARACTER_DEFAULT = Object.freeze({
  version: 1,
  characterId: 'ta-starter-01',
  appearanceId: 'default'
});
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,47}$/;
export function validateCharacterSelection(value, allowedCharacterIds = ['ta-starter-01']) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('Character selection must be an object');
  if (value.version !== 1) throw new RangeError('Unsupported character contract version');
  for (const key of ['characterId','appearanceId']) {
    if (typeof value[key] !== 'string' || !ID_PATTERN.test(value[key])) throw new TypeError('Invalid ' + key);
  }
  if (!allowedCharacterIds.includes(value.characterId)) throw new RangeError('Unknown character');
  return Object.freeze({version: 1, characterId: value.characterId, appearanceId: value.appearanceId});
}
export function movementAction({grounded=true, moving=false, sprinting=false, jumping=false} = {}) {
  if (!grounded || jumping) return 'jump';
  if (!moving) return 'idle';
  return sprinting ? 'run' : 'walk';
}
export function normalizeCharacterAction(action) {
  return CHARACTER_ACTIONS.includes(action) ? action : 'idle';
}
