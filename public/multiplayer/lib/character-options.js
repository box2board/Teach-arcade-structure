import {characters} from './characters.js';
export const characterOptions = characters.map(({id,name,species}) =>
  `<option value="${id}">${name} · ${species}</option>`
).join('');
