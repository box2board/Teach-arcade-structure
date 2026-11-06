export function createCabinet(host) {
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  canvas.className='cabinet-world';canvas.setAttribute('aria-hidden','true');
  canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';host.prepend(canvas);
  let w=1,h=1,dpr=1;
  const mix=(a,b,t)=>a+(b-a)*t;
  function gradient(x,y,x2,y2,stops){const g=ctx.createLinearGradient(x,y,x2,y2);stops.forEach(([p,c])=>g.addColorStop(p,c));return g;}
  function shape(points,fill,stroke,line=1){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke();}}
  function round(x,y,bw,bh,r,fill,stroke,line=1){ctx.beginPath();ctx.roundRect(x,y,bw,bh,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.lineWidth=line;ctx.strokeStyle=stroke;ctx.stroke();}}
  function circle(x,y,r,fill,stroke,line=1){ctx.beginPath();ctx.arc(x,y,Math.max(.1,r),0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke();}}
  function label(s,x,y,size,color='#fff2bc',weight=900){ctx.fillStyle=color;ctx.font=`${weight} ${size}px system-ui,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(s),x,y);}
  function geometry(){const unit=Math.min(w,h*.98);return{unit,left:(w-unit*.95)/2,right:(w+unit*.95)/2,top:h*.035,join:h*.685,bottom:h*.965};}
  function targetPoint(x,s){const g=geometry();return{x:w/2+x*g.unit*.345,y:mix(g.join,h*.105,(s-4.8)/3.85)};}
  function screen(x,s,y=Math.max(0,(s-4.8)*.65)){
    const g=geometry(),base=s>=4.8?targetPoint(x,s):{x:w/2+x*mix(g.unit*.405,g.unit*.345,s/4.8),y:mix(g.bottom-h*.043,g.join,s/4.8)};
    return{x:base.x,y:base.y-(y-Math.max(0,(s-4.8)*.65))*h*.065};
  }
  function radius(hole){return Math.min(w,h)*({50:.055,75:.040,100:.039,150:.037,200:.034,500:.032,1000:.025}[hole.n]||.04);}
  function drawCup(hole,time,flash){
    const p=targetPoint(hole.x,hole.s),r=radius(hole),lip=Math.max(3,r*.16),hit=flash?.h===hole&&flash.t<1;
    // A circular recess, a thick raised metal lip, and a separate dark well.
    ctx.save();ctx.shadowColor='#020613bb';ctx.shadowBlur=r*.35;ctx.shadowOffsetY=r*.24;
    circle(p.x,p.y+r*.09,r+lip, '#09162e');ctx.restore();
    circle(p.x,p.y,r+lip,gradient(p.x-r,p.y-r,p.x+r,p.y+r,[[0,'#fff5bd'],[.18,'#c89d43'],[.43,'#ffe9a4'],[.75,'#8c652c'],[1,'#edc872']]));
    circle(p.x,p.y,r,gradient(p.x,p.y-r,p.x,p.y+r,[[0,hole.color],[.4,'#15314a'],[1,hole.color]]));
    circle(p.x,p.y,r*.87,'#020919');
    const well=ctx.createRadialGradient(p.x,p.y+r*.3,1,p.x,p.y,r*.87);well.addColorStop(0,'#122c4a');well.addColorStop(.65,'#071428');well.addColorStop(1,'#010610');circle(p.x,p.y,r*.86,well);
    ctx.beginPath();ctx.arc(p.x,p.y,r+lip*.55,Math.PI*1.08,Math.PI*1.77);ctx.strokeStyle='#fff9d5';ctx.lineWidth=Math.max(1.4,lip*.30);ctx.stroke();
    if(!hole.open){
      ctx.save();circle(p.x,p.y,r*.83);ctx.clip();ctx.fillStyle=gradient(p.x-r,p.y,p.x+r,p.y,[[0,'#586b89'],[.45,'#b0c2d4'],[1,'#536b88']]);ctx.fillRect(p.x-r,p.y-r,r*2,r*2);
      for(let i=-4;i<5;i++){ctx.fillStyle='#354862';ctx.fillRect(p.x+i*r*.25,p.y-r,Math.max(1,r*.045),r*2);}ctx.restore();
      label('500',p.x,p.y,Math.max(12,r*.65),'#182941');label('WAIT',p.x,p.y+r+lip+9,Math.max(8,r*.26),'#ffe1a2');
    }else{label(hole.n,p.x,p.y+1,Math.max(12,r*(hole.n===1000?.56:.69)));}
    if(hole.motion==='gate'){circle(p.x,p.y-r-lip-5,Math.max(2.5,r*.09),hole.open?'#75ffb0':'#ffc562');}
    if(hit){ctx.save();ctx.globalAlpha=1-flash.t;ctx.shadowColor=hole.color;ctx.shadowBlur=20;circle(p.x,p.y,r+lip+flash.t*r*.6,null,'#fff4b5',3);ctx.restore();}
  }
  function drawBall(ball,ready){
    const b=ball||(ready?{x:0,s:.13,y:.075,spin:0,phase:'ready'}:null);if(!b)return;
    const p=screen(b.x,b.s,b.y),g=geometry();let r=g.unit*.031*mix(1,.63,Math.min(1,b.s/9));
    if(b.phase==='sink')r*=Math.max(0,1-Math.max(0,b.age-.15)*1.9);if(r<.4)return;
    const shadow=screen(b.x,b.s);ctx.save();ctx.globalAlpha=.35;ctx.filter='blur(3px)';ctx.beginPath();ctx.ellipse(shadow.x,shadow.y+r*.55,r*1.1,r*.35,0,0,7);ctx.fillStyle='#010817';ctx.fill();ctx.restore();
    ctx.save();if(b.phase==='sink'&&b.age>.15&&b.targetHole){const cp=targetPoint(b.targetHole.x,b.targetHole.s);circle(cp.x,cp.y,radius(b.targetHole)*.86);ctx.clip();}
    const grad=ctx.createRadialGradient(p.x-r*.35,p.y-r*.4,1,p.x,p.y,r);grad.addColorStop(0,'#fff9d8');grad.addColorStop(.35,'#f7d08a');grad.addColorStop(.78,'#c28b46');grad.addColorStop(1,'#76451f');circle(p.x,p.y,r,grad,'#7f542a',.8);
    ctx.save();circle(p.x,p.y,r*.97);ctx.clip();ctx.translate(p.x,p.y);ctx.rotate(b.spin||0);
    for(let i=0;i<70;i++){const a=i*2.39996,d=Math.sqrt(i/70)*r;circle(Math.cos(a)*d,Math.sin(a)*d,.6+i%2*.4,i%3?'#895e313d':'#fff3ce65');}
    ctx.beginPath();ctx.ellipse(0,0,r*.4,r*.98,.2,0,7);ctx.strokeStyle='#8a5b3044';ctx.lineWidth=1;ctx.stroke();ctx.restore();ctx.restore();
  }
  function render({holes,ball,ready,aim,power,flash,time}){
    const box=host.getBoundingClientRect();w=Math.max(1,box.width);h=Math.max(1,box.height);dpr=Math.min(window.devicePixelRatio||1,2);
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    const g=geometry(),l=g.left,r=g.right,top=g.top,join=g.join,bottom=g.bottom;
    ctx.fillStyle=gradient(0,0,0,h,[[0,'#172744'],[.6,'#0a1428'],[1,'#080e20']]);ctx.fillRect(0,0,w,h);
    // Inset cabinet sides stay proportional; the camera never stretches the art.
    ctx.save();ctx.shadowColor='#01040a';ctx.shadowBlur=25;round(l-9,top-4,r-l+18,bottom-top+15,18,'#321d58');ctx.restore();
    round(l-7,top-4,r-l+14,bottom-top+13,15,gradient(l,0,r,0,[[0,'#7046a4'],[.17,'#3c245e'],[.85,'#3c245e'],[1,'#7046a4']]),'#ab85cc',1);
    const inset=g.unit*.045,bl=l+inset,br=r-inset;
    round(bl,top+10,br-bl,join-top+12,7,gradient(bl,top,br,join,[[0,'#245ea1'],[.4,'#164578'],[1,'#112d56']]),'#6da0d4',1);
    // Quiet vertical grooves add depth without competing with the targets.
    ctx.save();ctx.globalAlpha=.09;for(let x=bl+10;x<br;x+=9){ctx.fillStyle='#adceef';ctx.fillRect(x,top+12,1,join-top);}ctx.restore();
    const laneTop=join+2,laneBottom=bottom-24;
    shape([[bl,laneTop],[br,laneTop],[r-9,laneBottom],[l+9,laneBottom]],gradient(0,laneTop,0,laneBottom,[[0,'#d59d50'],[.12,'#f0cf8e'],[1,'#e2b66d']]),'#ffe4a3',1.5);
    ctx.save();shape([[bl,laneTop],[br,laneTop],[r-9,laneBottom],[l+9,laneBottom]]);ctx.clip();
    for(let i=0;i<=12;i++){const t=i/12;shape([[mix(bl,br,t),laneTop],[mix(bl,br,t)+1,laneTop],[mix(l+9,r-9,t)+1,laneBottom],[mix(l+9,r-9,t),laneBottom]],'#94632c30');}
    for(let i=0;i<120;i++){const x=l+(i*79.31)%(r-l),y=laneTop+(i*53.19)%(laneBottom-laneTop);ctx.fillStyle=i%2?'#fff1c31c':'#95602912';ctx.fillRect(x,y,.7,8+i%20);}ctx.restore();
    round(bl-1,join-5,br-bl+2,13,3,gradient(0,join-5,0,join+8,[[0,'#b58036'],[.4,'#ffe5ab'],[1,'#ce984c']]));
    for(const side of [-1,1]){const x=side<0?bl-9:br+9,front=side<0?l+2:r-2;ctx.beginPath();ctx.moveTo(x,top+15);ctx.lineTo(x,join);ctx.lineTo(front,laneBottom);ctx.strokeStyle='#08182f';ctx.lineWidth=13;ctx.stroke();ctx.strokeStyle='#efcf82';ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle='#fff0bf';ctx.lineWidth=1.4;ctx.stroke();
      for(let i=0;i<16;i++){const y=mix(top+24,join-20,i/15);circle(x,y,1.6,(i+Math.floor(time*3))%4===0?'#ffffff':'#8fcbef');}}
    // Target movement is shown on restrained tracks, beneath the cups.
    for(const hole of holes)if(hole.motion==='slide'){const a=targetPoint(hole.baseX-hole.ax,hole.baseS),b=targetPoint(hole.baseX+hole.ax,hole.baseS);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle='#96bce443';ctx.lineWidth=2;ctx.stroke();circle(a.x,a.y,2,'#97c8e5');circle(b.x,b.y,2,'#97c8e5');}
    for(const hole of [...holes].sort((a,b)=>b.s-a.s))drawCup(hole,time,flash);
    if(ready){const end=screen(Math.sin(aim*Math.PI/180)*4.1,4.1),start=screen(0,.22);ctx.save();ctx.setLineDash([3,9]);ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.lineTo(end.x,end.y);ctx.strokeStyle='#6e4b2870';ctx.lineWidth=2;ctx.stroke();ctx.restore();if(power>.04){ctx.beginPath();ctx.arc(start.x,start.y,g.unit*.042,-Math.PI/2,-Math.PI/2+Math.PI*2*power);ctx.strokeStyle='#fff0aa';ctx.lineWidth=2;ctx.stroke();}}
    round(l+2,bottom-24,r-l-4,29,6,gradient(0,bottom-24,0,bottom+5,[[0,'#46306d'],[1,'#251636']]),'#caad68',1);
    label('ULTIMATE  ROLL',w/2,bottom-10,Math.max(10,g.unit*.018),'#e8cc91',800);
    drawBall(ball,ready);
  }
  return{render,screen,dispose(){canvas.remove();}};
}
