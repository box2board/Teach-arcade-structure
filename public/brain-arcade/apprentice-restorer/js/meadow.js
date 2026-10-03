export const meadowObjects={diverter:{id:'diverter',x:350,y:635},log:{id:'log',x:350,y:760},sluice:{id:'sluice',x:500,y:825}};
const unit=n=>Number.isFinite(n)?Math.max(0,Math.min(1,n)):0;
export function meadowState(old={}){
  return {diverter:Number.isInteger(old.diverter)?Math.max(0,Math.min(3,old.diverter)):0,
    logX:Number.isFinite(old.logX)?Math.max(350,Math.min(470,old.logX)):350,
    sluice:unit(old.sluice),pond:unit(old.pond),diverted:old.diverted===true,streamCleared:old.streamCleared===true};
}
export function meadowInteractables(s){return [meadowObjects.diverter,{...meadowObjects.log,x:s.logX},meadowObjects.sluice];}
export function meadowSupply(s){return s.pump===1&&s.vane===1&&s.elbow===3&&Math.abs(s.troughY-330)<4&&(s.mode==='engineer'?s.valve>0:s.valve>=.3&&s.valve<=.65);}
export function workMeadow(s,id,dt){
  if(id==='log'&&s.logX<470){
    if(s.player.x>s.logX-20||Math.abs(s.player.y-760)>55)return 'Stand on the left of the log. Hold E to push right.';
    const step=Math.min(65*dt,470-s.logX);s.logX+=step;s.player.x+=step;
  }
  if(id==='sluice'&&s.sluice<1)s.sluice=Math.min(1,s.sluice+dt*.5);
  return null;
}
export function stepMeadow(s,dt){
  const events=[];
  if(meadowSupply(s)&&s.diverter===2&&!s.diverted){s.diverted=true;events.push('diversion');}
  if(s.diverted&&s.logX>=450&&!s.streamCleared){s.streamCleared=true;events.push('stream');}
  if(meadowSupply(s)&&s.diverter===2&&s.logX>=450&&s.sluice===1&&s.pond<1){
    s.pond=Math.min(1,s.pond+dt/8);if(s.pond===1)events.push('pond');
  }
  return events;
}
export function meadowObjective(s){
  if(!meadowSupply(s))return 'The meadow needs the pump and balanced water flow.';
  if(s.diverter!==2)return 'Follow the south trail. Turn the meadow channel toward the stream.';
  if(s.logX<450)return 'Stand left of the fallen log. Hold E to clear the stream.';
  if(s.sluice<1)return 'Open the pond sluice. Hold E to lift its gate.';
  return 'The pond is filling. Watch the water return.';
}
export function drawMeadow(ctx,s,time,{path,water,glow}){
  path([[650,330],[650,610],[350,610],[350,760],[350,825],[500,825]],'#888866',18);
  const supply=meadowSupply(s);
  if(supply){water([[650,330],[650,610],[350,610],[350,635]],time*s.valve);if(s.diverter===2){water([[350,635],[350,s.logX<450?739:825]],time*s.valve);if(s.logX>=450)water([[350,825],[500,825]],time*s.valve);}else water([[350,635],[s.diverter===1?395:305,635]],time*s.valve);}
  // A dry basin becomes a living pond, rather than a percentage-only reward.
  ctx.fillStyle='#93805b';ctx.beginPath();ctx.ellipse(520,940,115,76,0,0,Math.PI*2);ctx.fill();
  if(s.pond>0){ctx.fillStyle='#48a4b1';ctx.beginPath();ctx.ellipse(520,940,110*s.pond,70*s.pond,0,0,Math.PI*2);ctx.fill();}
  if((s.mode==='engineer'?s.sluice>0:s.sluice===1)&&s.logX>=450&&supply&&s.diverter===2)water([[500,825],[500,880]],time*s.valve);
  ctx.fillStyle='#d3bc86';ctx.beginPath();ctx.arc(350,635,25,0,Math.PI*2);ctx.fill();
  const end=[[350,610],[380,635],[350,660],[320,635]][s.diverter];path([[320,635],[350,635],end],'#405f56',10);
  ctx.fillStyle='#91633e';ctx.fillRect(s.logX-18,715,36,90);ctx.strokeStyle='#c29d65';ctx.lineWidth=3;ctx.strokeRect(s.logX-18,715,36,90);path([[s.logX-5,720],[s.logX-5,800]],'#634b36',3);
  ctx.fillStyle='#41564c';ctx.fillRect(477,812,46,27);ctx.fillStyle='#d9c68e';ctx.fillRect(483,813-s.sluice*25,34,23);path([[500,808],[500,784]],'#deb77c',4);
  for(const o of meadowInteractables(s)){glow(o.x,o.y,false,time);ctx.fillStyle='#e7edda';ctx.font='bold 14px system-ui';ctx.textAlign='center';ctx.fillText({diverter:'MEADOW CHANNEL',log:s.logX>=450?'STREAM CLEARED':'PUSH →',sluice:s.sluice===1?'GATE OPEN':'POND GATE'}[o.id],o.x,o.y-50);}
  ctx.fillStyle='#e7edda';ctx.fillText(s.pond===1?'POND RESTORED':'DRY POND',520,1040);
  ctx.fillStyle='#102e3c';ctx.fillRect(467,1020,106,7);ctx.fillStyle='#7fcfc8';ctx.fillRect(467,1020,106*s.pond,7);
  if(s.pond===1||s.pondRestored){
    for(let n=0;n<5;n++){const x=450+n*30,y=946+Math.sin(time/1200+n)*18;ctx.fillStyle='#a5da8f';ctx.beginPath();ctx.ellipse(x,y,9,5,0,0,Math.PI*2);ctx.fill();}
    for(const x of [414,622])for(let n=0;n<4;n++){const y=918+n*17;path([[x,y+12],[x,y-8]],'#9cba6d',3);ctx.fillStyle='#e8c08a';ctx.fillRect(x-2,y-12,4,10);}
    path([[650,875],[920,875]],'#c0b487',30);
    ctx.fillStyle='#b99259';ctx.fillRect(718,852,122,47);for(let x=722;x<840;x+=12)path([[x,853],[x,898]],'#795c35',2);
    path([[718,851],[840,851]],'#e8d2a4',3);path([[718,900],[840,900]],'#e8d2a4',3);
    ctx.fillStyle='#e7edda';ctx.fillText('MEADOW SHORTCUT',785,832);
  }
}
