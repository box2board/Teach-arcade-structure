import assert from 'node:assert/strict';
import { exteriorTarget, navigationHint, installObjectiveGuidance } from '../public/dev/3d-adventure-engine/objective-guidance.js';
const config = { exterior: { energyCell: {x:-10,z:0}, terminal:{x:10,z:0}, switch:{x:0,z:-10}, missionEntry:{x:0,z:-15} } };
const origin = {x:0,z:0};
const forward = {x:0,z:-1};
assert.equal(navigationHint(origin, forward, exteriorTarget(config, {})), '10 m · Left');
assert.equal(navigationHint(origin, forward, exteriorTarget(config, {hasCell:true})), '10 m · Right');
assert.equal(navigationHint(origin, forward, exteriorTarget(config, {hasCell:true,terminalPowered:true})), '10 m · Ahead');
assert.equal(navigationHint(origin, {x:0,z:1}, exteriorTarget(config, {hasCell:true,terminalPowered:true})), '10 m · Behind');
assert.equal(navigationHint(origin, {x:1,z:0}, exteriorTarget(config, {})), '10 m · Behind');
assert.equal(navigationHint({x:-9,z:0}, forward, exteriorTarget(config, {})), 'Nearby · Press E or tap ACTION');
assert.equal(navigationHint({x:0,z:-14.5}, forward, exteriorTarget(config, {hasCell:true,terminalPowered:true,gateOpen:true})), 'Continue through the entrance');
assert.equal(navigationHint(origin, forward, exteriorTarget(config, null)), '');

// Check lifecycle: one hint, advancing targets, paused questions and interior handoff.
let hint, update;
globalThis.document = {
 querySelector: () => ({appendChild(node){hint=node;}}),
 createElement: () => ({textContent:'', hidden:false, setAttribute(){}}),
};
globalThis.window = {TA3DExteriorProgression:{}};
installObjectiveGuidance({player:{position:{...origin,clone:()=>({...origin})}},camera:{getWorldDirection(v){Object.assign(v,forward);}},onUpdate(fn){update=fn;}},config);
update(.2); assert.equal(hint.textContent,'10 m · Left');
window.TA3DExteriorProgression.hasCell=true;
update(.2); assert.equal(hint.textContent,'10 m · Right');
window.TA3DExteriorProgression.questionActive=true;
update(.2); assert.equal(hint.hidden,true);
window.TA3DExteriorProgression.questionActive=false;
update(.2); assert.equal(hint.hidden,false);
window.TA3DMission={started:true};
update(.2); assert.equal(hint.hidden,true);
console.log('Objective guidance: progression, camera-relative directions, proximity, question pause and interior handoff pass.');
