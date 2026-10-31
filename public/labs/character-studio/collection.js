import {validateRecipe} from './recipe.js';
export class RecipeHistory {
 constructor(initial){this.items=[validateRecipe(initial)];this.index=0;}
 commit(value){const r=validateRecipe(value);if(JSON.stringify(r)===JSON.stringify(this.items[this.index]))return;this.items.splice(this.index+1);this.items.push(r);if(this.items.length>60)this.items.shift();this.index=this.items.length-1;}
 move(delta){const next=this.index+delta;if(next<0||next>=this.items.length)return null;this.index=next;return structuredClone(this.items[next]);}
 get canUndo(){return this.index>0;}get canRedo(){return this.index<this.items.length-1;}
}
export const COLLECTION_KEY='teach-arcade-character-collection-v1';
export function readCollection(storage){const raw=storage.getItem(COLLECTION_KEY);if(!raw)return [];const rows=JSON.parse(raw);if(!Array.isArray(rows)||rows.length>24)throw Error('Invalid character collection.');return rows.map(row=>{if(typeof row.id!=='string'||typeof row.name!=='string'||!row.name.trim()||row.name.length>40)throw Error('Invalid saved character.');return {id:row.id,name:row.name,recipe:validateRecipe(row.recipe)};});}
export function writeCollection(storage,rows){if(rows.length>24)throw Error('Your collection is full (24 characters). Export or remove a saved look first.');const normalized=rows.map(row=>({id:row.id,name:row.name.trim().slice(0,40),recipe:validateRecipe(row.recipe)}));storage.setItem(COLLECTION_KEY,JSON.stringify(normalized));return normalized;}
