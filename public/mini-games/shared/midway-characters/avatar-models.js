import {createArtKit} from './approved-art.js';
import {characterById} from './characters.js';
import {createCharacterArt} from './character-art.js';
export function avatar(id){const c=characterById(id);if(!c)throw Error('Unknown character: '+id);if(id==='fox'){const g=createArtKit().steve();g.userData.characterId=id;g.userData.visualRevision=3;return g}return createCharacterArt(c)}
export function disposeAvatar(g){const geometries=new Set(),materials=new Set();g.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);for(const material of Array.isArray(o.material)?o.material:[o.material])materials.add(material)}});geometries.forEach(x=>x.dispose());materials.forEach(x=>x.dispose())}
