export const games={
 'avalanche-escape':{name:'Avalanche Escape',accent:'#84e9ff',action:'DASH',instructions:'Steer left and right to dodge falling snowballs and rocks. Collect golden trail markers. Hold Dash for a short burst of speed; near misses earn extra points.',controls:'Drag on the slope or use ← →. Hold Dash / Space for a burst.'},
 'fishing-frenzy':{name:'Fishing Frenzy',accent:'#6ef0ce',action:'CAST / HOLD TO REEL',instructions:'Aim your cast with the slider or ← →. Tap to cast at a moving fish. Once hooked, hold to reel and release to relax the line. Keep tension out of the red to land your catch.',controls:'Aim: slider / ← →. Cast, then hold and release the gold button / Space.'},
 'balance-bridge':{name:'Balance Bridge',accent:'#a9f18e',action:'BRAKE',instructions:'Tilt left and right to guide your marble along the winding bridge. Stay on the planks, collect gems, and avoid the dark gaps. Hold Brake to slow down and regain control.',controls:'Tilt: slider / ← →. Hold Brake / Space to slow down.'},
 'treasure-claw':{name:'Treasure Claw',accent:'#ffda79',action:'LOWER CLAW',instructions:'Watch the claw swing, then tap to lower it toward treasure. Gems are valuable and quick to retrieve. Gold is heavier; rocks take time and earn very little.',controls:'Tap the mine or press Space / Enter to lower the claw.'},
 'rocket-landing':{name:'Rocket Landing',accent:'#b6a5ff',action:'HOLD THRUST',instructions:'Steer your rocket onto the glowing moving pad. Hold thrust to slow your descent. Land gently with your rocket centered over the pad. Each landing starts a harder approach with fresh fuel.',controls:'Steer: slider / ← →. Hold Thrust / Space to fire the engine.'}
};
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createGame(id,random=Math.random){
 if(!games[id])throw Error('Unknown game');let s;const rand=(a,b)=>a+random()*(b-a);
 function fish(){return Array.from({length:8},(_,i)=>({x:rand(45,555),y:190+(i%4)*67,v:(i%2?-1:1)*rand(20,55),r:i%3===0?17:24,value:i%3===0?80:35,color:i%3===0?'#ffd96b':i%2?'#66e7d2':'#9ba9ff'}));}
 function field(){return Array.from({length:12},(_,i)=>({x:55+(i%4)*160+rand(-20,20),y:250+Math.floor(i/4)*110,r:i%4===0?27:i%3===0?15:21,type:i%4===0?'rock':i%3===0?'gem':'gold',value:i%4===0?5:i%3===0?100:45,gone:false}));}
 function approach(){Object.assign(s,{x:rand(170,430),y:70,vx:0,vy:5,fuel:100});}
 function start(){s={phase:'playing',time:0,score:0,combo:0,message:'READY',hold:false,input:0,aim:300,x:300,y:430,vx:0,vy:0,hits:0,inv:0,energy:1,objects:[],spawn:.6,progress:0,fish:fish(),mode:'ready',line:0,tension:.2,catch:null,cursor:300,angle:0,reach:0,treasures:field(),fuel:100,landings:0,settle:0};if(id==='rocket-landing')approach();return s;}
 function setInput(v){if(s?.phase==='playing')s.input=clamp(v,-1,1);}
 function aim(v){if(s?.phase==='playing'){s.aim=clamp(v,30,570);s.cursor=s.aim;}}
 function action(){if(!s||s.phase!=='playing')return;if(id==='fishing-frenzy'&&s.mode==='ready'){s.mode='cast';s.line=0;s.castX=s.aim;s.message='CASTING';}if(id==='treasure-claw'&&s.mode==='ready'){s.mode='down';s.reach=0;s.lock=s.angle;s.message='CLAW DOWN';}}
 function reward(n,text){s.score+=n;s.message=text;}
 function bridgeCenter(p){return 300+110*Math.sin(p/180);}
 function pad(){return 300+140*Math.sin(s.time*(.65+s.landings*.08));}
 function update(dt){s.time+=dt;s.inv=Math.max(0,s.inv-dt);if(id==='avalanche-escape'){
 const dash=s.hold&&s.energy>.02;s.energy=clamp(s.energy+(dash?-.65:.25)*dt,0,1);s.x=clamp(s.x+s.input*(dash?410:250)*dt,45,555);s.score+=dt*(dash?4:2);s.spawn-=dt;if(s.spawn<=0){s.spawn=Math.max(.3,.95-s.time*.013);s.objects.push({x:rand(50,550),y:-45,r:rand(15,30),speed:rand(150,210)+s.time*3,type:random()<.26?'star':random()<.45?'rock':'snow',near:false});}
 for(const o of s.objects){o.y+=o.speed*dt;const d=Math.hypot(o.x-s.x,o.y-440);if(!o.hit&&d<o.r+15){o.hit=true;if(o.type==='star')reward(25,'TRAIL BONUS +25');else if(!s.inv){s.hits++;s.combo=0;s.score=Math.max(0,s.score-15);s.inv=1;s.message='HIT · −15';}}if(!o.hit&&!o.near&&o.y>470&&Math.abs(o.x-s.x)<o.r+45&&o.type!=='star'){o.near=true;reward(10,'CLOSE CALL +10');}}s.objects=s.objects.filter(o=>o.y<650);
 }else if(id==='fishing-frenzy'){
 for(const f of s.fish){f.x+=f.v*dt;if(f.x<30||f.x>570){f.x=clamp(f.x,30,570);f.v*=-1;}}s.aim=clamp(s.aim+s.input*250*dt,30,570);
 if(s.mode==='cast'){s.line+=dt*330;const f=s.fish.find(f=>Math.hypot(f.x-s.castX,f.y-(105+s.line))<f.r+9);if(f){s.catch=f;s.mode='reel';s.tension=.25;s.progress=0;s.message='HOOKED · REEL CAREFULLY';}else if(s.line>410){s.mode='return';s.message='NO BITE';}}
 if(s.mode==='return'){s.line-=dt*450;if(s.line<=0)s.mode='ready';}
 if(s.mode==='reel'){s.tension=clamp(s.tension+(s.hold?.64+Math.sin(s.time*5)*.15:-.85)*dt,0,1.2);s.progress+=dt*(s.hold?.34:-.045);if(s.tension>=1){s.mode='return';s.catch=null;s.combo=0;s.message='LINE SNAPPED';}else if(s.progress>=1){reward(s.catch.value,'CAUGHT +'+s.catch.value);s.catch.x=rand(40,560);s.catch=null;s.mode='return';}}
 }else if(id==='balance-bridge'){
 const speed=s.hold?35:85+s.time*.8;s.progress+=speed*dt;s.vx+=s.input*230*dt;s.vx*=Math.exp(-(s.hold?6:1.5)*dt);s.x+=s.vx*dt;const center=bridgeCenter(s.progress),width=Math.max(100,160-s.time);const gap=Math.floor(s.progress/360)%3===2&&s.progress%360<65;
 if(!s.inv&&(Math.abs(s.x-center)>width/2-10||gap&&s.x>center-13&&s.x<center+35)){s.hits++;s.combo=0;s.inv=1.1;s.x=center;s.vx=0;s.message='SPLASH · BACK ON THE BRIDGE';s.score=Math.max(0,s.score-15);}else{s.score+=dt*(s.hold?.8:2);}
 const gate=Math.floor(s.progress/220);if(gate>(s.gate||0)){s.gate=gate;if(Math.abs(s.x-(center+Math.sin(gate)*28))<35&&!s.inv){s.combo++;reward(25+Math.min(5,s.combo)*5,'GEM COMBO +'+s.combo);}else s.message='FOLLOW THE BRIDGE';}
 }else if(id==='treasure-claw'){
 s.angle=Math.sin(s.time*1.4)*1.05;if(s.mode==='down'){s.reach+=240*dt;const x=300+Math.sin(s.lock)*s.reach,y=85+Math.cos(s.lock)*s.reach;const t=s.treasures.find(t=>!t.gone&&Math.hypot(t.x-x,t.y-y)<t.r+10);if(t){s.catch=t;t.gone=true;s.mode='up';s.message=t.type.toUpperCase()+' HOOKED';}if(y>550||x<15||x>585)s.mode='up';}
 if(s.mode==='up'){s.reach-=dt*(s.catch?(s.catch.type==='rock'?80:s.catch.type==='gold'?135:240):330);if(s.reach<=0){if(s.catch)reward(s.catch.value,s.catch.type.toUpperCase()+' +'+s.catch.value);s.catch=null;s.mode='ready';s.reach=0;if(s.treasures.every(t=>t.gone))s.treasures=field();}}
 }else if(id==='rocket-landing'){
 if(s.settle>0){s.settle-=dt;if(s.settle<=0)approach();return;}s.vx+=s.input*130*dt;s.vx*=Math.exp(-.8*dt);s.x=clamp(s.x+s.vx*dt,20,580);const thrust=s.hold&&s.fuel>0;s.vy+=(thrust?-105:60)*dt;s.vy=clamp(s.vy,-85,155);s.y=clamp(s.y+s.vy*dt,25,530);if(thrust)s.fuel=Math.max(0,s.fuel-23*dt);
 if(s.y>=500){const good=Math.abs(s.x-pad())<43&&s.vy>=0&&s.vy<48&&Math.abs(s.vx)<48;if(good){s.landings++;reward(100+Math.round(s.fuel),'SOFT LANDING +'+(100+Math.round(s.fuel)));}else{s.hits++;s.message='ROUGH LANDING · TRY AGAIN';}s.settle=1;s.hold=false;}
 }}
 function tick(dt){if(!s||s.phase!=='playing'||!Number.isFinite(dt)||dt<=0)return;let remain=Math.min(dt,45-s.time);while(remain>1e-7){const d=Math.min(remain,1/60);update(d);remain-=d;}if(s.time>=45-1e-6){s.time=45;s.phase='finished';s.hold=false;s.score=Math.floor(s.score);}}
 return {get s(){return s;},id,start,setInput,aim,action,tick,bridgeCenter,pad,hold(v){if(s?.phase==='playing')s.hold=v;},pause(){if(s?.phase==='playing'){s.phase='paused';s.hold=false;s.input=0;}},resume(){if(s?.phase==='paused')s.phase='playing';}};
}
