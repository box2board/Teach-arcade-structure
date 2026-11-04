export const TYPES=['normal','normal','wide','gold','normal','precision'];
export const MILESTONES=['CITY LIGHTS','ABOVE THE ROOFTOPS','CLOUD COUNTRY','AIRSHIP HEIGHTS','EDGE OF SPACE'];
export function createTower(){
 const s={phase:'intro',time:0,score:0,perfects:0,streak:0,layers:[],x:0,width:240,dir:1,misses:0,last:'',debris:[],type:'normal',slow:0,milestone:0,banner:0,finalTime:0,finalDuration:0};
 let prior='playing';
 function prepare(){s.type=s.bonusWide?'wide':TYPES[(s.layers.length-1)%TYPES.length];s.bonusWide=false;const top=s.layers.at(-1);s.width=Math.min(280,top.w+(s.type==='wide'?40:0));s.dir=s.layers.length%2?1:-1;s.x=s.dir===1?0:600-s.width;}
 function start(){Object.assign(s,{phase:'playing',time:0,score:0,perfects:0,streak:0,layers:[{x:180,w:240,type:'normal'}],x:0,width:240,dir:1,misses:0,last:'DROP YOUR FIRST BLOCK',debris:[],type:'normal',slow:0,milestone:0,banner:0,bonusWide:false,finalTime:0,finalDuration:0});}
 function final(){s.phase='final';s.type='final';s.slow=0;s.finalTime=0;s.finalDuration=2*(600-s.width)/220;s.last='FINAL DROP · AIM FOR THE GOLD TARGET';}
 function drop(){if(!['playing','final'].includes(s.phase))return false;const top=s.layers.at(-1),isFinal=s.phase==='final',delta=s.x+s.width/2-(top.x+top.w/2),l=Math.max(s.x,top.x),r=Math.min(s.x+s.width,top.x+top.w),overlap=r-l;
 if(isFinal){const target=Math.max(6,Math.min(30,top.w*.3)),error=Math.abs(delta);const bonus=overlap<=0?0:error<=3?200:error<=target/2?100:25;s.score+=bonus;s.last=bonus===200?'FINAL BULLSEYE +200':bonus===100?'PRECISION FINISH +100':bonus===25?'FINAL LANDING +25':'FINAL BLOCK MISSED';if(overlap>0)s.layers.push({x:l,w:overlap,type:'final'});s.phase='finished';return true;}
 if(overlap<=0){s.debris.push({x:s.x,w:s.width,level:s.layers.length,age:0});s.misses++;s.streak=0;s.last='MISSED · '+(3-s.misses)+' CHANCES LEFT';if(s.misses===3)s.phase='finished';}
 else {const perfect=Math.abs(delta)<=(s.type==='precision'?3.5:7);let x=l,w=overlap;
 if(perfect){s.perfects++;s.streak++;w=Math.min(280,top.w+(s.type==='wide'?40:8));x=top.x+(top.w-w)/2;}else{s.streak=0;if(s.type==='wide'){w=Math.min(280,overlap+20);x=l+(overlap-w)/2;}if(s.x>top.x)s.debris.push({x:r,w:Math.max(0,s.x+s.width-r),level:s.layers.length,age:0});else s.debris.push({x:s.x,w:Math.max(0,l-s.x),level:s.layers.length,age:0});}
 x=Math.max(0,Math.min(600-w,x));s.layers.push({x,w,perfect,type:s.type});const points=(perfect?25+Math.min(5,s.streak)*5:10)*(s.type==='gold'?2:1)+(perfect&&s.type==='precision'?50:0);s.score+=points;s.last=(perfect?'PERFECT · '+s.streak+' STREAK':'STACKED')+' +'+points;
 if(perfect&&s.streak%3===0){s.bonusWide=true;s.last+=' · WIDE NEXT';}if(perfect&&s.streak%5===0){s.slow=3;s.last+=' · SLOW MOTION';}
 const milestone=Math.min(4,Math.floor((s.layers.length-1)/5));if(milestone>s.milestone){s.milestone=milestone;s.banner=2.5;}
 s.width=w;if(w<14){s.phase='finished';s.last='TOWER TOO NARROW';}}
 if(s.phase==='playing')prepare();return true;}
 function move(dt,speed){let x=s.x+s.dir*speed*dt;const max=600-s.width;while(x<0||x>max){if(x>max){x=2*max-x;s.dir=-1;}if(x<0){x=-x;s.dir=1;}}s.x=x;for(const d of s.debris)d.age+=dt;s.debris=s.debris.filter(d=>d.age<1.5);s.banner=Math.max(0,s.banner-dt);}
 function tick(dt){if(!Number.isFinite(dt)||dt<=0||!['playing','final'].includes(s.phase))return;if(s.phase==='playing'){const used=Math.min(dt,45-s.time),slowUsed=Math.min(used,s.slow),speed=155+Math.min(240,s.layers.length*11)+s.time*1.2;move(used-slowUsed+slowUsed*.55,speed);s.slow=Math.max(0,s.slow-used);s.time+=used;dt-=used;if(s.time>=45){s.time=45;final();}}if(s.phase==='final'&&dt>0){const used=Math.min(dt,s.finalDuration-s.finalTime);move(used,220);s.finalTime+=used;if(s.finalTime>=s.finalDuration-1e-8)drop();}}
 return {s,start,drop,tick,pause(){if(['playing','final'].includes(s.phase)){prior=s.phase;s.phase='paused';}},resume(){if(s.phase==='paused')s.phase=prior;}};
}
