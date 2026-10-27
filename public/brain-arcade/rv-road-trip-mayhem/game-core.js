const c=document.getElementById('game'),ctx=c.getContext('2d'),W=c.width,H=c.height,$=id=>document.getElementById(id);
const ui={score:$('score'),cargo:$('cargo'),speed:$('speed'),combo:$('combo'),section:$('section'),n:$('nitroBar'),s:$('stormBar'),d:$('damageBar'),st:$('stabilityBar'),msg:$('msg'),call:$('call')};
const K={g:0,b:0};
const sections=[
 {x:0,n:'OPEN ROAD'},
 {x:1300,n:'CARGO RATTLE'},
 {x:2500,n:'MUD RUN'},
 {x:3650,n:'CONSTRUCTION'},
 {x:5150,n:'ROUTE CHOICE'},
 {x:6500,n:'OPTIONAL LOOP'},
 {x:7600,n:'BROKEN BRIDGE'},
 {x:8750,n:'STORM SPRINT'},
 {x:10400,n:'FINAL LAUNCH'}
];
const pts=[[0,390],[700,390],[1200,375],[1700,395],[2200,380],[2500,390],[3100,400],[3600,390],[4300,390],[5050,390],[5450,340],[5900,390],[6500,390],[7350,390],[7600,370],[8150,370],[8600,390],[9200,380],[9900,390],[10350,350],[10600,260],[10860,125],[11650,230],[12050,390],[12800,390]];
const lowerMud=[[2750,3350],[5350,5850]];
const rough=[[1350,2250],[9000,9600]];
const wind=[[8750,10050]];
const finalGap=[[10860,11650]];
const bridgeGaps=[[7780,7860],[8120,8210]];
const upperPlatforms=[
 {x1:5230,x2:5630,y:250,label:'HIGH ROAD'},
 {x1:5630,x2:6060,y:230,label:'HIGH ROAD'}
];
const loop={cx:6920,cy:275,r:165,start:6560,end:7280,active:false,theta:0,done:false,eligible:false};
const obstacles=[
 {x:3780,t:'barrels',breakable:1},{x:4030,t:'gate',phase:0.3},{x:4320,t:'crusher',phase:1.4},{x:4620,t:'barrels',breakable:1},{x:4860,t:'gate',phase:2.0},
 {x:7920,t:'pothole'},{x:8380,t:'pothole'},
 {x:9050,t:'debris',move:1},{x:9380,t:'debris',move:1},{x:9720,t:'debris',move:1}
];
const pickups=[
 {x:5460,y:210,t:'nitro',used:0},{x:5780,y:190,t:'repair',used:0},{x:7060,y:90,t:'score',used:0},{x:9990,y:330,t:'nitro',used:0}
];
const cargo=[
 {name:'Cooler',off:-36,a:1,loose:8,color:'#4baac7'},
 {name:'Bag',off:-18,a:1,loose:5,color:'#d17450'},
 {name:'Chair',off:0,a:1,loose:10,color:'#e0b94a'},
 {name:'Kayak',off:20,a:1,loose:12,color:'#65ad76'},
 {name:'Bike',off:40,a:1,loose:9,color:'#db8b3c'}
];
const R={x:120,y:350,vx:0,vy:0,on:1,jb:0,coyote:.18,nitro:60,storm:12,damage:0,score:0,combo:1,finish:0,air:0,checkpoint:120,inv:0,route:'lower',lastSection:'OPEN ROAD',cleanTimer:0,boost:0};
let last=performance.now(),cam=0,callTimer=0,windClock=0;
function ranges(q,arr){return arr.some(r=>q>r[0]&&q<r[1])}
function gap(q){return ranges(q,bridgeGaps)||ranges(q,finalGap)}
function ground(q){if(gap(q))return null;let i=0;while(i<pts.length-2&&q>pts[i+1][0])i++;const a=pts[i],b=pts[i+1];let t=Math.max(0,Math.min(1,(q-a[0])/(b[0]-a[0])));t=t*t*(3-2*t);return a[1]+(b[1]-a[1])*t}
function platformAt(q,y){for(const p of upperPlatforms){if(q>=p.x1&&q<=p.x2&&y+40<=p.y+55)return p}return null}
function slope(q){const a=ground(q-8),b=ground(q+8);return a==null||b==null?0:(b-a)/16}
function section(){let s=sections[0];for(const z of sections)if(R.x>=z.x)s=z;return s.n}
function popup(t){ui.call.textContent=t;ui.call.style.opacity=1;callTimer=.85}
function say(t){ui.msg.textContent=t}
function activeCargo(){return cargo.filter(i=>i.a)}
function avgStability(){const a=activeCargo();return a.length?100-a.reduce((s,i)=>s+i.loose,0)/a.length:0}
function reward(points,label){R.score+=points*R.combo;R.combo=Math.min(6,R.combo+.18);if(label)popup(label+' +'+Math.round(points*R.combo))}
function destabilize(v){for(const i of activeCargo())i.loose=Math.min(120,i.loose+v*(.75+Math.random()*.5))}
function settle(v){for(const i of activeCargo())i.loose=Math.max(0,i.loose-v)}
function loseCargo(reason){const candidates=activeCargo().filter(i=>i.loose>=95);if(!candidates.length)return;const it=candidates.sort((a,b)=>b.loose-a.loose)[0];it.a=0;it.loose=0;R.combo=1;R.score=Math.max(0,R.score-150);say(it.name+' flew off — '+reason);popup('CARGO LOST');}
function damage(amount,reason){if(R.inv>0)return;R.damage=Math.min(100,R.damage+amount);R.vx*=.68;R.vy=-65;R.storm=Math.min(100,R.storm+5);R.combo=1;R.inv=.8;destabilize(amount*2.1);say(reason);if(R.damage>=100)emergencyRecovery();}
function emergencyRecovery(){R.score=Math.max(0,R.score-350);R.damage=55;R.storm=Math.min(100,R.storm+14);R.x=Math.max(120,R.checkpoint);R.y=(ground(R.x)||390)-70;R.vx=160;R.vy=-40;settle(18);popup('EMERGENCY RECOVERY -350');say('The RV was nearly destroyed. Recovery cost time and score.');}
function jump(){R.jb=.2}
function useNitro(){if(R.nitro<10||loop.active)return;R.nitro-=10;R.boost=.9;R.vx=Math.min(820,R.vx+150);destabilize(5);R.score+=25;popup('NITRO');}
function reset(){Object.assign(R,{x:120,y:350,vx:0,vy:0,on:1,jb:0,coyote:.18,nitro:60,storm:12,damage:0,score:0,combo:1,finish:0,air:0,checkpoint:120,inv:0,route:'lower',lastSection:'OPEN ROAD',cleanTimer:0,boost:0});cargo.forEach((i,idx)=>{i.a=1;i.loose=[8,5,10,12,9][idx]});obstacles.forEach(o=>o.dead=0);pickups.forEach(p=>p.used=0);loop.active=false;loop.done=false;loop.eligible=false;loop.theta=0;cam=0;}
