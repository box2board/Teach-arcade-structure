export const FINISH=20000, LIMIT=60;
export function makeCourse(){
  const items=[];
  const add=(type,x,props={})=>items.push({id:type+'-'+items.length,type,x,done:false,...props});
  const barrier=(x,width=86,height=58,type='barrier')=>add(type,x,{width,height,minClearance:Infinity});
  const ramp=(x,width,height)=>{add('ramp',x,{width,height});add('boost',x+width+145,{y:height+178});add('shield',x+width+250,{y:height+305});add('pad',x+width+625,{width:300});};
  barrier(1250);add('boost',1280,{y:145});
  barrier(2400,76,72,'barrels');
  ramp(3350,260,68);
  add('overhead',5200,{width:420,bottom:98,height:190});
  barrier(6600,80,56);barrier(7290,80,62,'barrels');
  barrier(8700,210,70);add('boost',8780,{y:192});
  add('overhead',9900,{width:320,bottom:98,height:190});
  ramp(11000,300,96);
  add('time-stop',11950,{y:510,rampId:items.find(i=>i.type==='ramp'&&i.x===11000).id});
  barrier(13600,76,104);add('boost',13630,{y:210});
  barrier(14350,76,58,'barrels');
  add('overhead',15600,{width:360,bottom:98,height:190});
  ramp(17000,250,76);
  barrier(18850,195,72);add('boost',18900,{y:180});
  return items.sort((a,b)=>a.x-b.x);
}
const isGround=i=>i.type==='barrier'||i.type==='barrels';
export function createRace(onEvent=()=>{}){
  let state;
  function reset(){state={phase:'intro',countdown:3,time:0,x:0,speed:240,y:0,vy:0,held:false,airJumpReady:true,holdTime:0,doubleJumps:0,timeStop:0,timeStops:0,perfectLaunch:false,apexCombo:false,edgePerfect:false,flightRamp:null,apexCue:false,buffer:0,boost:0,shield:0,miniBoost:0,stun:0,hits:0,boosts:0,shields:0,smashed:0,cleared:0,streak:0,bestStreak:0,perfects:0,ramps:0,rampPops:0,landings:0,riding:null,rampSlope:0,edgeArmed:0,lastRampEdge:-100,rampPopped:false,items:makeCourse(),rivals:[0,1,2].map(id=>({id,x:0,speed:235,y:0,vy:0,riding:null,finishTime:null})),result:null};return state;}
  reset();
  function start(){reset();state.phase='countdown';onEvent({type:'countdown'});}
  function press(){if(state.phase!=='racing'||state.held)return;state.held=true;state.buffer=.15;}
  function release(){state.held=false;}
  function pause(){if(['racing','countdown'].includes(state.phase)){state.previousPhase=state.phase;state.phase='paused';release();state.buffer=0;state.edgeArmed=0;}}
  function resume(){if(state.phase==='paused')state.phase=state.previousPhase||'racing';}
  function clean(item){state.cleared++;state.streak++;state.bestStreak=Math.max(state.bestStreak,state.streak);if(isGround(item)&&item.minClearance>=-4&&item.minClearance<=34){state.perfects++;state.miniBoost=Math.max(state.miniBoost,1);onEvent({type:'perfect',streak:state.streak});}else if(state.streak%3===0)onEvent({type:'streak',streak:state.streak});else onEvent({type:'clear'});}
  function pop(perfect=false){state.vy+=180;state.holdTime=.55;state.rampPopped=true;state.rampPops++;state.buffer=0;state.perfectLaunch=perfect;onEvent({type:'ramp-pop',perfect});}
  function land(){state.y=0;state.vy=0;state.airJumpReady=true;state.holdTime=0;state.perfectLaunch=false;state.apexCombo=false;state.flightRamp=null;const pad=state.items.find(i=>i.type==='pad'&&!i.done&&Math.abs(state.x-i.x)<=i.width/2);if(pad){pad.done=true;state.landings++;state.miniBoost=Math.max(state.miniBoost,1.8);onEvent({type:'landing-bonus'});}else onEvent({type:'land'});}
  function finish(){if(state.phase==='finished')return;const place=1+state.rivals.filter(r=>(r.finishTime!==null&&r.finishTime<state.time)||r.x>state.x).length;state.phase='finished';release();state.result={gameId:'jump-rush',rulesVersion:6,finished:state.x>=FINISH,place,time:Number(state.time.toFixed(2)),distance:Math.min(FINISH,Math.round(state.x)),hits:state.hits,boosts:state.boosts,shields:state.shields,smashed:state.smashed,cleared:state.cleared,bestStreak:state.bestStreak,perfects:state.perfects,ramps:state.ramps,rampPops:state.rampPops,landings:state.landings,doubleJumps:state.doubleJumps,timeStops:state.timeStops,score:Math.round(Math.min(1,state.x/FINISH)*1000+(state.x>=FINISH?(LIMIT-state.time)*20:0)+state.perfects*25+state.landings*30+state.rampPops*15+state.timeStops*100)};onEvent({type:'finish',result:state.result});}
  function tick(dt){
    if(state.phase==='countdown'){state.countdown-=dt;if(state.countdown<=0){state.phase='racing';onEvent({type:'go'});}return;}
    if(state.phase!=='racing')return;
    dt=Math.min(dt,LIMIT-state.time);state.time+=dt;
    for(const key of ['boost','shield','timeStop','miniBoost','stun','buffer','edgeArmed'])state[key]=Math.max(0,state[key]-dt);
    const riding=state.items.find(i=>i.id===state.riding),nearEdge=riding&&riding.x+riding.width-state.x<Math.max(90,state.speed*.20);
    if(state.buffer>0){
      if(riding&&nearEdge){state.edgeArmed=.25;state.edgePerfect=(riding.x+riding.width-state.x)/state.speed<=.10;state.buffer=0;}
      else if(!state.riding&&state.y>0&&state.time-state.lastRampEdge<.14&&!state.rampPopped){pop(state.time-state.lastRampEdge<=.10);}
      else if(state.y===0||riding){state.vy=660;state.holdTime=.55;state.airJumpReady=true;state.perfectLaunch=false;state.apexCombo=false;state.flightRamp=null;state.riding=null;state.buffer=0;onEvent({type:'jump'});}
      else if(state.airJumpReady){state.apexCombo=state.perfectLaunch&&Math.abs(state.vy)<=220;state.vy=660;state.holdTime=.9;state.airJumpReady=false;state.doubleJumps++;state.buffer=0;onEvent({type:'double-jump',perfect:state.apexCombo});}
      else state.buffer=0;
    }
    const target=(state.boost>0?620:430)+Math.min(state.streak,6)*8+(state.miniBoost>0?65:0);
    state.speed=state.speed<target?Math.min(target,state.speed+90*dt):Math.max(target,state.speed-170*dt);
    const oldX=state.x;state.x+=state.speed*dt;state.rampSlope=0;
    const support=state.items.find(i=>i.type==='ramp'&&!i.done&&state.x>=i.x&&state.x<i.x+i.width);
    const surface=support?(state.x-support.x)/support.width*support.height:0;
    if(support&&(state.riding===support.id||(state.y<=surface+1&&state.vy<=0))){state.riding=support.id;state.y=surface;state.vy=0;state.airJumpReady=true;state.holdTime=0;state.perfectLaunch=false;state.apexCombo=false;state.flightRamp=null;state.rampSlope=support.height/support.width;}
    else if(riding&&state.riding&&state.x>=riding.x+riding.width){
      riding.done=true;state.riding=null;state.y=riding.height;state.vy=630+state.speed*.30;state.holdTime=.55;state.airJumpReady=true;state.ramps++;state.flightRamp=riding.id;state.perfectLaunch=false;state.apexCombo=false;state.lastRampEdge=state.time;state.rampPopped=false;state.apexCue=false;if(state.edgeArmed>0)pop(state.edgePerfect);else onEvent({type:'ramp'});state.edgeArmed=0;
    }else if(!state.riding&&(state.vy!==0||state.y>0)){state.y+=state.vy*dt;const extending=state.held&&state.holdTime>0;state.vy-=(extending&&!state.airJumpReady&&state.vy>-180?700:extending&&state.vy>0?1000:1850)*dt;state.holdTime=Math.max(0,state.holdTime-dt);if(state.y<=0)land();}
    if(state.perfectLaunch&&state.airJumpReady&&Math.abs(state.vy)<=220&&!state.apexCue){state.apexCue=true;onEvent({type:'apex-ready'});}
    for(const item of state.items){
      if(item.done||item.type==='ramp'||item.type==='pad')continue;
      if(item.type==='time-stop'){
        if(!state.airJumpReady&&oldX-140<=item.x&&state.x+140>=item.x&&Math.abs(state.y+30-item.y)<300){item.done=true;state.timeStop=3;state.timeStops++;onEvent({type:'time-stop'});}
        if(item.x<state.x-240)item.done=true;
        continue;
      }
      if(item.type==='boost'||item.type==='shield'){
        if(oldX-48<=item.x&&state.x+48>=item.x&&Math.abs(state.y+30-item.y)<48){item.done=true;if(item.type==='boost'){state.boost=3.2;state.boosts++;state.speed=Math.max(530,state.speed);}else{state.shield=5;state.shields++;}onEvent({type:item.type});}
      }else{
        const overlap=oldX-34<item.x+item.width/2&&state.x+34>item.x-item.width/2;
        const collision=item.type==='overhead'?state.y+58>item.bottom&&state.y<item.bottom+item.height:state.y<item.height-4;
        if(overlap&&isGround(item)&&!collision)item.minClearance=Math.min(item.minClearance,state.y-item.height);
        if(overlap&&collision){item.done=true;if(state.shield>0){state.smashed++;clean({...item,minClearance:Infinity});onEvent({type:'smash'});}else{state.streak=0;state.miniBoost=0;if(state.stun===0){state.hits++;state.speed=Math.max(170,state.speed*.52);state.stun=.65;onEvent({type:'hit',overhead:item.type==='overhead'});}}}
        if(state.x-40>item.x+item.width/2&&!item.done){item.done=true;clean(item);}
      }
      if(item.x<state.x-240)item.done=true;
    }
    for(const rival of state.rivals){
      if(state.timeStop>0)continue;
      rival.speed=Math.min(455+rival.id*10,rival.speed+85*dt);if(rival.finishTime===null){rival.x+=rival.speed*dt;if(rival.x>=FINISH){rival.finishTime=state.time-(rival.x-FINISH)/rival.speed;rival.x=FINISH;}}
      const ramp=state.items.find(i=>i.type==='ramp'&&rival.x>=i.x&&rival.x<i.x+i.width),oldRamp=state.items.find(i=>i.id===rival.riding);
      if(ramp&&(rival.y<=(rival.x-ramp.x)/ramp.width*ramp.height+2&&rival.vy<=0)){rival.riding=ramp.id;rival.y=(rival.x-ramp.x)/ramp.width*ramp.height;rival.vy=0;}
      else if(oldRamp&&rival.x>=oldRamp.x+oldRamp.width){rival.riding=null;rival.y=oldRamp.height;rival.vy=750;}
      else{const next=state.items.find(i=>isGround(i)&&i.x>rival.x&&i.x-rival.x<165);if(next&&rival.y===0)rival.vy=660;if(rival.vy||rival.y){rival.y+=rival.vy*dt;rival.vy-=1750*dt;if(rival.y<=0){rival.y=0;rival.vy=0;}}}
    }
    if(state.x>=FINISH||state.time>=LIMIT)finish();
  }
  return{get state(){return state;},start,press,release,pause,resume,tick};
}
