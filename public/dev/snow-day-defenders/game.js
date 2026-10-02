import * as THREE from '/assets/vendor/three-0.162.0/three.module.js';
import { segmentSphereHit } from './collision.js?v=2';
import { UPGRADE_RULES, freshUpgrades, grantTokens, canBuy, buyUpgrade } from './upgrades.js?v=3';
import { DIFFICULTIES, WAVE_PATTERNS, buildWave } from './waves.js?v=4';

const $ = id => document.getElementById(id);
const canvas = $('scene'), stage = $('stage');
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
scene.fog = new THREE.Fog('#bfdcec', 28, 66);
const camera = new THREE.PerspectiveCamera(43,1,.1,100);
camera.position.set(0,19,25);camera.lookAt(0,0,-10);
scene.add(new THREE.HemisphereLight(0xe8f7ff,0x7894b1,2.5));
const sun = new THREE.DirectionalLight(0xfff5e6,3.1);sun.position.set(-12,24,8);sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-17,right:17,top:25,bottom:-25,far:70});sun.shadow.bias=-.001;scene.add(sun);
const materials = {};
function mat(color){return materials[color] ||= new THREE.MeshStandardMaterial({color,roughness:.85});}
const sphere = new THREE.SphereGeometry(1,12,8), box = new THREE.BoxGeometry(1,1,1);
const slowRingGeo=new THREE.TorusGeometry(.8,.045,5,20);
const cone = new THREE.ConeGeometry(1,1,8);
function mesh(geo,color,x,y,z,sx=1,sy=sx,sz=sx,parent=scene){const m=new THREE.Mesh(geo,mat(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
mesh(box,'#e9f3fa',0,-.35,-18,120,.6,110);
mesh(box,'#d6e9f7',0,-.01,-16,13,.06,58);
for(let z=-40;z<10;z+=2.5){mesh(sphere,'#f8fcff',-7,.25,z,1,.45,1.5);mesh(sphere,'#f8fcff',7,.25,z,1,.45,1.5);}
function tree(x,z,s){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);mesh(box,'#98765d',0,.8,0,.35,1.6,.35,g);for(let i=0;i<3;i++){mesh(cone,'#527f83',0,1.5+i*.8,0,1.8-i*.35,1.8,1.8-i*.35,g);mesh(cone,'#f3faff',0,1.84+i*.8,0,1.37-i*.26,1.15,1.37-i*.26,g);}g.scale.setScalar(s);}
for(let i=0;i<14;i++){tree(-10-(i%3)*2,-37+i*3.5,.85+(i%4)*.15);tree(10+(i%3)*2,-39+i*3.5,1+(i%3)*.2);}
// Warm cabins beyond the banks; all scenery rests on the ground.
for(const [x,z] of [[-15,-10],[15,-22]]){mesh(box,'#b28f78',x,1.5,z,4,3,3);const roof=mesh(cone,'#f9fcff',x,3.5,z,3.6,1.9,2.8);roof.rotation.y=Math.PI/4;mesh(box,'#ffd78d',x,1.6,z+1.51,1,1,.04);}
const fortGroup=new THREE.Group();scene.add(fortGroup);fortGroup.position.z=9;
for(let row=0;row<2;row++)for(let i=0;i<10;i++)mesh(box,'#eff9ff',-5.6+i*1.25+(row%2)*.1,.45+row*.85,0,1.19,.8,.9,fortGroup);
for(let i=0;i<5;i++)mesh(box,'#fffaff',-5+i*2.5,2.05,0,1.15,.7,.95,fortGroup);
mesh(box,'#856951',-5.8,2.9,0,.1,2,.1,fortGroup);mesh(box,'#f0944d',-5.15,3.6,0,1.2,.65,.08,fortGroup);
const player=new THREE.Group();scene.add(player);player.position.set(0,0,5.6);
mesh(sphere,'#254d76',0,.9,0,.46,.64,.35,player);mesh(sphere,'#ffcfab',0,1.7,0,.32,.32,.32,player);
mesh(sphere,'#f29343',0,1.94,0,.37,.22,.37,player);mesh(sphere,'#fffaff',0,2.19,0,.13,.13,.13,player);
const feet=[mesh(box,'#263d54',-.22,.22,0,.25,.42,.42,player),mesh(box,'#263d54',.22,.22,0,.25,.42,.42,player)];
const arms=[mesh(sphere,'#f29343',-.5,1.05,-.1,.2,.33,.2,player),mesh(sphere,'#f29343',.5,1.05,-.1,.2,.33,.2,player)];
mesh(box,'#f29343',0,1.43,-.08,.75,.13,.6,player);
// Three readable silhouettes: regular, small fast, and large sturdy.
function creature(type,x,z){const root=new THREE.Group();root.userData.snowCreature=true;scene.add(root);const size=[1,.68,1.4][type];const hat=['#8f7fc0','#52a995','#ec9e55'][type];
const body=mesh(sphere,'#f4fbff',0,.65,0,.66,.72,.62,root);mesh(sphere,'#fffaff',0,1.5,0,.45,.45,.45,root);
mesh(box,hat,0,1.92,0,.85,.12,.8,root);mesh(box,hat,0,2.09,0,.58,.3,.56,root);
mesh(box,hat,0,1.22,0,.96,.15,.78,root);
for(const ex of [-.15,.15])mesh(sphere,'#27415c',ex,1.6,.39,.065,.065,.065,root);
const nose=mesh(cone,'#ee994c',0,1.47,.5,.095,.32,.095,root);nose.rotation.x=Math.PI/2;
const hands=[mesh(sphere,hat,-.73,.93,0,.16,.16,.16,root),mesh(sphere,hat,.73,.93,0,.16,.16,.16,root)];
const maxHp=DIFFICULTIES[difficulty].hp[type], pips=[];
const slowRing=new THREE.Mesh(slowRingGeo,mat('#70cee1'));slowRing.rotation.x=Math.PI/2;slowRing.position.y=.06;slowRing.visible=false;root.add(slowRing);
for(let i=0;i<maxHp;i++)pips.push(mesh(sphere,hat,(i-(maxHp-1)/2)*.2,2.55,0,.07,.07,.07,root));
root.scale.setScalar(size);root.position.set(x,0,z);
return {root,body,pips,slowRing,slowTime:0,type,x,z,size,hands,hp:maxHp,maxHp,hitTime:0,speed:[1.7,2.8,1.15][type],radius:.65*size,phase:Math.random()*6};}
let upgrades=freshUpgrades(), volley=0, splashes=[], splashHits=0, stickyHits=0;
const splashGeo=new THREE.RingGeometry(.85,1,32), splashMaterial=new THREE.MeshBasicMaterial({color:0x72cbe6,side:THREE.DoubleSide,transparent:true,opacity:.65});
let mode='ready', wave=1, fort=100, cleared=0, spawned=0, waveTime=0, spawnClock=0, tossClock=0, elapsed=0;
let enemies=[], balls=[], flakes=[], piles=[], tumbles=[], hits=0, defeatedByType=[0,0,0], moveLeft=false,moveRight=false,drag=false,targetX=null;
const BURST_RADIUS=8,DOUBLE_TAP_MS=280;
const heldArrows=new Set();let lastArrowTap=null,lastArrowTapAt=-Infinity;
let shockwaves=[],noticeTime=0;
const burstRingMaterial=new THREE.MeshBasicMaterial({color:0x168dbd,side:THREE.DoubleSide,transparent:true,opacity:.9,depthWrite:false});
const burstDiskGeo=new THREE.CircleGeometry(1,48),burstDiskMaterial=new THREE.MeshBasicMaterial({color:0xb5f4ff,side:THREE.DoubleSide,transparent:true,opacity:.25,depthWrite:false});
let dashTime=0,dashCooldown=0,dashDirection=0,burstCooldown=0,burstCharges=2,burstUses=0,burstHits=0;
let difficulty='easy',selectedDifficulty='easy',wavePlan=buildWave('easy',0);
for(const input of document.querySelectorAll('input[name="difficulty"]'))input.addEventListener('change',()=>{
 if(!['ready','won','lost'].includes(mode)||!input.checked||!DIFFICULTIES[input.value])return;
 selectedDifficulty=input.value;$('difficulty-hint').textContent=DIFFICULTIES[selectedDifficulty].hint;
});
const ballGeo=new THREE.SphereGeometry(.23,10,8), flakeGeo=new THREE.SphereGeometry(.06,4,3);
function disposeEntity(e){scene.remove(e.root||e.mesh);}
function burst(x,z){for(let i=0;i<9;i++){const m=mesh(flakeGeo,'#ffffff',x,.8,z);flakes.push({mesh:m,life:.55,vx:(Math.random()-.5)*5,vy:2+Math.random()*3,vz:(Math.random()-.5)*5});}}
function snowPile(e){
 const g=new THREE.Group();scene.add(g);g.position.set(e.x,0,e.z);
 mesh(sphere,'#faffff',0,.12,0,.8*e.size,.2*e.size,.6*e.size,g);
 mesh(sphere,'#edf7ff',.3*e.size,.15,.1,.45*e.size,.22*e.size,.4*e.size,g);
 mesh(box,['#8f7fc0','#52a995','#ec9e55'][e.type],-.15,.25,0,.5*e.size,.1,.4*e.size,g);
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
 $('gear').textContent=`Active upgrades: ${gear.length?gear.join(' · '):'none yet'}`;
}
for(const id of Object.keys(UPGRADE_RULES))$(`upgrade-${id}`).addEventListener('click',()=>{
 if(mode!=='between')return;
 const result=buyUpgrade(upgrades,id,fort);if(!result.purchased)return;
 fort=result.fort;fortGroup.scale.y=.4+.6*fort/100;hud();updateShop();
 $('shop-feedback').textContent=id==='repair'?`Fort repaired to ${fort}%.`:`${UPGRADE_RULES[id].label} equipped for this run.`;
 focusShopButton(canBuy(upgrades,id,fort)?$(`upgrade-${id}`):shopButtons()[0]);
});
function damageCreature(e){
 if(!enemies.includes(e))return;
 e.hp--;hits++;e.hitTime=.18;e.z-=.35;e.pips.forEach((p,j)=>p.visible=j<e.hp);
 if(upgrades.sticky){e.slowTime=2.4;e.slowRing.visible=true;stickyHits++;}
 burst(e.x,e.z);
 if(e.hp<=0){snowPile(e);tumbles.push({root:e.root,life:.4,size:e.size});enemies.splice(enemies.indexOf(e),1);cleared++;defeatedByType[e.type]++;hud();$('status').textContent=`Snow creature cleared! ${cleared} snow piles.`;}
}
function powderSplash(x,z,victim){
 const ring=new THREE.Mesh(splashGeo,splashMaterial);ring.rotation.x=-Math.PI/2;ring.position.set(x,.08,z);scene.add(ring);splashes.push({mesh:ring,life:.5});
 for(const e of [...enemies])if(e!==victim&&Math.hypot(e.x-x,e.z-z)<=2.6){damageCreature(e);e.z-=.7;splashHits++;}
}
// Active abilities share the same simulation clock as movement, so pause freezes cooldowns.
function abilityHud(){
 const active=mode==='playing';
 for(const [id,direction] of [['dash-left','◀'],['dash-right','▶']]){
  const b=$(id),label=dashCooldown>0?`${direction} Dash · ${Math.ceil(dashCooldown)}s`:`${direction} Dash`;
  if(b.textContent!==label)b.textContent=label;b.disabled=!active||dashCooldown>0;
 }
 const nearby=enemies.some(e=>Math.hypot(e.x-player.position.x,e.z-player.position.z)<=BURST_RADIUS);
 const b=$('snow-burst'),ready=active&&burstCharges>0&&burstCooldown===0&&nearby,label=`Snow Burst · ${burstCharges}${burstCooldown>0?' · Cooling':ready?' · Ready':''}`;
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
 if(burstCharges===0){abilityNotice('No Snow Burst charges left. Gain one at the next wave break.');return;}
 if(burstCooldown>0){abilityNotice('Snow Burst is cooling down.');return;}
 const x=player.position.x,z=player.position.z,radius=BURST_RADIUS;
 const targets=enemies.filter(e=>Math.hypot(e.x-x,e.z-z)<=radius);
 if(!targets.length){snowWave(x,z);abilityNotice('No creatures in range — charge saved. Let them come closer.');return;}
 burstCharges--;burstUses++;burstCooldown=1.2;
 snowWave(x,z);
 for(let i=0;i<24;i++){const angle=i*Math.PI/12,m=mesh(ballGeo,'#ffffff',x,.9,z);flakes.push({mesh:m,life:.85,vx:Math.cos(angle)*10,vy:3+Math.random()*3,vz:Math.sin(angle)*10});}
 for(const e of targets){
  for(let hit=0;hit<2&&enemies.includes(e);hit++){damageCreature(e);burstHits++;}
  if(enemies.includes(e))e.z-=2;
 }
 const message=`Snow Burst! ${targets.length} ${targets.length===1?'creature':'creatures'} hit · ${burstCharges} charges left`;
 $('status').textContent=message;abilityNotice(message,'burst');abilityHud();
}
for(const [id,action] of [['dash-left',()=>dash(-1)],['dash-right',()=>dash(1)],['snow-burst',snowBurst]])$(id).addEventListener('click',()=>{action();if(mode==='playing')canvas.focus({preventScroll:true});});
function hud(){ $('fort-text').textContent=`${fort}%`;$('fort').value=fort;$('wave').textContent=`${wave} / 3`;$('cleared').textContent=cleared; }
function overlay(title,message,label,eyebrow){
 $('shop').hidden=mode!=='between';$('difficulty-picker').hidden=!['ready','won','lost'].includes(mode);
 $('overlay').dataset.mode=mode;$('overlay').setAttribute('aria-modal',String(mode==='between'));$('overlay').hidden=false;
 $('title').textContent=title;$('message').textContent=message;$('start').textContent=label;$('eyebrow').textContent=eyebrow;
 $('menu-help').textContent=mode==='between'?'Arrows: choose · Enter: buy / start next wave':'Move: arrows / A & D / drag · Dash: double-tap arrows or Q / E · Snow Burst: Space / B';
 $('ability-feedback').hidden=true;noticeTime=0;
 if(mode==='between'){$('tip').hidden=true;focusShopButton();}
}
function clearInputs(){moveLeft=moveRight=drag=false;targetX=null;heldArrows.clear();lastArrowTap=null;lastArrowTapAt=-Infinity;}
function reset(){[...enemies,...balls,...flakes,...piles,...tumbles,...splashes,...shockwaves].forEach(disposeEntity);enemies=[];balls=[];flakes=[];piles=[];tumbles=[];splashes=[];shockwaves=[];noticeTime=0;$('ability-feedback').hidden=true;upgrades=freshUpgrades();difficulty=selectedDifficulty;wavePlan=buildWave(difficulty,0);dashTime=dashCooldown=burstCooldown=burstUses=burstHits=0;dashDirection=0;burstCharges=2;volley=splashHits=stickyHits=0;hits=0;defeatedByType=[0,0,0];fort=100;cleared=0;wave=1;spawned=0;waveTime=spawnClock=tossClock=0;$('tip').hidden=false;player.position.x=0;clearInputs();fortGroup.scale.y=1;hud();updateShop();}
function begin(){mode='playing';$('overlay').dataset.mode=mode;$('overlay').hidden=true;$('shop').hidden=true;$('difficulty-picker').hidden=true;$('pattern').textContent=`${DIFFICULTIES[difficulty].label} · Wave ${wave}: ${wavePlan.name}`;$('pause').disabled=false;$('pause').textContent='Pause';$('status').textContent=wavePlan.hint;abilityHud();canvas.focus({preventScroll:true});}
function finish(won){mode=won?'won':'lost';clearInputs();$('pause').disabled=true;overlay(won?'Snow day saved!':'Time to rebuild!',`You turned ${cleared} creatures into snow piles. ${won?`Your fort finished at ${fort}% strength.`:'Try lining up with the leading creatures before they reach the fort.'}`,'Play again',won?'FORT PROTECTED':'A FRESH START');$('status').textContent=won?'All three waves complete.':'The snow fort tumbled. Try again!';abilityHud();}
$('start').addEventListener('click',()=>{if(mode==='paused')begin();else if(mode==='between'){wave++;wavePlan=buildWave(difficulty,wave-1);spawned=0;spawnClock=waveTime=0;hud();begin();}else{reset();begin();}});
$('restart').addEventListener('click',()=>{reset();begin();});
function pause(){if(mode!=='playing')return;mode='paused';clearInputs();$('pause').textContent='Resume';overlay('Snow day paused','Your fort and snowballs are safe while you take a break.','Resume snow day','TAKE A BREATHER');$('status').textContent='Paused';abilityHud();}
$('pause').addEventListener('click',()=>mode==='paused'?begin():pause());
window.addEventListener('blur',()=>{clearInputs();pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
window.addEventListener('keydown',e=>{
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
 if([' ','b','B'].includes(e.key))snowBurst();if(e.key==='Escape')pause();
});
window.addEventListener('keyup',e=>{heldArrows.delete(e.key);if(['ArrowLeft','a','A'].includes(e.key))moveLeft=false;if(['ArrowRight','d','D'].includes(e.key))moveRight=false;});
for(const [id,set] of [['left',v=>moveLeft=v],['right',v=>moveRight=v]]){const b=$(id);b.addEventListener('pointerdown',e=>{if(mode!=='playing')return;e.preventDefault();b.setPointerCapture(e.pointerId);targetX=null;set(true);});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>set(false));}
const raycaster=new THREE.Raycaster(),ground=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3();
function pointer(e){const r=canvas.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);if(raycaster.ray.intersectPlane(ground,hit))targetX=THREE.MathUtils.clamp(hit.x,-5.7,5.7);}
canvas.addEventListener('pointerdown',e=>{if(mode!=='playing')return;drag=true;canvas.setPointerCapture(e.pointerId);pointer(e);});canvas.addEventListener('pointermove',e=>{if(drag)pointer(e);});for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{drag=false;targetX=null;});
function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.set(0,w/h<.85?24:19,w/h<.85?31:25);camera.lookAt(0,0,-10);camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(stage);resize();
function tick(dt){elapsed+=dt;
if(mode==='playing'){
 waveTime+=dt;spawnClock+=dt;tossClock+=dt;
 noticeTime=Math.max(0,noticeTime-dt);if(noticeTime===0)$('ability-feedback').hidden=true;
 dashCooldown=Math.max(0,dashCooldown-dt);burstCooldown=Math.max(0,burstCooldown-dt);
 const oldX=player.position.x;
 if(dashTime>0){player.position.x+=dashDirection*22*Math.min(dt,dashTime);dashTime=Math.max(0,dashTime-dt);}
 else if(moveLeft||moveRight){targetX=null;player.position.x+=((moveRight?1:0)-(moveLeft?1:0))*8*dt;}else if(targetX!==null)player.position.x+=THREE.MathUtils.clamp(targetX-player.position.x,-8*dt,8*dt);
 player.position.x=THREE.MathUtils.clamp(player.position.x,-5.7,5.7);
 const walking=Math.abs(oldX-player.position.x)>.001;feet.forEach((f,i)=>{f.position.z=walking?Math.sin(elapsed*16+i*Math.PI)*.15:0;});player.rotation.z=walking?(oldX-player.position.x)*.5:0;
 const settings=DIFFICULTIES[difficulty];
 while(spawned<wavePlan.events.length&&waveTime>=wavePlan.events[spawned].at){const event=wavePlan.events[spawned++];enemies.push(creature(event.type,event.x,event.z));}
 if(tossClock>=.22){
  tossClock=0;
  // Gentle aim assistance within the player's lane. Movement still selects the crowd.
  const targets=enemies.filter(e=>e.z<4.7&&Math.abs(e.x-player.position.x)<=2.4).sort((a,b)=>b.z-a.z);
  volley++;
  for(let shot=0;shot<(upgrades.double?2:1);shot++){
   const target=targets[shot]||targets[0]||null,powder=upgrades.powder&&volley%4===0&&shot===0;
   const m=mesh(ballGeo,powder?'#83d9ed':upgrades.sticky?'#b2eddd':'#ffffff',player.position.x+(upgrades.double?(shot===0?-.24:.24):0),1.1,4.7);
   const velocity=new THREE.Vector3(0,0,-1);
   if(target)velocity.set(target.x-m.position.x,target.root.position.y+.7*target.size-m.position.y,target.z-m.position.z).normalize();
   balls.push({mesh:m,target,velocity,powder,life:0});
  }
 }
 arms[1].rotation.x=Math.sin(tossClock/.22*Math.PI)*-.8;
 for(let i=balls.length-1;i>=0;i--){
  const b=balls[i],start=b.mesh.position.clone();b.life+=dt;
  if(b.target&&enemies.includes(b.target))b.velocity.set(b.target.x-start.x,b.target.root.position.y+.7*b.target.size-start.y,b.target.z-start.z).normalize();
  const end=start.clone().addScaledVector(b.velocity,27*dt);
  let victim=null,first=Infinity;
  for(const e of enemies){
   const contact=segmentSphereHit(start,end,{x:e.x,y:e.root.position.y+.7*e.size,z:e.z},e.radius+.23);
   if(contact!==null&&contact<first){first=contact;victim=e;}
  }
  if(victim){
   const x=victim.x,z=victim.z;damageCreature(victim);disposeEntity(b);balls.splice(i,1);
   if(b.powder)powderSplash(x,z,victim);
  }else{b.mesh.position.copy(end);if(end.z<-40||b.life>2){disposeEntity(b);balls.splice(i,1);}}
 }
 for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];e.slowTime=Math.max(0,e.slowTime-dt);e.slowRing.visible=e.slowTime>0;e.hitTime=Math.max(0,e.hitTime-dt);e.body.scale.set(.66*(e.hitTime?1.18:1),.72*(e.hitTime?.86:1),.62);e.z+=e.speed*settings.speed*dt*(1+(wave-1)*.12)*(e.slowTime>0?.55:1);e.root.position.set(e.x,Math.abs(Math.sin(elapsed*4+e.phase))*.12,e.z);e.root.rotation.z=Math.sin(elapsed*3+e.phase)*.055;e.hands.forEach((h,j)=>h.position.y=.93+Math.sin(elapsed*5+e.phase+j*Math.PI)*.13);if(e.z>7.9){burst(e.x,8);disposeEntity(e);enemies.splice(i,1);fort=Math.max(0,fort-settings.damage[e.type]);fortGroup.scale.y=.4+.6*fort/100;hud();if(fort===0){finish(false);break;}}}
 if(mode==='playing'&&spawned===wavePlan.events.length&&enemies.length===0){balls.forEach(disposeEntity);balls=[];if(wave===3)finish(true);else{mode='between';dashTime=0;burstCharges=Math.min(3,burstCharges+1);grantTokens(upgrades,3);updateShop();$('shop-feedback').textContent='Choose an upgrade or save your tokens.';clearInputs();$('pause').disabled=true;overlay(`Wave ${wave} cleared!`,`Fort: ${fort}% · Next: ${WAVE_PATTERNS[wave].name}`,'Start next wave','UPGRADE BREAK');$('status').textContent='Take a breather. Start the next wave when ready.';}}
 abilityHud();$('tip').hidden=waveTime>8;
}
if(mode!=='paused'){
 for(let i=shockwaves.length-1;i>=0;i--){const p=shockwaves[i];p.life-=dt;p.root.scale.setScalar(.3+Math.min(1,(1-p.life)/.65)*(p.radius-.3));if(p.life<=0){disposeEntity(p);shockwaves.splice(i,1);}}
 for(let i=splashes.length-1;i>=0;i--){const p=splashes[i];p.life-=dt;p.mesh.scale.setScalar(.3+(1-p.life/.5)*((p.radius||2.6)-.3));if(p.life<=0){disposeEntity(p);splashes.splice(i,1);}}
 for(let i=tumbles.length-1;i>=0;i--){const e=tumbles[i];e.life-=dt;e.root.rotation.x+=(Math.PI/2)*dt/.4;e.root.scale.setScalar(e.size*Math.max(.01,e.life/.4));if(e.life<=0){disposeEntity(e);tumbles.splice(i,1);}}
 for(let i=piles.length-1;i>=0;i--){const p=piles[i];p.life-=dt;p.root.scale.setScalar(Math.min(1,Math.max(.01,p.life)));if(p.life<=0){disposeEntity(p);piles.splice(i,1);}}
}
if(mode!=='paused')for(let i=flakes.length-1;i>=0;i--){const p=flakes[i];p.life-=dt;p.mesh.position.x+=p.vx*dt;p.mesh.position.z+=p.vz*dt;p.mesh.position.y+=p.vy*dt;p.vy-=12*dt;p.mesh.scale.setScalar(Math.max(.01,p.life/.55));if(p.life<=0){disposeEntity(p);flakes.splice(i,1);}}
}
let last=performance.now();function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;tick(dt);renderer.render(scene,camera);requestAnimationFrame(frame);}requestAnimationFrame(frame);
// Read-only diagnostics for playtest verification; no gameplay bypasses.
window.snowDayState=()=>({mode,wave,fort,cleared,spawned,enemies:enemies.length,balls:balls.length,playerX:player.position.x,hits,defeatedByType:[...defeatedByType],piles:piles.length,difficulty,pattern:wavePlan.name,planned:wavePlan.events.length,upgrades:{...upgrades},volley,splashHits,stickyHits,dashTime,dashCooldown,burstCooldown,burstCharges,burstUses,burstHits,shockwaves:shockwaves.length});
abilityHud();
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();$('title').textContent='3D graphics paused';$('message').textContent='The browser interrupted 3D graphics. Reload this page to start a fresh snow day.';$('start').disabled=true;$('restart').disabled=true;});
