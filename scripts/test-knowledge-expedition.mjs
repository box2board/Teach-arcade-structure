import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createExpedition,validatePack} from '../public/games/knowledge-expedition/engine/v1/model.js';
const pack=JSON.parse(fs.readFileSync(new URL('../public/games/knowledge-expedition/content/wwii.json', import.meta.url)));
const m=createExpedition(pack);assert.equal(m.travel(1),false);assert.equal(m.checkTimeline([]),null);assert.equal(m.answer('midway',0),null);
for(let i=0;i<pack.areas.length;i++){
 assert.equal(m.travel(i),true);const a=m.area;for(const d of a.discoveries){if(i===0){assert.equal(m.answer(d.id,1).correct,false);}assert.equal(m.answer(d.id,d.question.correctIndex).correct,true);assert.equal(m.answer(d.id,0),null);}
 assert(m.ready);assert.equal(m.checkConnection(0),null);assert.equal(m.checkTimeline(a.discoveries.map(d=>d.id).reverse()).correct,false);assert.equal(m.checkTimeline([...a.discoveries].sort((a,b)=>a.order-b.order).map(d=>d.id)).correct,true);assert.equal(m.checkConnection(1).correct,false);assert.equal(m.checkConnection(a.connection.correctIndex).correct,true);
}
assert(m.finished);assert.deepEqual(m.report(),{discoveries:9,total:9,firstTry:6,timelineFirstTry:0,connectionFirstTry:0,review:pack.areas[0].discoveries.map(d=>d.title)});assert.equal(m.travel(0),true);assert(m.completed.has(m.area.id));assert.equal(createExpedition(pack).report().discoveries,0);
const broken=structuredClone(pack);broken.areas[1].discoveries[0].id=broken.areas[0].discoveries[0].id;assert.throws(()=>validatePack(broken));
console.log('PASS: pack validation, area gates, discovery retries, chronology ordering, connection prerequisites, first-try reporting, revisit, and reset.');
for(const mutate of [p=>p.areas[1].id=p.areas[0].id,p=>p.areas[0].discoveries[1].order=p.areas[0].discoveries[0].order,p=>p.areas[0].discoveries[0].id='station',p=>p.areas[0].discoveries[0].source='javascript:alert(1)',p=>p.areas[0].connection.choices='invalid',p=>p.areas[0].connection.correctIndex=-1]){const invalid=structuredClone(pack);mutate(invalid);assert.throws(()=>validatePack(invalid));}
assert.throws(()=>validatePack(null));
const fresh=createExpedition(pack);for(const item of fresh.area.discoveries)fresh.answer(item.id,0);assert.equal(fresh.checkTimeline(null),null);assert.equal(fresh.checkTimeline(['poland','poland','poland']),null);assert.equal(fresh.timelines.size,0,'malformed submissions must not alter attempt counts');assert.equal(fresh.answer('poland',-1),null);
console.log('PASS: duplicate areas/order, reserved station ID, source validation, malformed questions, and invalid submission handling.');
