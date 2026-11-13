import {validateCharacterSelection} from './character-contract.js';

/**
 * Model URLs are intentionally omitted until Quaternius files are downloaded,
 * their contained licensing is reviewed and GLBs are verified in PlayCanvas.
 * No fictitious assets or external URLs are shipped to production.
 */
export const CHARACTER_CATALOG = Object.freeze([
  Object.freeze({
    id: 'ta-starter-01',
    label: 'Starter',
    source: 'Quaternius Universal Base Characters (candidate)',
    rig: 'quaternius-universal-humanoid',
    glb: null,
    animations: Object.freeze({idle:null,walk:null,run:null,jump:null,interact:null,celebrate:null}),
    variants: Object.freeze(['default']),
    status: 'asset-pending'
  })
]);
export const CHARACTER_IDS = Object.freeze(CHARACTER_CATALOG.map(x => x.id));
export function getCharacterDefinition(id) {
  return CHARACTER_CATALOG.find(x=>x.id===id) ?? null;
}
export function resolveCharacterSelection(raw) {
  const selection=validateCharacterSelection(raw,CHARACTER_IDS);
  const definition=getCharacterDefinition(selection.characterId);
  if (!definition.variants.includes(selection.appearanceId)) throw new RangeError('Unknown appearance');
  return Object.freeze({selection,definition});
}
