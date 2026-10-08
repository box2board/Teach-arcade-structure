import { GEAR, REWARD_RULES, answerReward, freshGear, gearPrice, purchaseGear, equipGear, validateQuestions } from './gear.js?v=16';
import { DEMO_QUESTIONS } from './questions.js?v=14';
import * as THREE from '/assets/vendor/three-0.162.0/three.module.js';
import { fitSnowCamera } from './camera.js?v=10';
import { segmentSphereHit } from './collision.js?v=2';
import { UPGRADE_RULES, freshUpgrades, grantTokens, canBuy, buyUpgrade } from './upgrades.js?v=3';
import { CREATURE_TYPES, advanceCreature } from './creatures.js?v=10';
import { DIFFICULTIES, WAVE_PATTERNS, buildWave } from './waves.js?v=13';

const $ = id => document.getElementById(id);
const canvas = $('scene'), stage = $('stage');
// Cosmetic randomness is separate so effects never alter wave schedules.
let visualSeed=731;
function visualRandom(){visualSeed=(visualSeed*1664525+1013904223)>>>0;return visualSeed/4294967296;}
let reducedEffects=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
$('reduced-effects').checked=reducedEffects;
let renderer;
try {
  renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'});
} catch {
  $('title').textContent = '3D graphics unavailable';
  $('message').textContent = 'This device could not start WebGL. Try a browser with 3D graphics enabled.';
  $('start').disabled = true;
  throw new Error('WebGL initialization failed');
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#bfdcec');
scene.fog = new THREE.Fog('#bfdcec', 42, 82);
const camera = new THREE.PerspectiveCamera(43,1,.1,100);
fitSnowCamera(camera,stage.clientWidth,stage.clientHeight);
scene.add(new THREE.HemisphereLight(0xe8f7ff,0x7894b1,1.8));
const sun = new THREE.DirectionalLight(0xfff5e6,2.2);sun.position.set(-12,24,8);sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-17,right:17,top:25,bottom:-25,far:70});sun.shadow.bias=-.001;scene.add(sun);
const materials = {};
function mat(color){return materials[color] ||= new THREE.MeshStandardMaterial({color,roughness:.85});}
const sphere = new THREE.SphereGeometry(1,12,8), box = new THREE.BoxGeometry(1,1,1);
const slowRingGeo=new THREE.TorusGeometry(.8,.045,5,20);
const cone = new THREE.ConeGeometry(1,1,8);
function mesh(geo,color,x,y,z,sx=1,sy=sx,sz=sx,parent=scene){const m=new THREE.Mesh(geo,mat(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
mesh(box,'#e9f3fa',0,-.35,-18,120,.6,110);
mesh(box,'#afcbdc',0,-.01,-16,13,.06,58);
for(let z=-40;z<10;z+=2.5){mesh(sphere,'#f8fcff',-7,.25,z,1,.45,1.5);mesh(sphere,'#f8fcff',7,.25,z,1,.45,1.5);}
function tree(x,z,s){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);mesh(box,'#98765d',0,.8,0,.35,1.6,.35,g);for(let i=0;i<3;i++){mesh(cone,'#527f83',0,1.5+i*.8,0,1.8-i*.35,1.8,1.8-i*.35,g);mesh(cone,'#f3faff',0,1.84+i*.8,0,1.37-i*.26,1.15,1.37-i*.26,g);}g.scale.setScalar(s);}
for(let i=0;i<14;i++){tree(-10-(i%3)*2,-37+i*3.5,.85+(i%4)*.15);tree(10+(i%3)*2,-39+i*3.5,1+(i%3)*.2);}
// Low hills and shallow tracks add depth outside creature silhouettes.
for(const [x,z,size] of [[-27,-47,13],[23,-50,17],[0,-62,20]])mesh(sphere,'#d8e9f3',x,0,z,size,size*.35,size*.65);
for(let z=-35;z<6;z+=1.7)for(const side of [-1,1]){const track=mesh(sphere,'#99b8cd',side*4.8,.035,z,.12,.018,.3);track.castShadow=false;}
// Warm cabins beyond the banks; all scenery rests on the ground.
for(const [x,z] of [[-15,-10],[15,-22]]){mesh(box,'#b28f78',x,1.5,z,4,3,3);const roof=mesh(cone,'#f9fcff',x,3.5,z,3.6,1.9,2.8);roof.rotation.y=Math.PI/4;mesh(box,'#ffd78d',x,1.6,z+1.51,1,1,.04);mesh(box,'#806a5b',x,1.6,z+1.55,.07,1,.03);mesh(box,'#806a5b',x,1.6,z+1.55,1,.07,.03);mesh(box,'#927763',x+1,3.9,z,.5,1,.5);}
const fortGroup=new THREE.Group();scene.add(fortGroup);fortGroup.position.z=9;
for(let row=0;row<2;row++)for(let i=0;i<10;i++)mesh(box,'#eff9ff',-5.6+i*1.25+(row%2)*.1,.45+row*.85,0,1.19,.8,.9,fortGroup);
const fortMerlons=[];for(let i=0;i<5;i++)fortMerlons.push(mesh(box,'#fffaff',-5+i*2.5,2.05,0,1.15,.7,.95,fortGroup));
mesh(box,'#856951',-5.8,2.9,0,.1,2,.1,fortGroup);mesh(box,'#f0944d',-5.15,3.6,0,1.2,.65,.08,fortGroup);
const player=new THREE.Group();scene.add(player);player.position.set(0,0,5.6);
mesh(sphere,'#254d76',0,.9,0,.46,.64,.35,player);mesh(sphere,'#ffcfab',0,1.7,0,.32,.32,.32,player);
mesh(sphere,'#f29343',0,1.94,0,.37,.22,.37,player);mesh(sphere,'#fffaff',0,2.19,0,.13,.13,.13,player);
const feet=[mesh(box,'#263d54',-.22,.22,0,.25,.42,.42,player),mesh(box,'#263d54',.22,.22,0,.25,.42,.42,player)];
const arms=[];
for(const side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.48,1.3,0);player.add(arm);mesh(sphere,'#254d76',0,-.18,-.06,.16,.28,.16,arm);mesh(sphere,'#f29343',0,-.4,-.12,.19,.18,.19,arm);arms.push(arm);}
const heldBall=mesh(sphere,'#ffffff',0,-.4,-.32,.2,.2,.2,arms[1]);
mesh(box,'#eff7ff',0,1.02,-.35,.035,.65,.025,player);
for(const side of [-1,1]){mesh(box,'#38658b',side*.22,.74,-.3,.22,.17,.08,player);mesh(box,'#f4dfb9',side*.22,.13,-.11,.29,.08,.49,player);}
mesh(box,'#dd7539',-.29,1.24,-.39,.17,.42,.07,player);
mesh(sphere,'#38658b',0,1.02,.34,.34,.4,.13,player);
mesh(box,'#f29343',0,1.43,-.08,.75,.13,.6,player);
// Each creature has a distinct silhouette as well as its own movement rule.
const bucketGeo=new THREE.CylinderGeometry(.42,.5,.55,10);
function creature(type,x,z){
 const rule=CREATURE_TYPES[type],root=new THREE.Group();root.userData.snowCreature=true;root.userData.creatureType=rule.name;scene.add(root);
 const size=rule.size,hat=rule.accent,roller=type===4,bodyBase=roller?[.8,.8,.8]:type===2?[.78,.72,.68]:[.66,.72,.62];
 const body=mesh(sphere,'#f4fbff',0,roller?.8:.65,0,...bodyBase,root),hands=[];
 if(roller){
  // Packed snow rolls beneath a stable, readable face and winter outfit.
  for(let i=0;i<8;i++){const a=i*Math.PI/4;mesh(sphere,i%2?'#dcebf4':'#ffffff',.3,Math.sin(a)*.98,Math.cos(a)*.98,.14,.16,.14,body);}
  mesh(sphere,hat,0,1.48,0,.62,.3,.57,root);
  mesh(box,'#f2b6d1',0,1.45,.48,.94,.16,.1,root);
  mesh(sphere,'#fffaff',0,1.84,0,.13,.13,.13,root);
  mesh(box,hat,0,.96,.65,1.08,.22,.16,root);
  for(const ex of [-.23,.23]){
   mesh(sphere,'#fffaff',ex,.96,.73,.22,.17,.09,root);
   mesh(sphere,'#264f70',ex,.96,.81,.16,.11,.04,root);
   mesh(sphere,'#9bd9ec',ex-.04,1.0,.85,.045,.025,.015,root);
  }
  const nose=mesh(cone,'#ee994c',0,.8,.83,.1,.28,.1,root);nose.rotation.x=Math.PI/2;
  for(const ex of [-.15,0,.15])mesh(sphere,'#27415c',ex,.61+Math.abs(ex)*.3,.76,.035,.035,.03,root);
  const scarf=new THREE.Mesh(slowRingGeo,mat(hat));scarf.rotation.x=Math.PI/2;scarf.position.y=.47;root.add(scarf);
  mesh(box,hat,.64,.32,.22,.18,.42,.12,root);
  for(const side of [-1,1])hands.push(mesh(sphere,hat,side*.83,.8,.1,.18,.22,.17,root));
 }else{
  mesh(sphere,'#fffaff',0,1.5,0,.45,.45,.45,root);
  if(type===2){mesh(bucketGeo,hat,0,2.05,0,1,1,1,root);mesh(box,'#fffaff',0,2.34,0,.72,.07,.72,root);}
  else{mesh(box,hat,0,1.92,0,.85,.12,.8,root);mesh(box,hat,0,2.09,0,.58,.3,.56,root);}
  if(type===1)for(const ex of [-.24,.24])mesh(sphere,hat,ex,2.45,0,.13,.4,.13,root);
  if(type===3){mesh(cone,hat,0,2.36,0,.45,.7,.45,root);mesh(sphere,'#fffaff',0,2.75,0,.12,.12,.12,root);}
  mesh(box,hat,0,1.22,0,.96,.15,.78,root);
  for(const ex of [-.15,.15])mesh(sphere,'#27415c',ex,1.6,.39,.065,.065,.065,root);
  const nose=mesh(cone,'#ee994c',0,1.47,.5,.095,.32,.095,root);nose.rotation.x=Math.PI/2;
  for(const side of [-1,1]){const hand=mesh(sphere,hat,side*.73,.93,0,type===3?.12:.16,type===3?.35:.16,.16,root);if(type===3)hand.rotation.z=side*.5;hands.push(hand);}
 }
 const snowChunks=[];
for(let i=0;i<6;i++){const a=i*Math.PI/3;snowChunks.push(mesh(sphere,'#e1eef7',Math.cos(a)*.83,Math.sin(a)*.75,.48,.18,.16,.15,body));}
 const maxHp=DIFFICULTIES[difficulty].hp[type],pips=[];
 const slowRing=new THREE.Mesh(slowRingGeo,mat('#70cee1'));slowRing.rotation.x=Math.PI/2;slowRing.position.y=.06;slowRing.visible=false;root.add(slowRing);
 for(let i=0;i<maxHp;i++)pips.push(mesh(sphere,hat,(i-(maxHp-1)/2)*.2,roller?2.23:2.9,0,.07,.07,.07,root));
 root.scale.setScalar(size);root.position.set(x,0,z);
 return {root,body,bodyBase,snowChunks,pips,slowRing,slowTime:0,type,x,z,baseX:x,spawnZ:z,age:0,roll:0,size,hands,hp:maxHp,maxHp,hitTime:0,speed:rule.speed,radius:rule.radius*size,phase:Math.random()*6};
}
let upgrades=freshUpgrades(), volley=0, splashes=[], splashHits=0, stickyHits=0;
const splashGeo=new THREE.RingGeometry(.85,1,32), splashMaterial=new THREE.MeshBasicMaterial({color:0x72cbe6,side:THREE.DoubleSide,transparent:true,opacity:.65});
let mode='ready', wave=1, fort=100, cleared=0, spawned=0, waveTime=0, spawnClock=0, tossClock=0, elapsed=0;
let enemies=[], balls=[], flakes=[], piles=[], tumbles=[], hits=0, defeatedByType=CREATURE_TYPES.map(()=>0), moveLeft=false,moveRight=false,drag=false,targetX=null;
const BURST_RADIUS=8,DOUBLE_TAP_MS=280;
const heldArrows=new Set();let lastArrowTap=null,lastArrowTapAt=-Infinity;
let shockwaves=[],noticeTime=0,fortFlash=0,celebrationTime=0;
const burstRingMaterial=new THREE.MeshBasicMaterial({color:0x168dbd,side:THREE.DoubleSide,transparent:true,opacity:.9,depthWrite:false});
const burstDiskGeo=new THREE.CircleGeometry(1,48),burstDiskMaterial=new THREE.MeshBasicMaterial({color:0xb5f4ff,side:THREE.DoubleSide,transparent:true,opacity:.25,depthWrite:false});
let dashTime=0,dashCooldown=0,dashDirection=0,burstCooldown=0,burstCharges=2,burstUses=0,burstHits=0;
let warningIndex=0,incomingTime=0;const introducedTypes=new Set();
function incomingNotice(message){
 $('incoming-warning').textContent=message;$('incoming-warning').hidden=false;$('status-row').dataset.warning='true';incomingTime=3;
}
function clearIncoming(){incomingTime=0;$('incoming-warning').hidden=true;$('status-row').dataset.warning='false';}
let difficulty='easy',selectedDifficulty='easy',wavePlan=buildWave('easy',0);
for(const input of document.querySelectorAll('input[name="difficulty"]'))input.addEventListener('change',()=>{
 if(!['ready','won','lost'].includes(mode)||!input.checked||!DIFFICULTIES[input.value])return;
 selectedDifficulty=input.value;$('difficulty-hint').textContent=DIFFICULTIES[selectedDifficulty].hint;
});
const ballGeo=new THREE.SphereGeometry(.23,10,8), flakeGeo=new THREE.SphereGeometry(.06,4,3);
// One shared point cloud avoids per-frame snowfall allocations.
const snowPositions=new Float32Array(80*3);
for(let i=0;i<80;i++){snowPositions[i*3]=(visualRandom()-.5)*30;snowPositions[i*3+1]=visualRandom()*12;snowPositions[i*3+2]=visualRandom()*48-36;}
const snowGeometry=new THREE.BufferGeometry();snowGeometry.setAttribute('position',new THREE.BufferAttribute(snowPositions,3));
const snowfall=new THREE.Points(snowGeometry,new THREE.PointsMaterial({color:0xffffff,size:.075,transparent:true,opacity:.55,depthWrite:false}));snowfall.userData.ambientSnow=true;scene.add(snowfall);
function effectsSettings(){snowfall.visible=!reducedEffects;renderer.setPixelRatio(Math.min(devicePixelRatio,reducedEffects?1:1.6));renderer.shadowMap.enabled=!reducedEffects;renderer.shadowMap.needsUpdate=true;}
$('reduced-effects').addEventListener('change',()=>{reducedEffects=$('reduced-effects').checked;effectsSettings();if(reducedEffects){celebrationTime=0;player.position.y=0;}});effectsSettings();
function syncFort(){fortGroup.scale.y=.4+.6*fort/100;fortMerlons.forEach((m,i)=>m.visible=fort>(i+1)*18);}
function fortImpact(x){
 fortFlash=.55;$('fort').dataset.hit='true';syncFort();
 for(let i=0;i<(reducedEffects?3:10);i++){const chunk=mesh(box,'#f4fbff',x,1.1,8.7,.18,.18,.18);flakes.push({mesh:chunk,life:.7,vx:(visualRandom()-.5)*4,vy:2+visualRandom()*3,vz:-visualRandom()*3});}
}
function celebrate(){
 celebrationTime=reducedEffects?0:1.1;
 if(reducedEffects)return;
 for(let i=0;i<18;i++){const m=mesh(flakeGeo,i%3?'#ffffff':'#ffd78d',(visualRandom()-.5)*10,2,8);flakes.push({mesh:m,life:1,vx:(visualRandom()-.5)*3,vy:3+visualRandom()*2,vz:-visualRandom()*2});}
}
function disposeEntity(e){scene.remove(e.root||e.mesh);}
function burst(x,z){for(let i=0;i<(reducedEffects?3:9);i++){const m=mesh(flakeGeo,'#ffffff',x,.8,z);flakes.push({mesh:m,life:.55,vx:(visualRandom()-.5)*5,vy:2+visualRandom()*3,vz:(visualRandom()-.5)*5});}}
function snowPile(e){
 const g=new THREE.Group();scene.add(g);g.position.set(e.x,0,e.z);
 mesh(sphere,'#faffff',0,.12,0,.8*e.size,.2*e.size,.6*e.size,g);
 mesh(sphere,'#edf7ff',.3*e.size,.15,.1,.45*e.size,.22*e.size,.4*e.size,g);
 mesh(box,CREATURE_TYPES[e.type].accent,-.15,.25,0,.5*e.size,.1,.4*e.size,g);
 piles.push({root:g,life:5});
}
const shopIds=['upgrade-double','upgrade-sticky','upgrade-powder','upgrade-repair','start'];
function shopButtons(){return shopIds.map($).filter(b=>!b.disabled);}
function focusShopButton(button){(button||shopButtons()[0]).focus({preventScroll:true});}
function shopKeyboard(e){
 if(mode!=='between'||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' ','Tab'].includes(e.key))return false;
 e.preventDefault();
 const available=shopButtons(),current=document.activeElement;
 if(e.key==='Enter'||e.key===' '){if(!e.repeat&&available.includes(current))current.click();return true;}
 if(e.key==='Tab'||e.key==='ArrowLeft'||e.key==='ArrowRight'){
  const direction=(e.key==='ArrowLeft'||(e.key==='Tab'&&e.shiftKey))?-1:1;
  const index=available.indexOf(current);
  focusShopButton(available[index<0?0:(index+direction+available.length)%available.length]);
 }else{
  // Two upgrade columns lead down to the full-width next-wave button.
  const paths=e.key==='ArrowDown'?[[2,4],[3,4],[4],[4],[0,1,2,3]]:[[4],[4],[0,4],[1,4],[2,3,0,1]];
  const index=shopIds.findIndex(id=>$(id)===current);
  focusShopButton(index<0?available[0]:paths[index].map(i=>$(shopIds[i])).find(b=>!b.disabled));
 }
 return true;
}
function updateShop(){
 $('tokens').textContent=upgrades.tokens;
 for(const id of Object.keys(UPGRADE_RULES)){
  const b=$(`upgrade-${id}`),owned=id!=='repair'&&upgrades[id];
  b.disabled=mode!=='between'||!canBuy(upgrades,id,fort);b.dataset.owned=String(!!owned);
  b.querySelector('strong').textContent=owned?`${UPGRADE_RULES[id].label} · Equipped`:`${UPGRADE_RULES[id].label} · ${UPGRADE_RULES[id].cost} ${UPGRADE_RULES[id].cost===1?'token':'tokens'}`;
 }
 const gear=['double','sticky','powder'].filter(id=>upgrades[id]).map(id=>UPGRADE_RULES[id].label);
 $('gear').textContent=equipmentEnabled?gearSummary():`Active upgrades: ${gear.length?gear.join(' · '):'none yet'}`;
}
for(const id of Object.keys(UPGRADE_RULES))$(`upgrade-${id}`).addEventListener('click',()=>{
 if(mode!=='between')return;
 const result=buyUpgrade(upgrades,id,fort);if(!result.purchased)return;
 fort=result.fort;syncFort();hud();updateShop();
 $('shop-feedback').textContent=id==='repair'?`Fort repaired to ${fort}%.`:`${UPGRADE_RULES[id].label} equipped for this run.`;
 focusShopButton(canBuy(upgrades,id,fort)?$(`upgrade-${id}`):shopButtons()[0]);
});
function damageCreature(e){
 if(!enemies.includes(e))return;
 e.hp--;hits++;e.hitTime=.28;e.z-=DIFFICULTIES[difficulty].pushback;e.pips.forEach((p,j)=>p.visible=j<e.hp);e.snowChunks.forEach((chunk,i)=>chunk.visible=i<Math.ceil(6*e.hp/e.maxHp));
 if(upgrades.sticky){e.slowTime=2.4;e.slowRing.visible=true;stickyHits++;}
 burst(e.x,e.z);
 if(e.hp<=0){snowPile(e);tumbles.push({root:e.root,life:.4,size:e.size});enemies.splice(enemies.indexOf(e),1);cleared++;defeatedByType[e.type]++;hud();$('status').textContent=`Snow creature cleared! ${cleared} snow piles.`;}
}
function powderSplash(x,z,victim){
 const radius=equipmentEnabled&&gearState.equipped.toss==='popper'?2.6+(gearLevel('toss')-1)*.5:2.6;
 const ring=new THREE.Mesh(splashGeo,splashMaterial);ring.rotation.x=-Math.PI/2;ring.position.set(x,.08,z);scene.add(ring);splashes.push({mesh:ring,life:.5,radius});
 for(const e of [...enemies])if(e!==victim&&Math.hypot(e.x-x,e.z-z)<=radius){damageCreature(e);e.z-=.7;splashHits++;}
}
// Active abilities share the same simulation clock as movement, so pause freezes cooldowns.
function abilityHud(){
 const active=mode==='playing';$('snow-gear').disabled=!['playing','paused'].includes(mode)||gearOpen;
 for(const [id,direction] of [['dash-left','◀'],['dash-right','▶']]){
  const b=$(id),label=dashCooldown>0?`${direction} Dash · ${Math.ceil(dashCooldown)}s`:`${direction} Dash`;
  if(b.textContent!==label)b.textContent=label;b.disabled=!active||dashCooldown>0;
 }
 const nearby=enemies.some(e=>Math.hypot(e.x-player.position.x,e.z-player.position.z)<=BURST_RADIUS);
 const b=$('snow-burst'),ready=active&&burstCharges>0&&burstCooldown===0&&nearby,label=`${equipmentEnabled?GEAR[gearState.equipped.special].name:'Snow Burst'} · ${burstCharges}${burstCooldown>0?' · Cooling':ready?' · Ready':''}`;
 b.dataset.ready=String(ready);
 if(b.textContent!==label)b.textContent=label;b.disabled=!active||burstCharges===0||burstCooldown>0;
}
function dash(direction){
 if(mode!=='playing'||dashCooldown>0)return;
 if(player.position.x*direction>=5.7){$('status').textContent='At the snowbank. Dash toward the other side.';return;}
 dashDirection=direction;dashTime=.16;dashCooldown=3;targetX=null;
 burst(player.position.x,player.position.z);abilityHud();
}
function abilityNotice(message,kind='info'){
 const b=$('ability-feedback');b.textContent=message;b.dataset.kind=kind;b.hidden=false;noticeTime=2.4;
}
function snowWave(x,z){
 const root=new THREE.Group();root.userData.snowWave=true;root.position.set(x,.13,z);scene.add(root);
 for(const [geometry,material] of [[burstDiskGeo,burstDiskMaterial],[splashGeo,burstRingMaterial]]){
  const m=new THREE.Mesh(geometry,material);m.rotation.x=-Math.PI/2;root.add(m);
 }
 root.scale.setScalar(.3);shockwaves.push({root,life:1,radius:BURST_RADIUS});
}
function snowBurst(){
 if(mode!=='playing')return;
 if(burstCharges===0){abilityNotice('No Snow Burst charges left. Open Snow Gear to earn more.');return;}
 if(burstCooldown>0){abilityNotice('Snow Burst is cooling down.');return;}
 const x=player.position.x,z=player.position.z,radius=BURST_RADIUS+(equipmentEnabled?gearLevel('special')-1:0);
 const targets=enemies.filter(e=>Math.hypot(e.x-x,e.z-z)<=radius);
 if(!targets.length){snowWave(x,z);abilityNotice('No creatures in range — charge saved. Let them come closer.');return;}
 burstCharges--;burstUses++;burstCooldown=1.2;
 snowWave(x,z);
 for(let i=0,n=reducedEffects?8:24;i<n;i++){const angle=i*Math.PI*2/n,m=mesh(ballGeo,'#ffffff',x,.9,z);flakes.push({mesh:m,life:.85,vx:Math.cos(angle)*10,vy:3+visualRandom()*3,vz:Math.sin(angle)*10});}
 for(const e of targets){
  for(let hit=0;hit<(equipmentEnabled?1+gearLevel('special'):2)&&enemies.includes(e);hit++){damageCreature(e);burstHits++;}
  if(enemies.includes(e))e.z-=2;
 }
 const message=`Snow Burst! ${targets.length} ${targets.length===1?'creature':'creatures'} hit · ${burstCharges} charges left`;
 $('status').textContent=message;abilityNotice(message,'burst');abilityHud();
}
for(const [id,action] of [['dash-left',()=>dash(-1)],['dash-right',()=>dash(1)],['snow-burst',equippedSpecial]])$(id).addEventListener('click',()=>{action();if(mode==='playing')canvas.focus({preventScroll:true});});
function hud(){ $('fort-text').textContent=`${fort}%`;$('fort').value=fort;$('snow-gear').dataset.help=String(equipmentEnabled&&fort<=40);$('wave').textContent=`${wave} / 3`;$('cleared').textContent=cleared; }
function overlay(title,message,label,eyebrow){
 $('shop').hidden=mode!=='between';$('difficulty-picker').hidden=!['ready','won','lost'].includes(mode);
 $('overlay').dataset.mode=mode;$('overlay').setAttribute('aria-modal',String(mode==='between'));$('overlay').hidden=false;
 $('title').textContent=title;$('message').textContent=message;$('start').textContent=label;$('eyebrow').textContent=eyebrow;
 $('menu-help').textContent=mode==='between'?'Arrows: choose · Enter: buy / start next wave':'Move: arrows / A & D / drag · Dash: double-tap arrows or Q / E · Snow Burst: Space / B';
 $('ability-feedback').hidden=true;noticeTime=0;clearIncoming();
 if(mode==='between'){$('tip').hidden=true;focusShopButton();}
}
function clearInputs(){moveLeft=moveRight=drag=false;targetX=null;heldArrows.clear();lastArrowTap=null;lastArrowTapAt=-Infinity;}
function reset(){gearReset();fortFlash=celebrationTime=0;$('fort').dataset.hit='false';player.position.y=0;player.rotation.set(0,0,0);arms[1].rotation.x=0;heldBall.visible=true;introducedTypes.clear();clearIncoming();[...enemies,...balls,...flakes,...piles,...tumbles,...splashes,...shockwaves].forEach(disposeEntity);enemies=[];balls=[];flakes=[];piles=[];tumbles=[];splashes=[];shockwaves=[];noticeTime=0;$('ability-feedback').hidden=true;upgrades=freshUpgrades();if(equipmentEnabled)grantTokens(upgrades,REWARD_RULES.startingStars);difficulty=selectedDifficulty;wavePlan=buildWave(difficulty,0);dashTime=dashCooldown=burstCooldown=burstUses=burstHits=0;dashDirection=0;burstCharges=2;volley=splashHits=stickyHits=0;hits=0;defeatedByType=CREATURE_TYPES.map(()=>0);fort=100;cleared=0;wave=1;spawned=0;warningIndex=0;waveTime=spawnClock=tossClock=0;$('tip').hidden=false;player.position.x=0;clearInputs();syncFort();hud();updateShop();}
function begin(){gearOpen=false;reviewOpen=false;$('gear-overlay').hidden=true;clearIncoming();mode='playing';$('overlay').dataset.mode=mode;$('overlay').hidden=true;$('shop').hidden=true;$('difficulty-picker').hidden=true;$('pattern').textContent=`${DIFFICULTIES[difficulty].label} · Wave ${wave}: ${wavePlan.name}`;$('tip').textContent=equipmentEnabled?'Move left/right · Snow Gear pauses to earn and upgrade':difficulty==='hard'?'Line up closely · dash between sides · burst close groups':'Move toward creatures · dots show remaining hits';$('pause').disabled=false;$('pause').textContent='Pause';$('status').textContent=wavePlan.hint;abilityHud();canvas.focus({preventScroll:true});}
function finish(won){if(won)celebrate();mode=won?'won':'lost';clearInputs();$('pause').disabled=true;overlay(won?'Snow day saved!':'Time to rebuild!',`You turned ${cleared} creatures into snow piles. ${won?`Your fort finished at ${fort}% strength.`:'Open Snow Gear during a wave to earn help before your fort falls.'}${equipmentEnabled?` Review: ${reviewAttempts.filter(a=>a.correct).length} correct across ${reviewAttempts.length} attempts.`:''}`,'Play again',won?'FORT PROTECTED':'A FRESH START');$('status').textContent=won?'All three waves complete.':'The snow fort tumbled. Try again!';abilityHud();}
$('start').addEventListener('click',()=>{if(mode==='paused')begin();else if(mode==='between'){wave++;wavePlan=buildWave(difficulty,wave-1);spawned=0;warningIndex=0;spawnClock=waveTime=0;hud();begin();}else{reset();if(equipmentEnabled){mode='paused';openGear('start');startReview();}else begin();}});
$('restart').addEventListener('click',()=>{reset();if(equipmentEnabled){mode='paused';openGear('start');startReview();}else begin();});
function pause(){if(mode!=='playing')return;mode='paused';clearInputs();$('pause').textContent='Resume';overlay('Snow day paused','Your fort and snowballs are safe while you take a break.','Resume snow day','TAKE A BREATHER');$('status').textContent='Paused';abilityHud();}
$('pause').addEventListener('click',()=>mode==='paused'?begin():pause());
window.addEventListener('blur',()=>{clearInputs();pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
window.addEventListener('keydown',e=>{
 if(gearKeyboard(e))return;
 if(shopKeyboard(e))return;
 if(!['ArrowLeft','ArrowRight','a','A','d','D','q','Q','e','E',' ','b','B','Escape'].includes(e.key)||mode!=='playing')return;
 // Keep focused buttons usable with Space; canvas focus owns gameplay shortcuts.
 if(e.target?.tagName==='BUTTON'||e.target?.tagName==='INPUT')return;
 e.preventDefault();
 if(['ArrowLeft','a','A'].includes(e.key))moveLeft=true;
 if(['ArrowRight','d','D'].includes(e.key))moveRight=true;
 if(e.repeat)return;
 if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
  if(!heldArrows.has(e.key)){
   const now=performance.now();
   if(lastArrowTap===e.key&&now-lastArrowTapAt<=DOUBLE_TAP_MS){dash(e.key==='ArrowLeft'?-1:1);lastArrowTap=null;lastArrowTapAt=-Infinity;}
   else{lastArrowTap=e.key;lastArrowTapAt=now;}
   heldArrows.add(e.key);
  }
 }
 if(['q','Q'].includes(e.key))dash(-1);if(['e','E'].includes(e.key))dash(1);
 if([' ','b','B'].includes(e.key))equippedSpecial();if(e.key==='Escape')pause();
});
window.addEventListener('keyup',e=>{heldArrows.delete(e.key);if(['ArrowLeft','a','A'].includes(e.key))moveLeft=false;if(['ArrowRight','d','D'].includes(e.key))moveRight=false;});
for(const [id,set] of [['left',v=>moveLeft=v],['right',v=>moveRight=v]]){const b=$(id);b.addEventListener('pointerdown',e=>{if(mode!=='playing')return;e.preventDefault();b.setPointerCapture(e.pointerId);targetX=null;set(true);});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>set(false));}
const raycaster=new THREE.Raycaster(),ground=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3();
function pointer(e){const r=canvas.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);if(raycaster.ray.intersectPlane(ground,hit))targetX=THREE.MathUtils.clamp(hit.x,-5.7,5.7);}
canvas.addEventListener('pointerdown',e=>{if(mode!=='playing')return;drag=true;canvas.setPointerCapture(e.pointerId);pointer(e);});canvas.addEventListener('pointermove',e=>{if(drag)pointer(e);});for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{drag=false;targetX=null;});
function resize(){const w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight);renderer.setSize(w,h,false);fitSnowCamera(camera,w,h);}new ResizeObserver(resize).observe(stage);resize();
const gamePanel=$('game-panel');
function fullscreenHud(){
 const active=document.fullscreenElement===gamePanel||document.webkitFullscreenElement===gamePanel;
 $('fullscreen').textContent=active?'Exit fullscreen':'Fullscreen';$('fullscreen').setAttribute('aria-pressed',String(active));resize();
}
$('fullscreen').hidden=!(gamePanel.requestFullscreen||gamePanel.webkitRequestFullscreen);
$('fullscreen').addEventListener('click',async()=>{
 try{
  const active=document.fullscreenElement===gamePanel||document.webkitFullscreenElement===gamePanel;
  if(active){const exit=document.exitFullscreen||document.webkitExitFullscreen;await exit.call(document);}
  else{const enter=gamePanel.requestFullscreen||gamePanel.webkitRequestFullscreen;await enter.call(gamePanel);}
  if(mode==='playing')canvas.focus({preventScroll:true});
 }catch{abilityNotice('Fullscreen could not start. You can keep playing in this window.');}
});
document.addEventListener('fullscreenchange',fullscreenHud);document.addEventListener('webkitfullscreenchange',fullscreenHud);
// Snow Gear freezes the simulation; earnings never depend on surviving a wave.
let equipmentEnabled=true,gearState=freshGear(),gearOpen=false,gearTab='toss',gearReturn='start';
let questionSet=null,questionError='',reviewQueue=[],reviewIndex=0,reviewAnswered=false,questionCursor=0;
let earnedQuestions=new Set(),reviewAttempts=[],reviewOpen=false,reviewRoundCorrect=0,reviewRoundStars=0;const studyBoostWaves=new Set();
const supportCache=new Map();
let supportObjects=[],supportClock=0,helperClock=0,domeTime=0,rallyTime=0;
const domeVisual=new THREE.Mesh(new THREE.SphereGeometry(1,16,8),new THREE.MeshBasicMaterial({color:0x83d9ed,transparent:true,opacity:.17,depthWrite:false}));domeVisual.position.set(0,0,9);domeVisual.scale.set(7,4,2);domeVisual.visible=false;scene.add(domeVisual);
const domeRim=mesh(slowRingGeo,'#83d9ed',0,.12,9,8.2,2.5,8.2);domeRim.rotation.x=-Math.PI/2;domeRim.visible=false;
const fanVisual=new THREE.Group();scene.add(fanVisual);fanVisual.visible=false;let fanVisualTime=0;
for(const x of [-1.3,0,1.3]){const swirl=mesh(slowRingGeo,'#b5f4ff',x,.2,0,.4,.4,.4,fanVisual);swirl.rotation.x=-Math.PI/2;const tip=mesh(cone,'#83d9ed',x,.22,-.5,.12,.45,.12,fanVisual);tip.rotation.x=-Math.PI/2;}
const rallyVisuals=[];
for(const x of [-3.8,3.8]){const root=new THREE.Group();root.position.set(x,0,5);mesh(sphere,'#fffaff',0,.5,0,.42,.5,.4,root);mesh(sphere,'#fffaff',0,1.2,0,.32,.32,.32,root);mesh(box,'#f29343',0,1.55,0,.58,.2,.55,root);decorateHelper(root,'#f29343',1);root.visible=false;scene.add(root);rallyVisuals.push(root);}
try{questionSet=validateQuestions(window.SNOW_QUESTION_SET||DEMO_QUESTIONS);}catch(error){questionError=error.message;}
function gearLevel(slot){return equipmentEnabled?(gearState.levels[gearState.equipped[slot]]||1):1;}
function gearReset(){supportCache.clear();domeRim.visible=false;fanVisual.visible=false;fanVisualTime=0;domeVisual.visible=false;rallyVisuals.forEach(r=>r.visible=false);fortGroup.rotation.z=0;supportObjects.forEach(disposeEntity);supportObjects=[];supportClock=helperClock=domeTime=rallyTime=0;gearState=freshGear();gearOpen=reviewOpen=false;$('gear-overlay').hidden=true;earnedQuestions.clear();studyBoostWaves.clear();reviewAttempts=[];questionCursor=0;syncToolVisual();}
function gearSummary(){return Object.values(gearState.equipped).map(id=>`${GEAR[id].name} ${gearState.levels[id]}`).join(' · ');}
function gearRender(){
 $('gear-wallet').textContent=`${upgrades.tokens} Snow Stars`;$('gear-rewards').textContent='First try: 2 stars · Corrected mistake: 1 star · Unlock: 2 stars · Upgrade: 3 / 5 stars';$('gear-loadout').textContent=gearSummary();$('gear-set-label').textContent=questionSet?`${window.SNOW_QUESTION_SET?'Review set':'Playtest sample'}: ${questionSet.title}`:`Questions unavailable: ${questionError}`;
 for(const slot of ['toss','support','special'])$(`tab-${slot}`).setAttribute('aria-pressed',String(slot===gearTab));
 for(const [id,rule] of Object.entries(GEAR)){
  const b=$(`gear-${id}`),level=gearState.levels[id]||0,equipped=gearState.equipped[rule.slot]===id;
  b.hidden=rule.slot!==gearTab;b.disabled=!level&&upgrades.tokens<REWARD_RULES.unlockCost;b.dataset.equipped=String(equipped);
  b.querySelector('strong').textContent=`${rule.name}${level?` · ${level}/3`:''}${equipped?' · Equipped':''}`;
  b.querySelector('span').textContent=`${rule.description} ${level?(equipped?(level===3?'Maximum level':`Improve · ${gearPrice(gearState,id)} stars`):'Equip free'):`Unlock · ${REWARD_RULES.unlockCost} stars`}`;
  if(equipped)b.disabled=upgrades.tokens<gearPrice(gearState,id)||level===3;
 }
 $('gear-repair').disabled=upgrades.tokens<1||fort===100;$('gear-charge').disabled=upgrades.tokens<1||burstCharges>=5;
 $('gear-study').disabled=!questionSet||earnedQuestions.size===questionSet.questions.length;$('gear-study').textContent=questionSet&&earnedQuestions.size===questionSet.questions.length?'All questions mastered':'Answer questions to earn more';
 $('gear-resume').textContent=gearReturn==='between'?'Start next wave':gearReturn==='start'?'Start wave 1':'Resume wave';
 $('gear-title').textContent=gearReturn==='start'?'Pack your sled':'Snow Gear';
 $('gear').textContent=gearSummary();updateShop();
}
function gearButtons(){
 if(reviewOpen)return reviewAnswered?[$('review-next')]:[0,1,2,3].map(i=>$(`answer-${i}`)).filter(b=>!b.hidden&&!b.disabled);
 return ['tab-toss','tab-support','tab-special',...Object.keys(GEAR).map(id=>`gear-${id}`),'gear-repair','gear-charge','gear-study','gear-resume'].map($).filter(b=>!b.hidden&&!b.disabled);
}
function gearFocus(){const b=gearButtons()[0]||$('gear-resume');b.focus({preventScroll:true});b.scrollIntoView?.({block:'nearest'});}
function openGear(origin='resume'){
 if(!['playing','paused','between'].includes(mode))return;
 gearReturn=origin;mode='paused';clearInputs();gearOpen=true;reviewOpen=false;$('overlay').hidden=true;$('gear-overlay').hidden=false;$('gear-equipment').hidden=false;$('gear-review').hidden=true;
 $('gear-feedback').textContent='Equip owned gear for free. A successful study round can repair up to 20% fort and refill a depleted special, once per wave.';gearRender();gearFocus();abilityHud();
}
function resumeGear(){
 if(!gearOpen||reviewOpen)return;
 gearOpen=false;$('gear-overlay').hidden=true;
 if(gearReturn==='between'){supportCache.clear();supportObjects.forEach(disposeEntity);supportObjects=[];wave++;wavePlan=buildWave(difficulty,wave-1);spawned=warningIndex=0;spawnClock=waveTime=0;supportClock=0;hud();}
 syncToolVisual();rebuildSupport();begin();
}
function startReview(){
 if(!gearOpen||!questionSet)return;
 const eligible=[];for(let i=0;i<questionSet.questions.length;i++){const q=questionSet.questions[(questionCursor+i)%questionSet.questions.length];if(!earnedQuestions.has(q.id))eligible.push(q);}
 reviewQueue=eligible.slice(0,3);if(!reviewQueue.length)return;reviewIndex=reviewRoundCorrect=reviewRoundStars=0;reviewOpen=true;$('gear-equipment').hidden=true;$('gear-review').hidden=false;showQuestion();
}
function showQuestion(){
 const q=reviewQueue[reviewIndex];reviewAnswered=false;$('review-progress').textContent=`Question ${reviewIndex+1} of ${reviewQueue.length} · First try: 2 stars · Correct a missed question: 1 star`;$('review-prompt').textContent=q.prompt;$('review-feedback').textContent='Take your time. The field is paused.';$('review-next').hidden=true;
 for(let i=0;i<4;i++){const b=$(`answer-${i}`);b.hidden=i>=q.choices.length;b.disabled=false;b.textContent=q.choices[i]||'';b.dataset.result='';}gearFocus();
}
function answerQuestion(index){
 if(!gearOpen||!reviewOpen||reviewAnswered)return;
 const q=reviewQueue[reviewIndex];if(index>=q.choices.length)return;reviewAnswered=true;const correct=index===q.answer;
 const reward=answerReward(q.id,correct,earnedQuestions,reviewAttempts);
 reviewAttempts.push({id:q.id,correct,selected:index,wave});
 if(correct&&!earnedQuestions.has(q.id)){earnedQuestions.add(q.id);grantTokens(upgrades,reward);reviewRoundCorrect++;reviewRoundStars+=reward;}
 for(let i=0;i<q.choices.length;i++){const b=$(`answer-${i}`);b.disabled=true;b.dataset.result=i===q.answer?'correct':i===index?'wrong':'';}
 $('review-feedback').textContent=`${correct?`Correct! +${reward} Snow ${reward===1?'Star':'Stars'}.`:`The answer is: ${q.choices[q.answer]}.`} ${q.explanation}`;$('gear-wallet').textContent=`${upgrades.tokens} Snow Stars`;$('review-next').hidden=false;$('review-next').textContent=reviewIndex+1===reviewQueue.length?'Choose your gear':'Next question';gearFocus();
}
$('review-next').addEventListener('click',()=>{
 if(!gearOpen||!reviewOpen||!reviewAnswered)return;
 questionCursor=(questionSet.questions.findIndex(q=>q.id===reviewQueue[reviewIndex].id)+1)%questionSet.questions.length;
 if(++reviewIndex<reviewQueue.length)showQuestion();else{reviewOpen=false;$('gear-equipment').hidden=false;$('gear-review').hidden=true;gearRender();let boost='';
 if(reviewRoundCorrect>0&&gearReturn!=='start'&&!studyBoostWaves.has(wave)&&(fort<100||burstCharges<2)){const oldFort=fort;fort=Math.min(100,fort+REWARD_RULES.studyRepair);const oldCharges=burstCharges;if(burstCharges<2)burstCharges++;studyBoostWaves.add(wave);syncFort();hud();boost=` Study boost: +${fort-oldFort}% fort${burstCharges>oldCharges?' and +1 special charge':''}. Once per wave.`;}
 gearRender();$('gear-feedback').textContent=`You earned ${reviewRoundStars} Snow Stars.${boost} Missed questions can be revisited later.`;gearFocus();}
});
for(let i=0;i<4;i++)$(`answer-${i}`).addEventListener('click',()=>answerQuestion(i));
for(const slot of ['toss','support','special'])$(`tab-${slot}`).addEventListener('click',()=>{gearTab=slot;gearRender();$(`tab-${slot}`).focus({preventScroll:true});});
for(const [id,rule] of Object.entries(GEAR))$(`gear-${id}`).addEventListener('click',()=>{
 if(!gearOpen||reviewOpen)return;
 if(gearState.levels[id]&&gearState.equipped[rule.slot]!==id)equipGear(gearState,id);
 else if(!purchaseGear(gearState,upgrades,id))return;
 $('gear-feedback').textContent=`${rule.name} equipped at level ${gearState.levels[id]}.`;gearRender();if($(`gear-${id}`).disabled)gearFocus();
});
$('gear-repair').addEventListener('click',()=>{if(!gearOpen||reviewOpen||upgrades.tokens<1||fort===100)return;upgrades.tokens--;fort=Math.min(100,fort+25);syncFort();hud();gearRender();$('gear-feedback').textContent=`Fort repaired to ${fort}%.`;gearFocus();});
$('gear-charge').addEventListener('click',()=>{if(!gearOpen||reviewOpen||upgrades.tokens<1||burstCharges>=5)return;upgrades.tokens--;burstCharges++;gearRender();$('gear-feedback').textContent=`${burstCharges} special charges ready.`;gearFocus();});
$('gear-study').addEventListener('click',startReview);$('gear-resume').addEventListener('click',resumeGear);
$('snow-gear').addEventListener('click',()=>openGear());$('between-gear').addEventListener('click',()=>openGear('between'));
function gearKeyboard(e){
 if(!gearOpen)return false;
 if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' ','Tab','Escape'].includes(e.key))return true;
 e.preventDefault();if(e.repeat)return true;
 if(e.key==='Escape'){if(reviewOpen){$('review-feedback').textContent='Finish this short question round, then return to your gear.';}else resumeGear();return true;}
 const buttons=gearButtons(),index=buttons.indexOf(document.activeElement);
 if(e.key==='Enter'||e.key===' '){if(index>=0)buttons[index].click();return true;}
 const direction=(['ArrowLeft','ArrowUp'].includes(e.key)||(e.key==='Tab'&&e.shiftKey))?-1:1;
 const next=buttons[index<0?0:(index+direction+buttons.length)%buttons.length];next?.focus({preventScroll:true});next?.scrollIntoView?.({block:'nearest'});return true;
}
// Persistent cosmetic models use shared geometry/materials and do not affect hits.
const toolModels={},toolColor={scoop:'#f29343',spinner:'#52a995',popper:'#b08acb',sprayer:'#458fca',roller:'#cf709a'};
for(const id of ['scoop','spinner','popper','sprayer','roller']){
 const root=new THREE.Group();root.position.set(.05,-.35,-.3);root.userData.gearModel=id;arms[1].add(root);const color=toolColor[id];
 mesh(box,'#856951',0,.05,0,.09,.5,.09,root);
 if(id==='scoop'){mesh(sphere,color,0,-.2,-.1,.37,.12,.35,root);mesh(sphere,'#ffffff',0,-.13,-.17,.25,.09,.22,root);mesh(box,color,0,.31,0,.27,.08,.09,root);}
 if(id==='spinner'){const wheel=mesh(slowRingGeo,color,0,-.12,-.06,.45,.45,.45,root);root.userData.rotor=wheel;for(let i=0;i<4;i++){const a=i*Math.PI/2;mesh(sphere,'#ffffff',Math.cos(a)*.42,Math.sin(a)*.42,0,.17,.17,.17,wheel);}mesh(box,color,0,-.12,0,.13,.65,.14,root);}
 if(id==='popper'){mesh(box,color,0,-.12,0,.48,.45,.4,root);mesh(sphere,'#fffaff',0,.15,0,.29,.14,.26,root);for(const x of [-.15,.15])mesh(sphere,'#83d9ed',x,.22,-.06,.1,.1,.1,root);mesh(box,'#ffe5b8',0,-.12,-.22,.23,.12,.035,root);}
 if(id==='sprayer'){mesh(sphere,color,0,-.08,0,.26,.4,.23,root);mesh(box,'#83d9ed',0,-.05,-.24,.3,.35,.035,root);mesh(box,'#ffe5b8',0,.3,-.05,.36,.1,.3,root);mesh(box,color,.25,.09,0,.1,.3,.1,root);}
 if(id==='roller'){mesh(box,color,0,-.15,0,.55,.16,.45,root);for(const x of [-.28,.28]){const wheel=mesh(sphere,'#254d76',x,-.28,0,.08,.18,.18,root);wheel.userData.wheel=true;}mesh(sphere,'#ffffff',0,.02,-.02,.26,.26,.26,root);}
 const trim=new THREE.Group();root.add(trim);root.userData.trim=trim;
 for(let i=0;i<3;i++)mesh(sphere,'#ffd78d',-.13+i*.13,-.11,-.28,.045,.045,.045,trim);
 root.visible=false;toolModels[id]=root;
}
function syncToolVisual(){
 for(const [id,root] of Object.entries(toolModels)){root.visible=equipmentEnabled&&gearState.equipped.toss===id;const level=gearState.levels[id]||1;root.scale.setScalar(1+(level-1)*.12);root.userData.trim.children.forEach((m,i)=>m.visible=i<level);root.userData.level=level;}
}
function decorateHelper(root,color,level=1){
 const hands=[];
 for(const side of [-1,1])hands.push(mesh(sphere,color,side*.46,.76,-.16,.15,.18,.15,root));
 mesh(box,color,0,1.02,0,.68,.12,.55,root);mesh(box,color,.18,.83,-.38,.12,.3,.08,root);
 mesh(sphere,'#fffaff',0,1.78,0,.12,.12,.12,root);
 const nose=mesh(cone,'#f29343',0,1.15,-.37,.07,.24,.07,root);nose.rotation.x=-Math.PI/2;
 for(let i=0;i<level;i++)mesh(sphere,'#ffd78d',-.12+i*.12,.63,-.42,.045,.045,.035,root);
 root.userData.hands=hands;root.userData.throwTime=0;root.userData.level=level;
}
function helperAnimation(root,dt){
 root.userData.throwTime=Math.max(0,(root.userData.throwTime||0)-dt);
 const lift=reducedEffects?0:Math.sin(root.userData.throwTime/.3*Math.PI)*.23;
 root.userData.hands?.forEach((hand,i)=>{hand.position.y=.76+(i?lift:0);hand.position.z=-.16-(i?lift:0);});
}
function supportPulse(o){o.pulseTime=.65;}
function decorateSupport(root,id,level){
 root.userData.supportModel=id;root.userData.level=level;
 if(id==='buddy')decorateHelper(root,'#52a995',level);
 if(id==='bank'){
  for(let i=0;i<level;i++)mesh(box,i===2?'#83d9ed':'#fffaff',-.55+i*.55,.91,0,.45,.2,.47,root);
  mesh(box,'#856951',.65,1.02,0,.035,.55,.035,root);mesh(box,'#f29343',.82,1.2,0,.3,.18,.025,root);
 }
 if(id==='puddle'){
  for(let i=0;i<8;i++){const a=i*Math.PI/4;mesh(sphere,'#effaff',Math.cos(a)*1.17,.045,Math.sin(a)*1.05,.2,.05,.2,root);}
  for(let i=0;i<level;i++)mesh(box,'#c8f2ff',-.5+i*.4,.09,-.25,.22,.015,.055,root);
 }
 if(id==='magnet'){
  for(const x of [-.17,.17])mesh(sphere,'#254d76',x,.96,.48,.06,.06,.045,root);
  mesh(box,'#fffaff',0,.68,.49,.32,.08,.04,root);
  const pinwheel=new THREE.Group();pinwheel.position.set(.65,1.5,0);root.add(pinwheel);root.userData.rotor=pinwheel;
  for(let i=0;i<4;i++){const blade=mesh(box,i%2?'#83d9ed':'#f29343',0,0,0,.13,.65,.045,pinwheel);blade.rotation.z=i*Math.PI/2;}
 }
 if(id==='patch'){
  mesh(box,'#f29343',0,.82,0,.85,.12,.6,root);mesh(box,'#856951',0,.96,0,.35,.08,.08,root);
  for(const x of [-.15,.15])mesh(box,'#856951',x,.88,0,.06,.14,.08,root);
  const plaster=mesh(box,'#ffe5b8',0,.46,.32,.62,.16,.035,root);plaster.rotation.z=.35;
  mesh(box,'#fffaff',0,.46,.35,.14,.16,.025,root);
 }
 if(id==='mittens'){
  for(const x of [-.28,.28]){mesh(sphere,'#f29343',x,1.07,0,.18,.25,.15,root);mesh(sphere,'#f29343',x+(x>0?-.16:.16),1.07,0,.1,.12,.1,root);mesh(box,'#fffaff',x,.88,0,.28,.12,.25,root);}
 }
 const ring=mesh(slowRingGeo,id==='patch'?'#52a995':id==='mittens'?'#ffd78d':'#83d9ed',0,.08,0,1.3,1.3,1.3,root);ring.rotation.x=-Math.PI/2;ring.visible=false;ring.castShadow=false;root.userData.pulse=ring;
}

function rebuildSupport(){
 // Preserve deployed defenses when merely opening the menu; switching gear replaces them.
 const id=gearState.equipped.support,level=gearLevel('support'),signature=`${id}:${level}`;
 if(supportObjects[0]?.signature===signature)return;
 if(supportObjects.length)supportCache.set(supportObjects[0].signature,supportObjects.map(o=>o.hp));
 supportObjects.forEach(disposeEntity);supportObjects=[];if(!equipmentEnabled)return;
 const xs=id==='buddy'?(level>=2?[-3.8,3.8]:[player.position.x>=0?-3.8:3.8]):['bank','puddle'].includes(id)?[-3.8,0,3.8]:[0];
 for(const x of xs){const root=new THREE.Group();scene.add(root);const z=id==='buddy'?5:id==='magnet'?-1:id==='patch'||id==='mittens'?8:2;root.position.set(x,0,z);
  if(id==='buddy'){mesh(sphere,'#f4fbff',0,.5,0,.42,.5,.4,root);mesh(sphere,'#ffffff',0,1.2,0,.32,.32,.32,root);mesh(box,'#52a995',0,1.55,0,.58,.2,.55,root);mesh(sphere,'#254d76',-.12,1.25,-.29,.05,.05,.05,root);mesh(sphere,'#254d76',.12,1.25,-.29,.05,.05,.05,root);}
  if(id==='bank')for(let i=0;i<3;i++)mesh(box,'#edf8ff',-.55+i*.55,.4,0,.52,.8,.5,root);
  if(id==='puddle')mesh(sphere,'#83d9ed',0,.04,0,1.3,.035,1.2,root);
  if(id==='magnet'){mesh(sphere,'#ffe5b8',0,.8,0,.5,.7,.5,root);mesh(cone,'#f29343',0,1.7,0,.6,.6,.6,root);}
  if(id==='patch'||id==='mittens'){mesh(box,'#52a995',0,.45,0,1,.65,.6,root);mesh(box,'#ffffff',0,.8,0,.35,.15,.4,root);}
  decorateSupport(root,id,level);
  const hp=supportCache.get(signature)?.[supportObjects.length]??2+level*2;root.visible=id!=='bank'||hp>0;supportObjects.push({root,x,z,hp,signature,pulseTime:0});
 }
 helperClock=0;
}
function launchGearBall(x,z,target,{radius=.23,powder=false,rolling=false,power=1,slow=false}={}){
 const m=mesh(ballGeo,powder||slow?'#83d9ed':upgrades.sticky?'#b2eddd':'#ffffff',x,rolling?radius:1.1,z);m.scale.setScalar(radius/.23);
 m.userData.projectileStyle=rolling?'roller':powder?'powder':slow?'slush':'snow';
 if(rolling)for(let i=0;i<6;i++){const a=i*Math.PI/3;mesh(sphere,i%2?'#dcebf4':'#fffaff',.05,Math.sin(a)*.21,Math.cos(a)*.21,.045,.04,.04,m);}
 if(powder){const ring=mesh(slowRingGeo,'#b08acb',0,0,0,.24,.24,.24,m);ring.rotation.x=Math.PI/2;}
 if(slow)m.scale.set(radius/.23,.7*radius/.23,1.35*radius/.23);
 const velocity=new THREE.Vector3(0,0,-1);if(target&&!rolling)velocity.set(target.x-x,target.root.position.y+.7*target.size-1.1,target.z-z).normalize();
 balls.push({mesh:m,target,velocity,powder,rolling,power,slow,radius,life:0,hitIds:new Set()});
}
function supportTick(dt){
 if(!equipmentEnabled)return;const id=gearState.equipped.support,level=gearLevel('support');supportClock+=dt;helperClock+=dt;
 domeTime=Math.max(0,domeTime-dt);rallyTime=Math.max(0,rallyTime-dt);domeVisual.visible=domeTime>0;domeRim.visible=domeTime>0;fanVisualTime=Math.max(0,fanVisualTime-dt);fanVisual.visible=fanVisualTime>0;if(fanVisualTime>0&&!reducedEffects)fanVisual.position.z-=dt*9;rallyVisuals.forEach(r=>r.visible=rallyTime>0);
 if(id==='buddy'||rallyTime>0){if(helperClock>=Math.max(.26,.7-level*.12)){
  helperClock=0;const xs=rallyTime>0?[-3.8,3.8]:supportObjects.map(o=>o.x);
  for(const x of xs){const target=enemies.filter(e=>Math.abs(e.x-x)<2.2&&e.z<4.7).sort((a,b)=>b.z-a.z)[0];if(target){launchGearBall(x,4.7,target,{slow:level===3});const root=rallyTime>0?rallyVisuals.find(r=>r.position.x===x):supportObjects.find(o=>o.x===x)?.root;if(root)root.userData.throwTime=.3;}}
 }}
 for(const r of rallyVisuals)helperAnimation(r,dt);
 for(const o of supportObjects){
  helperAnimation(o.root,dt);o.pulseTime=Math.max(0,o.pulseTime-dt);const pulse=o.root.userData.pulse;pulse.visible=o.pulseTime>0;pulse.scale.setScalar(reducedEffects?1.3:1.3+(1-o.pulseTime/.65)*.7);if(o.root.userData.rotor&&!reducedEffects)o.root.userData.rotor.rotation.z+=dt;
  if(id==='bank'){o.root.children.filter(m=>m.geometry===box&&m.position.y===.4).forEach((m,i)=>m.visible=i<Math.ceil(3*o.hp/(2+level*2)));if(o.hp<=0){o.root.visible=false;if(supportClock>=Math.max(5,12-level*2)){o.hp=2+level*2;o.root.visible=true;}}else for(const e of [...enemies])if(Math.abs(e.x-o.x)<1&&e.z>=o.z-1&&e.z<o.z+1){e.z-=2.3;e.slowTime=Math.max(e.slowTime,1);o.hp--;supportPulse(o);burst(o.x,o.z);if(o.hp<=0)break;}}
  if(id==='puddle')for(const e of enemies)if(Math.hypot(e.x-o.x,e.z-o.z)<1.3+level*.2)e.slowTime=Math.max(e.slowTime,.6+level*.2);
  if(id==='magnet')for(const e of enemies)if(Math.abs(e.z-o.z)<3+level&&Math.abs(e.x)<4){const shift=THREE.MathUtils.clamp(-e.x,-dt*(1+level*.3),dt*(1+level*.3));e.x+=shift;e.baseX+=shift;}
 }
 if(supportClock>=Math.max(5,12-level*2)){
  supportClock=0;if(id==='patch'){fort=Math.min(100,fort+3+level*3);supportObjects.forEach(supportPulse);syncFort();hud();}
  if(id==='mittens'){burstCharges=Math.min(5,burstCharges+1);supportObjects.forEach(supportPulse);}
 }
 fortGroup.rotation.z=domeTime>0?Math.sin(elapsed*4)*.008:0;
}
function equippedSpecial(){
 if(!equipmentEnabled||gearState.equipped.special==='burst'){snowBurst();return;}
 if(mode!=='playing')return;const id=gearState.equipped.special,level=gearLevel('special');
 if(!burstCharges){abilityNotice('No special charges. Open Snow Gear to earn more.');return;}if(burstCooldown>0){abilityNotice('Your special is cooling down.');return;}
 const close=enemies.filter(e=>Math.hypot(e.x-player.position.x,e.z-5.6)<BURST_RADIUS+level);
 if((['fan','bigball'].includes(id)&&!close.length)||(id==='whiteout'&&!enemies.length)){abilityNotice('Let creatures come closer — charge saved.');return;}
 burstCharges--;burstCooldown=2;burstUses++;
 if(id==='fan'){fanVisualTime=.75;fanVisual.position.set(player.position.x,0,4.7);fanVisual.visible=true;}
 if(id==='fan')for(const e of close){e.z-=4+level;e.slowTime=Math.max(e.slowTime,2+level);burst(e.x,e.z);}
 if(id==='bigball')launchGearBall(player.position.x,4.7,null,{rolling:true,radius:1+level*.2,power:2+level});
 if(id==='whiteout')for(const e of enemies)e.slowTime=Math.max(e.slowTime,3+level*2);
 if(id==='dome')domeTime=3+level*2;
 if(id==='rally')rallyTime=4+level*3;
 snowWave(player.position.x,5.6);abilityNotice(`${GEAR[id].name}!`,'burst');abilityHud();
}

function tick(dt){if(mode!=='paused'&&!gearOpen)elapsed+=dt;
if(mode==='playing'&&!gearOpen){
 waveTime+=dt;spawnClock+=dt;tossClock+=dt;
 noticeTime=Math.max(0,noticeTime-dt);if(noticeTime===0)$('ability-feedback').hidden=true;
 if(incomingTime>0){incomingTime=Math.max(0,incomingTime-dt);if(incomingTime===0)clearIncoming();}
 dashCooldown=Math.max(0,dashCooldown-dt);burstCooldown=Math.max(0,burstCooldown-dt);
 const oldX=player.position.x;
 if(dashTime>0){player.position.x+=dashDirection*22*Math.min(dt,dashTime);dashTime=Math.max(0,dashTime-dt);}
 else if(moveLeft||moveRight){targetX=null;player.position.x+=((moveRight?1:0)-(moveLeft?1:0))*8*dt;}else if(targetX!==null)player.position.x+=THREE.MathUtils.clamp(targetX-player.position.x,-8*dt,8*dt);
 player.position.x=THREE.MathUtils.clamp(player.position.x,-5.7,5.7);
 const walking=Math.abs(oldX-player.position.x)>.001;feet.forEach((f,i)=>{f.position.z=walking?Math.sin(elapsed*16+i*Math.PI)*.15:0;});player.rotation.z=walking?(oldX-player.position.x)*.5:0;
 const settings=DIFFICULTIES[difficulty];
 while(warningIndex<wavePlan.warnings.length&&waveTime>=wavePlan.warnings[warningIndex].at){const notice=wavePlan.warnings[warningIndex++];if(!introducedTypes.has(notice.type)){introducedTypes.add(notice.type);incomingNotice(notice.message);}}
 while(spawned<wavePlan.events.length&&waveTime>=wavePlan.events[spawned].at){const event=wavePlan.events[spawned++];enemies.push(creature(event.type,event.x,event.z));}
 const tossId=equipmentEnabled?gearState.equipped.toss:'basic',tossLevel=gearLevel('toss');
 const tossInterval=settings.tossInterval*(tossId==='spinner'?.7:tossId==='roller'?3.8:1)/(1+(tossLevel-1)*.18);
 if(tossClock>=tossInterval){
  tossClock=0;
  // Gentle aim assistance within the player's lane. Movement still selects the crowd.
  const targets=enemies.filter(e=>e.z<4.7&&Math.abs(e.x-player.position.x)<=(tossId==='scoop'?settings.aimWidth+.7+(tossLevel-1)*.3:settings.aimWidth)).sort((a,b)=>b.z-a.z);
  volley++;
  const shotCount=tossId==='scoop'?2+(tossLevel===3?1:0):upgrades.double?2:1;
  for(let shot=0;shot<shotCount;shot++){
   const target=targets[shot]||targets[0]||null,powder=tossId==='popper'||(upgrades.powder&&volley%4===0&&shot===0);
   const offset=tossId==='scoop'?(shot-(shotCount-1)/2)*.65:upgrades.double?(shot===0?-.24:.24):0;
   launchGearBall(player.position.x+offset,4.7,target,{powder,rolling:tossId==='roller',radius:tossId==='roller'?.6+tossLevel*.12:.23,power:tossId==='roller'?1+tossLevel:1,slow:tossId==='sprayer'});
  }
 }
 const throwPhase=tossClock/tossInterval;
 arms[1].rotation.x=Math.sin(throwPhase*Math.PI)*1.2;
 heldBall.visible=!equipmentEnabled&&throwPhase>.55;
 if(equipmentEnabled&&!reducedEffects&&toolModels.spinner.visible)toolModels.spinner.userData.rotor.rotation.z+=dt*9;
 for(let i=balls.length-1;i>=0;i--){
  const b=balls[i],start=b.mesh.position.clone();b.life+=dt;
  if(!b.rolling&&settings.tracking&&b.target&&enemies.includes(b.target))b.velocity.set(b.target.x-start.x,b.target.root.position.y+.7*b.target.size-start.y,b.target.z-start.z).normalize();
  const end=start.clone().addScaledVector(b.velocity,27*dt);if(b.rolling&&!reducedEffects)b.mesh.rotation.x-=27*dt/(b.radius||.7);
  let victim=null,first=Infinity;
  for(const e of enemies){
   if(b.hitIds?.has(e))continue;
   const contact=segmentSphereHit(start,end,{x:e.x,y:e.root.position.y+.7*e.size,z:e.z},e.radius+(b.radius||.23));
   if(contact!==null&&contact<first){first=contact;victim=e;}
  }
  if(victim){
   const x=victim.x,z=victim.z;
   for(let hit=0;hit<(b.power||1)&&enemies.includes(victim);hit++)damageCreature(victim);
   if(b.slow&&enemies.includes(victim))victim.slowTime=2+gearLevel('toss');
   if(b.rolling){b.hitIds.add(victim);b.mesh.position.copy(end);}else{disposeEntity(b);balls.splice(i,1);}
   if(b.powder)powderSplash(x,z,victim);
  }else{b.mesh.position.copy(end);if(end.z<-40||b.life>(b.rolling?2.5:b.slow?.55:2)){disposeEntity(b);balls.splice(i,1);}}
 }
 supportTick(dt);
 for(let i=enemies.length-1;i>=0;i--){
  const e=enemies[i];e.slowTime=Math.max(0,e.slowTime-dt);e.slowRing.visible=e.slowTime>0;e.hitTime=Math.max(0,e.hitTime-dt);
  const wear=.88+.12*e.hp/e.maxHp;e.body.scale.set(e.bodyBase[0]*wear*(e.hitTime?1.12:1),e.bodyBase[1]*wear*(e.hitTime?.9:1),e.bodyBase[2]*wear);
  advanceCreature(e,dt,settings.speed*(1+(wave-1)*.12));
  const hopping=e.type===1,roller=e.type===4;
  e.root.position.set(e.x,roller?0:Math.abs(Math.sin(e.age*(hopping?9:4)+e.phase))*(hopping?.3:.12),e.z);
  e.root.rotation.z=roller?0:Math.sin(e.age*3+e.phase)*(e.type===3?.14:.055);
  if(e.hitTime&&!reducedEffects)e.root.rotation.z+=Math.sin(e.hitTime*45)*.16;
  if(roller)e.body.rotation.x=e.roll;
  e.hands.forEach((h,j)=>h.position.y=.93+Math.sin(e.age*5+e.phase+j*Math.PI)*.13);
  if(e.z>7.9&&domeTime>0){e.z-=3;burst(e.x,8);continue;}
  if(e.z>7.9){burst(e.x,8);disposeEntity(e);enemies.splice(i,1);fort=Math.max(0,fort-settings.damage[e.type]);fortImpact(e.x);hud();abilityNotice(`${CREATURE_TYPES[e.type].name} reached the fort · ${fort}% strength`,'fort');if(fort===0){finish(false);break;}}
 }
 if(mode==='playing'&&spawned===wavePlan.events.length&&enemies.length===0){balls.forEach(disposeEntity);balls=[];if(wave===3)finish(true);else{celebrate();mode='between';dashTime=0;burstCharges=Math.min(3,burstCharges+1);grantTokens(upgrades,equipmentEnabled?1:3);updateShop();$('shop-feedback').textContent='Choose an upgrade or save your tokens.';clearInputs();$('pause').disabled=true;overlay(`Wave ${wave} cleared!`,`Fort: ${fort}% · Next: ${WAVE_PATTERNS[wave].name}`,'Start next wave','UPGRADE BREAK');$('status').textContent='Take a breather. Start the next wave when ready.';if(equipmentEnabled)openGear('between');}}
 abilityHud();$('tip').hidden=waveTime>8;
}
if(mode!=='paused'&&!gearOpen){
 fortFlash=Math.max(0,fortFlash-dt);$('fort').dataset.hit=String(fortFlash>0);
 if(celebrationTime>0){celebrationTime=Math.max(0,celebrationTime-dt);player.position.y=Math.sin((1.1-celebrationTime)/1.1*Math.PI)*.45;arms[0].rotation.x=-Math.sin(celebrationTime/1.1*Math.PI)*2;}else{player.position.y=0;arms[0].rotation.x=0;}
 if(!reducedEffects){for(let i=0;i<80;i++){snowPositions[i*3]+=.12*dt;snowPositions[i*3+1]-=(.45+(i%5)*.09)*dt;if(snowPositions[i*3+1]<0)snowPositions[i*3+1]=12;if(snowPositions[i*3]>15)snowPositions[i*3]=-15;}snowGeometry.attributes.position.needsUpdate=true;}
 for(let i=shockwaves.length-1;i>=0;i--){const p=shockwaves[i];p.life-=dt;p.root.scale.setScalar(.3+Math.min(1,(1-p.life)/.65)*(p.radius-.3));if(p.life<=0){disposeEntity(p);shockwaves.splice(i,1);}}
 for(let i=splashes.length-1;i>=0;i--){const p=splashes[i];p.life-=dt;p.mesh.scale.setScalar(.3+(1-p.life/.5)*((p.radius||2.6)-.3));if(p.life<=0){disposeEntity(p);splashes.splice(i,1);}}
 for(let i=tumbles.length-1;i>=0;i--){const e=tumbles[i];e.life-=dt;e.root.rotation.x+=(Math.PI/2)*dt/.4;e.root.scale.setScalar(e.size*Math.max(.01,e.life/.4));if(e.life<=0){disposeEntity(e);tumbles.splice(i,1);}}
 for(let i=piles.length-1;i>=0;i--){const p=piles[i];p.life-=dt;p.root.scale.setScalar(Math.min(1,Math.max(.01,p.life)));if(p.life<=0){disposeEntity(p);piles.splice(i,1);}}
}
if(mode!=='paused'&&!gearOpen)for(let i=flakes.length-1;i>=0;i--){const p=flakes[i];p.life-=dt;p.mesh.position.x+=p.vx*dt;p.mesh.position.z+=p.vz*dt;p.mesh.position.y+=p.vy*dt;p.vy-=12*dt;p.mesh.scale.setScalar(Math.max(.01,p.life/.55));if(p.life<=0){disposeEntity(p);flakes.splice(i,1);}}
}
let last=performance.now();function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;tick(dt);renderer.render(scene,camera);requestAnimationFrame(frame);}requestAnimationFrame(frame);
// Read-only diagnostics for playtest verification; no gameplay bypasses.
window.snowDayState=()=>({mode,wave,fort,cleared,spawned,enemies:enemies.length,balls:balls.length,playerX:player.position.x,hits,defeatedByType:[...defeatedByType],piles:piles.length,difficulty,pattern:wavePlan.name,planned:wavePlan.events.length,upgrades:{...upgrades},volley,splashHits,stickyHits,dashTime,dashCooldown,burstCooldown,burstCharges,burstUses,burstHits,shockwaves:shockwaves.length,gearOpen,reviewOpen,stars:upgrades.tokens,equipment:{equipped:{...gearState.equipped},levels:{...gearState.levels}},academic:{correct:earnedQuestions.size,attempts:reviewAttempts.length},domeTime,rallyTime});
abilityHud();
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();$('title').textContent='3D graphics paused';$('message').textContent='The browser interrupted 3D graphics. Reload this page to start a fresh snow day.';$('start').disabled=true;$('restart').disabled=true;});
