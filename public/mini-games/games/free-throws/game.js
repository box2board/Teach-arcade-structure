import {createHoops,DURATION,SWISH_WINDOW,shotPower,hoopAt,clamp} from './engine.js';
const root=document.querySelector('#free-throw-fever'),$=id=>root.querySelector('#'+id),canvas=$('canvas'),ctx=canvas.getContext('2d');
let last=null,clock=0,owner=null,ready=false,arena=new Image(),particles=[],messageAge=0,best=0;
try{best=Number(localStorage.getItem('free-throws-arcade-v4-best'))||0;}catch{}
const game=createHoops(event=>{if(event.type==='basket'){const sh=event.shot;messageAge=1.2;$('verdict').textContent=sh.label;$('detail').textContent=sh.make?'+'+sh.points+' POINTS'+(sh.multiplier>1?' · GOLD BALL!':''):(sh.error<0?'Hold a little longer.':'Release a little sooner.');$('live').textContent=sh.label+(sh.make?' '+sh.points+' points.':'');if(sh.make)for(let i=0;i<22;i++)particles.push({x:300+sh.hoop.x*240,y:246,vx:(Math.random()-.5)*160,vy:-40-Math.random()*90,life:.5+Math.random()*.35});particles=particles.slice(-80);}if(event.type==='finish')finish(event.result);});
$('start').disabled=true;$('start').textContent='LOADING THE COURT…';arena.onload=()=>{ready=true;$('start').disabled=false;$('start').textContent='LET’S HOOP ↗';};arena.onerror=()=>{$('description').textContent='The court artwork could not load. Reload to try again.';$('start').textContent='RELOAD TO RETRY';};arena.src='assets/arcade-arena.webp';
function clear(){owner=null;game.cancel();}
function start(){if(!ready)return;clear();game.start();last=null;particles=[];messageAge=0;$('overlay').hidden=true;$('results').hidden=true;$('intro').hidden=false;$('pause').disabled=false;$('pause').textContent='Pause';canvas.focus({preventScroll:true});}
function show(title,description,label){$('title').textContent=title;$('description').textContent=description;$('start').textContent=label;$('overlay').hidden=false;}
function finish(result){clear();best=Math.max(best,result.score);try{localStorage.setItem('free-throws-arcade-v4-best',String(best));}catch{}$('eyebrow').textContent='FINAL BUZZER';$('intro').hidden=true;$('results').hidden=false;$('results').innerHTML=[['BUCKETS',result.makes+' / '+result.attempts],['SWISHES',result.swishes],['BEST',best]].map(([label,value])=>'<div>'+label+'<strong>'+value+'</strong></div>').join('');show(result.score+' POINTS!',result.accuracy+'% accuracy · Best streak '+result.bestStreak,'RUN IT BACK ↗');$('pause').disabled=true;window.dispatchEvent(new CustomEvent('sparks:minigame-complete',{detail:result}));}
function pause(){if(!['playing','countdown','buzzer'].includes(game.state.phase))return;game.pause();clear();$('intro').hidden=true;$('results').hidden=true;show('TIME OUT.','Your round is paused.','BACK TO THE COURT ↗');$('pause').textContent='Resume';}
function resume(){game.resume();last=null;$('overlay').hidden=true;$('pause').textContent='Pause';canvas.focus({preventScroll:true});}
$('start').onclick=()=>game.state.phase==='paused'?resume():start();$('pause').onclick=()=>game.state.phase==='paused'?resume():pause();
function sync(now=performance.now()){const dt=last===null?0:clamp((now-last)/1000,0,.25);last=now;game.tick(dt);return dt;}
function beginPointer(e){if(e.button!==0||owner)return;sync();if(!game.begin())return;e.preventDefault();owner={kind:'pointer',id:e.pointerId};e.currentTarget.setPointerCapture(e.pointerId);}
function endPointer(e){if(owner?.kind!=='pointer'||owner.id!==e.pointerId)return;e.preventDefault();sync();game.release();owner=null;}
for(const el of [canvas,$('shoot')]){el.addEventListener('pointerdown',beginPointer);el.addEventListener('pointerup',endPointer);for(const event of ['pointercancel','lostpointercapture'])el.addEventListener(event,e=>{if(owner?.kind==='pointer'&&owner.id===e.pointerId)clear();});el.addEventListener('contextmenu',e=>e.preventDefault());}
window.addEventListener('keydown',e=>{if(e.code==='Escape'){if(['playing','countdown','buzzer','paused'].includes(game.state.phase)){e.preventDefault();game.state.phase==='paused'?resume():pause();}return;}if(!['Space','Enter'].includes(e.code)||e.repeat||owner||game.state.phase!=='playing'||e.target.closest('a')||e.target.closest('button')&&e.target!==$('shoot'))return;e.preventDefault();sync();if(game.begin())owner={kind:'key',id:e.code};});
window.addEventListener('keyup',e=>{if(owner?.kind!=='key'||owner.id!==e.code)return;e.preventDefault();sync();game.release();owner=null;});window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
function resize(){const width=canvas.getBoundingClientRect().width,d=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*d);canvas.height=Math.round(width*1.1*d);}new ResizeObserver(resize).observe(canvas);canvas.tabIndex=0;
function ellipse(x,y,rx,ry,fill,stroke,width=2){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
function line(points,color,width=2){ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function drawBall(x,y,r,spin,gold=false){ctx.save();ctx.translate(x,y);ctx.rotate(spin);const g=ctx.createRadialGradient(-r*.35,-r*.4,r*.03,0,0,r);g.addColorStop(0,gold?'#fff5aa':'#ffd18b');g.addColorStop(.5,gold?'#ffd34d':'#ff8b36');g.addColorStop(1,gold?'#cd8b19':'#c64c19');ellipse(0,0,r,r,g,'#512d28',2.5);ctx.beginPath();ctx.arc(0,0,r-1,0,Math.PI*2);ctx.clip();line([[-r,0],[r,0]],'#663726',2.5);line([[0,-r],[0,r]],'#663726',2.5);for(const sign of [-1,1]){ctx.beginPath();ctx.ellipse(sign*r,0,r*.72,r*1.1,0,0,Math.PI*2);ctx.strokeStyle='#663726';ctx.lineWidth=2.5;ctx.stroke();}ctx.restore();}
function draw(dt){const s=game.state,sh=s.shot,cfg=sh||game.config(),hoop=cfg.hoop||hoopAt(s.motionTime,s.time),hx=300+hoop.x*240,hy=246,rim=62;
 ctx.setTransform(canvas.width/600,0,0,canvas.height/660,0,0);ctx.clearRect(0,0,600,660);if(ready)ctx.drawImage(arena,0,0,600,660);else{ctx.fillStyle='#164b70';ctx.fillRect(0,0,600,660);}
 // Dim the far seating for a readable glass backboard; the hoop is actual game geometry.
 ctx.save();ctx.shadowColor='#65edff';ctx.shadowBlur=12;ctx.fillStyle='#10334a';ctx.fillRect(hx-12,70,24,100);ctx.fillStyle='#102641';ctx.fillRect(hx-117,118,234,140);ctx.fillStyle='#c5f2ffeb';ctx.fillRect(hx-109,126,218,124);ctx.strokeStyle='#fff';ctx.lineWidth=5;ctx.strokeRect(hx-109,126,218,124);ctx.restore();
 ctx.fillStyle='#ffffff50';ctx.beginPath();ctx.moveTo(hx-99,135);ctx.lineTo(hx-15,135);ctx.lineTo(hx-70,235);ctx.lineTo(hx-99,235);ctx.closePath();ctx.fill();ctx.strokeStyle='#ff8240';ctx.lineWidth=5;ctx.strokeRect(hx-42,188,84,54);
 const netAge=sh?.make&&sh.resolved?sh.age-sh.rim:9,sway=netAge<.33?Math.sin(netAge*32)*8*(1-netAge/.33):0;
 for(let i=0;i<=8;i++){const a=(i/8-.5)*2;line([[hx+a*rim,hy],[hx+a*40+sway,hy+70]],'#f8fcff',2);if(i<8)line([[hx+a*rim,hy],[hx+(a+.25)*40+sway,hy+70]],'#d8ebff',1.3);}
 for(let i=1;i<=3;i++)ellipse(hx+sway*i/3,hy+70*i/3,rim-(rim-40)*i/3,8,null,'#e7f6ff',1.5);
 ellipse(hx,hy,rim,15,null,'#683023',10);ellipse(hx,hy-2,rim,15,null,'#ff7b28',6);
 let bx=300,by=570,br=43,spin=clock*.25;
 if(sh){const u=clamp(sh.age/sh.rim,0,1),miss=sh.make?0:(sh.error<0?72:-85),endY=hy+miss;bx=300+(hx-300)*u;by=570+(endY-570)*u-Math.sin(Math.PI*u)*205;br=43+(15-43)*u;spin=sh.age*6;
  if(sh.age>sh.rim){const v=clamp((sh.age-sh.rim)/(sh.flight-sh.rim),0,1);bx=hx+(sh.make?0:55)*v;by=endY+160*v-(sh.make?0:Math.sin(Math.PI*v)*35);br=15+v*4;}
  if(sh.make&&sh.age<sh.rim){ctx.save();ctx.globalAlpha=.17;for(let i=1;i<=3;i++)ellipse(bx-(hx-300)*.02*i,by+14*i,br-i*2,br-i*2,'#fff3b3');ctx.restore();}
 }
 ellipse(bx,610,br*.9,br*.18,'#2a1c2140');drawBall(bx,by,br,spin,cfg.multiplier>1);
 // Front lip occludes a descending made shot, but never hides the ball's ascent.
 if(sh&&sh.age>=sh.rim*.95&&sh.age<sh.rim+.14&&sh.make){ctx.beginPath();ctx.ellipse(hx,hy-2,rim,15,0,0,Math.PI);ctx.strokeStyle='#ffb04a';ctx.lineWidth=7;ctx.stroke();}
 for(const p of particles){if(['playing','buzzer'].includes(s.phase)){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=220*dt;p.life-=dt;}ctx.save();ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle='#ffe364';ctx.fillRect(p.x,p.y,4,7);ctx.restore();}particles=particles.filter(p=>p.life>0);
}
function render(dt) {
 const s = game.state;
 const cfg = s.shot || game.config();
 const power = s.holding ? shotPower(s.hold) : 0;
 $('time').textContent = (DURATION - s.time).toFixed(1);
 $('score').textContent = s.score;
 $('made').textContent = s.makes + ' / ' + s.attempts;
 $('streak').textContent = s.streak;
 $('pause').disabled = ['intro', 'finished'].includes(s.phase);
 $('shoot').disabled = s.phase !== 'playing' || !!s.shot;
 $('ball-type').textContent = cfg.multiplier > 1 ? 'GOLD BALL · 2× POINTS' : 'CLASSIC BALL';
 $('stage').textContent = cfg.stage;
 $('make-zone').style.left = (cfg.target - cfg.window) * 100 + '%';
 $('make-zone').style.width = cfg.window * 200 + '%';
 $('swish-zone').style.left = (cfg.target - SWISH_WINDOW) * 100 + '%';
 $('swish-zone').style.width = SWISH_WINDOW * 200 + '%';
 $('needle').style.left = power * 100 + '%';
 let prompt = 'HOLD TO CHARGE';
 if (s.shot) prompt = 'SHOT ON ITS WAY…';
 else if (s.holding) prompt = Math.abs(power - cfg.target) <= cfg.window + 1e-9 ? 'RELEASE NOW!' : 'WATCH THE METER';
 $('power-label').textContent = prompt;
 $('countdown').hidden = s.phase !== 'countdown';
 $('count-number').textContent = Math.max(1, Math.ceil(s.countdown));
 if(['playing','buzzer'].includes(s.phase)){messageAge-=dt;if(messageAge<=0){$('verdict').textContent=s.phase==='buzzer'?'BUZZER BEATER?':s.streak>=3?'YOU’RE HEATING UP!':'HOLD. GREEN. RELEASE.';$('detail').textContent=s.phase==='buzzer'?'Your last shot still counts.':cfg.multiplier>1?'Gold ball · Double points. Watch the green zone.':'Aim for the bright center for a swish.';}}
 draw(dt);
}
function frame(now){const dt=sync(now);clock+=dt;render(dt);requestAnimationFrame(frame);}requestAnimationFrame(frame);
window.SparksMinigames??={};window.SparksMinigames.freeThrows={start,pause,resume,getState:()=>({phase:game.state.phase,secondsLeft:DURATION-game.state.time,score:game.state.score,result:game.state.result})};
