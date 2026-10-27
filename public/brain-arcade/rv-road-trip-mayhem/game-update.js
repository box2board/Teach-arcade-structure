function obsY(o){const gy=ground(o.x)||390;if(o.t==='gate')return gy-72-Math.sin(performance.now()/430+o.phase)*54;if(o.t==='crusher')return gy-85-Math.sin(performance.now()/520+o.phase)*78;if(o.t==='debris')return gy-35+Math.sin(performance.now()/310+o.x)*22;return gy-30}
function obsHit(o){if(o.dead||R.inv>0)return false;return Math.abs(R.x-o.x)<54&&Math.abs(R.y-obsY(o))<62}
function pickupHit(p){return !p.used&&Math.abs(R.x-p.x)<45&&Math.abs(R.y-p.y)<65}
function enterLoop(){loop.active=true;loop.theta=0;R.vx=Math.max(500,R.vx);R.on=0;popup('OPTIONAL LOOP');say('You chose the stunt route. Keep the gas down.');}
function updateLoop(dt){const sp=Math.max(500,R.vx);loop.theta+=sp/loop.r*dt;R.x=loop.cx+loop.r*Math.sin(loop.theta);R.y=loop.cy+loop.r*Math.cos(loop.theta)-38;R.vx=Math.min(720,R.vx+K.g*80*dt);R.score+=45*dt*R.combo;destabilize(dt*2.4);if(loop.theta>=Math.PI*2){loop.active=false;loop.done=true;R.x=loop.cx+130;R.y=(ground(R.x)||390)-38;R.vx=Math.max(520,R.vx);R.vy=0;R.on=1;reward(650,'LOOP CLEARED');R.nitro=Math.min(100,R.nitro+15);}}
function update(dt){
 if(R.finish)return;
 if(callTimer>0){callTimer-=dt;if(callTimer<=0)ui.call.style.opacity=0}
 R.inv=Math.max(0,R.inv-dt);
 const sec=section();if(sec!==R.lastSection){R.lastSection=sec;popup(sec);R.checkpoint=Math.max(120,R.x-100);if(sec==='CARGO RATTLE')say('Rough road ahead. Slower driving keeps the cargo strapped down.');if(sec==='MUD RUN')say('Mud kills momentum. Carry speed in, then spend nitro only if needed.');if(sec==='CONSTRUCTION')say('Timing matters here. Brake for moving machinery or smash only the barrels.');if(sec==='ROUTE CHOICE')say('Jump onto the high road for rewards, or stay low through the mud.');if(sec==='OPTIONAL LOOP')say('Loop is optional. Enter fast for bonus, or stay on the road.');if(sec==='BROKEN BRIDGE')say('Two short gaps. Precision beats full throttle.');if(sec==='STORM SPRINT')say('Crosswind and debris. Control the RV, do not just floor it.');if(sec==='FINAL LAUNCH')say('One final jump. Build speed, then commit.');}
 if(loop.active){updateLoop(dt);updateHUD();cam+=(loop.cx-430-cam)*Math.min(1,dt*5);return;}
 R.jb=Math.max(0,R.jb-dt);if(R.on)R.coyote=.18;else R.coyote=Math.max(0,R.coyote-dt);
 if(R.jb>0&&(R.on||R.coyote>0)){R.vy=-(500+Math.min(90,R.vx*.11));R.on=0;R.jb=0;R.air=0;}
 const oldX=R.x,wasOn=R.on;
 const damagePenalty=1-Math.min(.38,R.damage*.0038);
 const normalMax=620*damagePenalty;
 if(R.on){
   if(K.g)R.vx+=520*damagePenalty*dt;
   if(K.b){R.vx-=760*dt;settle(22*dt);}
   const top=R.vx>normalMax?normalMax+(R.vx-normalMax)*Math.pow(.985,dt*60):normalMax;
   if(R.vx>top)R.vx=top;
   if(ranges(R.x,lowerMud)&&R.route!=='upper'){R.vx*=Math.pow(.968,dt*60);if(K.g)R.vx+=135*dt;}
   else R.vx*=Math.pow(.995,dt*60);
   if(ranges(R.x,rough)){const over=Math.max(0,R.vx-390);destabilize(over/190*dt*16);R.vx*=Math.pow(.992,dt*60);}
   else if(R.vx<430)settle(8*dt);
 } else {if(K.g)R.vx+=35*dt;R.vy+=1080*dt;R.air+=dt;}
 if(ranges(R.x,wind)){windClock+=dt*5.5;R.vx+=Math.sin(windClock)*45*dt;if(!R.on)R.vy+=Math.sin(windClock*1.8)*65*dt;destabilize(dt*3.2);}
 R.vx=Math.max(-70,Math.min(820,R.vx));R.x+=R.vx*dt;R.y+=R.vy*dt;
 let gy=ground(R.x),plat=platformAt(R.x,R.y);
 if(R.route==='upper'&&plat){if(R.y+38>=plat.y){const hard=R.vy>500;R.y=plat.y-38;R.vy=0;R.on=1;if(hard)destabilize(8);}}
 else if(R.route==='upper'&&R.x>6080){R.route='lower';}
 if(R.route!=='upper'){
   if(wasOn&&gy==null&&ground(oldX)!=null){R.on=0;const big=ranges(R.x,finalGap);R.vy=Math.min(R.vy,-(big?Math.max(360,120+R.vx*.48):210));if(big)popup('FINAL JUMP');}
   else if(gy!=null&&R.y+38>=gy){const landing=R.vy;R.y=gy-38;R.vy=0;R.on=1;if(landing>560){R.damage=Math.min(100,R.damage+5);destabilize(12);R.combo=1;say('Hard landing — cargo straps took a hit.');}else if(R.air>.35){reward(Math.min(180,50+R.air*85),'CLEAN LANDING');settle(5);}R.air=0;}
   else if(!plat)R.on=0;
 }
 if(R.route!=='upper'&&R.x>5160&&R.x<5320&&!R.on&&R.vy<0&&R.vx>330){R.route='upper';R.vy=Math.min(R.vy,-360);popup('HIGH ROAD');say('High road chosen — collect the pickups and avoid the mud below.');}
 if(!loop.done&&R.x>loop.start&&R.x<loop.start+120&&R.on&&R.vx>470&&K.g)enterLoop();
 for(const p of pickups){if(!pickupHit(p))continue;p.used=1;if(p.t==='nitro'){R.nitro=Math.min(100,R.nitro+35);reward(120,'NITRO PICKUP')}if(p.t==='repair'){R.damage=Math.max(0,R.damage-18);reward(140,'REPAIR PICKUP')}if(p.t==='score')reward(400,'STUNT TOKEN');}
 for(const o of obstacles){if(!obsHit(o))continue;if(o.breakable&&R.vx>470){o.dead=1;destabilize(4);reward(180,'SMASH')}else if(o.t==='pothole'){o.dead=1;R.vy=-150;R.vx*=.82;destabilize(16);R.damage=Math.min(100,R.damage+3);say('Pothole hit — a small jump would have cleared it.');R.inv=.45;}else{damage(o.t==='gate'?10:o.t==='crusher'?14:8,o.t==='gate'?'Gate hit — slowing down would have opened a safe window.':o.t==='crusher'?'Crusher hit — bad timing.':'Storm debris hit.');o.dead=1;R.x+=48;}}
 for(const i of activeCargo()){if(i.loose>100)loseCargo('the straps gave way');}
 R.cleanTimer+=dt;if(R.cleanTimer>4&&R.on&&R.vx>260&&R.damage<80){R.cleanTimer=0;R.nitro=Math.min(100,R.nitro+3);R.score+=35;}
 let stormRate=1.3+Math.max(0,(260-R.vx)/120);if(ranges(R.x,wind))stormRate+=1.6;R.storm+=stormRate*dt;if(R.vx>500)R.storm-=2.2*dt;R.storm=Math.max(0,Math.min(100,R.storm));if(R.storm>=100){R.storm=72;damage(12,'The storm caught the RV — major setback.');R.x=Math.max(120,R.x-180);}
 if(R.y>700){R.x=Math.max(120,R.checkpoint);R.y=(ground(R.x)||390)-90;R.vx=170;R.vy=-50;R.damage=Math.min(100,R.damage+6);R.storm=Math.min(100,R.storm+7);destabilize(12);say('Recovered from the drop.');}
 if(R.x>12350){R.finish=1;const kept=activeCargo().length;const condition=Math.max(0,100-R.damage);R.score+=kept*600+condition*12;popup(kept>=4&&R.damage<40?'GREAT RUN':'CAMPGROUND REACHED');say('Finish — '+kept+'/5 cargo, '+Math.round(R.damage)+' damage, score '+Math.round(R.score)+'.');}
 cam+=(Math.max(0,R.x-(250-Math.min(55,R.vx/14)))-cam)*Math.min(1,dt*5);
 updateHUD();
}
function updateHUD(){ui.score.textContent=Math.round(R.score);ui.cargo.textContent=activeCargo().length;ui.speed.textContent=Math.round(Math.abs(R.vx));ui.combo.textContent='x'+R.combo.toFixed(1);ui.section.textContent=R.lastSection;ui.n.style.width=R.nitro+'%';ui.s.style.width=R.storm+'%';ui.d.style.width=R.damage+'%';ui.st.style.width=Math.max(0,avgStability())+'%';}
