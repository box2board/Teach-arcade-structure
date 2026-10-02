const WIDTH=1200, HEIGHT=800;
export function createWorld(canvas, {getArea, isCollected, isRestored, onInteract}) {
  const ctx=canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable');
  const keys=new Set(), touches=new Set();
  const player={x:600,y:430}, camera={x:0,y:0};
  let active=false, last=0, tick=0, nearby=null;
  let viewWidth=800,viewHeight=500;
  const obstacles=[{x:160,y:135,w:220,h:65},{x:820,y:135,w:220,h:65},{x:500,y:660,w:220,h:65}];
  function resize(){const r=canvas.getBoundingClientRect();viewWidth=r.width;viewHeight=r.height;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=r.width*ratio;canvas.height=r.height*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);}
  new ResizeObserver(resize).observe(canvas);
  function blocked(x,y){return obstacles.some(o=>x+12>o.x && x-12<o.x+o.w && y+12>o.y && y-12<o.y+o.h);}
  const directions={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
  window.addEventListener('keydown',e=>{
    if(!active || e.target.closest('button,a,input,select,textarea,dialog'))return;
    const dir=directions[e.key];
    if(dir){e.preventDefault();keys.add(dir);}
    if(e.key==='Shift')keys.add('dash');
    if(['e','E','Enter',' '].includes(e.key)){e.preventDefault();if(!e.repeat && nearby)onInteract(nearby);}
  });
  window.addEventListener('keyup',e=>{keys.delete(directions[e.key]);if(e.key==='Shift')keys.delete('dash');});
  window.addEventListener('blur',()=>{keys.clear();touches.clear();});
  function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x-camera.x,y-camera.y,w,h);}
  function tree(x,y,color){rect(x-3,y,6,17,'#334331');ctx.fillStyle=color;ctx.beginPath();ctx.arc(x-camera.x,y-camera.y,16,0,Math.PI*2);ctx.fill();}
  function render(dt){
    const area=getArea(), color=area.palette;
    ctx.fillStyle=color[0];ctx.fillRect(0,0,viewWidth,viewHeight);
    // Stable ground details and garden paths make movement easy to read.
    for(let x=0;x<WIDTH;x+=64)for(let y=0;y<HEIGHT;y+=64){rect(x+((y/64)%2)*12,y,2,2,'#ffffff12');}
    rect(230,245,740,45,color[1]);rect(580,250,40,390,color[1]);rect(240,250,40,160,color[1]);rect(940,250,40,160,color[1]);
    if(area.terrain==='water'){
      for(let y=60;y<HEIGHT;y+=60){ctx.strokeStyle='#72b8cc25';ctx.beginPath();ctx.moveTo(-camera.x,y-camera.y);ctx.lineTo(WIDTH-camera.x,y-camera.y);ctx.stroke();}
      rect(210,190,200,145,'#c6c19d');rect(790,190,200,145,'#c6c19d');rect(490,550,220,120,'#c6c19d');
    }else{for(let i=0;i<20;i++){const x=60+(i%10)*120,y=i<10?80:745;tree(x,y,'#2e6555');}}
    obstacles.forEach(o=>{rect(o.x+8,o.y+8,o.w,o.h,'#00000040');rect(o.x,o.y,o.w,o.h,'#334352');rect(o.x,o.y,o.w,10,color[2]);for(let x=o.x+15;x<o.x+o.w;x+=45)rect(x,o.y+22,22,24,'#b7d4c5');});
    const restored=isRestored(area.id);
    // A restored timeline powers the plaza, making academic progress visible.
    ctx.strokeStyle=restored?'#8af3c3':'#ffffff20';ctx.lineWidth=3;
    area.discoveries.forEach(d=>{ctx.beginPath();ctx.moveTo(d.x-camera.x,d.y-camera.y);ctx.lineTo(600-camera.x,430-camera.y);ctx.stroke();});
    ctx.fillStyle=restored?'#69eab6':'#4d5965';ctx.beginPath();ctx.arc(600-camera.x,430-camera.y,45,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=restored?'#d4ffe9':'#909cab';ctx.lineWidth=4;ctx.stroke();
    ctx.fillStyle='#102334';ctx.font='bold 16px system-ui';ctx.textAlign='center';ctx.fillText(restored?'RESTORED':'CONNECT',600-camera.x,435-camera.y);
    area.discoveries.forEach((d,i)=>{
      const found=isCollected(d.id), x=d.x-camera.x,y=d.y-camera.y;
      ctx.fillStyle=found?'#74ecb4':color[2];ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=found?8:12+Math.sin(tick*3+i)*4;
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
  function loop(time){const dt=Math.min((time-last)/1000||0,.035);last=time;tick+=dt;
    if(active){let x=Number(keys.has('right')||touches.has('right'))-Number(keys.has('left')||touches.has('left'));let y=Number(keys.has('down')||touches.has('down'))-Number(keys.has('up')||touches.has('up'));const length=Math.hypot(x,y)||1,speed=keys.has('dash')?290:190;
      const nx=Math.max(24,Math.min(WIDTH-24,player.x+x/length*speed*dt));const ny=Math.max(32,Math.min(HEIGHT-24,player.y+y/length*speed*dt));
      if(!blocked(nx,player.y))player.x=nx;if(!blocked(player.x,ny))player.y=ny;
    }
    const targetX=Math.max(0,Math.min(WIDTH-viewWidth,player.x-viewWidth/2));const targetY=Math.max(0,Math.min(HEIGHT-viewHeight,player.y-viewHeight/2));
    const easing=1-Math.exp(-10*dt);camera.x+=(targetX-camera.x)*easing;camera.y+=(targetY-camera.y)*easing;
    nearby=getArea().discoveries.find(d=>!isCollected(d.id)&&Math.hypot(d.x-player.x,d.y-player.y)<80)|| (Math.hypot(player.x-600,player.y-430)<85?{id:'station',title:'Connection station'}:null);
    render(dt);requestAnimationFrame(loop);
  }
  resize();requestAnimationFrame(loop);
  return {setActive(v){active=v;keys.clear();touches.clear();},reset(){player.x=600;player.y=480;camera.x=Math.max(0,player.x-viewWidth/2);camera.y=Math.max(0,player.y-viewHeight/2);},getNearby:()=>nearby,
    touch(dir,on){if(on)touches.add(dir);else touches.delete(dir);},interact(){if(active&&nearby)onInteract(nearby);}};
}
