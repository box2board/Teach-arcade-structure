import {drawCharacterToken} from '../../../lib/character-tokens.js';
import {createMiniMotion} from '../../../lib/mini-motion.js';
export function mount({container,initial,now}){
 const d=container.ownerDocument,host=d.createElement('div'),shadow=host.attachShadow({mode:'open'});
 container.append(host);
 const style=d.createElement('style');style.textContent=`
 :host{display:block;color:#fff1ce;font:16px system-ui}*{box-sizing:border-box}
 .ride{width:min(100%,850px);margin:auto;border:3px solid #e5b96b;border-radius:18px;overflow:hidden;background:#12253b;box-shadow:0 15px 38px #071827}
 header,footer{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;background:#273149}
 h2{margin:0;font:700 25px Georgia,serif;color:#ffe4aa}p{margin:0}small{color:#aee5de}canvas{display:block;width:100%;aspect-ratio:600/650;touch-action:none;background:#35283b}
 .controls{display:flex;flex-wrap:wrap;gap:8px}.controls button{min-width:54px;min-height:46px;border:0;border-radius:9px;background:#ffe2aa;color:#182a3d;font:700 19px system-ui;touch-action:none}
 .controls[hidden]{display:none}.status{font-weight:700;font-variant-numeric:tabular-nums}
 @media(min-width:940px) and (min-height:650px){.ride{max-width:none;width:min(100%,calc((100dvh - 115px)*600/650 + 230px));display:grid;grid-template-columns:minmax(0,1fr) 226px;grid-template-rows:auto 1fr}canvas{grid-column:1;grid-row:1/3;align-self:start}header,footer{grid-column:2;display:block;padding:18px}footer{grid-row:2}.controls{margin-top:16px} .status{margin-top:12px}}
 `;
 const ride=d.createElement('section');ride.className='ride';ride.innerHTML='<header><div><small>TEACH ARCADE · CARNIVAL MIDWAY</small><h2>Magnet Mayhem</h2><p>Guide the steel ball through the ticket ring</p></div><p class="status"></p></header><canvas width="600" height="650" aria-label="Shared carnival magnet table"></canvas><footer><p>Move your magnet · hold PULL to attract · release to push</p><div class="controls"><button data-x="-1" aria-label="Move left">←</button><button data-y="-1" aria-label="Move up">↑</button><button data-y="1" aria-label="Move down">↓</button><button data-x="1" aria-label="Move right">→</button><button data-pull aria-label="Hold to pull">PULL</button></div></footer>';
 shadow.append(style,ride);const canvas=ride.querySelector('canvas'),ctx=canvas.getContext('2d'),status=ride.querySelector('.status'),controls=ride.querySelector('.controls');controls.hidden=!initial.canPlay;
 let context=initial,seq=-1,frame,dead=false,drag=null,lastInput=null;const keys=new Set(),touches=new Map(),pulls=new Set(),abort=new AbortController(),motion=createMiniMotion();
 const on=(el,type,fn)=>el.addEventListener(type,fn,{signal:abort.signal});
 const circle=(x,y,r,fill)=>{ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();};
 const scenery=d.createElement('canvas');scenery.width=600;scenery.height=650;
 const bg=scenery.getContext('2d');
 bg.fillStyle='#482d41';bg.fillRect(0,0,600,650);
 for(let x=0;x<600;x+=32){bg.fillStyle=x%64?'#664353':'#79525a';bg.fillRect(x,0,29,650);}
 bg.fillStyle='#172c47';bg.fillRect(26,60,548,548);
 const felt=bg.createLinearGradient(34,70,565,590);felt.addColorStop(0,'#255f72');felt.addColorStop(.52,'#28435d');felt.addColorStop(1,'#29314d');bg.fillStyle=felt;bg.fillRect(35,76,530,520);
 bg.strokeStyle='#d69f63';bg.lineWidth=17;bg.strokeRect(25,66,550,540);
 bg.strokeStyle='#ffe0a0';bg.lineWidth=3;bg.strokeRect(34,75,532,522);
 for(let i=0;i<70;i++){const x=38+i*37%524,y=83+i*89%508;bg.fillStyle='#dce8c627';bg.beginPath();bg.arc(x,y,1.7,0,Math.PI*2);bg.fill();}
 for(let y=88;y<590;y+=36){bg.fillStyle=y%72?'#ffcf70':'#9de5d4';for(const x of [26,574]){bg.beginPath();bg.arc(x,y,3.5,0,Math.PI*2);bg.fill();}}
 bg.textAlign='center';bg.font='bold 15px system-ui';bg.fillStyle='#fff2cd';bg.fillText('THE MAGNETIC MIDWAY · WIN TICKETS',300,42);
 function direction(){let x=Number(keys.has('ArrowRight')||keys.has('KeyD'))-Number(keys.has('ArrowLeft')||keys.has('KeyA')),y=Number(keys.has('ArrowDown')||keys.has('KeyS'))-Number(keys.has('ArrowUp')||keys.has('KeyW'));for(const [dx,dy] of touches.values()){x+=dx;y+=dy;}const length=Math.max(1,Math.hypot(x,y));return{x:x/length,y:y/length,attract:keys.has('Space')||pulls.size>0};}
 for(const button of controls.querySelectorAll('button')){
  const down=e=>{e.preventDefault();button.setPointerCapture(e.pointerId);if(button.dataset.pull!==undefined)pulls.add(e.pointerId);else touches.set(e.pointerId,[Number(button.dataset.x||0),Number(button.dataset.y||0)]);};
  const up=e=>{touches.delete(e.pointerId);pulls.delete(e.pointerId);};
  on(button,'pointerdown',down);for(const type of ['pointerup','pointercancel','lostpointercapture'])on(button,type,up);
 }
 on(d.defaultView,'keydown',e=>{if(!context.canPlay||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyW','KeyA','KeyS','KeyD','Space'].includes(e.code))return;e.preventDefault();keys.add(e.code);});
 on(d.defaultView,'keyup',e=>keys.delete(e.code));on(d.defaultView,'blur',()=>{keys.clear();touches.clear();pulls.clear();});
 function aim(e){const r=canvas.getBoundingClientRect();drag={x:(e.clientX-r.left)*600/r.width,y:(e.clientY-r.top)*650/r.height};}
 on(canvas,'pointerdown',e=>{e.preventDefault();canvas.setPointerCapture(e.pointerId);aim(e);});on(canvas,'pointermove',e=>{if(canvas.hasPointerCapture(e.pointerId))aim(e);});on(canvas,'pointerup',()=>drag=null);on(canvas,'pointercancel',()=>drag=null);
 function render(t){if(dead)return;const s=context.snapshot,me=s?.magnets.find(m=>m.id===context.playerId);
  const ratio=Math.min(d.defaultView.devicePixelRatio||1,1.35),rect=canvas.getBoundingClientRect(),w=Math.round(rect.width*ratio),h=Math.round(rect.height*ratio);
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}ctx.setTransform(w/600,0,0,h/650,0,0);
  ctx.drawImage(scenery,0,0);ctx.textAlign='center';
  if(s){const gate=s.gate;ctx.strokeStyle='#ffe27a';ctx.lineWidth=11;ctx.beginPath();ctx.arc(gate.x+(s.elapsed>10?Math.sin(s.elapsed*.7+gate.phase)*20:0),gate.y,gate.r,0,Math.PI*2);ctx.stroke();
   ctx.font='bold 16px system-ui';ctx.fillStyle='#ffeebd';ctx.fillText('25',gate.x,gate.y+6);
   const bumpers=s.elapsed<8?[]:[{x:300+Math.sin(s.elapsed*.9)*110,y:250,r:23},{x:300+Math.cos(s.elapsed*.7)*105,y:440,r:23}];if(s.elapsed>25)bumpers.push({x:300+Math.sin(s.elapsed*1.3)*100,y:345,r:19});for(const b of bumpers){circle(b.x,b.y,b.r+5,'#f9d99b');circle(b.x,b.y,b.r-3,'#ba6859');}
   const draw=motion.draw(s.magnets,t,context.playerId,context.canPlay?direction():null,220,()=>s.phase!=='playing');for(const m of draw){const mine=m.id===context.playerId;circle(m.x,m.y,24,mine?'#ffe49d':'#a8dfdc');circle(m.x,m.y,17,m.input.attract?'#cc5d69':'#558db7');drawCharacterToken(ctx,m,mine?'#ffdb8a':'#a8dfdc');if(mine||draw.length<=12){ctx.font='bold 11px system-ui';ctx.fillStyle='#fff';ctx.fillText(mine?'YOU':m.name,m.x,m.y-31);}}
   circle(s.ball.x+3,s.ball.y+5,16,'#09233888');const steel=ctx.createRadialGradient(s.ball.x-5,s.ball.y-5,1,s.ball.x,s.ball.y,15);steel.addColorStop(0,'#fff');steel.addColorStop(1,'#719eb7');circle(s.ball.x,s.ball.y,15,steel);
   for(const e of s.effects){ctx.fillStyle='#ffe891';ctx.font='bold 19px system-ui';ctx.fillText(e.text,e.x,e.y-20-(s.elapsed-e.at)*30);}
   const leaders=[...s.magnets].sort((a,b)=>b.score-a.score).slice(0,3);
   ctx.fillStyle='#17263add';ctx.fillRect(26,611,548,31);
   ctx.font='bold 11px system-ui';leaders.forEach((p,i)=>{ctx.fillStyle=p.id===context.playerId?'#9dffe0':'#fff1d0';ctx.fillText((i+1)+'. '+p.name+' '+p.score,112+i*188,632);});
   status.textContent=(me?.score??Math.max(0,...s.magnets.map(m=>m.score)))+' tickets · '+Math.ceil(Math.max(0,40-s.elapsed))+'s';
  }
  frame=d.defaultView.requestAnimationFrame(render);
 }
 function update(next){if(next.snapshot!==context.snapshot)motion.receive(performance.now());context=next;seq=Math.max(seq,next.snapshot?.magnets.find(m=>m.id===next.playerId)?.seq??-1);}
 update(initial);frame=d.defaultView.requestAnimationFrame(render);
 return {update,pollInterval:100,input(){if(!context.canPlay||context.snapshot?.phase!=='playing')return null;const me=context.snapshot.magnets.find(m=>m.id===context.playerId);const move=direction();if(drag&&me){const dx=drag.x-me.x,dy=drag.y-me.y,n=Math.hypot(dx,dy);move.x=n>8?dx/Math.max(1,n):0;move.y=n>8?dy/Math.max(1,n):0;}
  const signature=JSON.stringify(move);if(signature===lastInput&&me?.seq>=seq)return null;lastInput=signature;return {...move,seq:++seq};},destroy(){dead=true;abort.abort();d.defaultView.cancelAnimationFrame(frame);host.remove();keys.clear();touches.clear();pulls.clear();}};
}
