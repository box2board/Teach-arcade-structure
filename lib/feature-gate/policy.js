// Pilot routes deliberately exclude multiplayer and shared assets.
export const PILOT=Object.freeze({
  "brain-rv-road-trip-mayhem": {
    "name": "RV Road Trip Mayhem",
    "path": "/brain-arcade/rv-road-trip-mayhem"
  },
  "brain-chess": {
    "name": "Chess",
    "path": "/brain-arcade/chess"
  },
  "brain-sudoku": {
    "name": "Sudoku",
    "path": "/brain-arcade/sudoku"
  }
});
const STATUSES=["live","coming_soon","under_improvement"];
export function featureForPath(path) {
  let decoded=path;
  try { decoded=decodeURIComponent(decoded); } catch { return null; }
  decoded=decoded.replace(/\/+/g,'/').toLowerCase();
  for (const [id,feature] of Object.entries(PILOT)) if(decoded===feature.path||decoded.startsWith(feature.path+'/')) return id;
  return null;
}
export function validateFlags(value) {
  if(!value||typeof value!=='object'||Array.isArray(value)) throw Error('Invalid feature flags');
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
