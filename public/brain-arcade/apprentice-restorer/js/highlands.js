// Stormbreak is a separate region. Its wind supply is shared, never duplicated.
export const highlandsObjects={
  expedition:{id:'expedition',x:1810,y:1000},home:{id:'home',x:170,y:930},sail:{id:'sail',x:300,y:800},
  turbine:{id:'turbine',x:180,y:280},windvane:{id:'windvane',x:350,y:280},router:{id:'router',x:430,y:460},
  goat:{id:'goat',x:900,y:400},perch:{id:'perch',x:1090,y:300},weight:{id:'weight',x:780,y:870},
  lift:{id:'lift',x:1100,y:740},liftback:{id:'liftback',x:1430,y:740},spare:{id:'spare',x:1480,y:930},
  forge:{id:'forge',x:1690,y:460},signal:{id:'signal',x:1740,y:180}
};
const unit=n=>Number.isFinite(n)?Math.max(0,Math.min(1,n)):0;
export function highlandsState(old={}){
  const h=old.highlands||{};
  return {region:old.region==='highlands'&&old.giantAwake===true&&old.giantPower===1?'highlands':'valley',highlands:{
    sail:h.sail===true,turbine:unit(h.turbine),vane:Number.isInteger(h.vane)?Math.max(0,Math.min(3,h.vane)):0,
    routing:Number.isInteger(h.routing)?Math.max(0,Math.min(3,h.routing)):0,bridge:unit(h.bridge),goat:h.goat===true,
    goatWork:unit(h.goatWork),goatOrdered:h.goatOrdered===true,weight:h.weight===true,lift:unit(h.lift),
    spare:h.spare===true,forge:unit(h.forge),signal:Number.isInteger(h.signal)?Math.max(0,Math.min(3,h.signal)):0,
    charge:unit(h.charge),stable:Math.min(12,Number.isFinite(h.stable)?Math.max(0,h.stable):0),
    complete:h.complete===true,engineer:h.engineer===true,time:0,travel:null}};
}
export function highlandsReadings(s){
  const h=s.highlands;
  const wind=h.engineer?.85+.15*Math.sin(h.time*.75):1;
  const supply=h.turbine===1&&h.vane===1?Math.min(1.1,wind+(h.goatWork===1?.18:0)):0;
  const shares=[[1,0,0],[0,1,0],[0,0,1],[0,.55,.45]][h.routing];
  const [bridge,lift,forge]=shares.map(n=>n*supply);
  return {supply,bridge,lift,forge,healthy:lift>=.45&&lift<=.75&&forge>=.32&&forge<=.65};
}
export function highlandsCanStand(x,y,s){
  if(x<30||x>1890||y<50||y>1050)return false;
  const h=s.highlands;
  if(x>520&&x<700)return h.bridge===1&&y>=450&&y<=530;
  if(x>1180&&x<1360)return h.goatWork===1&&y>=285&&y<=365;
  return true;
}
export function highlandsInteractables(s){
  if(s.mode==='engineer')return [];
  if(s.region!=='highlands')return s.giantAwake?[highlandsObjects.expedition]:[];
  const h=s.highlands;if(h.travel)return [];
  return Object.values(highlandsObjects).filter(o=>o.id!=='expedition'&&!(o.id==='sail'&&h.sail)&&!(o.id==='goat'&&h.goat)&&!(o.id==='weight'&&h.weight)&&!(o.id==='spare'&&h.spare));
}
export function actHighlands(s,id,reverse=false){
  if(id==='expedition'&&s.giantAwake){s.region='highlands';s.player={x:170,y:930};return 'Stormbreak Highlands! Follow the wind cables to the broken turbine.';}
  if(s.region!=='highlands'||s.highlands.travel)return null;
  const h=s.highlands,r=highlandsReadings(s);
  if(id==='home'){s.region='valley';s.player={x:1810,y:1000};return 'The giant brings you home. Your highland repairs are saved.';}
  if(id==='sail'){h.sail=true;return 'Sailcloth recovered. Hold E at the turbine to mend its blades.';}
  if(id==='turbine')return h.turbine===1?'Turbine repaired. Turn the wind vane to catch the easterly wind.':h.sail?'Hold E to mend the turbine blades.':'Find sailcloth along the southern trail.';
  if(id==='windvane'){h.vane=(h.vane+1)%4;return h.vane===1?'Wind caught! The turbine is sending power down its cable.':'Vane turned. Face it toward the wind →.';}
  if(id==='router'){h.routing=(h.routing+(reverse?3:1))%4;return ['All power to the bridge winch.','All power to the cable lift.','All power to the summit workshop.','Power shared: 55% lift · 45% workshop.'][h.routing];}
  if(id==='goat'){h.goat=true;return 'A mountain goat joins you! It can reach the high wind brake.';}
  if(id==='perch'){if(!h.goat)return 'This brake is too high. Meet the goat on the middle plateau.';if(h.goatWork===1)return 'Brake released. A shortcut and an extra wind intake are open.';h.goatOrdered=true;return 'Your goat climbs to release the wind brake. Watch the northern crossing.';}
  if(id==='weight'){h.weight=true;return 'Counterweight found! Fit it at the cable lift by holding E.';}
  if(id==='lift'||id==='liftback'){
    if(h.lift<1)return h.weight?'Hold E at the western lift station to fit its counterweight.':'The lift needs its counterweight. Search the middle plateau.';
    if(r.lift<.45)return 'The lift needs wind power. Route power to it at the western junction.';
    h.travel={elapsed:0,from:{x:id==='lift'?1100:1430,y:740},to:{x:id==='lift'?1430:1100,y:740}};
    return 'Cable lift moving. Your workshop travels with you.';
  }
  if(id==='spare'){h.spare=true;return 'Workshop gear recovered. Fit it at the summit workshop.';}
  if(id==='forge')return h.forge===1?'Workshop connected. Share wind with the lift, then align the summit signal.':h.spare?'Hold E to repair the summit workshop.':'Find the spare gear on the southern summit trail.';
  if(id==='signal'){h.signal=(h.signal+1)%4;return h.signal===2?'Signal aligned. Keep the lift and workshop powered together.':'Signal turned. Align its dish with the distant valley receiver ↓.';}
  return null;
}
export function workHighlands(s,id,dt){
  if(s.region!=='highlands'||s.highlands.travel)return null;
  const h=s.highlands;
  const name=id==='turbine'&&h.sail?'turbine':id==='lift'&&h.weight?'lift':id==='forge'&&h.spare?'forge':null;
  if(name&&h[name]<1){h[name]=Math.min(1,h[name]+dt*.5);if(h[name]===1)return name==='turbine'?'Turbine mended! Turn its vane to catch the wind.':name==='lift'?'Counterweight fitted! Route wind to the lift, then tap E to ride.':'Summit workshop repaired! Restore its shared power and signal.';}
  return null;
}
export function stepHighlands(s,dt){
  const h=s.highlands,events=[];h.time+=dt;
  if(h.travel){const t=h.travel;t.elapsed=Math.min(3,t.elapsed+dt);const f=t.elapsed/3;s.player={x:t.from.x+(t.to.x-t.from.x)*f,y:740};if(t.elapsed>=3-1e-9){s.player={...t.to};h.travel=null;events.push('highland-arrival');}return events;}
  const r=highlandsReadings(s);
  if(h.bridge<1&&r.bridge>.45){h.bridge=Math.min(1,h.bridge+dt*r.bridge/6);if(h.bridge===1)events.push('highland-bridge');}
  if(h.goatOrdered&&h.goatWork<1){h.goatWork=Math.min(1,h.goatWork+dt/4);if(h.goatWork===1)events.push('highland-goat');}
  if(h.forge===1&&r.forge>.15&&h.charge<1){h.charge=Math.min(1,h.charge+dt*r.forge/5);if(h.charge===1)events.push('highland-charge');}
  if(!h.complete){const ready=h.charge===1&&h.forge===1&&h.lift===1&&h.signal===2&&r.healthy;h.stable=ready?Math.min(12,h.stable+dt):0;if(h.stable>=12){h.complete=true;events.push('highland-complete');}}
  return events;
}
export function highlandsObjective(s){
  const h=s.highlands;
  if(h.complete)return 'Stormbreak restored · Explore the highlands or ride home.';
  if(!h.sail)return 'Recover sailcloth on the southern trail.';
  if(h.turbine<1)return 'Hold E at the western turbine to mend its blades.';
  if(h.vane!==1)return 'Turn the wind vane toward the wind →.';
  if(h.bridge<1)return 'Send wind to the bridge winch. Watch the crossing lower.';
  if(!h.goat)return 'Cross to the middle plateau and meet its mountain goat.';
  if(!h.weight)return 'Recover the lift counterweight on the middle plateau’s south trail.';
  if(h.lift<1)return 'Fit the counterweight at the cable lift. Hold E.';
  if(h.goatWork<1)return h.goatOrdered?'The goat is climbing. Prepare the cable lift while it works.':'Ask the goat to reach the high brake on the north ledge.';
  if(!h.spare)return 'Ride the lift or cross the north shortcut. Find the summit gear.';
  if(h.forge<1)return 'Hold E to repair the summit workshop.';
  if(h.routing!==3)return 'Share power between lift and workshop at the western junction.';
  if(h.signal!==2)return 'Align the summit dish with the valley receiver ↓.';
  if(h.charge<1)return 'The workshop is charging from its share of wind power.';
  return `Keep both machines healthy · ${h.stable.toFixed(1)} / 12 seconds.`;
}
export function highlandsLabel(s,id){
  const h=s.highlands;
  const labels={expedition:['Travel to Stormbreak','Tap E to ride the giant to a new region.'],home:['Return to valley','Tap E to ride home. Progress is saved.'],sail:['Recover sailcloth','Tap E to collect.'],turbine:[h.turbine===1?'Turbine repaired':'Mend turbine','Hold E with recovered sailcloth.'],windvane:['Turn wind vane','Tap E to face the easterly wind →.'],router:['Route wind','Tap E to cycle power routes · Q cycles back.'],goat:['Meet goat','Tap E to recruit a climbing companion.'],perch:[h.goatWork===1?'Wind brake released':'Send goat','Tap E to send your goat to the high brake.'],weight:['Recover counterweight','Tap E to collect.'],lift:[h.lift===1?'Ride cable lift':'Fit counterweight',h.lift===1?'Tap E when wind powers the lift.':'Hold E to repair.'],liftback:['Ride back','Tap E when wind powers the lift.'],spare:['Recover workshop gear','Tap E to collect.'],forge:[h.forge===1?'Workshop repaired':'Repair workshop','Hold E with the spare gear.'],signal:['Align summit dish','Tap E to aim at the valley receiver ↓.']};
  return labels[id];
}
export function drawHighlands(ctx,s,time,{path,glow}){
  const h=s.highlands,r=highlandsReadings(s);
  const rect=(x,y,w,z,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,z);};
  rect(0,0,1920,1080,'#203c59');
  for(let n=0;n<20;n++){const x=(n*187+time*.009)%2100-90,y=90+(n*83)%870;ctx.fillStyle='#bdcddd18';ctx.beginPath();ctx.ellipse(x,y,90,24,0,0,Math.PI*2);ctx.fill();}
  for(const [x,w] of [[30,490],[700,480],[1360,530]]){rect(x+12,70,w,990,'#132a43');rect(x,50,w,980,'#697d86');rect(x,50,w,18,'#abc2bd');for(let n=0;n<24;n++){const px=x+24+(n*91)%(w-40),py=90+(n*137)%900;path([[px,py],[px+16,py+5],[px+22,py+21]],'#425f70',3);}}
  path([[170,930],[170,650],[300,490],[430,490]],'#b4bba0',36);path([[730,490],[900,490],[1090,300]],'#b4bba0',32);path([[900,490],[900,740],[1100,740]],'#b4bba0',32);path([[1430,740],[1500,740],[1690,460],[1740,180]],'#b4bba0',32);path([[1500,740],[1480,930]],'#b4bba0',32);
  path([[520,450],[520+180*h.bridge,450]],'#d4b581',6);path([[520,530],[520+180*h.bridge,530]],'#d4b581',6);rect(520,457,180*h.bridge,65,'#a88c63');for(let x=528;x<520+180*h.bridge;x+=15)path([[x,459],[x,521]],'#6d624f',3);
  if(h.goatWork>0){rect(1180,300,180*h.goatWork,50,'#cad1b6');path([[1180,295],[1180+180*h.goatWork,295]],'#f2da9f',4);}
  path([[1100,718],[1430,718]],r.lift>=.45?'#f3c474':'#667a88',5);
  const fx=h.travel?s.player.x:1100+330*(.5+.5*Math.sin(time/1800));rect(fx-34,727,68,27,'#cfb482');rect(fx-28,737,56,5,'#6d6552');
  // Connected cables make the split visible in the landscape.
  path([[180,280],[350,280],[430,460]],r.supply?'#ffe2a0':'#2e4f65',7);
  for(const [points,power] of [[[[430,460],[520,460]],r.bridge],[[[430,460],[430,620],[940,620],[1100,740]],r.lift],[[[430,460],[430,100],[1600,100],[1690,460]],r.forge]]){path(points,power>0?'#d1bd82':'#3b556b',5);if(power>0){const a=points[0],b=points[1],f=(time*.00025*power)%1;ctx.fillStyle='#ffedb0';ctx.beginPath();ctx.arc(a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,5,0,Math.PI*2);ctx.fill();}}
  rect(156,280,48,90,'#40556b');ctx.save();ctx.translate(180,280);ctx.rotate(h.turbine===1&&r.supply?time*.002*r.supply:0);for(let n=0;n<4;n++){ctx.rotate(Math.PI/2);path([[0,0],[0,-65]],'#d4b984',7);rect(4,-65,24,45,h.turbine===1?'#e9dcc1':'#8b9698');}ctx.restore();
  const directions=['↑','→','↓','←'];ctx.textAlign='center';ctx.font='bold 22px system-ui';ctx.fillStyle='#ffe4b0';ctx.fillText(directions[h.vane],350,289);
  rect(405,435,50,50,'#1d3d53');ctx.font='bold 13px system-ui';ctx.fillStyle='#ffe4b0';ctx.fillText(['BRIDGE','LIFT','WORKSHOP','SHARED'][h.routing],430,418);
  for(const id of ['sail','weight','spare'])if(!h[id]){const p=highlandsObjects[id];rect(p.x-18,p.y-16,36,32,id==='sail'?'#e4d6b2':id==='weight'?'#374d5a':'#d6af65');glow(p.x,p.y,false,time);}
  for(const x of [1100,1430]){rect(x-20,695,40,64,'#354f63');path([[x-25,705],[x+25,705]],'#e0ba79',6);}
  rect(1620,390,140,120,'#334c5c');path([[1605,394],[1690,350],[1775,394]],'#aac0ba',12);rect(1670,431,40,55,h.complete?'#ffdf83':h.charge>0?'#ca9461':'#192f42');
  ctx.save();ctx.translate(1740,180);ctx.rotate(h.signal*Math.PI/2);path([[-25,-15],[0,10],[25,-15]],'#d2e0de',7);path([[0,10],[0,35]],'#bca476',6);ctx.restore();
  if(h.complete)for(let n=0;n<4;n++){ctx.strokeStyle='#fee3a066';ctx.lineWidth=3;ctx.beginPath();ctx.arc(1740,180,40+(time*.04+n*25)%120,Math.PI*.1,Math.PI*.9);ctx.stroke();}
  const gp=h.goatOrdered?{x:1090,y:370-h.goatWork*70}:{x:h.goat?s.player.x+30:900,y:h.goat?s.player.y+20:400};
  ctx.fillStyle='#ecdfc0';ctx.beginPath();ctx.ellipse(gp.x,gp.y,20,12,0,0,Math.PI*2);ctx.fill();rect(gp.x-14,gp.y+8,5,15,'#d7c59f');rect(gp.x+9,gp.y+8,5,15,'#d7c59f');rect(gp.x+12,gp.y-18,16,18,'#ecdfc0');path([[gp.x+17,gp.y-18],[gp.x+10,gp.y-30]],'#9ea9a2',4);rect(gp.x+24,gp.y-13,3,3,'#1b3b4d');
  for(const [id,value] of [['turbine',h.turbine],['lift',h.lift],['forge',h.forge]]){const p=highlandsObjects[id];if(value>0&&value<1){rect(p.x-30,p.y+43,60,6,'#243e52');rect(p.x-30,p.y+43,60*value,6,'#ffdd95');}}
  for(const o of highlandsInteractables(s))glow(o.x,o.y,false,time);
  ctx.fillStyle='#e8eee3';ctx.font='bold 19px system-ui';ctx.fillText('STORMBREAK HIGHLANDS',970,80);
  ctx.font='bold 14px system-ui';ctx.fillText('WESTERN TURBINE',180,170);ctx.fillText('HIGH WIND BRAKE',1090,250);ctx.fillText('SUMMIT WORKSHOP',1690,550);
  if(h.travel){ctx.fillStyle='#ffdea1';ctx.fillText('CABLE LIFT',s.player.x,690);}
}
