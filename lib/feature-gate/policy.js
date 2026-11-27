import {FEATURES,featureForPath} from '../../public/assets/scripts/feature-registry.js';
export {featureForPath};
export const PILOT=FEATURES;
const STATUSES=["live","coming_soon","under_improvement"];
export function validateFlags(value) {
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==Object.keys(PILOT).length) throw Error('Invalid feature flags');
  const out={};
  for(const id of Object.keys(PILOT)){
    if(!STATUSES.includes(value[id])) throw Error('Missing or invalid pilot flag');
    out[id]=value[id];
  }
  return out;
}
export function availability(flags,id) {
  if(!id||!Object.hasOwn(PILOT,id)) return 'pass';
  if(!flags) return 'unavailable';
  return flags[id]==='live'?'pass':flags[id];
}
export const defaultFlags=()=>Object.fromEntries(Object.keys(PILOT).map(id=>[id,'live']));
