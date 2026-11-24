// Permanent feature IDs match Development HQ; resourceId preserves existing Cabinet bookmarks.
// Presentation order and page placement are intentionally not part of this registry.
// Only these three routes are approved for pilot enforcement; add entries after route audit.
export const FEATURES=Object.freeze(Object.fromEntries(Object.entries({
  "brain-rv-road-trip-mayhem": {
    "resourceId": "brain:rv-road-trip-mayhem",
    "name": "RV Road Trip Mayhem",
    "description": "Hit the road across six scenic routes. Jump junk, boost over canyons, and chase a clean finish.",
    "image": "/assets/images/brain-arcade/rv-road-trip-mayhem-768.webp",
    "imageAlt": "RV Road Trip Mayhem",
    "url": "/brain-arcade/rv-road-trip-mayhem/",
    "path": "/brain-arcade/rv-road-trip-mayhem",
    "aliases": [],
    "collection": "Brain Arcade",
    "category": "Brain Arcade"
  },
  "brain-chess": {
    "resourceId": "brain:chess",
    "name": "Chess",
    "description": "The timeless strategy showdown—plan attacks, protect your king, and think several moves ahead.\n            Perfect for logic, focus, and long-term planning.",
    "image": "/assets/images/brain-arcade/chess-flat-768.webp",
    "imageAlt": "Chess",
    "url": "/brain-arcade/chess/",
    "path": "/brain-arcade/chess",
    "aliases": [],
    "collection": "Brain Arcade",
    "category": "Brain Arcade"
  },
  "brain-sudoku": {
    "resourceId": "brain:sudoku",
    "name": "Sudoku",
    "description": "Fill the grid using logic alone. Each row, column, and box must contain the numbers 1–9 without repeats.\n            A perfect focus game that rewards careful thinking over speed.",
    "image": "/assets/images/brain-arcade/sudoku-flat-768.webp",
    "imageAlt": "Sudoku",
    "url": "/brain-arcade/sudoku/",
    "path": "/brain-arcade/sudoku",
    "aliases": [],
    "collection": "Brain Arcade",
    "category": "Brain Arcade"
  }
}).map(([id,feature])=>[id,Object.freeze({...feature,aliases:Object.freeze(feature.aliases)})])));
export function normalizePath(path){
 if(typeof path!=='string')return null;
 try{return decodeURIComponent(path).replace(/\\/g,'/').replace(/\/+/g,'/').toLowerCase();}catch{return null;}
}
export function featureForPath(path){
 const normalized=normalizePath(path);
 if(!normalized)return null;
 for(const [id,f] of Object.entries(FEATURES))for(const base of [f.path,...f.aliases])if(normalized===base||normalized.startsWith(base+'/'))return id;
 return null;
}
export function featureForResource(id){
 if(typeof id!=='string')return null;
 if(Object.hasOwn(FEATURES,id))return id;
 return Object.keys(FEATURES).find(key=>FEATURES[key].resourceId===id)??null;
}
// A link may carry an existing resource ID, new feature ID, or just a local href.
// A disagreement must not accidentally decorate an unrelated link.
export function featureForLink({href,base,resourceId,featureId}){
 let url;try{url=new URL(href,base);}catch{return null;}
 if(url.origin!==new URL(base).origin)return null;
 const byPath=featureForPath(url.pathname),byId=featureForResource(featureId)||featureForResource(resourceId);
 if(byId&&byPath&&byId!==byPath)return null;
 // Metadata alone is not enough for a launch link: verify the actual mapped URL.
 if(!byPath)return null;
 const f=FEATURES[byPath],p=normalizePath(url.pathname);
 return [f.path,...f.aliases].some(root=>p===root||p===root+'/'||p===root+'/index.html')?byPath:null;
}
