import test from 'node:test';
import assert from 'node:assert/strict';
import {CHARACTER_DEFAULT, CHARACTER_ACTIONS, validateCharacterSelection, movementAction, normalizeCharacterAction} from '../public/assets/characters/character-contract.js';
import {CHARACTER_IDS, resolveCharacterSelection, getCharacterDefinition} from '../public/assets/characters/character-catalog.js';

test('default selection is accepted',()=>{
  assert.deepEqual(validateCharacterSelection(CHARACTER_DEFAULT,CHARACTER_IDS),CHARACTER_DEFAULT);
  assert.equal(resolveCharacterSelection(CHARACTER_DEFAULT).definition.id,'ta-starter-01');
});
test('unknown and malicious identifiers are rejected',()=>{
  assert.throws(()=>validateCharacterSelection({...CHARACTER_DEFAULT,characterId:'<script>'},CHARACTER_IDS));
  assert.throws(()=>validateCharacterSelection({...CHARACTER_DEFAULT,characterId:'admin'},CHARACTER_IDS));
  assert.throws(()=>resolveCharacterSelection({...CHARACTER_DEFAULT,appearanceId:'unknown'}));
  assert.throws(()=>validateCharacterSelection({...CHARACTER_DEFAULT,version:2},CHARACTER_IDS));
});
test('movement maps to animation states, without changing physics',()=>{
  assert.equal(movementAction({moving:false}),'idle');
  assert.equal(movementAction({moving:true}),'walk');
  assert.equal(movementAction({moving:true,sprinting:true}),'run');
  assert.equal(movementAction({grounded:false,moving:true}),'jump');
  assert.equal(normalizeCharacterAction('invalid'),'idle');
  assert.deepEqual(CHARACTER_ACTIONS,['idle','walk','run','jump','interact','celebrate']);
});
test('missing assets are explicitly marked pending',()=>{
  const asset=getCharacterDefinition('ta-starter-01');
  assert.equal(asset.glb,null);
  assert.equal(asset.status,'asset-pending');
});
