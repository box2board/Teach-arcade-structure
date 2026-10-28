import fs from 'node:fs';import {fileURLToPath} from 'node:url';import vm from 'node:vm';import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../public/dev/snow-day-visuals/',import.meta.url));const THREE=await import(new URL('../public/assets/vendor/three-0.162.0/three.module.js',import.meta.url));const {DEMO_QUESTIONS}=await import(root+'questions.js');const {createFeatures,randomFive,FEATURES}=await import(root+'features.js');
for(let seed=0;seed<1000;seed++){const ids=randomFive(seed);assert.equal(new Set(ids).size,5);assert.ok(!ids.includes('frozen')||ids.includes('projectiles'));assert.deepEqual(randomFive(seed),ids);}assert.notDeepEqual(randomFive(1),randomFive(2));
class E{constructor(){this.dataset={};this.children=[];this.style={};this.value='normal';this.classList={add(){}};this.hidden=true;this.textContent='';this.clientWidth=1024;this.clientHeight=768;this.disabled=false;}append(...xs){this.children.push(...xs)}get firstChild(){return this.children[0]}set innerHTML(s){this.children=[]}setAttribute(){}addEventListener(){}focus(){}getContext(){return{beginPath(){},roundRect(){},fill(){},fillText(){}}}}
const els=new Map();const doc={body:new E(),getElementById(id){if(!els.has(id))els.set(id,new E());return els.get(id)},createElement(){return new E()},addEventListener(){}};
class R{constructor(){this.info={render:{calls:0,triangles:0}}}setClearColor(){}setPixelRatio(){}setSize(){}render(){}}
const {VERSION,qualityFor}=await import('../public/teach-arcade-visuals/presets/quality.js');
const {createCues}=await import('../public/teach-arcade-visuals/core/cues.js');
const {uiCue}=await import('../public/teach-arcade-visuals/core/ui.js');
const {createParticlePool,createWeather}=await import('../public/teach-arcade-visuals/core/particles-three.js');
const {buildVillage,buildFort,dressDefender,dressCreature,batchCharacter}=await import('../public/dev/snow-day-visuals/theme.js');
const {fitBenchmarkCamera}=await import('../public/dev/snow-day-visuals/camera.js');
const {sculptDefender,sculptCreature,snowSurface}=await import('../public/dev/snow-day-visuals/art.js');
const {softContactTexture,dressSupply,updateSupplyStyle}=await import('../public/dev/snow-day-visuals/landscape.js');
const {dressFeatureObject,dressIceShield,updateIceShield,snowTree}=await import('../public/dev/snow-day-visuals/details.js');
const ctx={updateSupplyStyle,dressFeatureObject,dressIceShield,updateIceShield,softContactTexture,dressSupply,sculptDefender,sculptCreature,snowSurface,fitBenchmarkCamera,VERSION,qualityFor,createCues,uiCue,createParticlePool,createWeather,buildVillage,buildFort,dressDefender,dressCreature,batchCharacter,localStorage:{getItem(){return null;},setItem(){}},CustomEvent:class{},THREE:{...THREE,WebGLRenderer:R},DEMO_QUESTIONS,createFeatures,randomFive,FEATURES,setupLab:()=>({config:()=>({enabled:[],randomize:true,seed:1,density:1,speed:1,health:1,startWave:1,startSquad:5}),record(){}}),document:doc,window:{addEventListener(){},dispatchEvent(){}},performance:{now:()=>ctx.testNow||0},requestAnimationFrame(){},devicePixelRatio:1,console};vm.createContext(ctx);vm.runInContext(fs.readFileSync(root+'game.js','utf8').replace(/^import .*;$/gm,''),ctx);
vm.runInContext('start();finishRecruitment();update(.016)',ctx);assert.equal(ctx.window.snowDiagnostics().modules.features.length,5);assert.ok(ctx.window.snowDiagnostics().bullets>0);
vm.runInContext("S.wave=2;S.damage=3;S.health=1;addEnemy(0,18);update(.016)",ctx);assert.equal(ctx.window.snowDiagnostics().state.mode,'rebuild');assert.equal(ctx.window.snowDiagnostics().state.health,0);
function answer(correct){const i=vm.runInContext(`questionList[(questionIndex-1)%questionList.length].choices.find(c=>c.correct===${correct}).text`,ctx);const group=els.get('content').children[1];group.children.find(b=>b.textContent.slice(3)===i).onclick();}
answer(false);assert.equal(ctx.window.snowDiagnostics().state.health,0);els.get('go').onclick();
for(let n=1;n<=10;n++){answer(true);assert.equal(ctx.window.snowDiagnostics().state.health,n*10);assert.equal(ctx.window.snowDiagnostics().state.mode,'rebuild');els.get('go').onclick();}
assert.equal(ctx.window.snowDiagnostics().state.mode,'play');assert.equal(ctx.window.snowDiagnostics().state.wave,2);assert.equal(ctx.window.snowDiagnostics().state.damage,3);assert.equal(ctx.window.snowDiagnostics().state.health,100);
vm.runInContext("clearWorld();S.health=1;addEnemy(0,18,'boss');update(.016)",ctx);assert.equal(ctx.window.snowDiagnostics().state.mode,'rebuild');assert.equal(vm.runInContext("enemies.some(e=>e.type==='boss')",ctx),true);
vm.runInContext("runConfig={enabled:['objectives'],randomize:false,seed:1,density:1,speed:1,health:1,startWave:1,startSquad:5};start();finishRecruitment();S.health=.001;S.x=8;fx.update(1)",ctx);assert.equal(ctx.window.snowDiagnostics().state.mode,'rebuild','Module damage also enters rebuild');
vm.runInContext("runConfig={enabled:['zigzag'],randomize:false,seed:1,density:1,speed:1,health:1,startWave:1,startSquad:5};start()",ctx);assert.equal(ctx.window.snowDiagnostics().modules.features.join(','),'zigzag');
console.log('PASS: 1,000 exact-five combinations, dependency pairing, automatic throwing, wrong answers give zero progress, ten correct answers rebuild fully, same wave/upgrades preserved, boss breach retained, optional-module damage rebuilds, custom Lab override. WebGL rendering and physical-device performance not tested.');

ctx.testNow=0;vm.runInContext('start()',ctx);assert.equal(ctx.window.snowDiagnostics().state.mode,'recruit');assert.equal(ctx.window.snowDiagnostics().state.squad,6);assert.equal(ctx.window.snowDiagnostics().recruitmentSeconds,60);assert.equal(ctx.window.snowDiagnostics().bullets,0);
function recruitAnswer(correct){const text=vm.runInContext(`questionList[(questionIndex-1)%questionList.length].choices.find(c=>c.correct===${correct}).text`,ctx);els.get('content').children[1].children.find(b=>b.textContent.slice(3)===text).onclick();}
for(let n=1;n<=3;n++){recruitAnswer(true);assert.equal(ctx.window.snowDiagnostics().state.squad,6+n);els.get('go').onclick();}recruitAnswer(false);assert.equal(ctx.window.snowDiagnostics().state.squad,9);els.get('go').onclick();ctx.testNow=59999;vm.runInContext('recruitmentTick()',ctx);assert.equal(ctx.window.snowDiagnostics().state.mode,'recruit');ctx.testNow=60000;recruitAnswer(true);assert.equal(ctx.window.snowDiagnostics().state.mode,'play');assert.equal(ctx.window.snowDiagnostics().state.squad,9,'Late answer must not count');
ctx.testNow=0;vm.runInContext('start()',ctx);ctx.testNow=60000;vm.runInContext('recruitmentTick()',ctx);assert.equal(ctx.window.snowDiagnostics().state.squad,6,'Zero correct still gets six');
vm.runInContext(`runConfig={enabled:['projectiles'],randomize:false,seed:1,density:1,speed:1,health:1,startWave:1};start();finishRecruitment();addEnemy(0,-10);for(let i=0;i<400;i++)fx.update(.02);`,ctx);assert.equal(ctx.window.snowDiagnostics().state.squad,5,'Enemy projectile removes exactly one player');assert.equal(ctx.window.snowDiagnostics().state.health,100,'Projectile casualty does not also damage fort');
vm.runInContext(`S.squad=1;syncSquad();losePlayer();`,ctx);assert.equal(ctx.window.snowDiagnostics().state.squad,0);assert.equal(ctx.window.snowDiagnostics().state.mode,'rebuild');vm.runInContext('resumeRebuilt()',ctx);assert.equal(ctx.window.snowDiagnostics().state.squad,6);assert.equal(ctx.window.snowDiagnostics().state.mode,'play');
console.log('PASS: 60-second recruitment, 6 + correct scoring, wrong/late answers excluded, automatic transition, zero-correct fallback, real projectile casualty and last-defender recovery.');

// Visual modes must preserve state and stay within their particle budgets.
for(const mode of ['performance','standard','showcase']){
 vm.runInContext(`qualityName='${mode}';applyQuality();puff(0,1,0,0xffffff,1000)`,ctx);
 assert.ok(ctx.window.snowDiagnostics().visuals.activeParticles<=qualityFor(mode).particles);
 const before=JSON.stringify(ctx.window.snowDiagnostics().state);
 vm.runInContext('weather.update(.016,1);particlePool.update(.016);cues.tick(.016)',ctx);
 assert.equal(JSON.stringify(ctx.window.snowDiagnostics().state),before);
}
const budget=vm.runInContext('({sceneChildren:scene.children.length,instanced:scene.children.filter(o=>o.isInstancedMesh).length})',ctx);
console.log('PASS: all three visual budgets, cosmetic update isolation, existing instanced scenery',budget);

for(const [w,h] of [[1366,768],[1024,768],[390,844],[844,390]]){
 const camera=new THREE.PerspectiveCamera(48,w/h,.1,220);fitBenchmarkCamera(camera,w,h);
 for(const center of [-8.3,0,8.3]){
 camera.position.x=camera.userData.portraitFollow?center:0;camera.updateMatrixWorld();
 for(const offset of [-4,4])for(const y of [0,3.8]){const v=new THREE.Vector3(center+offset,y,16).project(camera);assert.ok(Math.abs(v.x)<=1&&Math.abs(v.y)<=1,`${w}x${h}: squad remains visible at steering edge`);}
 }
 if(w===390){camera.position.x=0;camera.updateMatrixWorld();const feet=new THREE.Vector3(0,0,14).project(camera),head=new THREE.Vector3(0,3.8,14).project(camera);assert.ok((feet.y-head.y)*h/-2>70,'portrait character exceeds 70px instead of the previous roughly 40px');}
}
console.log('PASS: close-view squad bounds at all steering edges, portrait character scale');

for(const type of ['normal','runner','tank','boss']){const g=vm.runInContext(`creature('${type}')`,ctx);assert.equal(g.children.filter(o=>o.isMesh).length,2,'one colored body + one transparent shadow');}
const first=vm.runInContext('defender()',ctx),second=vm.runInContext('defender()',ctx);assert.ok(first.userData.arms.every(a=>a.parent===first));assert.equal(first.children.filter(o=>o.isMesh).length,4);assert.equal(first.children.at(-1).geometry,second.children.at(-1).geometry,'same outfit reuses cached geometry');
console.log('PASS: creature body 1 draw + shadow; defender body 1 + 2 moving arms + shadow; shared cached outfit geometries');

// Source reconciliation must never silently discard newer gameplay modules.
const {createHash}=await import('node:crypto');
const provenance=JSON.parse(fs.readFileSync(new URL('../visual-upgrades/provenance.json',import.meta.url)));
for(const name of ['features.js','lab.js','questions.js']){
 assert.equal(createHash('sha256').update(fs.readFileSync(root+name)).digest('hex'),provenance.sourceSha256[name]);
 assert.equal(fs.readFileSync(root+name,'utf8'),fs.readFileSync(root+'before/'+name,'utf8'));
}
const gameSource=fs.readFileSync(root+'game.js','utf8');
assert.ok(!gameSource.includes("$('wave-intro')"));
vm.runInContext('start();hud()',ctx);assert.equal(els.get('lab-open').disabled,true);
vm.runInContext('finishRecruitment();hud()',ctx);assert.equal(els.get('lab-open').disabled,false);
vm.runInContext('nextWave()',ctx);assert.match(els.get('toast').textContent,/WAVE|FROST KING/);
// Recruitment remains uncapped after the old 20-member threshold.
ctx.testNow=0;vm.runInContext('start();recruitmentCorrect=25;finishRecruitment()',ctx);
assert.equal(ctx.window.snowDiagnostics().state.squad,31);
console.log('PASS: Site source hashes, unchanged feature/library modules, bottom wave notices, Lab academic lock and recruitment above 20');

vm.runInContext("S.mode='review';nextQuestion()",ctx);assert.equal(els.get('lab-open').disabled,true,'review panel locks Lab before the next frame');

vm.runInContext("visualTestScene()",ctx);assert.equal(ctx.window.snowDiagnostics().state.squad,9);assert.equal(ctx.window.snowDiagnostics().state.mode,"play");assert.equal(ctx.window.snowDiagnostics().enemies,15);vm.runInContext("update(.02)",ctx);assert.ok(ctx.window.snowDiagnostics().bullets>0);vm.runInContext("start()",ctx);assert.equal(ctx.window.snowDiagnostics().state.mode,"recruit");console.log("PASS: representative art scene is playable; normal start still recruits");

const terrain=vm.runInContext("scene.children.find(o=>o.isInstancedMesh&&o.geometry.attributes.position.count===45*69)",ctx);
assert.ok(terrain,'sculpted landscape survives the static instancing pass');
const terrainPosition=terrain.geometry.attributes.position;
for(let i=0;i<terrainPosition.count;i++){
 assert.ok(Number.isFinite(terrainPosition.getY(i)));
 if(Math.abs(terrainPosition.getX(i))<=11.5)assert.ok(Math.abs(terrainPosition.getY(i)+.004)<.0001,'play plane remains flat');
}
const contact=softContactTexture(),alpha=contact.image.data;
assert.equal(alpha[3],0);assert.ok(alpha[((16*32)+16)*4+3]>200,'contact shadows fade out rather than hard circles');
console.log('PASS: instanced terrain, finite sculpted vertices, unchanged flat play plane and soft contact alpha');

vm.runInContext("visualTestScene()",ctx);
assert.equal(vm.runInContext('new Set(crew.map(g=>g.position.z)).size',ctx),2,'nine defenders use two readable rows');
assert.ok(vm.runInContext('Math.max(...crew.map(g=>g.position.x))-Math.min(...crew.map(g=>g.position.x))',ctx)>5);
vm.runInContext('S.x=8.3;resize();frame(1000)',ctx);
assert.ok(Number.isFinite(vm.runInContext('camera.position.x',ctx)));
console.log('PASS: wider two-row formation and camera frame integration');

vm.runInContext("visualTestScene()",ctx);
const shielded=vm.runInContext('enemies.find(e=>e.shield>0)',ctx);assert.ok(shielded.shieldVisual.userData.iceArt);const shieldRef=shielded.shieldVisual,health=shielded.hp;
vm.runInContext('hitEnemy(enemies.find(e=>e.shield>0),2)',ctx);assert.equal(shielded.shield,3);assert.equal(shielded.hp,health);assert.equal(shieldRef.userData.cracks[0].visible,true);assert.equal(shieldRef.userData.cracks[1].visible,false);
vm.runInContext('hitEnemy(enemies.find(e=>e.shield>0),2)',ctx);assert.equal(shielded.shield,1);assert.equal(shieldRef.userData.cracks[1].visible,true);
vm.runInContext('hitEnemy(enemies.find(e=>e.shield>0),1)',ctx);assert.equal(shielded.shield,0);assert.equal(shielded.hp,health);assert.equal(shieldRef.parent,null);
vm.runInContext('hitEnemy(enemies.find(e=>e.shield===0),1)',ctx);assert.equal(shielded.hp,health-1);
const treeScene=new THREE.Scene();const fakeMesh=(geo,color,x,y,z,sx=1,sy=sx,sz=sx,parent=treeScene)=>{const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color}));m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;};
const tree=snowTree({scene:treeScene,mesh:fakeMesh,sphere:new THREE.SphereGeometry(1,8,6),cylinder:new THREE.CylinderGeometry(1,1,1,8),shadow(){},random:()=>.5},18,-20,1);assert.equal(tree.userData.snowTree,true);assert.ok(tree.children.length<30);
console.log('PASS: shield silhouette, cracks at 3/1 strength, same damage absorption/removal reference, post-break HP damage and bounded tree geometry');

for(const [color,marker,kind] of [[0xeab049,false,'attack-warning'],[0xf09161,false,'enemy-snowball'],[0x44b98c,true,'feature-badge'],[0xffbd3f,true,'feature-badge'],[0xae75da,true,'feature-badge'],[0xd689d7,true,'feature-badge']]){
 const root=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial());const original=root;
 dressFeatureObject(root,color,marker);assert.equal(root,original);assert.equal(root.userData.artKind,kind);assert.ok(root.children.length<=1);
}
vm.runInContext("runConfig={enabled:['projectiles','charging','support','splitting'],randomize:false,seed:1,density:1,speed:1,health:1,startWave:1};start();finishRecruitment();addEnemy(0,-10);for(let i=0;i<210;i++)fx.update(.02)",ctx);
assert.ok(vm.runInContext("scene.children.some(o=>o.userData.artKind==='attack-warning')",ctx),'actual timed warning uses art adapter');
const stateBeforeArt=JSON.stringify(ctx.window.snowDiagnostics().state);vm.runInContext("featureMesh(sphere,0xf09161,0,.7,0,.4)",ctx);assert.equal(JSON.stringify(ctx.window.snowDiagnostics().state),stateBeforeArt);
console.log('PASS: feature badge/shot/warning adapters preserve object identity and simulation state; real module warnings use ring art');

vm.runInContext('addCrate();crates.at(-1).hp=crates.at(-1).max/2;updateSupplyStyle(crates.at(-1))',ctx);
assert.equal(vm.runInContext('crates.at(-1).g.userData.targetBar.scale.x',ctx),1.05);
assert.equal(vm.runInContext('crates.at(-1).g.userData.targetBar.position.x',ctx),-.525);
console.log('PASS: crate durability bar reflects HP without changing crate rewards or hit points');
