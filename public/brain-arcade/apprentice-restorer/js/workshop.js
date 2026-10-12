export const workshopObjects={cart:{id:'cart',x:1030,y:670},cartwheel:{id:'cartwheel',x:220,y:930},beaver:{id:'beaver',x:620,y:980},scaffold:{id:'scaffold',x:1430,y:960},drivegear:{id:'drivegear',x:1320,y:170},chime:{id:'chime',x:1820,y:520},giantdrive:{id:'giantdrive',x:1530,y:890},giantsignal:{id:'giantsignal',x:1680,y:890},ride:{id:'ride',x:1590,y:990},ridehome:{id:'ridehome',x:640,y:945}};
const unit=n=>Number.isFinite(n)?Math.max(0,Math.min(1,n)):0;
const point=(p,fallback)=>Number.isFinite(p?.x)&&Number.isFinite(p?.y)&&p.x>=30&&p.x<=1890&&p.y>=50&&p.y<=1050?{x:p.x,y:p.y}:{...fallback};
export function workshopState(old={}){
  return {cartWheel:old.cartWheel===true,cartRepair:unit(old.cartRepair),cartPosition:point(old.cartPosition,workshopObjects.cart),
    cartTrail:Array.isArray(old.cartTrail)?old.cartTrail.slice(-120).map(p=>point(p,workshopObjects.cart)):[],
    beaverFriend:old.beaverFriend===true,beaverPosition:point(old.beaverPosition,workshopObjects.beaver),scaffoldOrdered:old.scaffoldOrdered===true,scaffoldProgress:unit(old.scaffoldProgress),
    driveCargo:old.driveCargo===true,chimeCargo:old.chimeCargo===true,driveInstalled:old.driveInstalled===true,chimeInstalled:old.chimeInstalled===true,
    driveRatio:Number.isInteger(old.driveRatio)?Math.max(0,Math.min(2,old.driveRatio)):0,giantPower:unit(old.giantPower),giantHeat:unit(old.giantHeat),giantAwake:old.giantAwake===true&&old.giantPower===1,signalFlash:0,giantPosition:point(old.giantPosition,{x:1600,y:945}),giantRide:null};
}
export function workshopInteractables(s){
  if(s.mode==='engineer'||s.giantRide)return [];
  return [...(s.cartRepair<1?[{...workshopObjects.cart,...s.cartPosition}]:[]),...(!s.cartWheel?[workshopObjects.cartwheel]:[]),...(s.pond===1&&!s.beaverFriend?[workshopObjects.beaver]:[]),workshopObjects.scaffold,
    ...(!s.driveCargo&&!s.driveInstalled?[workshopObjects.drivegear]:[]),...(!s.chimeCargo&&!s.chimeInstalled?[workshopObjects.chime]:[]),workshopObjects.giantdrive,workshopObjects.giantsignal,...(s.giantAwake?[workshopObjects.ride,workshopObjects.ridehome]:[])];
}
export function actWorkshop(s,id){
  if(s.giantRide)return null;
  if(id==='cartwheel'){s.cartWheel=true;return 'Wheel recovered! Carry it to the broken workshop cart on the east trail.';}
  if(id==='beaver'){if(s.beaverFriend)return 'Your beaver friend is ready to build.';s.beaverFriend=true;return 'A beaver joins you! It can build the giant’s wooden scaffold.';}
  if(id==='scaffold'){if(s.scaffoldProgress===1)return 'Scaffold ready. Bring the workshop to the giant’s repair panels.';if(s.scaffoldOrdered)return 'Your beaver is on the job. Gather the gear and chime while it builds.';if(!s.beaverFriend)return 'A builder is needed here. Restore the pond and meet its beaver.';s.scaffoldOrdered=true;return 'Your beaver is building a scaffold. You can gather parts while it works.';}
  if(['drivegear','chime'].includes(id)){
    if(s.cartRepair<1||Math.hypot(s.cartPosition.x-s.player.x,s.cartPosition.y-s.player.y)>115)return 'This part is too heavy to carry. Bring your repaired workshop cart.';
    s[id==='drivegear'?'driveCargo':'chimeCargo']=true;return id==='drivegear'?'Drive gear loaded into the workshop.':'Signal chime loaded into the workshop.';
  }
  if(id==='giantdrive'||id==='giantsignal'){
    if(s.scaffoldProgress<1)return 'The giant’s repair panels are out of reach. Ask the beaver to build a scaffold.';
    if(s.cartRepair<1||Math.hypot(s.cartPosition.x-s.player.x,s.cartPosition.y-s.player.y)>115)return 'Bring the workshop cart beside the giant to unload a part.';
    if(id==='giantdrive'){
      if(!s.driveInstalled){if(!s.driveCargo)return 'The drive socket is empty. Search the north ridge for a gear.';s.driveInstalled=true;s.driveCargo=false;return 'Drive gear installed! Tap E to change its gearing. Watch power and heat.';}
      s.driveRatio=(s.driveRatio+1)%3;return ['Fast gearing: quick charge, rising heat.','Steady gearing: moderate charge, gentle cooling.','Slow gearing: gradual charge, strong cooling.'][s.driveRatio];
    }
    if(!s.chimeInstalled){if(!s.chimeCargo)return 'The signal mount is empty. Search the eastern trail for its chime.';s.chimeInstalled=true;s.chimeCargo=false;return 'Chime installed. Ring it when the giant has enough power.';}
    s.signalFlash=1;if(s.giantPower<1)return 'The chime rings, but the giant needs more power.';
    if(!s.giantAwake){s.giantAwake=true;return 'The giant awakens! Its back can carry you between the ridge and meadow.';}
    return 'The giant answers your chime.';
  }
  if(['ride','ridehome'].includes(id)&&s.giantAwake){const destination={x:id==='ride'?640:1590,y:945};const ridge=[{x:1590,y:945},{x:900,y:876},{x:680,y:876},{x:640,y:945}];s.giantRide={elapsed:0,duration:5,destination,points:id==='ride'?ridge:[...ridge].reverse()};s.cartTrail=[];return 'All aboard! The giant carries your workshop across the valley.';}
  if(id==='cart')return s.cartRepair===1?'Your workshop follows you and carries heavy parts.':s.cartWheel?'Hold E to fit the recovered wheel.':'The workshop needs a wheel. Explore the southern meadow.';
  return null;
}
export function workWorkshop(s,id,dt){
  if(id==='cart'&&s.cartWheel&&s.cartRepair<1){s.cartRepair=Math.min(1,s.cartRepair+dt*.5);if(s.cartRepair===1)return 'Workshop repaired! Bring it along to collect heavy machinery.';}
  return null;
}
export function stepWorkshop(s,dt,canStand){
  const events=[];s.signalFlash=Math.max(0,s.signalFlash-dt);
  if(s.giantRide){
    const ride=s.giantRide;ride.elapsed=Math.min(ride.duration,ride.elapsed+dt);
    const lengths=ride.points.slice(1).map((p,i)=>Math.hypot(p.x-ride.points[i].x,p.y-ride.points[i].y));
    let distance=lengths.reduce((a,b)=>a+b,0)*ride.elapsed/ride.duration;
    for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1){const a=ride.points[i],b=ride.points[i+1],f=Math.min(1,distance/lengths[i]);s.player={x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f};break;}distance-=lengths[i];}
    s.giantPosition={...s.player};
    s.cartPosition={x:s.player.x-30,y:s.player.y+12};s.beaverPosition={x:s.player.x+35,y:s.player.y+12};
    if(ride.elapsed>=ride.duration-1e-9){s.player={...ride.destination};s.giantPosition={...ride.destination};s.cartPosition={x:s.player.x-30,y:s.player.y};s.beaverPosition={x:s.player.x+35,y:s.player.y};s.giantRide=null;events.push('ride-arrived');}
    return events;
  }
  if(s.cartRepair===1){
    const last=s.cartTrail.at(-1)||s.cartPosition;
    if(Math.hypot(last.x-s.player.x,last.y-s.player.y)>18)s.cartTrail.push({...s.player});
    s.cartTrail=s.cartTrail.slice(-120);
    const target=s.cartTrail[0];
    if(target&&(s.cartTrail.length>3||Math.hypot(s.cartPosition.x-s.player.x,s.cartPosition.y-s.player.y)>65)){
      const d=Math.hypot(target.x-s.cartPosition.x,target.y-s.cartPosition.y);
      if(d<4)s.cartTrail.shift();else{const step=Math.min(d,dt*205),p={x:s.cartPosition.x+(target.x-s.cartPosition.x)/d*step,y:s.cartPosition.y+(target.y-s.cartPosition.y)/d*step};if(canStand(p.x,p.y,s))s.cartPosition=p;}
    }
  }
  if(s.beaverFriend){
    const target=s.scaffoldOrdered&&s.scaffoldProgress<1?workshopObjects.scaffold:{x:s.player.x+30,y:s.player.y+25};
    const d=Math.hypot(target.x-s.beaverPosition.x,target.y-s.beaverPosition.y);
    if(d>12){const f=Math.min(1,dt*210/d);s.beaverPosition.x+=(target.x-s.beaverPosition.x)*f;s.beaverPosition.y+=(target.y-s.beaverPosition.y)*f;}
    if(s.scaffoldOrdered&&s.scaffoldProgress<1&&d<40){s.scaffoldProgress=Math.min(1,s.scaffoldProgress+dt/4);if(s.scaffoldProgress===1)events.push('scaffold');}
  }
  if(s.driveInstalled&&s.chimeInstalled&&s.beacon===1&&!s.giantAwake){
    const previousHeat=s.giantHeat,previousPower=s.giantPower;
    s.giantHeat=Math.max(0,Math.min(1,s.giantHeat+dt*[.13,-.035,-.2][s.driveRatio]));
    if(s.giantHeat<.7)s.giantPower=Math.min(1,s.giantPower+dt*[.18,.1,.04][s.driveRatio]);
    else s.giantPower=Math.max(0,s.giantPower-dt*.08);
    if(previousHeat<.7&&s.giantHeat>=.7)events.push('giant-hot');
    if(previousPower<1&&s.giantPower===1)events.push('giant-ready');
  }
  return events;
}
export function workshopObjective(s){
  if(!s.cartWheel)return 'Explore the south meadow for a wheel. Restore the traveling workshop.';
  if(s.cartRepair<1)return 'Bring the recovered wheel to the workshop on the east trail.';
  if(!s.beaverFriend)return 'Meet the beaver at the restored pond.';
  if(!s.scaffoldOrdered)return 'Ask your beaver to build beside the sleeping giant on the southeast ridge.';
  if(!s.driveCargo&&!s.driveInstalled)return 'Tow the workshop north. Find a drive gear on the ridge.';
  if(!s.chimeCargo&&!s.chimeInstalled)return 'Bring the workshop along the east trail. Find the signal chime.';
  if(s.scaffoldProgress<1)return 'The beaver is building the scaffold. Explore while it works.';
  if(!s.driveInstalled||!s.chimeInstalled)return 'Unload the workshop at the giant’s two repair panels.';
  if(s.giantHeat>=.7)return 'The giant’s drive is overheating. Try a different gear ratio.';
  if(s.giantPower<1)return 'Charge the giant from the sun beacon. Balance speed and heat.';
  return 'Power restored! Ring the giant’s chime to wake it.';
}
export function drawWorkshop(ctx,s,time,{path,glow}){
  if(s.mode==='engineer')return;
  const wheel=(x,y,r)=>{ctx.strokeStyle='#d7ba79';ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();path([[x-r,y],[x+r,y]],'#81684a',3);path([[x,y-r],[x,y+r]],'#81684a',3);};
  if(!s.cartWheel){wheel(220,930,17);glow(220,930,false,time);}
  const c=s.cartPosition;ctx.fillStyle='#203b3466';ctx.fillRect(c.x-29,c.y+13,62,13);ctx.fillStyle='#b8804b';ctx.fillRect(c.x-28,c.y-22,56,39);ctx.fillStyle='#d9be80';ctx.fillRect(c.x-32,c.y-28,64,8);wheel(c.x-24,c.y+17,10);if(s.cartRepair===1)wheel(c.x+24,c.y+17,10);else path([[c.x+17,c.y+14],[c.x+32,c.y+25]],'#70573b',5);
  ctx.fillStyle='#284a49';ctx.fillRect(c.x-18,c.y-18,19,22);ctx.fillStyle='#e1c88e';ctx.fillRect(c.x-14,c.y-24,5,23);ctx.fillRect(c.x-20,c.y-25,16,7);
  if(s.driveCargo)wheel(c.x+13,c.y-6,10);if(s.chimeCargo){ctx.fillStyle='#e7c784';ctx.beginPath();ctx.arc(c.x+8,c.y-17,8,Math.PI,0);ctx.fill();}
  if(s.cartWheel&&s.cartRepair<1){ctx.fillStyle='#183e40';ctx.fillRect(c.x-28,c.y+33,56,6);ctx.fillStyle='#9cd8ba';ctx.fillRect(c.x-28,c.y+33,56*s.cartRepair,6);}
  ctx.font='bold 14px system-ui';ctx.textAlign='center';ctx.fillStyle='#e7edda';ctx.fillText(s.cartRepair===1?'WORKSHOP':'BROKEN WORKSHOP',c.x,c.y-44);
  const b=s.beaverFriend?s.beaverPosition:workshopObjects.beaver;
  if(s.pond===1||s.beaverFriend){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(s.scaffoldOrdered&&s.scaffoldProgress<1?Math.sin(time/100)*.08:0);ctx.fillStyle='#624730';ctx.beginPath();ctx.ellipse(-17,8,15,7,.3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#b28252';ctx.beginPath();ctx.ellipse(0,0,17,12,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d4a775';ctx.beginPath();ctx.arc(13,-7,10,0,Math.PI*2);ctx.fill();ctx.fillStyle='#172e31';ctx.fillRect(16,-12,3,3);ctx.fillStyle='#f1e5c5';ctx.fillRect(19,-1,5,5);ctx.restore();}
  for(const [id,p] of [['drivegear',workshopObjects.drivegear],['chime',workshopObjects.chime]])if(id==='drivegear'?!s.driveCargo&&!s.driveInstalled:!s.chimeCargo&&!s.chimeInstalled){if(id==='drivegear'){wheel(p.x,p.y,22);for(let n=0;n<8;n++){const a=n*Math.PI/4;path([[p.x+Math.cos(a)*23,p.y+Math.sin(a)*23],[p.x+Math.cos(a)*30,p.y+Math.sin(a)*30]],'#e5c582',7);}}else{ctx.fillStyle='#e1b875';ctx.beginPath();ctx.arc(p.x,p.y,18,Math.PI,0);ctx.lineTo(p.x+24,p.y+14);ctx.lineTo(p.x-24,p.y+14);ctx.closePath();ctx.fill();}glow(p.x,p.y,false,time);}
  if(s.scaffoldOrdered&&s.scaffoldProgress<1){ctx.fillStyle='#183e40';ctx.fillRect(1400,1020,70,7);ctx.fillStyle='#e4bd74';ctx.fillRect(1400,1020,70*s.scaffoldProgress,7);ctx.fillStyle='#e7edda';ctx.font='bold 12px system-ui';ctx.fillText(s.scaffoldProgress>0?'BUILDING…':'BUILDER ON THE WAY',1435,1044);}
  ctx.save();if(s.giantAwake)ctx.translate(s.giantPosition.x-1600,s.giantPosition.y-945+(s.giantRide?Math.sin(time/110)*3:Math.sin(time/700)*2));
  // A giant tortoise machine: plates, legs, head and eyes wake in stages.
  const lift=s.giantAwake?12:s.giantPower*6;
  ctx.fillStyle='#203f3b77';ctx.beginPath();ctx.ellipse(1600,1004,140,25,0,0,Math.PI*2);ctx.fill();
  for(const x of [1490,1690])for(const y of [927,989]){ctx.fillStyle='#415c57';ctx.fillRect(x,y-lift,42,37+lift);ctx.fillStyle='#a4ac88';ctx.fillRect(x-3,y+22,48,16);}
  ctx.fillStyle='#4f7364';ctx.beginPath();ctx.ellipse(1600,922-lift,125,78,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#a7ba8b';ctx.lineWidth=5;ctx.stroke();
  for(let n=0;n<5;n++){const x=1520+n*40;path([[x,868-lift],[x-12,920-lift],[x+6,965-lift]],'#8ca783',3);}
  ctx.fillStyle='#7f9881';ctx.beginPath();ctx.ellipse(1760,926-lift,48,31,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=s.giantAwake?'#ffe6a0':s.giantPower>.3?'#99d4b5':'#354d45';ctx.beginPath();ctx.arc(1774,915-lift,s.giantAwake?7:4,0,Math.PI*2);ctx.fill();
  ctx.restore();
  if(s.scaffoldProgress>0){for(let n=0;n<Math.ceil(s.scaffoldProgress*6);n++)path([[1410,1000-n*16],[1470,1000-n*16]],'#bd985f',7);path([[1414,1005],[1414,910]],'#dbbc7f',5);path([[1466,1005],[1466,910]],'#dbbc7f',5);}
  for(const p of [workshopObjects.giantdrive,workshopObjects.giantsignal]){ctx.fillStyle='#254444';ctx.fillRect(p.x-24,p.y-23,48,45);glow(p.x,p.y,false,time);}
  if(s.driveInstalled){wheel(1530,890,15);ctx.fillStyle='#e7edda';ctx.font='bold 12px system-ui';ctx.fillText(['FAST','STEADY','SLOW'][s.driveRatio],1530,934);}
  if(s.chimeInstalled){ctx.fillStyle='#e2c485';ctx.beginPath();ctx.arc(1680,883,15,Math.PI,0);ctx.lineTo(1699,903);ctx.lineTo(1661,903);ctx.closePath();ctx.fill();}
  path([[1750,708],[1750,760],[1530,760],[1530,860]],s.beacon===1?'#d8bd77':'#526960',5);
  ctx.fillStyle='#183e40';ctx.fillRect(1515,817,100,8);ctx.fillStyle='#9cd8ba';ctx.fillRect(1515,817,100*s.giantPower,8);ctx.fillStyle='#183e40';ctx.fillRect(1515,830,100,6);ctx.fillStyle=s.giantHeat>=.7?'#f18a6a':'#e4bd74';ctx.fillRect(1515,830,100*s.giantHeat,6);
  ctx.fillStyle='#e7edda';ctx.font='bold 15px system-ui';ctx.fillText(s.giantAwake?'THE GIANT IS AWAKE':'THE SLEEPING GIANT',1600,790);
  if(s.signalFlash>0){ctx.strokeStyle='#ffe0a0';ctx.lineWidth=3;ctx.beginPath();ctx.arc(1680,890,30+(1-s.signalFlash)*55,0,Math.PI*2);ctx.stroke();}
  if(s.giantAwake&&!s.giantRide){glow(1590,990,true,time);ctx.fillStyle='#ffe4a3';ctx.fillText('E · RIDE TO MEADOW',1590,1030);glow(640,945,true,time);ctx.fillText('E · CALL GIANT',640,905);}
}
