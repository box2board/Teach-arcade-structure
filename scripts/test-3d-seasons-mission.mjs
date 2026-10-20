// Headless integration: real mission runtime and Three.js, lightweight DOM/input adapters.
// Verifies progression gates, not browser rendering or physical movement.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../public/assets/vendor/three-0.162.0/three.module.js';
const nodes=new Map();
class Node extends EventTarget {
 constructor(id=''){super();this.id=id;this.children=[];this.style={};this.classList={add(){},remove(){},toggle(){}};this.hidden=false;this.textContent='';}
 appendChild(node){this.children.push(node);nodes.set(node.id,node);return node;}
 set innerHTML(value){this.children=[];}
 setAttribute(){}
 before(node){nodes.set(node.id,node);}
 animate(){}
 querySelector(selector){return this.parts?.[selector]||null;}
 click(){if(this.disabled)return;this.onclick?.();this.dispatchEvent(new Event('click'));}
}
class Dialog extends Node {
 open=false;
 showModal(){this.open=true;}
 close(){this.open=false;this.dispatchEvent(new Event('close'));}
}
globalThis.HTMLDialogElement=Dialog;
globalThis.window=new EventTarget();
Object.defineProperty(globalThis,'navigator',{value:{maxTouchPoints:0},configurable:true});
globalThis.document={getElementById:id=>nodes.get(id)||null,createElement:()=>new Node(),body:new Node('body')};
for(const id of ['objectiveText','objectiveSubtext','questionText','answerList','questionFeedback','ta3dMissionPrompt','ta3dMissionPromptText','ta3dMissionToast','ta3dMissionFade']) nodes.set(id,new Node(id));
for(const id of ['questionDialog','completeDialog']) {
 const node=new Dialog(id);node.parts={'h2':new Node(),'p':new Node(),'.eyebrow':new Node()};nodes.set(id,node);
}
const timers=[];
globalThis.setTimeout=(fn,ms)=>{const timer={fn,ms,active:true};timers.push(timer);return timer;};
globalThis.clearTimeout=timer=>{if(timer)timer.active=false;};
const flush=ms=>{for(const t of timers.splice(0)){if(t.active&&t.ms===ms)t.fn();else timers.push(t);}};
const legacy = process.argv.includes('--legacy');
if (legacy) await import('../public/dev/3d-adventure-engine/adventure-config-v11.js');
else {
  await import('../public/dev/3d-adventure-engine/silent-observatory/config-v12.js');
  await import('../public/dev/3d-adventure-engine/silent-observatory/seasons-mission.js');
}
const config=window.TA3DAdventureConfig;
window.TA3DDifficulty={settings:config.difficulties[process.env.MISSION_DIFFICULTY || 'medium']};
THREE.WebGLRenderer.prototype.render=function(){};
let source=await readFile(new URL('../public/dev/3d-adventure-engine/mission-v9.js',import.meta.url),'utf8');
source=source.replace('/assets/vendor/three-0.162.0/three.module.js',new URL('../public/assets/vendor/three-0.162.0/three.module.js',import.meta.url).href).replace('./relay-progress.js',new URL('../public/dev/3d-adventure-engine/relay-progress.js',import.meta.url).href);
for (const name of ['evidence-questions.js','seasons-model.js']) source=source.replace(`./${name}`,new URL(`../public/dev/3d-adventure-engine/${name}`,import.meta.url).href);
await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const scene=new THREE.Scene();const player=new THREE.Group();player.name='player-controller';scene.add(player);
const camera=new THREE.PerspectiveCamera();camera.position.set(0,5,-4);
const frame=()=>THREE.WebGLRenderer.prototype.render.call({},scene,camera);
const interact=(point,offset=1.5)=>{player.position.set(point.x,0,point.z+offset);frame();const e=new Event('keydown');Object.defineProperties(e,{code:{value:'KeyE'},repeat:{value:false}});window.dispatchEvent(e);};
const dialog=nodes.get('questionDialog');
const answer=i=>nodes.get('answerList').children[i].click();
const choose=(q,index=q.correct)=>{
 const text=q.answers[index];
 const button=nodes.get('answerList').children.find(node=>node.textContent.endsWith(`. ${text}`));
 assert.ok(button, `Missing answer: ${text}`);button.click();
};
const dismiss=()=>{dialog.close();};
if (!legacy) {
 const updates=[];
 window.TA3DEngine={player,findObject(){return null;},registerDynamicBlocker(){},onUpdate(fn){updates.push(fn);}};
 for(const id of ['cellStatus','terminalStatus','gateStatus','interactionPrompt','interactionText'])nodes.set(id,new Node(id));
 let exterior=await readFile(new URL('../public/dev/3d-adventure-engine/exterior-progression-v10.js',import.meta.url),'utf8');
 for(const [name,url] of [
  ['/assets/vendor/three-0.162.0/three.module.js',new URL('../public/assets/vendor/three-0.162.0/three.module.js',import.meta.url).href],
  ['./evidence-questions.js',new URL('../public/dev/3d-adventure-engine/evidence-questions.js',import.meta.url).href]
 ]) exterior=exterior.replace(name,url);
 await import(`data:text/javascript;base64,${Buffer.from(exterior).toString('base64')}`);
 const action=point=>{player.position.set(point.x,0,point.z+1.5);for(const fn of updates)fn(.016);const e=new Event('keydown');Object.defineProperties(e,{code:{value:'KeyE'},repeat:{value:false}});window.dispatchEvent(e);};
 action(config.exterior.energyCell);action(config.exterior.terminal);
 assert.equal(nodes.get('ta3dQuestionEvidence').textContent,config.questions.exteriorTerminal.evidence,'opening observation renders');
 choose(config.questions.exteriorTerminal,(config.questions.exteriorTerminal.correct+1)%4);
 for(const button of nodes.get('answerList').children)button.click();
 assert.equal(window.TA3DExteriorProgression.terminalPowered,false,'exterior sweep cannot advance after a wrong answer');
 nodes.get('ta3dEvidenceRetry').click();choose(config.questions.exteriorTerminal);
 assert.equal(window.TA3DExteriorProgression.terminalPowered,true);dismiss();
 action(config.exterior.switch);assert.equal(window.TA3DExteriorProgression.gateOpen,true);
}
nodes.get('completeDialog').showModal();flush(220);
assert.equal(window.TA3DMission.started,true);
const order=config.relayPuzzle.order;
if (legacy) {
 for (const id of order) interact(config.relayPuzzle.stations[id]);
 assert.equal(window.TA3DMission.archiveUnlocked,true);
 interact(config.mission.archiveConsole,1.6);assert.equal(dialog.open,true);
 answer(config.questions.archive.correct);assert.equal(window.TA3DMission.knowledgePassed,true);dismiss();
 interact(config.mission.commandCore,1.7);flush(config.mission.commandCore.stabilizationMs || 1400);
 assert.equal(window.TA3DMission.finished,true);
 console.log('Original adventure: relay, archive and core progression preserved.');
 process.exit(0);
}
// An out-of-order station cannot award evidence or open its task.
interact(config.relayPuzzle.stations[order[1]]);
assert.equal(dialog.open,false);assert.equal(window.TA3DMission.relayProgress,0);
for(let i=0;i<order.length;i++) {
 const station=config.relayPuzzle.stations[order[i]];
 interact(station);
 assert.equal(dialog.open,true);
 assert.equal(nodes.get('ta3dQuestionEvidence').textContent,station.evidenceQuestion.evidence);
 choose(station.evidenceQuestion,(station.evidenceQuestion.correct+1)%4);
 assert.equal(window.TA3DMission.relayProgress,i,'wrong answer cannot activate station');
 for(const button of nodes.get('answerList').children)button.click();
 assert.equal(window.TA3DMission.relayProgress,i,'answer sweep is locked after a mistake');
 nodes.get('ta3dEvidenceRetry').click();
 choose(station.evidenceQuestion);assert.equal(window.TA3DMission.relayProgress,i+1);
 dismiss();
}
assert.equal(window.TA3DMission.archiveUnlocked,true);
interact(config.mission.archiveConsole,1.6);assert.equal(dialog.open,true);
choose(config.questions.archive,(config.questions.archive.correct+1)%4);assert.equal(window.TA3DMission.knowledgePassed,false);
nodes.get('ta3dEvidenceRetry').click();choose(config.questions.archive);assert.equal(window.TA3DMission.knowledgePassed,true);dismiss();
interact(config.mission.commandCore,1.7);assert.equal(dialog.open,true);

const change=(name,value)=>{const node=nodes.get(`season-${name}`);assert.ok(node);node.value=value;node.dispatchEvent(new Event('change'));};
const run=()=>nodes.get('season-run').click();
const apply=()=>nodes.get('season-apply').click();
apply();assert.equal(window.TA3DMission.finished,false);
change('prediction','north');run();apply();
assert.equal(window.TA3DMission.finished,false,'untilted model cannot pass');
change('tilt','tilted');change('axis','fixed');
change('prediction','north');run();apply();
assert.equal(nodes.get('season-apply').disabled,true,'one month is insufficient');
change('month','december');change('prediction','north');run();
assert.equal(nodes.get('season-apply').disabled,true,'wrong prediction cannot pass');
change('prediction','south');run();
assert.equal(nodes.get('season-apply').disabled,false,'both predictions and observations match');
change('axis','tracks');assert.equal(nodes.get('season-apply').disabled,true,'editing model invalidates tests');
change('prediction','south');run();apply();
assert.equal(window.TA3DMission.finished,false,'sun-tracking axis disagrees with December');
change('axis','fixed');change('month','june');change('prediction','north');run();
change('month','december');change('prediction','south');run();apply();
flush(config.mission.commandCore.stabilizationMs);
assert.equal(window.TA3DMission.finished,true);
assert.equal(nodes.get('completeDialog').open,true);
console.log('Seasons mission: evidence review, answer-sweep lockout, three stations, synthesis and two-month model completion pass.');
