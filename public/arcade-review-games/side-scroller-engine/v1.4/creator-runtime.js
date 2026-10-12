/* Opt-in V1.4 creator extensions. Existing V1.3 pages do not load this module. */
(()=>{const TA=window.TASideScroller,Base=TA.Engine;
 class CreatorEngine extends Base{
  constructor(opts){super(opts);for(const s of this.solids){if(s.source!=='platform')continue;const original=(opts.level.platforms||[]).find((p,i)=>(p.id||'p'+(i+1))===s.platformId);if(original?.style)s.style=original.style;}}
  moveY(dy,wasGrounded=false){super.moveY(dy,wasGrounded);if(this.player.y<0){this.player.y=0;this.player.vy=Math.max(0,this.player.vy);}}
  resetCamera(){super.resetCamera();this.camera.y=Math.max(0,Math.min(this.level.world.height-this.canvas.height,this.player.y-this.canvas.height*.55));}
  updateCamera(dt){super.updateCamera(dt);const h=this.canvas.height,max=Math.max(0,this.level.world.height-h),cam=this.camera,p=this.player;cam.y=Number.isFinite(cam.y)?cam.y:0;let desired=cam.y;const screen=p.y-cam.y;if(screen<h*.30)desired=p.y-h*.30;else if(screen+p.h>h*.72)desired=p.y+p.h-h*.72;desired=Math.max(0,Math.min(max,desired));const alpha=1-Math.exp(-6*dt);cam.y+=Math.max(-900*dt,Math.min(900*dt,(desired-cam.y)*alpha));if(p.y-cam.y<0||p.y+p.h-cam.y>h)cam.y=Math.max(0,Math.min(max,p.y-h*.5));cam.y=Math.max(0,Math.min(max,cam.y));}
  updateMovingPlatforms(dt){const all=this.movingPlatforms,paths=all.filter(m=>m.path?.length>=2);this.movingPlatforms=all.filter(m=>!m.path?.length);try{super.updateMovingPlatforms(dt);}finally{this.movingPlatforms=all;}
   for(const m of paths){const oldX=m.x,oldY=m.y,p=this.player;TA.PathMotion.advance(m,dt);m.dx=m.x-oldX;m.dy=m.y-oldY;const standing=p.x+p.w>oldX&&p.x<oldX+m.w&&Math.abs(p.y+p.h-oldY)<7&&p.vy>=0;if(standing){p.x+=m.dx;p.y+=m.dy;p.grounded=true;}}
  }
  updateMovers(dt){const all=this.movers,paths=all.filter(m=>m.path?.length>=2);this.movers=all.filter(m=>!m.path?.length);try{super.updateMovers(dt);}finally{this.movers=all;}
   for(const m of paths){if(!m.active)continue;TA.PathMotion.advance(m,dt,(m.speed||80)*this.difficultyRules.hazardSpeed);if(this.overlap(this.player,m))this.resolveMoverInteraction(m);}
  }
  interact(){const p=this.player;for(const o of this.collectibles){if(!o.active||!this.overlap(p,o))continue;const reward=o.reward||'score';if(reward==='power')this.abilities.grantPower('guard',o.hits||1);if(reward==='gear')this.abilities.equipGear('climbing-kit',o.abilities||['climb','heavy']);this.stats.score+=(o.score??100)-100;}
   super.interact();
  }
 }
 TA.Engine=CreatorEngine;TA.CreatorEngine=CreatorEngine;
})();
