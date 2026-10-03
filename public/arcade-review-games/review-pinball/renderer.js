// Visual skin only. All geometry comes from the physics table; no game-state mutations.
const backgrounds=new WeakMap();
const rampLayers=new WeakMap();
const circle=(c,x,y,r,fill)=>{c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=fill;c.fill();};
const stroke=(c,a,b,color,width)=>{c.beginPath();c.moveTo(...a);c.lineTo(...b);c.lineCap='round';c.strokeStyle=color;c.lineWidth=width;c.stroke();};
function text(c,value,x,y,size=15,color='#b5d5e5'){c.font=`800 ${size}px system-ui`;c.textAlign='center';c.fillStyle=color;c.fillText(value,x,y);}
function gradient(c,x,y,r,colors){const g=c.createRadialGradient(x-r*.3,y-r*.4,1,x,y,r);colors.forEach((v,i)=>g.addColorStop(i/(colors.length-1),v));return g;}
function metal(c,x,y,height,colors=['#ecf5fb','#8fa8ba','#293c4d','#a6c2d1']){const g=c.createLinearGradient(x,y,x,y+height);colors.forEach((v,i)=>g.addColorStop(i/(colors.length-1),v));return g;}
function socket(c,x,y,r){
 c.save();c.shadowColor='#000c';c.shadowBlur=13;c.shadowOffsetY=8;circle(c,x,y,r,'#03080e');c.restore();
 circle(c,x,y,r-2,gradient(c,x,y,r,['#7d9eac','#243747','#080e17']));
}
function base(table){
 if(backgrounds.has(table))return backgrounds.get(table);
 const surface=document.createElement('canvas');surface.width=1040;surface.height=1640;const c=surface.getContext('2d');c.scale(2,2);
 const g=c.createLinearGradient(0,0,520,820);g.addColorStop(0,'#142c42');g.addColorStop(.5,'#132537');g.addColorStop(1,'#08121d');c.fillStyle=g;c.fillRect(0,0,520,820);
 // Printed playfield pattern, kept low-contrast so moving hardware remains legible.
 for(let y=55;y<790;y+=7)stroke(c,[48,y],[430,y],'#d5f5ff04',1);
 for(let y=65;y<580;y+=70){stroke(c,[180,y],[280,y+55],'#69dcd712',2);stroke(c,[280,y+55],[335,y+55],'#69dcd712',2);circle(c,335,y+55,3,'#51c9c025');}
 const light=c.createRadialGradient(250,270,20,250,270,370);light.addColorStop(0,'#43babd12');light.addColorStop(1,'#02071400');c.fillStyle=light;c.fillRect(0,0,520,820);
 // Recessed shooter channel and apron.
 c.fillStyle='#020912';c.fillRect(440,226,40,554);stroke(c,[452,240],[452,757],'#6b839128',2);
 c.fillStyle=metal(c,0,779,41,['#314655','#15232e','#07111b']);c.fillRect(40,779,442,41);
 c.beginPath();c.ellipse(254,185,156,105,0,Math.PI,Math.PI*2);c.strokeStyle='#020811';c.lineWidth=16;c.stroke();c.strokeStyle='#76b8c4';c.lineWidth=2;c.stroke();
 text(c,'NEON',254,121,31,'#71f1d3');text(c,'C I R C U I T',254,146,14,'#f5d27b');
 text(c,'LOOP',70,248,12,'#75decf');text(c,'LOOP',414,248,12,'#75decf');
 for(const r of table.rails){const [x1,y1,x2,y2]=r;stroke(c,[x1+3,y1+7],[x2+3,y2+7],'#0009',14);stroke(c,[x1,y1],[x2,y2],'#0a1721',12);stroke(c,[x1,y1],[x2,y2],metal(c,x1,Math.min(y1,y2)-4,12),8);stroke(c,[x1-1,y1-2],[x2-1,y2-2],'#e6f5ffb5',1.6);}
 for(const p of table.bumpers)socket(c,p.x,p.y+4,p.r+10);
 // Physical slingshot housings; contact edges match the simulation exactly.
 for(const points of [[[93,620],[147,690],[88,685]],[[418,620],[365,690],[423,685]]]){
  c.save();c.shadowColor='#000b';c.shadowBlur=10;c.shadowOffsetY=6;c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fillStyle=metal(c,0,620,70,['#526777','#253541','#0c1721']);c.fill();c.restore();
  stroke(c,points[0],points[1],'#3a122e',15);stroke(c,points[0],points[1],'#e482b7',8);stroke(c,[points[0][0]-1,points[0][1]-2],[points[1][0]-1,points[1][1]-2],'#ffd8ec',2);
 }
 for(const [x,y] of [[61,180],[61,577],[421,577],[453,763],[69,80],[411,73]]){circle(c,x,y,4,'#0a1016');circle(c,x,y-1,3,metal(c,x,y-4,6));stroke(c,[x-1.5,y-1],[x+1.5,y-1],'#1b2d39',1);}
 backgrounds.set(table,surface);return surface;
}
function ball(c,b,elevated){
 if(!b)return;c.save();c.shadowColor='#000b';c.shadowBlur=elevated?12:5;c.shadowOffsetX=elevated?6:2;c.shadowOffsetY=elevated?12:4;
 circle(c,b.x,b.y,b.r,gradient(c,b.x,b.y,b.r,['#ffffff','#d9ebf6','#657d8e','#23323d']));c.restore();circle(c,b.x-3,b.y-4,2,'#fff');
}
function ramp(c,r){
 const path=()=>{c.beginPath();r.path.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.lineJoin='round';c.lineCap='round';};
 // Support feet and cast shadow reveal the crossover's raised layer.
 for(const index of [3,6,9,11,13]){const p=r.path[index];socket(c,p[0]+8,p[1]+20,7);stroke(c,[p[0]+8,p[1]+20],[p[0],p[1]],metal(c,p[0],p[1],23),6);}
 c.save();c.translate(5,12);path();c.strokeStyle='#0008';c.lineWidth=35;c.shadowColor='#0009';c.shadowBlur=8;c.stroke();c.restore();
 path();c.strokeStyle='#241334';c.lineWidth=34;c.stroke();
 path();c.strokeStyle=metal(c,0,150,480,['#eee0ff','#9360c7','#483263','#c0a5db']);c.lineWidth=30;c.stroke();
 path();c.strokeStyle='#0b1721';c.lineWidth=23;c.stroke();
 path();c.strokeStyle=metal(c,0,163,475,['#66798b','#314b60','#738aa0','#314755']);c.lineWidth=20;c.stroke();
 path();c.strokeStyle='#d6eefc55';c.lineWidth=1.2;c.setLineDash([5,10]);c.stroke();c.setLineDash([]);
 const m=r.mouth;stroke(c,[m.x-19,m.y+4],[m.x+19,m.y+4],'#251b0c',9);stroke(c,[m.x-19,m.y],[m.x+19,m.y],metal(c,m.x,m.y-3,6,['#ffedaa','#caa443','#fff1bb']),5);
 text(c,'RAMP 750',m.x,m.y+33,13,'#d9baff');text(c,'↑',m.x,m.y-13,22,'#ffe6a0');
}
function rampLayer(table){
 if(rampLayers.has(table))return rampLayers.get(table);
 const surface=document.createElement('canvas');surface.width=1040;surface.height=1640;
 const c=surface.getContext('2d');c.scale(2,2);for(const r of table.ramps??[])ramp(c,r);
 rampLayers.set(table,surface);return surface;
}
export function renderTable(c,engine,{state,lit,multiplier,savedUntil,flash,rush}){
 const scale=c.canvas.width/520;c.setTransform(scale,0,0,scale,0,0);c.clearRect(0,0,520,820);c.drawImage(base(engine.table),0,0,520,820);
 for(const [i,p] of engine.table.bumpers.entries()){
  const hot=flash.some(f=>f.id==='bumper'+i&&engine.time-f.t<.16);
  circle(c,p.x,p.y+8,p.r,gradient(c,p.x,p.y+8,p.r,['#55827f','#123234','#061d23']));
  c.save();c.shadowColor=hot?'#ffe798':'#51e3c9';c.shadowBlur=hot?25:8;circle(c,p.x,p.y,p.r,gradient(c,p.x,p.y,p.r,hot?['#fff8d3','#f6d36e','#b58d30']:['#bcffe9','#49c8ad','#146954']));c.restore();
  circle(c,p.x,p.y,p.r-5,gradient(c,p.x,p.y,p.r,['#e9f9fb','#839ca5','#334955']));
  circle(c,p.x,p.y-1,p.r-10,gradient(c,p.x,p.y-1,p.r-8,hot?['#fff9ca','#d8b54b','#5f4821']:['#7aafad','#2d6665','#16383d']));
  c.beginPath();c.arc(p.x-1,p.y-1,p.r-2,3.6,5.3);c.strokeStyle='#ffffffad';c.lineWidth=2;c.stroke();text(c,'100',p.x,p.y+5,14,'#effff8');
 }
 for(const [i,t] of engine.table.targets.entries()){
  stroke(c,[t.x-5,t.y-6],[t.x+9,t.y+18],'#01060bc0',18);stroke(c,[t.x-7,t.y-12],[t.x+7,t.y+12],metal(c,t.x,t.y-12,24),16);
  c.save();c.shadowColor=lit.has(i)?'#6affd0':'#f69ebf';c.shadowBlur=lit.has(i)?14:2;stroke(c,[t.x-7,t.y-12],[t.x+7,t.y+12],lit.has(i)?'#75f2c5':'#c56997',10);c.restore();text(c,String(i+1),t.x+(i<2?24:-24),t.y+5,14);
 }
 // Recessed score inserts read as lights mounted in the playfield, not floating text.
 const on=lit.size===4;socket(c,254,483,24);circle(c,254,483,18,gradient(c,254,483,18,on?['#fff3bf','#d8b048','#594722']:['#657482','#293d4c','#101c27']));
 text(c,on?'JACKPOT LIT':'LIGHT ALL FOUR',254,535,15,on?'#ffe4a1':'#8eaabd');
 text(c,'2,500 JACKPOT',254,553,12,'#698899');
 text(c,'×'+multiplier,254,620,34,'#f5d282');
 const spinner=engine.table.spinner;
 if(spinner){
  const {x,y,width}=spinner;stroke(c,[x-width/2-5,y+12],[x-width/2-5,y-8],'#acbfcc',4);stroke(c,[x+width/2+5,y+12],[x+width/2+5,y-8],'#acbfcc',4);
  const h=Math.max(2,Math.abs(Math.cos(engine.spinnerAngle??0))*14);
  c.fillStyle=metal(c,x,y-h/2,h,['#f3f5ff','#8d75c0','#473561']);c.fillRect(x-width/2,y-h/2,width,h);
  stroke(c,[x-width/2,y],[x+width/2,y],'#e5d4ff',2);text(c,'SPIN 150',x,y+26,11,'#b9a7df');
 }
 if(rush){
  const remaining=rush.remaining(engine.time);
  for(const [i,id] of ['ramp','orbit','spinner'].entries()){const x=217+i*37;circle(c,x,661,6,remaining>0||rush.shots.has(id)?'#7cf4cf':'#233d49');text(c,['RAMP','LOOP','SPIN'][i],x,679,9,'#a5c6cf');}
  if(remaining>0)text(c,`RUSH ×2 · ${Math.ceil(remaining)}s`,254,702,13,'#91ffdc');
 }
 if(!engine.ride)ball(c,engine.ball,false);
 c.drawImage(rampLayer(engine.table),0,0,520,820);
 for(const f of engine.flippers){const length=f.length+(engine.assist?8:0),end=[f.x+Math.cos(f.angle)*length,f.y+Math.sin(f.angle)*length];
  stroke(c,[f.x+3,f.y+7],[end[0]+3,end[1]+7],'#000a',20);stroke(c,[f.x,f.y],end,'#6c501e',19);stroke(c,[f.x,f.y],end,metal(c,f.x,Math.min(f.y,end[1])-8,22,['#fff5cc','#ffe29a','#c59a41','#806222']),16);stroke(c,[f.x-1,f.y-3],[end[0]-1,end[1]-3],'#fff9dfb5',3);circle(c,f.x,f.y,7,gradient(c,f.x,f.y,7,['#eff6f8','#6c8594','#263b46']));
 }
 if(engine.ride)ball(c,engine.ball,true);
 text(c,'NEON CIRCUIT  /  TEACH ARCADE',254,807,12,'#66818f');
 if(state==='playing'&&engine.time<savedUntil)text(c,'BALL SAVER',254,576,13,'#8deed1');
 if(state==='ready')text(c,'PRESS SPACE TO LAUNCH',254,576,13,'#ffe6a0');
 // Subtle glass reflection, with no glare across the central ball path.
 const glass=c.createLinearGradient(42,0,190,820);glass.addColorStop(0,'#f0fcff0b');glass.addColorStop(.4,'#f0fcff00');c.fillStyle=glass;c.fillRect(44,43,387,718);
}
