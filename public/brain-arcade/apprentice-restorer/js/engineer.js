import {connected} from './flow-model.js';
export const distributor={id:'distributor',x:600,y:700};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function engineerState(old={}){
  return {gardenShare:Number.isFinite(old.gardenShare)?clamp(old.gardenShare,.1,.9):.7,
    stability:Number.isFinite(old.stability)?clamp(old.stability,0,12):0,
    trialComplete:old.trialComplete===true&&Number.isFinite(old.stability)&&old.stability>=12,
    pondRestored:old.trialComplete===true&&Number.isFinite(old.stability)&&old.stability>=12};
}
// All flow comes from one source: garden + pond allocation + wheel + spill.
export function systemReadings(s){
  const live=s.pump===1&&s.vane===1&&connected(s);
  const source=live?s.valve:0,capacity=Math.min(source,.85),spill=source-capacity;
  const distributable=Math.max(0,capacity-.22);
  const garden=distributable*s.gardenShare;
  const allocatedPond=distributable*(1-s.gardenShare)*s.sluice;
  const open=s.diverter===2&&s.logX>=450;
  const pond=open?allocatedPond:0;
  const wheel=capacity-garden-allocatedPond;
  const both=s.gate===2;
  return {source,spill,garden,pond,wheel,waste:open?0:allocatedPond,
    wheelOK:wheel>=.22&&wheel<=.4,
    gardenOK:both&&garden>=.14&&garden<=.24,
    pondOK:pond>=.12&&pond<=.23,
    levelOK:s.pond>=.65&&s.pond<=.9};
}
export function stepEngineer(s,dt){
  const r=systemReadings(s),events=[];
  s.elapsed+=dt;s.windAngle+=(s.vane===1?2.5:0)*dt;
  s.wheelSpeed+=(r.wheel*7-s.wheelSpeed)*Math.min(1,dt*3);s.wheelAngle+=s.wheelSpeed*dt;
  if(s.trialComplete)return events;
  for(let i=0;i<2;i++){
    const fed=s.gate===2||s.gate===(i===0?1:3);
    s.garden[i]=clamp(s.garden[i]+dt*(fed&&r.garden>=.14&&r.garden<=.24?.035:r.garden>.24?-.05:-.025),0,1);
  }
  // The pond leaks naturally: sustained inflow must match losses, not just fill once.
  s.pond=clamp(s.pond+(r.pond-s.pond*.22)*dt*.5,0,1);
  const stable=r.wheelOK&&r.gardenOK&&r.pondOK&&s.pond>=.65&&s.pond<=.9&&s.garden.every(n=>n>=.8)&&r.spill===0;
  s.stability=stable?Math.min(12,s.stability+dt):0;
  if(s.stability>=12){s.trialComplete=true;s.pondRestored=true;s.finished=true;s.won=true;events.push('engineered');}
  return events;
}
export function engineerHint(s){
  const r=systemReadings(s);
  if(!r.source)return 'Trace the source: the channel must connect and the wind pump must run.';
  if(r.spill>0)return 'Water is spilling at the source. Maximum flow exceeds the channel capacity.';
  if(r.waste>0)return 'Water is leaving the distributor but not reaching the pond. Trace that route.';
  if(s.diverter!==2)return 'Compare the channel outlet with the stream leading to the pond.';
  if(s.logX<450)return 'The stream reaches a fallen log. Try moving it from the left.';
  if(s.gate!==2)return 'One garden bed is dry. Check the garden splitter.';
  if(!r.gardenOK)return r.garden>.24?'The garden is flooding. Send a smaller share there.':'The garden is drying. It needs a larger share of the supply.';
  if(!r.pondOK)return r.pond>.23?'The pond intake is too high. Partly close its gate.':'The pond intake is low. Compare the distribution and gate opening.';
  if(!r.wheelOK)return 'The wheel needs a share of the same supply. Check what the other branches take.';
  return 'Watch the levels settle. A working arrangement must stay balanced for 12 seconds.';
}
export function drawDistributor(ctx,s,{path,glow},time){
  path([[650,610],[600,610],[600,700],[350,700],[350,635]],'#a6b394',10);
  ctx.fillStyle='#d4bc87';ctx.beginPath();ctx.arc(600,700,24,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.translate(600,700);ctx.rotate(s.gardenShare*Math.PI*2);path([[0,0],[0,-20]],'#274d48',5);ctx.restore();glow(600,700,false,time);
  ctx.fillStyle='#e7edda';ctx.font='bold 14px system-ui';ctx.textAlign='center';ctx.fillText('DISTRIBUTOR',600,656);ctx.fillText(`Garden ${Math.round(s.gardenShare*100)}% · Pond ${Math.round((1-s.gardenShare)*100)}%`,600,744);
}
