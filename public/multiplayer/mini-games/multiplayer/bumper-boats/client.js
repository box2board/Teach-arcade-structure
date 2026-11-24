import {drawCharacterToken} from '../../../lib/character-tokens.js';
import {CENTER_R} from './constants.js';

export function mount({container,initial}){
 const d=container.ownerDocument,host=d.createElement('div'),shadow=host.attachShadow({mode:'open'});container.append(host);
 const style=d.createElement('style');style.textContent=`
 :host{display:block;color:#fff0d1;font:14px system-ui}*{box-sizing:border-box}
 .frame{max-width:min(680px,calc((100dvh - 130px)*.92));margin:auto;border:2px solid #dba955;border-radius:18px;overflow:hidden;background:#14243a;box-shadow:0 12px 36px #07101b}
 header{padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;background:linear-gradient(110deg,#392548,#154354);border-bottom:2px solid #e0b96d}
 h2,p{margin:0}h2{color:#ffe4a9;font:700 22px Georgia,serif}small{color:#b4e1d2;font-weight:700;letter-spacing:.06em}.stats{display:flex;gap:10px;font-weight:800}.stats span{border:1px solid #778d89;border-radius:8px;padding:5px 8px;white-space:nowrap}
 canvas{width:100%;display:block;aspect-ratio:600/650;touch-action:none;background:#15394a}.foot{padding:8px 12px 10px}.notice{min-height:22px;text-align:center;color:#c6ecd9;font-weight:750}.bar{display:flex;align-items:center;justify-content:space-between;gap:8px}.pad{display:grid;grid-template-columns:repeat(3,48px);grid-template-rows:repeat(2,40px);gap:4px}.pad button:nth-child(1){grid-column:2}.pad button:nth-child(2){grid-column:1;grid-row:2}.pad button:nth-child(3){grid-column:2;grid-row:2}.pad button:nth-child(4){grid-column:3;grid-row:2}
 button{min-width:46px;min-height:40px;border:0;border-radius:9px;background:#ffe0a0;color:#1a2f3d;font:800 19px system-ui;touch-action:none}.boost{min-width:118px;padding:8px 12px;background:#f0a951;font-size:14px}.hint{text-align:center;color:#a8c8c3;font-size:12px;margin-top:7px}
 `;shadow.append(style);
 const frame=d.createElement('section');frame.className='frame';frame.innerHTML='<header><div><small>TEACH ARCADE · BOARDWALK PIER</small><h2>Bumper Boats</h2></div><div class="stats"><span id="score">0 tickets</span><span id="clock">45s</span></div></header><canvas width="600" height="650" aria-label="Shared bumper boat arena. Collect tickets and bump rivals toward the center spill ring."></canvas><div class="foot"><p class="notice" aria-live="polite"></p><div class="bar"><div class="pad"><button data-x="0" data-y="-1" aria-label="Steer up">↑</button><button data-x="-1" data-y="0" aria-label="Steer left">←</button><button data-x="0" data-y="1" aria-label="Steer down">↓</button><button data-x="1" data-y="0" aria-label="Steer right">→</button></div><button class="boost">BOOST · SPACE</button></div><p class="hint">Steer with arrows/WASD or drag · Boost into rivals · Collect shared tickets</p></div>';
 shadow.append(frame);
 const canvas=frame.querySelector('canvas'),ctx=canvas.getContext('2d'),score=frame.querySelector('#score'),clock=frame.querySelector('#clock'),notice=frame.querySelector('.notice'),boostButton=frame.querySelector('.boost');
 let context=initial,seq=-1,frameId=0,dead=false,target=null,boostQueued=false,keys=new Set(),touches=new Map(),lastSize='';
 const abort=new AbortController(),on=(target,type,fn)=>target.addEventListener(type,fn,{signal:abort.signal});
 const colors=['#f2a943','#42bd99','#ed7787','#9d88eb','#46a9cf','#e8c95f','#df8b52','#74c9da'];
 const scenery=d.createElement('canvas');scenery.width=600;scenery.height=650;const bg=scenery.getContext('2d');
 function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill()}
 function round(c,x,y,w,h,r,color){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill()}
 function line(c,x,y,x2,y2,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke()}
 function text(c,value,x,y,size,color){c.fillStyle=color;c.font='800 '+size+'px system-ui';c.textAlign='center';c.fillText(value,x,y)}
 function star(c,x,y,r,color){c.fillStyle=color;c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?r*.44:r;i?c.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q):c.moveTo(x+Math.cos(a)*q,y+Math.sin(a)*q)}c.closePath();c.fill()}
 // Warm boardwalk stripes frame a bright shared splash-pier arena.
 bg.fillStyle='#273046';bg.fillRect(0,0,600,650);for(let y=0;y<650;y+=24){bg.fillStyle=(y/24)%2?'#7a5149':'#965f4e';bg.fillRect(0,y,600,21);for(let x=0;x<600;x+=82)line(bg,x+y%41,y,x+y%41,y+21,'#523d43',2)}
 ellipse(bg,300,324,278,278,'#0d1d36');ellipse(bg,300,315,267,267,'#dab58a');ellipse(bg,300,315,255,255,'#314b69');const water=bg.createRadialGradient(250,230,18,300,315,252);water.addColorStop(0,'#49a1a0');water.addColorStop(.55,'#287b8e');water.addColorStop(1,'#154966');ellipse(bg,300,315,247,247,water);
 bg.save();bg.beginPath();bg.arc(300,315,245,0,Math.PI*2);bg.clip();for(let i=0;i<46;i++){const y=82+i*11,x=35+(i*137)%530;line(bg,x,y,x+32,y+Math.sin(i*1.7)*3,'#d0ffff18',1.4)}bg.restore();
 for(let i=0;i<40;i++){const a=i*Math.PI*2/40;ellipse(bg,300+Math.cos(a)*260,315+Math.sin(a)*260,4,4,i%5===0?'#fff0a5':'#99eee2')}
 ellipse(bg,300,315,CENTER_R+10,CENTER_R+10,'#172b4a');ellipse(bg,300,315,CENTER_R,CENTER_R,'#e7b884');ellipse(bg,300,315,CENTER_R-9,CENTER_R-9,'#814f69');ellipse(bg,300,315,CENTER_R-17,CENTER_R-17,'#293c59');star(bg,300,306,23,'#ffd279');text(bg,'TICKET SPILL',300,352,10,'#ffe7c7');
 // Small pier marquees keep the attraction readable when the field is busy.
 round(bg,26,20,174,45,12,'#14263c');text(bg,'SPLASH PIER',113,39,13,'#ffe0a0');text(bg,'BUMPER BOATS',113,56,9,'#aeeadd');round(bg,414,20,160,45,12,'#14263c');text(bg,'GOLD TICKET',494,39,11,'#ffdf79');text(bg,'20 TICKETS',494,56,9,'#aeeadd');
 function direction(){let x=Number(keys.has('ArrowRight')||keys.has('d'))-Number(keys.has('ArrowLeft')||keys.has('a')),y=Number(keys.has('ArrowDown')||keys.has('s'))-Number(keys.has('ArrowUp')||keys.has('w'));for(const [dx,dy] of touches.values()){x+=dx;y+=dy}if(x||y)target=null;else if(target){const p=context.snapshot?.boats.find(p=>p.id===context.playerId);if(p){x=target.x-p.x;y=target.y-p.y;if(Math.hypot(x,y)<8){target=null;x=y=0}}}const n=Math.max(1,Math.hypot(x,y));return{x:x/n,y:y/n}}
 function drawBoat(b,isMe){const teamColor=colors[(Number(b.team)||0)%colors.length];ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.angle);ellipse(ctx,3,7,27,22,'#07182b70');round(ctx,-25,-20,50,40,17,'#172943');round(ctx,-23,-18,46,36,16,teamColor);round(ctx,-16,-15,31,29,13,'#ffffff38');round(ctx,-7,-13,20,24,8,'#32475b');ellipse(ctx,3,1,7,9,'#f5c78f');round(ctx,8,-10,6,19,3,'#e5f2dc');line(ctx,18,-14,22,-7,'#fff6d9',3);if(b.boost>0){for(let i=0;i<3;i++)line(ctx,-26-i*8,-9+i*8,-36-i*8,-9+i*8,'#fff0a8',3)}ctx.restore();
   ctx.save();ctx.translate(b.x,b.y-6);ctx.scale(.7,.7);ctx.translate(-b.x,-(b.y-6));drawCharacterToken(ctx,b,teamColor);ctx.restore();
   if(isMe){ctx.strokeStyle=b.marked>0?'#ffd183':'#b6fff0';ctx.lineWidth=3;ctx.beginPath();ctx.arc(b.x,b.y,30,0,Math.PI*2);ctx.stroke();text(ctx,'YOU',b.x,b.y-42,11,'#d9fff1')}
   else if(context.snapshot.boats.length<=20||Math.hypot(b.x-(context.snapshot.boats.find(p=>p.id===context.playerId)?.x??300),b.y-(context.snapshot.boats.find(p=>p.id===context.playerId)?.y??315))<95)text(ctx,b.name,b.x,b.y-33,9,'#fff1d4');
   if(b.marked>0){ctx.strokeStyle='#ffe08b';ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.x,b.y,34,0,Math.PI*2);ctx.stroke()}
 }
 function render(){if(dead)return;const rect=canvas.getBoundingClientRect(),ratio=Math.min(globalThis.devicePixelRatio||1,1.35),w=Math.max(1,Math.round(rect.width*ratio)),h=Math.max(1,Math.round(rect.height*ratio)),size=w+'x'+h;if(size!==lastSize){canvas.width=w;canvas.height=h;lastSize=size}ctx.setTransform(w/600,0,0,h/650,0,0);ctx.drawImage(scenery,0,0);
  const s=context.snapshot,me=s?.boats.find(b=>b.id===context.playerId);
  if(s){for(const t of s.tickets){ellipse(ctx,t.x,t.y+7,t.gold?15:11,4,'#10263888');round(ctx,t.x-11,t.y-7,22,14,3,t.gold?'#ffdf6c':'#b7f4d9');text(ctx,t.gold?'20':'T',t.x,t.y+4,t.gold?8:10,'#31534f');if(t.gold)star(ctx,t.x,t.y-12,8,'#fff08f')}
   const leaders=[...s.boats].sort((a,b)=>b.score-a.score).slice(0,4);for(const b of s.boats)drawBoat(b,b.id===context.playerId);
   round(ctx,14,578,572,57,12,'#10243bdc');leaders.forEach((b,i)=>text(ctx,(i+1)+'. '+b.name+' '+b.score,82+i*142,602,11,b.id===context.playerId?'#9dffe0':'#fff0d0'));
   if(me&&!leaders.some(p=>p.id===me.id))text(ctx,'YOU · '+me.score,300,624,11,'#9dffe0');
   for(const e of s.effects){ctx.globalAlpha=Math.max(0,1-e.age);text(ctx,e.text,e.x,e.y-e.age*26,13,'#fff0a0');ctx.globalAlpha=1}
   score.textContent=(me?.score??0)+' tickets';clock.textContent=Math.ceil(Math.max(0,45-s.elapsed))+'s';
   notice.textContent=s.phase==='finished'?'RIDE COMPLETE · '+(me?.score??0)+' TICKETS':me?.marked>0?'YOU’RE MARKED · HIT THE CENTER RING':'BUMP RIVALS · COLLECT TICKETS';
   boostButton.textContent=me?.cool>0?'BOOST · '+me.cool.toFixed(1)+'s':'BOOST · SPACE';
  }
  frameId=requestAnimationFrame(render);
 }
 function queueBoost(){if(context.canPlay&&context.snapshot?.phase==='playing')boostQueued=true}
 on(canvas,'pointerdown',e=>{e.preventDefault();canvas.setPointerCapture(e.pointerId);const r=canvas.getBoundingClientRect();target={x:clamp((e.clientX-r.left)*600/r.width,0,600),y:clamp((e.clientY-r.top)*650/r.height,0,650)}});on(canvas,'pointermove',e=>{if(canvas.hasPointerCapture(e.pointerId)){const r=canvas.getBoundingClientRect();target={x:clamp((e.clientX-r.left)*600/r.width,0,600),y:clamp((e.clientY-r.top)*650/r.height,0,650)}}});on(canvas,'pointercancel',()=>target=null);
 for(const button of frame.querySelectorAll('.pad button')){const down=e=>{e.preventDefault();button.setPointerCapture(e.pointerId);touches.set(e.pointerId,[Number(button.dataset.x),Number(button.dataset.y)])};const up=e=>touches.delete(e.pointerId);on(button,'pointerdown',down);for(const type of ['pointerup','pointercancel','lostpointercapture'])on(button,type,up)}
 on(boostButton,'pointerdown',e=>{e.preventDefault();queueBoost()});on(d.defaultView,'keydown',e=>{if(!context.canPlay||(e.composedPath()[0]?.matches?.('input, select, textarea, button')&&e.key!==' '))return;const key=e.key.toLowerCase();if(['arrowleft','arrowright','arrowup','arrowdown','w','a','s','d',' '].includes(key)){e.preventDefault();if(key===' '&&!e.repeat)queueBoost();else keys.add(key)}});on(d.defaultView,'keyup',e=>keys.delete(e.key.toLowerCase()));on(d.defaultView,'blur',()=>{keys.clear();touches.clear();target=null});
 function update(next){context=next;const p=next.snapshot?.boats.find(p=>p.id===next.playerId);seq=Math.max(seq,p?.seq??-1)}
 update(initial);frameId=requestAnimationFrame(render);
 return{update,pollInterval:100,input(){if(!context.canPlay||context.snapshot?.phase!=='playing')return null;const dir=direction(),boost=boostQueued;boostQueued=false;return{seq:++seq,...dir,boost}},destroy(){dead=true;abort.abort();cancelAnimationFrame(frameId);host.remove();keys.clear();touches.clear()}};
}
