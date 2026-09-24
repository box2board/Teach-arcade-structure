(() => {
  const TA = window.TASideScroller = window.TASideScroller || {};
  const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));
  class Engine {
    constructor({canvas, config, level, theme, questions=[]}) {
      this.canvas=canvas; this.ctx=canvas.getContext('2d'); this.config=config; this.level=level; this.theme=theme; this.questions=questions;
      this.keys={}; this.state='ready'; this.camera={x:0}; this.last=0; this.acc=0; this.step=1/120;
      this.tileSize=level.tileSize||32; this.solids=[]; this.hazards=[]; this.collectibles=[]; this.checkpoints=[]; this.questionTriggers=[];
      this.parseLayers(); this.spawn={...level.spawn}; this.player=this.makePlayer(); this.bindInput();
    }
    makePlayer(){ const p=this.config.player; return {x:this.spawn.x,y:this.spawn.y,w:p.width||26,h:p.height||38,vx:0,vy:0,grounded:false,coyote:0,jumpBuffer:0,facing:1,health:p.maxHealth||3,checkpoint:{...this.spawn}}; }
    parseLayers(){
      const kinds={terrain:this.solids,hazards:this.hazards,collectibles:this.collectibles,checkpoints:this.checkpoints,questions:this.questionTriggers};
      Object.entries(this.level.layers||{}).forEach(([name,grid])=>{
        const target=kinds[name]; if(!target)return;
        grid.forEach((row,r)=>row.forEach((code,c)=>{ if(!code)return; target.push({code,x:c*this.tileSize,y:r*this.tileSize,w:this.tileSize,h:this.tileSize,active:true}); }));
      });
    }
    bindInput(){
      addEventListener('keydown',e=>{this.keys[e.key.toLowerCase()]=true;if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase()))e.preventDefault();});
      addEventListener('keyup',e=>this.keys[e.key.toLowerCase()]=false);
      document.querySelectorAll('[data-control]').forEach(btn=>{
        const k=btn.dataset.control; const on=e=>{e.preventDefault();this.keys[k]=true}; const off=e=>{e.preventDefault();this.keys[k]=false};
        btn.addEventListener('pointerdown',on); btn.addEventListener('pointerup',off); btn.addEventListener('pointercancel',off); btn.addEventListener('pointerleave',off);
      });
    }
    start(){this.state='playing';this.last=performance.now();requestAnimationFrame(t=>this.loop(t));}
    loop(t){let dt=Math.min((t-this.last)/1000,.05);this.last=t;this.acc+=dt;while(this.acc>=this.step){this.update(this.step);this.acc-=this.step}this.render();requestAnimationFrame(n=>this.loop(n));}
    pressed(...ks){return ks.some(k=>this.keys[k]);}
    update(dt){
      if(this.state!=='playing')return;
      const p=this.player,c=this.config.player;
      const dir=(this.pressed('arrowright','d')?1:0)-(this.pressed('arrowleft','a')?1:0);
      const target=dir*c.speed; const rate=dir?c.acceleration:c.deceleration;
      p.vx += clamp(target-p.vx,-rate*dt,rate*dt); if(dir)p.facing=dir;
      p.coyote=p.grounded?c.coyoteTime:Math.max(0,p.coyote-dt);
      if(this.pressed('arrowup','w',' ')) p.jumpBuffer=c.jumpBuffer; else p.jumpBuffer=Math.max(0,p.jumpBuffer-dt);
      if(p.jumpBuffer>0&&p.coyote>0){p.vy=-c.jumpVelocity;p.grounded=false;p.coyote=0;p.jumpBuffer=0;}
      if(!this.pressed('arrowup','w',' ')&&p.vy<0)p.vy+=c.gravity*c.jumpCut*dt;
      p.vy=Math.min(c.maxFallSpeed,p.vy+c.gravity*dt);
      this.moveX(p.vx*dt); this.moveY(p.vy*dt);
      if(p.y>this.level.world.height+100)this.respawn();
      this.updateInteractions();
      const desired=p.x-this.canvas.width*.38+(dir*c.cameraLookAhead);
      this.camera.x += (desired-this.camera.x)*c.cameraSmoothing;
      this.camera.x=clamp(this.camera.x,0,Math.max(0,this.level.world.width-this.canvas.width));
      if(p.x>=this.level.finish.x){this.state='won';document.getElementById('status').textContent='Level complete!';}
    }
    overlaps(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
    moveX(dx){const p=this.player;p.x+=dx;for(const s of this.solids){if(this.overlaps(p,s)){if(dx>0)p.x=s.x-p.w;else if(dx<0)p.x=s.x+s.w;p.vx=0;}}}
    moveY(dy){const p=this.player;p.y+=dy;p.grounded=false;for(const s of this.solids){if(this.overlaps(p,s)){if(dy>0){p.y=s.y-p.h;p.grounded=true}else if(dy<0)p.y=s.y+s.h;p.vy=0;}}}
    updateInteractions(){const p=this.player;
      for(const h of this.hazards)if(h.active&&this.overlaps(p,h)){this.respawn();break;}
      for(const cp of this.checkpoints)if(cp.active&&this.overlaps(p,cp)){p.checkpoint={x:cp.x,y:cp.y-p.h};cp.active=false;}
      for(const q of this.questionTriggers)if(q.active&&this.overlaps(p,q)){q.active=false;this.askQuestion(q.code);}
    }
    respawn(){const p=this.player;p.x=p.checkpoint.x;p.y=p.checkpoint.y;p.vx=p.vy=0;}
    askQuestion(code){const bank=this.questions.filter(q=>!q.trigger||q.trigger===code);if(!bank.length)return;this.state='question';TA.showQuestion(bank[Math.floor(Math.random()*bank.length)],correct=>{document.getElementById('status').textContent=correct?'Correct — boost earned!':'Keep going!';if(correct)this.player.vx=this.config.player.speed*1.25;this.state='playing';});}
    render(){TA.render(this);}
  }
  TA.Engine=Engine;
})();