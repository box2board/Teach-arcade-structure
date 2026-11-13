import {createTower,MILESTONES} from './engine.js';
import {connectTower,embedded,recordTower} from './cabinet-adapter.js';
const $=id=>document.getElementById(id),c=$('canvas'),ctx=c.getContext('2d'),g=recordTower(createTower()),s=g.s;let last=performance.now(),camera=0,finished=false;
function start(){g.start();camera=0;finished=false;last=performance.now();$('overlay').hidden=true;$('pause').disabled=false;$('pause').textContent='Pause';c.focus({preventScroll:true});}
function drop(e){if(e?.type==='pointerdown'&&e.button!==0)return;e?.preventDefault();g.drop();$('live').textContent=s.last;}
$('start').onclick=start;$('drop').addEventListener('pointerdown',drop);c.addEventListener('pointerdown',drop);
c.tabIndex=0;$('drop').addEventListener('click',e=>{if(e.detail===0)drop(e);});
function pause(){g.pause();$('pause').textContent='Resume';}function resume(){g.resume();last=performance.now();$('pause').textContent='Pause';}
$('pause').onclick=()=>s.phase==='paused'?resume():pause();if(!embedded){window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});}
window.addEventListener('keydown',e=>{if(e.code==='Escape'&&!embedded){s.phase==='paused'?resume():pause();return;}if(['Space','Enter'].includes(e.code)&&!e.target.closest('a,button')){e.preventDefault();if(!e.repeat)drop();}});
function box(x,y,w,color){ctx.fillStyle='#100b253d';ctx.fillRect(x+8,y+9,w,25);ctx.fillStyle=color;ctx.fillRect(x,y,w,25);ctx.fillStyle='#ffffff44';ctx.fillRect(x,y,w,5);ctx.fillStyle='#100b2533';ctx.fillRect(x+w-7,y+5,7,20);}
const typeColors={wide:'#68e8db',gold:'#ffda75',precision:'#ffac65',final:'#fff0a0'};
const colors=['#68e8db','#a995ff','#ffda75','#77bfff','#95ef9c'];
function draw(dt){const rect=c.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.6),w=Math.round(rect.width*d),h=Math.round(rect.height*d);if(c.width!==w||c.height!==h){c.width=w;c.height=h;}const H=h/(w/600);ctx.setTransform(w/600,0,0,w/600,0,0);const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,['#191033','#253054','#315477','#292853','#080e28'][s.milestone]);bg.addColorStop(1,['#513375','#655285','#8aa8ca','#66558f','#3a3068'][s.milestone]);ctx.fillStyle=bg;ctx.fillRect(0,0,600,H);
 for(let i=0;i<36;i++){ctx.fillStyle=i%3?'#d6c3f075':'#ffe5a8';ctx.beginPath();ctx.arc((i*137)%600,(i*71)%Math.max(1,H*.8),i%3?1:2,0,7);ctx.fill();}
 if(s.milestone<2)for(let i=0;i<12;i++){const bh=40+(i*53)%110;ctx.fillStyle='#211738';ctx.fillRect(i*55,H-bh,48,bh);ctx.fillStyle='#997fc855';for(let j=0;j<4;j++)ctx.fillRect(i*55+10,H-bh+12+j*22,5,8);}
 if(s.milestone>=1&&s.milestone<4){for(let i=0;i<5;i++){const cx=(i*163+30+s.time*4)%720-60,cy=H*.3+(i%3)*H*.18;ctx.fillStyle=s.milestone===1?'#ddd3ff33':'#e8f1ff66';ctx.beginPath();ctx.ellipse(cx,cy,65,15,0,0,7);ctx.fill();}}
 if(s.milestone===3){ctx.fillStyle='#d3b3ff';ctx.beginPath();ctx.ellipse(440,H*.25,65,22,0,0,7);ctx.fill();ctx.fillStyle='#ffd67c';ctx.fillRect(420,H*.25+24,35,10);}
 if(s.milestone===4){ctx.fillStyle='#8d77b7';ctx.beginPath();ctx.arc(480,H*.25,42,0,7);ctx.fill();}
 camera+=(Math.max(0,(s.layers.length-1)*25-H*.54)-camera)*Math.min(1,dt*8);const base=H-50+camera,y=base-s.layers.length*25;
 ctx.fillStyle='#ae8fd1';ctx.fillRect(150,base+25,300,12);s.layers.forEach((b,i)=>box(b.x,base-i*25,b.w,typeColors[b.type]||colors[i%5]));
 for(const b of s.debris){ctx.save();ctx.translate(b.x,base-b.level*25+b.age*b.age*370);ctx.rotate(b.age*(b.x<300?-1:1));box(0,0,b.w,'#c391ad');ctx.restore();}
 if(['playing','final','paused'].includes(s.phase)){ctx.save();ctx.setLineDash([5,7]);ctx.strokeStyle='#fff3';ctx.beginPath();ctx.moveTo(s.x+s.width/2,y-30);ctx.lineTo(s.x+s.width/2,base);ctx.stroke();ctx.restore();box(s.x,y-30,s.width,typeColors[s.type]||colors[s.layers.length%5]);
 ctx.fillStyle='#1c1535';ctx.font='900 10px system-ui';ctx.textAlign='center';ctx.fillText(s.type.toUpperCase(),s.x+s.width/2,y-13,Math.max(1,s.width-8));
 if(s.type==='precision'){ctx.strokeStyle='#fff0b2';ctx.lineWidth=2;ctx.strokeRect(s.x+3,y-27,Math.max(1,s.width-6),19);}
 if(s.type==='final'){const top=s.layers.at(-1),target=Math.max(6,Math.min(30,top.w*.3)),cx=top.x+top.w/2;ctx.fillStyle='#ffe077';ctx.fillRect(cx-target/2,base-(s.layers.length-1)*25-5,target,6);ctx.strokeStyle='#fff4c1';ctx.strokeRect(cx-target/2,base-(s.layers.length-1)*25-8,target,12);}
}
}
function render(){ $('time').textContent=Math.max(0,45-s.time).toFixed(1);$('score').textContent=s.score;$('floors').textContent=Math.max(0,s.layers.length-1);$('chances').textContent=3-s.misses;$('message').textContent=s.phase==='paused'?'PAUSED':s.last;$('drop').disabled=!['playing','final'].includes(s.phase);$('drop').textContent=s.phase==='final'?'FINAL DROP · '+Math.max(0,s.finalDuration-s.finalTime).toFixed(1)+'s LEFT':'DROP BLOCK · '+s.type.toUpperCase();$('milestone').textContent=MILESTONES[s.milestone]+(s.banner>0?' · MILESTONE!':'')+(s.slow>0?' · SLOW MOTION':'');
 if(s.phase==='finished'&&!finished){finished=true;let best=s.score;try{best=Math.max(best,Number(localStorage.getItem('tower-drop-v2-best'))||0);localStorage.setItem('tower-drop-v2-best',best);}catch{}$('title').textContent='Your tower: '+(s.layers.length-1)+' floors';$('description').textContent=s.score+' points · '+s.perfects+' perfect landings · Best score '+best;$('extra').textContent=s.last+'. Try to keep your tower wide with perfect drops.';$('start').textContent='Build again →';$('overlay').hidden=false;$('pause').disabled=true;window.dispatchEvent(new CustomEvent('sparks:minigame-complete',{detail:{gameId:'tower-drop',score:s.score,floors:s.layers.length-1,perfects:s.perfects,rulesVersion:2,time:s.time}}));}}
function frame(now){const dt=Math.max(0,(now-last)/1000);last=now;if(!embedded||s.phase!=='intro'){g.tick(dt);draw(Math.min(.1,dt));render();}requestAnimationFrame(frame);}requestAnimationFrame(frame);
connectTower(start);
