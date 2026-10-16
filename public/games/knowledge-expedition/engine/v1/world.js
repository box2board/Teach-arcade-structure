const WIDTH=1200, HEIGHT=800;
export function createWorld(canvas, {getArea, isCollected, isRestored, onInteract, onHint = () => {}}) {
  const ctx=canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable');
  const keys=new Set(), touches=new Set();
  const player={x:600,y:430}, camera={x:0,y:0};
  let active=false, last=0, tick=0, nearby=null, frame=0, priorHint="";
  const groundCache=new Map();
  const reducedMotion=matchMedia("(prefers-reduced-motion: reduce)").matches;
  let viewWidth=800,viewHeight=500;
  const obstacles=[{x:160,y:135,w:220,h:65},{x:820,y:135,w:220,h:65},{x:500,y:660,w:220,h:65}];
  function resize(){const r=canvas.getBoundingClientRect();viewWidth=r.width;viewHeight=r.height;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=r.width*ratio;canvas.height=r.height*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);}
  const observer = new ResizeObserver(() => { resize(); if (!active) drawFrame(0); });
  observer.observe(canvas);
  function blocked(x,y){return obstacles.some(o=>x+12>o.x && x-12<o.x+o.w && y+12>o.y && y-12<o.y+o.h);}
  const directions={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
  window.addEventListener('keydown',e=>{
    if(!active || e.target.closest('button,a,input,select,textarea,dialog'))return;
    const dir=directions[e.key.length===1 ? e.key.toLowerCase() : e.key];
    if(dir){e.preventDefault();keys.add(dir);}
    if(e.key==='Shift')keys.add('dash');
    if(['e','E','Enter',' '].includes(e.key)){e.preventDefault();if(!e.repeat && nearby)onInteract(nearby);}
  });
  window.addEventListener('keyup',e=>{keys.delete(directions[e.key.length===1 ? e.key.toLowerCase() : e.key]);if(e.key==='Shift')keys.delete('dash');});
  window.addEventListener('blur',()=>{keys.clear();touches.clear();});
  function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x-camera.x,y-camera.y,w,h);}
  function getGround(area) {
    if (groundCache.has(area.id)) return groundCache.get(area.id);
    const ground=document.createElement('canvas');ground.width=WIDTH;ground.height=HEIGHT;
    const groundCtx=ground.getContext('2d'),color=area.palette;
    groundCtx.fillStyle=color[0];groundCtx.fillRect(0,0,WIDTH,HEIGHT);
    const paintRect=(x,y,w,h,color)=>{groundCtx.fillStyle=color;groundCtx.fillRect(x,y,w,h);};
    const paintTree=(x,y,color)=>{paintRect(x-3,y,6,17,'#334331');groundCtx.fillStyle=color;groundCtx.beginPath();groundCtx.arc(x,y,16,0,Math.PI*2);groundCtx.fill();};
    // Stable ground details and garden paths make movement easy to read.
    for(let x=0;x<WIDTH;x+=64)for(let y=0;y<HEIGHT;y+=64){paintRect(x+((y/64)%2)*12,y,2,2,'#ffffff12');}
    paintRect(230,245,740,45,color[1]);paintRect(580,250,40,390,color[1]);paintRect(240,250,40,160,color[1]);paintRect(940,250,40,160,color[1]);
    if(area.terrain==='water'){
      for(let y=60;y<HEIGHT;y+=60){groundCtx.strokeStyle='#72b8cc25';groundCtx.beginPath();groundCtx.moveTo(0,y);groundCtx.lineTo(WIDTH,y);groundCtx.stroke();}
      paintRect(210,190,200,145,'#c6c19d');paintRect(790,190,200,145,'#c6c19d');paintRect(490,550,220,120,'#c6c19d');
    }else{for(let i=0;i<20;i++){const x=60+(i%10)*120,y=i<10?80:745;paintTree(x,y,'#2e6555');}}
    obstacles.forEach(o=>{paintRect(o.x+8,o.y+8,o.w,o.h,'#00000040');paintRect(o.x,o.y,o.w,o.h,'#334352');paintRect(o.x,o.y,o.w,10,color[2]);for(let x=o.x+15;x<o.x+o.w;x+=45)paintRect(x,o.y+22,22,24,'#b7d4c5');});
    // Bound cached backgrounds so long topic packs do not retain every map.
    if (groundCache.size >= 2) groundCache.delete(groundCache.keys().next().value);
    groundCache.set(area.id,ground);return ground;
  }
  function render(dt){
    const area=getArea(), color=area.palette;
    ctx.fillStyle=color[0];ctx.fillRect(0,0,viewWidth,viewHeight);
    ctx.drawImage(getGround(area), -camera.x, -camera.y);
    const restored=isRestored(area.id);
    // A restored timeline powers the plaza, making academic progress visible.
    ctx.strokeStyle=restored?'#8af3c3':'#ffffff20';ctx.lineWidth=3;
    area.discoveries.forEach(d=>{ctx.beginPath();ctx.moveTo(d.x-camera.x,d.y-camera.y);ctx.lineTo(600-camera.x,430-camera.y);ctx.stroke();});
    ctx.fillStyle=restored?'#69eab6':'#4d5965';ctx.beginPath();ctx.arc(600-camera.x,430-camera.y,45,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=restored?'#d4ffe9':'#909cab';ctx.lineWidth=4;ctx.stroke();
    ctx.fillStyle='#102334';ctx.font='bold 16px system-ui';ctx.textAlign='center';ctx.fillText(restored?'RESTORED':'CONNECT',600-camera.x,435-camera.y);
    area.discoveries.forEach((d,i)=>{
      const found=isCollected(d.id), x=d.x-camera.x,y=d.y-camera.y;
      ctx.fillStyle=found?'#74ecb4':color[2];ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=found?8:(reducedMotion?12:12+Math.sin(tick*3+i)*4);
      ctx.beginPath();ctx.arc(x,y,24,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      ctx.fillStyle='#193340';ctx.font='bold 20px system-ui';ctx.fillText(found?'✓':String(i+1),x,y+7);
      ctx.fillStyle='#f7f4e7';ctx.font='bold 13px system-ui';ctx.fillText(d.title,x,y+48);
    });
    // Explorer has a shadow, feet, coat, face, and satchel instead of a tile.
    const x=player.x-camera.x,y=player.y-camera.y;
    ctx.fillStyle='#00000045';ctx.beginPath();ctx.ellipse(x,y+16,15,7,0,0,Math.PI*2);ctx.fill();
    rect(player.x-9,player.y+7,6,10,'#203348');rect(player.x+3,player.y+7,6,10,'#203348');
    rect(player.x-11,player.y-6,22,18,'#f0bf67');rect(player.x+7,player.y-3,8,12,'#80613a');
    ctx.fillStyle='#f2d3ad';ctx.beginPath();ctx.arc(x,y-12,9,0,Math.PI*2);ctx.fill();rect(player.x-13,player.y-21,26,5,'#dbe5d9');rect(player.x-8,player.y-29,16,10,'#dbe5d9');
    const scale=0.11,mw=WIDTH*scale,mh=HEIGHT*scale,left=viewWidth-mw-12,top=12;
    ctx.fillStyle='#091621df';ctx.fillRect(left-5,top-5,mw+10,mh+10);
    area.discoveries.forEach(d=>{ctx.fillStyle=isCollected(d.id)?'#74ecb4':color[2];ctx.fillRect(left+d.x*scale-3,top+d.y*scale-3,6,6);});
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(left+player.x*scale,top+player.y*scale,3,0,Math.PI*2);ctx.fill();
    ctx.textAlign='left';
  }
  function updateHint() {
    const area=getArea();
    const remaining=area.discoveries.filter(d=>!isCollected(d.id));
    nearby=remaining.find(d=>Math.hypot(d.x-player.x,d.y-player.y)<80)||
      (Math.hypot(player.x-600,player.y-430)<85?{id:'station',title:'Connection station'}:null);
    const target=remaining.reduce((best,d)=>!best||Math.hypot(d.x-player.x,d.y-player.y)<Math.hypot(best.x-player.x,best.y-player.y)?d:best,null)||{id:'station',title:'Connection station',x:600,y:430};
    const compass=['east','southeast','south','southwest','west','northwest','north','northeast'];
    const direction=compass[(Math.round(Math.atan2(target.y-player.y,target.x-player.x)/(Math.PI/4))+8)%8];
    const signature=`${area.id}:${nearby?.id||''}:${target.id}:${direction}:${active}`;
    if(signature!==priorHint){priorHint=signature;onHint({nearby,target,direction,active});}
  }
  function drawFrame(dt) {
    const targetX=Math.max(0,Math.min(WIDTH-viewWidth,player.x-viewWidth/2));
    const targetY=Math.max(0,Math.min(HEIGHT-viewHeight,player.y-viewHeight/2));
    const easing=reducedMotion?1:1-Math.exp(-10*dt);
    camera.x+=(targetX-camera.x)*easing;camera.y+=(targetY-camera.y)*easing;
    updateHint();render(dt);
  }
  function loop(time) {
    frame=0;if(!active)return;
    const dt=last?Math.min((time-last)/1000,.05):0;last=time;tick+=dt;
    if(active){let x=Number(keys.has('right')||touches.has('right'))-Number(keys.has('left')||touches.has('left'));let y=Number(keys.has('down')||touches.has('down'))-Number(keys.has('up')||touches.has('up'));const length=Math.hypot(x,y)||1,speed=keys.has('dash')?290:190;
      const nx=Math.max(24,Math.min(WIDTH-24,player.x+x/length*speed*dt));const ny=Math.max(32,Math.min(HEIGHT-24,player.y+y/length*speed*dt));
      if(!blocked(nx,player.y))player.x=nx;if(!blocked(player.x,ny))player.y=ny;
    }
    drawFrame(dt);if(active)frame=requestAnimationFrame(loop);
  }
  function setActive(value) {
    keys.clear();touches.clear();
    if (active===value) return;
    active=value;last=0;
    if(frame){cancelAnimationFrame(frame);frame=0;}
    drawFrame(0);if(active)frame=requestAnimationFrame(loop);
  }
  resize();drawFrame(0);
  return {setActive, reset(){player.x=600;player.y=480;camera.x=Math.max(0,Math.min(WIDTH-viewWidth,player.x-viewWidth/2));camera.y=Math.max(0,Math.min(HEIGHT-viewHeight,player.y-viewHeight/2));priorHint="";drawFrame(0);},getNearby:()=>nearby,
    touch(dir,on){if(on)touches.add(dir);else touches.delete(dir);},interact(){if(active&&nearby)onInteract(nearby);}};
}
