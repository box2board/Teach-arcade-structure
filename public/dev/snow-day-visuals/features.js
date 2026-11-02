// Optional gameplay modules. Every run captures a configuration; changing the lab
// never changes an active run. Reset removes all owned objects and timers.
export const FEATURES=[
['zigzag','Zigzag enemies','Wider, predictable lateral movement.'],['shields','Ice shields','Marked enemies absorb hits before their shields break.'],['splitting','Splitting snowmen','Purple snowmen split into two runners.'],['projectiles','Enemy snowballs','Orange warnings precede aimed shots.'],['charging','Charging enemies','Yellow warnings precede a fast rush.'],['support','Support creatures','Green creatures protect nearby allies.'],['flanks','Split attacks','Alternate left and right formations.'],['movingCrates','Moving crates','Supplies slide across the snowfield.'],['riskCrates','Risky supplies','Extra helpers wait in crates on the far flank.'],['powerups','Temporary power-ups','Crates grant rapid fire, piercing, or freezing snow.'],['specialists','Specialist teammates','Every fifth defender fires a heavy piercing volley.'],['frozen','Frozen teammates','Enemy shots temporarily freeze individual defenders.'],['obstacles','Rolling obstacles','Marked lanes receive rolling snowballs.'],['weather','Ice and wind','Visible ice slows steering; gusts gently push the squad.'],['objectives','Escort objective','Stay near the moving snowplow to protect it.'],['miniboss','Mini-boss','A larger armored creature enters midway through a wave.'],['bossPhases','Boss phases','Frost King cycles through shields, helpers, and aimed volleys.'],['defense','Defensive tools','Place a temporary snowbank in your current lane.'],['bonuses','Performance bonuses','Untouched waves and consecutive crates earn bonuses.'],['sequences','Varied formations','Seeded groups alternate fan, column, and split patterns.']
].map(([id,title,description])=>({id,title,description}));
export const PRESETS={Baseline:[], 'Dodge and Aim':['zigzag','projectiles','frozen'], 'Supply Scramble':['movingCrates','riskCrates','powerups','flanks'], 'Heavy Defense':['shields','support','splitting','defense'], 'Winter Chaos':['weather','charging','obstacles','sequences'], 'Boss Workshop':['bossPhases','miniboss','specialists','bonuses']};
export function seeded(seed){let a=Number(seed)>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function createFeatures(c){
let cfg={enabled:[],seed:12345,density:1,speed:1,health:1,startWave:1,startSquad:5}, random=seeded(12345), objects=[],timers={},serial=0,formation=0,power='',powerUntil=0,streak=0,waveHealth=100,bank=null,plow=null;
const frozen=new Map(),stats={shots:0,hits:0,crates:0,leaks:0,enemyShots:0,damageTaken:0,playersLost:0};
const on=id=>cfg.enabled.includes(id), clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function object(kind,x,z,color,r=.5){const g=c.mesh(c.sphere,color,x,.6,z,r);const o={kind,g,x,z,life:20,r};objects.push(o);return o;}
function marker(e,color){return c.mesh(c.box,color,0,2.5,0,.8,.18,.8,e.g);}
function reset(config){cleanup();cfg={...cfg,...config,enabled:[...(config.enabled||[])]};if(on('frozen')&&!on('projectiles'))cfg.enabled.push('projectiles');random=seeded(cfg.seed);serial=0;formation=0;streak=0;power='';powerUntil=0;frozen.clear();for(const k of Object.keys(stats))stats[k]=0;wave();}
function cleanup(){objects.forEach(o=>c.scene.remove(o.g));objects=[];timers={};bank=null;plow=null;}
function wave(){cleanup();frozen.clear();power='';powerUntil=0;waveHealth=c.S.health;timers={shot:4,obstacle:7,weather:0,mini:0};if(on('objectives')){plow=object('plow',0,9,0xf3a940,1.2);plow.life=Infinity;c.mesh(c.box,0x347c9c,0,1.1,0,1.2,1.2,1.3,plow.g);c.mesh(c.box,0x597485,0,0,-1,2.4,.6,.4,plow.g);}}
function spawn(e){e.featureId=serial++;e.originX=e.x;e.hp*=cfg.health;e.max=e.hp;e.shield=on('shields')&&e.featureId%5===0?5:0;if(e.shield)e.shieldVisual=c.mesh(c.box,0x55bddc,0,.9,.65,1.2,1.25,.18,e.g);if(on('splitting')&&e.type==='normal'&&e.featureId%7===0){e.split=true;marker(e,0xae75da);}if(on('support')&&e.type==='normal'&&e.featureId%11===0){e.support=true;marker(e,0x44b98c);}if(on('charging')&&e.type==='runner'){e.chargeAt=6+random()*3;e.chargeAge=0;e.chargeMark=marker(e,0xffbd3f);}if(e.type==='boss')e.phaseAge=0;}
function damage(e,n){if(e.shield>0){e.shield=Math.max(0,e.shield-n);if(!e.shield&&e.shieldVisual){e.g.remove(e.shieldVisual);c.toast('ICE SHIELD BROKEN');}return 0;}if(on('support')&&!e.support&&c.enemies().some(a=>a.support&&Math.hypot(a.x-e.x,a.z-e.z)<5))n*=.5;if(e.type==='boss'&&on('bossPhases')&&e.bossPhase===0)n*=.35;stats.hits++;return n;}
function death(e){if(e.split){for(const offset of [-.8,.8])c.addEnemy(clamp(e.x+offset,-9,9),e.z,'runner');}}
function group(){formation++;return Math.max(1,Math.round(cfg.density*(c.S.wave===2?15:6+c.S.wave*3)));}
function spawnX(i,original){if(on('flanks'))return clamp((formation%2? -5:5)+(i%4-1.5)*1.5,-9,9);if(on('sequences')){const pattern=formation%3;return pattern===0?(i%2?-6:6)+(i%3)*.4:pattern===1?(i%3-1)*1.3:clamp((i%9-4)*2,-9,9);}return original;}
function crate(a){a.baseX=a.x;a.featureAge=0;if(on('riskCrates')){a.x=c.S.x>0?-8:8;a.baseX=a.x;a.g.position.x=a.x;a.reward=5;a.bonus.material.map.dispose();a.bonus.material.dispose();a.g.remove(a.bonus);a.bonus=c.label('+5','#168c7c');a.bonus.position.y=5;a.bonus.scale.set(2.5,1.25,1);a.g.add(a.bonus);}}
function reward(){stats.crates++;streak++;if(on('bonuses')&&streak%3===0){c.S.health=Math.min(100,c.S.health+10);c.toast('3 CRATES · +10% FORT');}if(on('powerups')){power=['rapid','pierce','freeze'][Math.floor(random()*3)];powerUntil=c.S.elapsed+8;c.toast(power.toUpperCase()+' SNOW · 8 SECONDS');}}
function bullet(b,i){stats.shots++;b.damage=c.S.damage*(on('specialists')&&i%5===4?2:1);b.pierce=power==='pierce'&&c.S.elapsed<powerUntil||on('specialists')&&i%5===4;b.freeze=power==='freeze'&&c.S.elapsed<powerUntil;b.hitIds=new Set();if(b.pierce)b.g.material=c.mat(0xe5af4e);}
function launch(x,z,tx){const o=object('shot',x,z,0xf09161,.4);o.vx=(tx-x)/2.6;o.vz=(15-z)/2.6;stats.enemyShots++;}
function warn(x,z,tx,delay=.9){if(objects.filter(o=>o.kind==='warning'||o.kind==='shot').length>=10)return;const o=object('warning',tx,14,0xeab049,.85);o.g.scale.y=.08;o.life=delay;o.sourceX=x;o.sourceZ=z;o.targetX=tx;}
function defend(){if(!on('defense')||c.S.mode!=='play'||bank)return;bank=object('bank',c.S.x,10,0x91d5e9,1);bank.g.scale.set(2.2,.65,.7);bank.life=7;bank.hp=4;c.toast('SNOWBANK PLACED · 7 SECONDS');}
function update(dt){const S=c.S;
for(const [i,t] of frozen)if(t<=S.elapsed)frozen.delete(i);
if(powerUntil<=S.elapsed)power='';if(power)c.status(power.toUpperCase()+' SNOW · '+Math.ceil(powerUntil-S.elapsed)+'s');
if(on('weather')){timers.weather+=dt;const gust=Math.floor(timers.weather/8)%2===1;S.target=clamp(S.target+(gust?Math.sin(timers.weather)*dt*2:0),-8.3,8.3);if(!timers.ice){const ice=object('ice',0,14,0x8dcfe4,1);ice.g.scale.set(4,.035,4);ice.life=Infinity;timers.ice=1;}if(gust&&Math.floor(timers.weather*2)%2===0)c.status('GUSTS · steer against the wind');}
if(on('objectives')&&plow){plow.x=Math.sin(S.time*.16)*5;plow.g.position.x=plow.x;if(Math.abs(S.x-plow.x)>4){S.health-=dt*.8;stats.damageTaken+=dt*.8;}c.status('ESCORT · stay near the orange snowplow');}
if(on('projectiles')){timers.shot-=dt;if(timers.shot<=0){const e=c.enemies().find(e=>e.z>-38&&e.z<7);if(e)warn(e.x,e.z,S.x);timers.shot=3.2;}}
if(on('obstacles')){timers.obstacle-=dt;if(timers.obstacle<=0){const o=object('boulder',S.x,-45,0x9dc3db,1.3);o.life=16;c.toast('ROLLING SNOW · CLEAR YOUR LANE');timers.obstacle=9;}}
if(on('miniboss')&&S.time>15&&!timers.mini){timers.mini=1;c.addEnemy(6,-45,'tank');const e=c.enemies().at(-1);e.hp=e.max=60*cfg.health;e.g.scale.setScalar(2.2);e.r=1.2;marker(e,0xd689d7);c.toast('ICE GOLEM INCOMING');}
for(const e of c.enemies()){
if(on('zigzag')&&e.type!=='boss')e.x=clamp(e.originX+Math.sin(S.elapsed*1.6+e.phase)*2,-9,9);
if(e.chargeAt){e.chargeAge+=dt;if(e.chargeAge>e.chargeAt&&e.chargeAge<e.chargeAt+1){e.z-=dt*e.speed; e.chargeMark.scale.set(1.4,.35,1.4);}if(e.chargeAge>=e.chargeAt+1&&e.chargeAge<e.chargeAt+2.3)e.z+=dt*10;}
if(e.slowUntil>S.elapsed)e.z-=dt*e.speed*.55;
if(e.type==='boss'&&on('bossPhases')){e.phaseAge+=dt;const phase=Math.floor(e.phaseAge/6)%3;if(e.bossPhase!==phase){e.bossPhase=phase;c.toast(['FROST KING · ICE ARMOR','FROST KING · REINFORCEMENTS','FROST KING · SNOW VOLLEY'][phase]);if(phase===1)for(const x of [-7,7])c.addEnemy(x,e.z-3,'runner');if(phase===2)for(const x of [-6,0,6])warn(e.x,e.z,x,1.2);}e.g.rotation.y=phase===0?Math.sin(S.elapsed)*.12:0;}
e.g.position.x=e.x;e.g.position.z=e.z;
}
for(const a of c.crates()){a.featureAge+=dt;if(on('movingCrates'))a.x=clamp(a.baseX+Math.sin(a.featureAge*1.2)*3,-8.5,8.5);a.g.position.x=a.x;}
for(const o of [...objects]){o.life-=dt;if(o.kind==='warning'&&o.life<=0){launch(o.sourceX,o.sourceZ,o.targetX);}
if(o.kind==='shot'||o.kind==='boulder'){const prev=o.z;o.z+=dt*(o.kind==='shot'?o.vz:9);o.x+=dt*(o.vx||0);o.g.position.set(o.x,.7,o.z);o.g.rotation.x+=dt*3;
if(bank&&o.z>=9&&prev<11&&Math.abs(o.x-bank.x)<2.5){o.life=0;bank.hp--;if(bank.hp<=0)bank.life=0;}
else if(o.z>=14&&prev<15){if(Math.abs(o.x-S.x)<2.5){if(o.kind==='shot'){stats.playersLost++;c.losePlayer();for(const i of frozen.keys())if(i>=S.squad)frozen.delete(i);if(on('frozen')&&S.squad>1){const available=Array.from({length:S.squad},(_,i)=>i).filter(i=>!frozen.has(i));if(available.length>1)frozen.set(available[0],S.elapsed+4);}}else{S.health-=8;stats.damageTaken+=8;}}o.life=0;}}
if(o.life<=0){c.scene.remove(o.g);objects.splice(objects.indexOf(o),1);if(o===bank)bank=null;}if(S.mode!=='play')return;}
if(S.health<=0)c.finish(false);
}
function complete(){if(on('bonuses')&&c.S.health>=waveHealth){c.S.health=Math.min(100,c.S.health+10);c.S.score+=20;c.toast('PERFECT DEFENSE · +20 POINTS');}}
function snapshot(){return{...stats,configuration:{...cfg,enabled:[...cfg.enabled]},seed:cfg.seed,features:[...cfg.enabled],survivalSeconds:Math.round(c.S.elapsed),fortHealth:Math.max(0,Math.round(c.S.health)),frozen:frozen.size,power};}
return {on,random:()=>random(),reset,cleanup,wave,spawn,damage,death,group,spawnX,crate,reward,bullet,update,defend,complete,snapshot,settings:()=>cfg,rate:()=>power==='rapid'?1.8:1,canShoot:i=>!frozen.has(i),movement:()=>on('weather')&&Math.abs(c.S.x)<4?7:13,leak:()=>{stats.leaks++;}};
}

export function randomFive(seed){const random=seeded(seed),ids=FEATURES.map(f=>f.id);for(let i=ids.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}const chosen=ids.slice(0,5);if(chosen.includes('frozen')&&!chosen.includes('projectiles'))chosen[chosen.findIndex(id=>id!=='frozen')]='projectiles';return chosen;}
