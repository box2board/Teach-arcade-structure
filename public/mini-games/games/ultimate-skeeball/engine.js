const HOLES=[
  {id:'big',x:0,s:5.35,rx:.46,r:.30,n:50,motion:'still'},
  {id:'slider',x:0,s:6.05,rx:.30,r:.23,n:75,motion:'slide',ax:.56,speed:1.1,phase:0},
  {id:'left',x:-.73,s:6.76,rx:.27,r:.23,n:100,motion:'bob',az:.18,speed:1.1,phase:0},
  {id:'right',x:.73,s:6.76,rx:.27,r:.23,n:100,motion:'bob',az:.18,speed:1.1,phase:Math.PI},
  {id:'sweeper',x:0,s:7.40,rx:.26,r:.20,n:150,motion:'slide',ax:.56,speed:1.5,phase:1.2},
  {id:'orbitL',x:-.67,s:8.03,rx:.22,r:.19,n:200,motion:'orbit',ax:.13,az:.16,speed:1.6,phase:0},
  {id:'orbitR',x:.67,s:8.03,rx:.22,r:.19,n:200,motion:'orbit',ax:.13,az:.16,speed:1.6,phase:Math.PI},
  {id:'vault',x:0,s:8.12,rx:.20,r:.17,n:500,motion:'gate',speed:1,phase:0},
  {id:'needle',x:0,s:8.65,rx:.13,r:.14,n:1000,motion:'slide',ax:.72,speed:1.65,phase:2}
];

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const floor=s=>Math.max(0,(s-4.8)*.65);

export function targetsAt(time) {
  return HOLES.map(source=>{
    const target={...source,x:source.x,s:source.s,open:true};
    const angle=time*(source.speed||1)+(source.phase||0);
    if(source.motion==='slide')target.x+=Math.sin(angle)*source.ax;
    if(source.motion==='bob')target.s+=Math.sin(angle)*source.az;
    if(source.motion==='orbit'){
      target.x+=Math.cos(angle)*source.ax;
      target.s+=Math.sin(angle)*source.az;
    }
    target.open=source.motion!=='gate'||time%4.2<1.8;
    return target;
  });
}

// Replays one roll with the same 120 Hz physics used by the browser game.
export function scoreShot(startTime,rawAim,rawPower) {
  let time=clamp(Number(startTime)||0,0,60);
  const aim=clamp(Number(rawAim)||0,-15,15);
  const power=clamp(Number(rawPower)||0,.04,1);
  const angle=aim*Math.PI/180;
  const ball={x:0,s:0,y:.075,vx:Math.sin(angle)*(3+power*4.6),vs:3+power*4.6,vy:0,phase:'roll'};
  const step=1/120;
  for(let frame=0;frame<1200;frame++){
    time+=step;
    if(ball.phase==='roll'){
      ball.s+=ball.vs*step;ball.x+=ball.vx*step;ball.y=.075;
      if(ball.s>=4.45){ball.s=4.45;ball.phase='flight';ball.vy=2.3+power*4.1;}
      continue;
    }
    for(let slice=0;slice<4;slice++){
      const delta=step/4;
      ball.s+=ball.vs*delta;ball.x+=ball.vx*delta;ball.vy-=9*delta;ball.y+=ball.vy*delta;
      if(Math.abs(ball.x)>1.03){ball.x=Math.sign(ball.x)*1.03;ball.vx*=-.5;}
      if(ball.s>=9.02&&ball.vs>0){ball.s=9.02;ball.vs*=-.45;ball.vx*=.7;ball.vy=Math.min(ball.vy,-.7);}
      if(ball.y<=floor(ball.s)+.075&&ball.vy<0){
        let hit=null,best=Infinity,blocked=false;
        for(const target of targetsAt(time)){
          if(!target.open){
            if(Math.hypot((ball.x-target.x)/(target.rx+.025),(ball.s-target.s)/(target.r+.025))<=1.05)blocked=true;
            continue;
          }
          const assist=target.n>=500?.025:.07;
          const distance=Math.hypot((ball.x-target.x)/(target.rx+assist),(ball.s-target.s)/(target.r+assist));
          if(distance<=1.05&&distance<best){hit=target;best=distance;}
        }
        return {targetId:hit?.id??null,points:hit?.n??0,blocked,time,x:ball.x,s:ball.s};
      }
    }
  }
  return {targetId:null,points:0,blocked:false,time,x:ball.x,s:ball.s};
}

