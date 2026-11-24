import {horizonUrl} from './horizon.js';
import {drawCharacterToken} from '../../../lib/character-tokens.js';
import {midwayArt} from './art.js';
import {booths,lightAngle,beamHalfAngle,beamRange,visibleRayLength} from './engine.js';
export function mount({container,initial,now}){
 const d=container.ownerDocument,host=d.createElement('div'),shadow=host.attachShadow({mode:'open'});container.append(host);
 const style=d.createElement('style');style.textContent=`
 :host{display:block;color:#f9edce;font:15px system-ui}*{box-sizing:border-box}
 .wrap{background:#101f30;border-radius:16px;overflow:hidden;max-width:min(600px,calc((100dvh - 160px)*.857));margin:auto}
 .wrap{border:1px solid #b58b58;box-shadow:0 10px 40px #060e18}header{background:linear-gradient(115deg,#30233e,#172c3b);border-bottom:2px solid #c29760}h2{font-family:Georgia,serif;color:#ffe2aa}.stats{font-variant-numeric:tabular-nums}.stats span{border:1px solid #546572;border-radius:7px;padding:4px 7px}.notice{font-weight:700;letter-spacing:.04em} header,footer{padding:10px 16px}header{display:flex;justify-content:space-between;align-items:center;gap:8px}
 h2,p{margin:3px 0}small{color:#9ddac9}.stats{display:flex;gap:16px;align-items:center;font-weight:800}
 canvas{width:100%;display:block;touch-action:none;background:#102630}
 .controls{display:flex;gap:8px;justify-content:center}.controls button{min-width:54px;min-height:44px;font-size:22px}
 button{border:0;border-radius:9px;padding:8px 14px;background:#ffe0a1;color:#182b37;font:700 16px system-ui;touch-action:none}
 .notice{text-align:center;color:#bfe9de;min-height:1.3em}
 `;
 const wrap=d.createElement('section');wrap.className='wrap';wrap.innerHTML='<header><div><small>TEACH ARCADE · MOONLIT MIDWAY</small><h2>Spotlight Sneak</h2></div><div class="stats"><span id="score">0 tickets</span><span id="clock">35s</span></div></header><canvas width="600" height="700" tabindex="0" aria-label="Shared moonlit midway; sneak around booths and collect tickets while avoiding the spotlights"></canvas><footer><p class="notice" aria-live="polite"></p><div class="controls"><button data-x="-1" aria-label="Move left">←</button><button data-y="-1" aria-label="Move up">↑</button><button data-y="1" aria-label="Move down">↓</button><button data-x="1" aria-label="Move right">→</button></div></footer>';
 shadow.append(style,wrap);
 const canvas=wrap.querySelector('canvas'),ctx=canvas.getContext('2d'),score=wrap.querySelector('#score'),clock=wrap.querySelector('#clock'),notice=wrap.querySelector('.notice');
 let context=initial,keys=new Set(),touches=new Map(),seq=-1,frame,dead=false,target=null;
 const abort=new AbortController(),on=(target,event,fn)=>target.addEventListener(event,fn,{signal:abort.signal});
 let scenery=d.createElement('canvas');scenery.width=600;scenery.height=700;const bg=scenery.getContext('2d');
 function rr(c,x,y,w,h,r,fill){c.fillStyle=fill;c.beginPath();c.roundRect(x,y,w,h,r);c.fill()}
 function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill()}
 function text(c,t,x,y,size,color='#f8ebcb'){c.fillStyle=color;c.font='700 '+size+'px system-ui';c.textAlign='center';c.fillText(t,x,y)}
 const backdrop=midwayArt(bg), scene=midwayArt(ctx);
 backdrop.background();
 const horizon = new Image();
 horizon.onload = () => {
   if (dead) return;
   bg.drawImage(horizon, 0, 0, 600, 96);
   const night = bg.createLinearGradient(0, 78, 0, 96);
   night.addColorStop(0, 'transparent');
   night.addColorStop(1, '#15383b');
   bg.fillStyle = night;
   bg.fillRect(0, 78, 600, 18);
 };
 horizon.src = horizonUrl;
 booths.forEach((b,i)=>backdrop.booth(b,i));
 const shirts=['#e7a34c','#42b89e','#e17185','#968aef'];
 function render(){if(dead)return;const s=context.snapshot,me=s?.players.find(p=>p.id===context.playerId);ctx.drawImage(scenery,0,0);
  if(s){const elapsed=s.elapsed;for(const t of s.tickets){ellipse(ctx,t.x,t.y+9,10,3,'#102d3655');rr(ctx,t.x-12,t.y-8,24,16,3,t.gold?'#ffdf8c':'#b0ead0');ctx.strokeStyle=t.gold?'#946522':'#467c6a';ctx.setLineDash([2,2]);ctx.beginPath();ctx.moveTo(t.x-6,t.y-6);ctx.lineTo(t.x-6,t.y+6);ctx.stroke();ctx.setLineDash([]);text(ctx,t.gold?'★':'10',t.x+2,t.y+3,10,'#315945')}
   for(const lamp of s.lights.filter(light=>light.on)){
    const angle=lightAngle(lamp,elapsed),half=beamHalfAngle(elapsed);
    const beam=ctx.createRadialGradient(lamp.x,lamp.y,0,lamp.x,lamp.y,beamRange);
    beam.addColorStop(0,'#fff4bdab');beam.addColorStop(.55,'#ffe5a355');beam.addColorStop(1,'#ffe6a425');
    ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(lamp.x,lamp.y);
    for(let ray=0;ray<=40;ray++){
     const direction=angle-half+2*half*ray/40;
     const end=visibleRayLength(lamp,direction);
     ctx.lineTo(lamp.x+Math.cos(direction)*end,lamp.y+Math.sin(direction)*end);
    }
    ctx.closePath();ctx.fill();
   }
   for(const l of s.lights)scene.lamp(l,l.on,lightAngle(l,elapsed));
   for(const p of s.players){
    const local=p.id===context.playerId;
    if(local){ctx.strokeStyle=p.seen?'#ff997b':'#adffde';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(p.x,p.y+10,18,7,0,0,7);ctx.stroke()}
    drawCharacterToken(ctx,p,shirts[(Number(p.team)||0)%4]);
    text(ctx,local?'YOU':p.name,p.x,p.y-48,local?13:10,local?'#acffdc':'#fff1d5');
   }
   for(const p of s.players)for(const e of p.effects||[]){ctx.globalAlpha=1-e.age/.8;text(ctx,e.text,e.x,e.y-e.age*35,14);ctx.globalAlpha=1}
   const active=s.phase==='finished'?'ROUND COMPLETE':me?.status==='racing'?'STAY IN THE SHADOWS':me?.status==='finished'?'ROUND COMPLETE':'WATCHING';notice.textContent=me?(s.phase==='finished'?'ROUND COMPLETE':me.stun?'SPOTTED':me.seen?'IN THE LIGHT · FIND COVER':active+' · '+me.caught+' spotted'):'Watch the shared midway';
   score.textContent=(me?.score??0)+' tickets';clock.textContent=Math.ceil(Math.max(0,35-elapsed))+'s';
  }
  frame=requestAnimationFrame(render);
 }
 function direction(){let x=Number(keys.has('ArrowRight')||keys.has('d'))-Number(keys.has('ArrowLeft')||keys.has('a')),y=Number(keys.has('ArrowDown')||keys.has('s'))-Number(keys.has('ArrowUp')||keys.has('w'));for(const [dx,dy]of touches.values()){x+=dx;y+=dy}if(x||y)target=null;else if(target){const p=context.snapshot?.players.find(p=>p.id===context.playerId);if(p){x=target.x-p.x;y=target.y-p.y;if(Math.hypot(x,y)<7){target=null;x=y=0}else{const n=Math.hypot(x,y);x/=n;y/=n}}}const scale=Math.max(1,Math.abs(x),Math.abs(y));return{x:x/scale,y:y/scale}}
 const setTarget=e=>{const r=canvas.getBoundingClientRect();target={x:Math.max(0,Math.min(600,(e.clientX-r.left)*600/r.width)),y:Math.max(0,Math.min(700,(e.clientY-r.top)*700/r.height))}};
 on(canvas,'pointerdown',e=>{e.preventDefault();canvas.setPointerCapture(e.pointerId);setTarget(e)});on(canvas,'pointermove',e=>{if(canvas.hasPointerCapture(e.pointerId))setTarget(e)});on(canvas,'pointercancel',()=>{target=null});
 on(d.defaultView,'keydown',e=>{if(['arrowleft','arrowright','arrowup','arrowdown','w','a','s','d'].includes(e.key.toLowerCase())){e.preventDefault();keys.add(e.key.length===1?e.key.toLowerCase():e.key)}});on(d.defaultView,'keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));
 on(d.defaultView,'blur',()=>{keys.clear();touches.clear();target=null});for(const b of wrap.querySelectorAll('[data-x],[data-y]')){const down=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);touches.set(e.pointerId,[Number(b.dataset.x||0),Number(b.dataset.y||0)])};const up=e=>touches.delete(e.pointerId);on(b,'pointerdown',down);for(const type of ['pointerup','pointercancel','lostpointercapture'])on(b,type,up)}
 function update(next){context=next;const p=next.snapshot?.players.find(p=>p.id===next.playerId);seq=Math.max(seq,p?.seq??-1)}
 update(initial);frame=requestAnimationFrame(render);
 return{update,pollInterval:100,input(){if(!context.canPlay||context.snapshot?.phase!=='playing')return null;const dir=direction();return{seq:++seq,...dir}},destroy(){dead=true;abort.abort();cancelAnimationFrame(frame);host.remove();keys.clear();touches.clear()}}
}
