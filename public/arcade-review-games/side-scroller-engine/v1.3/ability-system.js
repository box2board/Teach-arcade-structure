/* Teach Arcade Side-Scroller Engine v1.3 — reusable player ability layer. */
(()=>{const TA=window.TASideScroller=window.TASideScroller||{};
const DEFAULTS={dash:{enabled:true,doubleTapMs:260,durationMs:180,cooldownMs:340,speedMultiplier:1.9,breakTag:'ram'},stomp:{enabled:true,minFallSpeed:250,breakTag:'stomp'},power:{enabled:true,maxHits:1},gear:{enabled:true},mounts:{enabled:true}};
class AbilitySystem{
constructor(engine,config={}){this.engine=engine;this.config={...DEFAULTS,...config,dash:{...DEFAULTS.dash,...config.dash},stomp:{...DEFAULTS.stomp,...config.stomp},power:{...DEFAULTS.power,...config.power}};this.state={dashTimer:0,dashCooldown:0,dashDir:0,lastTap:{left:-Infinity,right:-Infinity},stomping:false,power:null,gear:null,mount:null,abilities:[],ammo:0,boosts:{speed:0,jump:0}};}
update(dt){const s=this.state;s.dashTimer=Math.max(0,s.dashTimer-dt*1000);s.dashCooldown=Math.max(0,s.dashCooldown-dt*1000);for(const k of Object.keys(s.boosts))s.boosts[k]=Math.max(0,s.boosts[k]-dt);if(!this.engine.player.grounded&&this.config.stomp.enabled&&this.engine.pressed('arrowdown','s'))s.stomping=true;if(this.engine.player.grounded)s.stomping=false;}
registerDirectionTap(dir,now=performance.now()){if(!this.config.dash.enabled||this.state.dashCooldown>0)return false;const key=dir<0?'left':'right',last=this.state.lastTap[key];this.state.lastTap[key]=now;if(now-last<=this.config.dash.doubleTapMs){this.startDash(dir);this.state.lastTap[key]=-Infinity;return true}return false;}
startDash(dir){const s=this.state;s.dashDir=Math.sign(dir)||1;s.dashTimer=this.config.dash.durationMs;s.dashCooldown=this.config.dash.cooldownMs;const p=this.engine.player,c=this.engine.config.player;p.vx=s.dashDir*(c.speed||280)*this.config.dash.speedMultiplier;this.engine.sound?.play('dash');}
isDashing(){return this.state.dashTimer>0;}
canBreak(tag){if(tag==='ram')return this.isDashing();if(tag==='stomp')return this.state.stomping&&this.engine.player.vy>=this.config.stomp.minFallSpeed;return false;}
grantPower(id='guard',hits=this.config.power.maxHits){this.state.power={id,hits};return this.state.power;}
absorbHit(){const p=this.state.power;if(!p||p.hits<=0)return false;p.hits--;if(p.hits<=0)this.state.power=null;return true;}
equipGear(id,abilities=[]){this.state.gear={id,abilities:[...abilities]};return this.state.gear;}
grantAbility(id){if(id&&!this.state.abilities.includes(id))this.state.abilities.push(id);return this.state.abilities;}
hasAbility(id){return this.state.abilities.includes(id)||this.state.gear?.abilities?.includes(id)||this.state.mount?.abilities?.includes(id)||false;}
addAmmo(count=1){this.state.ammo=Math.min(99,this.state.ammo+Math.max(0,Math.floor(count)));return this.state.ammo;}
boost(type,seconds=10){if(type in this.state.boosts)this.state.boosts[type]=Math.max(this.state.boosts[type],seconds);}
mount(id,abilities=[],modifiers={}){this.state.mount={id,abilities:[...abilities],modifiers:{...modifiers}};return this.state.mount;}
dismount(){const old=this.state.mount;this.state.mount=null;return old;}
snapshot(){return JSON.parse(JSON.stringify(this.state));}
}
TA.AbilitySystem=AbilitySystem;TA.ABILITY_DEFAULTS=DEFAULTS;
})();