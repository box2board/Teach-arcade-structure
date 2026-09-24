(() => {
 const TA=window.TASideScroller=window.TASideScroller||{};
 const color=(theme,kind,code)=>theme.tiles?.[kind]?.[code]?.color||theme.tiles?.[kind]?.default?.color||'#777';
 TA.render=e=>{const {ctx,canvas,theme,camera,level,player}=e;ctx.clearRect(0,0,canvas.width,canvas.height);
  const g=ctx.createLinearGradient(0,0,0,canvas.height);g.addColorStop(0,theme.skyTop||'#18304a');g.addColorStop(1,theme.skyBottom||'#6f91a6');ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);
  (theme.parallax||[]).forEach(layer=>{ctx.fillStyle=layer.color;const off=-(camera.x*layer.speed)%layer.width;for(let x=off-layer.width;x<canvas.width+layer.width;x+=layer.width){ctx.fillRect(x,layer.y,layer.width,layer.height);}});
  const draw=(arr,kind)=>arr.forEach(o=>{if(!o.active)return;ctx.fillStyle=color(theme,kind,o.code);ctx.fillRect(Math.round(o.x-camera.x),o.y,o.w,o.h);});
  draw(e.solids,'terrain');draw(e.hazards,'hazards');draw(e.checkpoints,'checkpoints');draw(e.questionTriggers,'questions');
  ctx.fillStyle=theme.finishColor||'#ffd166';ctx.fillRect(level.finish.x-camera.x,level.finish.y,8,level.finish.h||120);
  ctx.fillStyle=theme.playerColor||'#f3f4f6';ctx.fillRect(Math.round(player.x-camera.x),Math.round(player.y),player.w,player.h);
  if(e.state==='won'){ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#fff';ctx.font='700 36px system-ui';ctx.textAlign='center';ctx.fillText('ENGINE DEMO COMPLETE',canvas.width/2,canvas.height/2);}
 };
})();