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
  updateMovers(dt){
   const all=this.movers,custom=all.filter(m=>m.active&&(m.path?.length>=2||['hopping','chasing','stationary','ambush'].includes(m.movement)));
   this.movers=all.filter(m=>m.active&&!custom.includes(m));try{super.updateMovers(dt);}finally{this.movers=all;}
   for(const m of custom){const speed=(m.speed??80)*this.difficultyRules.hazardSpeed,range=m.range??120,p=this.player;
    if(m.path?.length>=2)TA.PathMotion.advance(m,dt,speed);
    else if(m.movement==='ambush'){const close=Math.hypot(p.x+p.w/2-m.x-m.w/2,p.y+p.h/2-m.originY-m.h/2)<(m.triggerDistance??170);m._ambush=Math.max(0,Math.min(1,(m._ambush||0)+(close?4:-2)*dt));m.y=m.originY-m._ambush*m.h*.7;}
    else if(m.movement!=='stationary'){
     const chasing=m.movement==='chasing',near=Math.hypot(p.x-m.x,p.y-m.y)<(m.detectionRange??300);
     if(chasing&&near)m.dir=Math.sign(p.x-m.x)||m.dir;
     const next=m.x+speed*m.dir*dt,ground=this.surfaceAt(m.x+m.w/2,m.y+m.h,18,24),air=m.movement==='hopping'&&m._air;
     if((!chasing||near)&&!this.wallAhead(m,next)&&next>=0&&next+m.w<=this.level.world.width&&(air||this.groundAhead(m,next))&&(chasing||Math.abs(next-m.originX)<range))m.x=next;else if(!chasing)m.dir*=-1;
     if(m.movement==='hopping'){
      m._jumpWait=(m._jumpWait??0)-dt;
      if(!m._air&&ground!=null&&m._jumpWait<=0){m.vy=-Math.sqrt(2*1250*(m.jumpHeight??80));m._air=true;m._jumpWait=m.jumpInterval??1.4;}
      if(m._air){const oldBottom=m.y+m.h;m.vy+=1250*dt;const nextY=m.y+m.vy*dt,support=this.surfaceAt(m.x+m.w/2,oldBottom,0,Math.max(0,nextY-m.y)+2);if(m.vy>=0&&support!=null&&nextY+m.h>=support){m.y=support-m.h;m.vy=0;m._air=false;}else if(m.vy<0){const ceiling=this.solids.filter(s=>s.active!==false&&m.x+m.w>s.x&&m.x<s.x+s.w&&m.y>=s.y+s.h&&nextY<s.y+s.h).sort((a,b)=>(b.y+b.h)-(a.y+a.h))[0];if(ceiling){m.y=ceiling.y+ceiling.h;m.vy=0;}else m.y=nextY;}else m.y=nextY;if(m.y>this.level.world.height+100){this.resetMover(m);m._air=false;}}
      else if(ground!=null)m.y=ground-m.h;
     }else if(ground!=null)m.y=ground-m.h;
    }
    if(m.active&&this.overlap(p,m))this.resolveMoverInteraction(m);
   }
   for(const m of all){m._hitCooldown=Math.max(0,(m._hitCooldown||0)-dt);if(!m.active||m.phase==='reset'||m.attack!=='projectile')continue;
    const near=Math.hypot(this.player.x-m.x,this.player.y-m.y)<(m.detectionRange??300);m._fireTimer=Math.max(0,(m._fireTimer??m.fireInterval??2)-dt);
    if(near&&m._fireTimer<=0){this.fireEnemyProjectile(m);m._fireTimer=m.fireInterval??2;}
   }
   this.updateEnemyProjectiles(dt);
  }
  fireEnemyProjectile(m){this.enemyProjectiles||=[];if(this.enemyProjectiles.length>=100)return;const p=this.player,x=m.x+m.w/2,y=m.y+m.h/2,dir=m.projectileDirection||'left';let dx=dir==='right'?1:dir==='left'?-1:0,dy=dir==='up'?-1:dir==='down'?1:0;if(dir==='aim'){dx=p.x+p.w/2-x;dy=p.y+p.h/2-y;const length=Math.hypot(dx,dy)||1;dx/=length;dy/=length;}const speed=(m.projectileSpeed??180)*this.difficultyRules.hazardSpeed;this.enemyProjectiles.push({x:x-5,y:y-5,w:10,h:10,vx:dx*speed,vy:dy*speed,life:5});}
  updateEnemyProjectiles(dt){this._projectilesCleared=false;const keep=[];for(const shot of this.enemyProjectiles||[]){shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.life-=dt;if(shot.life<=0||shot.x<0||shot.y<0||shot.x>this.level.world.width||shot.y>this.level.world.height||this.solids.some(s=>s.active!==false&&this.overlap(shot,s)))continue;if(this.overlap(this.player,shot)){this.enemyContactDamage();if(this._projectilesCleared)return;continue;}keep.push(shot);}this.enemyProjectiles=keep;}
  enemyContactDamage(){if(this.invulnerable>0)return;if(this.abilities?.absorbHit()){this.stats.powerHits++;this.invulnerable=.9;this.sound?.play('hit');return;}this.respawn();this.invulnerable=.9;}
  respawn(){super.respawn();this.enemyProjectiles=[];this._projectilesCleared=true;}
  resolveMoverInteraction(m){if(!m.active)return;const p=this.player,rule=m.interaction||'hazard';if(rule==='bounce')return super.resolveMoverInteraction(m);
   const stomp=rule==='stompable'&&p.vy>=(m.minStompSpeed??55)&&(p.prevY??p.y)+p.h<=m.y+(m.stompTolerance??this.config.player.stompTolerance??10),dash=rule==='dash'&&this.abilities?.isDashing();
   if(stomp||dash){if(m._hitCooldown>0)return;m._health=(m._health??m.health??1)-1;m._hitCooldown=.35;if(stomp){p.y=m.y-p.h-1;p.vy=-(m.stompBounce||430);p.grounded=false;p.groundSurface=null;p.groundSlope=0;}if(m._health<=0){m.active=false;this.stats.enemiesDefeated++;this.stats.score+=m.score??200;this.updateQuestionHUD();}this.sound?.play('stomp');return;}
   this.enemyContactDamage();
  }
  interact(){const p=this.player;for(const o of this.collectibles){if(!o.active||!this.overlap(p,o))continue;const reward=o.reward||'score';if(reward==='power')this.abilities.grantPower('guard',o.hits||1);if(reward==='gear')this.abilities.equipGear('climbing-kit',o.abilities||['climb','heavy']);this.stats.score+=(o.score??100)-100;}
   super.interact();
  }
 }
 TA.Engine=CreatorEngine;TA.CreatorEngine=CreatorEngine;
})();
