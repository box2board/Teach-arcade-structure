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
 click(){this.dispatchEvent(new Event('click'));}
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
await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const scene=new THREE.Scene();const player=new THREE.Group();player.name='player-controller';scene.add(player);
const camera=new THREE.PerspectiveCamera();camera.position.set(0,5,-4);
const frame=()=>THREE.WebGLRenderer.prototype.render.call({},scene,camera);
const interact=(point,offset=1.5)=>{player.position.set(point.x,0,point.z+offset);frame();const e=new Event('keydown');Object.defineProperties(e,{code:{value:'KeyE'},repeat:{value:false}});window.dispatchEvent(e);};
const dialog=nodes.get('questionDialog');
const answer=i=>nodes.get('answerList').children[i].click();
const dismiss=()=>{dialog.close();};
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
 answer((station.evidenceQuestion.correct+1)%4);
 assert.equal(window.TA3DMission.relayProgress,i,'wrong answer cannot activate station');
 dismiss();assert.equal(window.TA3DMission.relayProgress,i,'closing task cannot activate station');
 interact(station);answer(station.evidenceQuestion.correct);
 assert.equal(window.TA3DMission.relayProgress,i+1);
 answer(station.evidenceQuestion.correct);assert.equal(window.TA3DMission.relayProgress,i+1,'double submission does not advance again');
 dismiss();
 assert.equal(window.TA3DMission.knowledgePassed,false,'station evidence cannot unlock final console');
}
assert.equal(window.TA3DMission.archiveUnlocked,true);
interact(config.mission.archiveConsole,1.6);assert.equal(dialog.open,true);
answer((config.questions.archive.correct+1)%4);assert.equal(window.TA3DMission.knowledgePassed,false);
answer(config.questions.archive.correct);assert.equal(window.TA3DMission.knowledgePassed,true);dismiss();
interact(config.mission.commandCore,1.7);assert.equal(dialog.open,true);
answer((config.questions.commandCore.correct+1)%4);flush(config.mission.commandCore.stabilizationMs);
assert.equal(window.TA3DMission.finished,false,'prediction is required for completion');
answer(config.questions.commandCore.correct);flush(config.mission.commandCore.stabilizationMs);
assert.equal(window.TA3DMission.finished,true);
assert.equal(nodes.get('completeDialog').open,true);
console.log('Seasons mission: all 3 evidence gates, wrong answers, cancellation, duplicate submission, synthesis, prediction and completion pass.');
