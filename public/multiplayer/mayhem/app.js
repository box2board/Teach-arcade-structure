import {readDuringSlowPoll} from './slow-poll.js';
import {createMiniGameHost} from '../lib/minigame-host.js';
import {postSession,createLivePolling} from '../lib/session-network.js';
import {boardPoint,boardMoving} from './board-motion.js';
import {board,nodes} from './presentation.js';
const $=id=>document.getElementById(id);
const node=(tag,value='',className='')=>{const el=document.createElement(tag);el.textContent=value;el.className=className;return el;};
const params=new URLSearchParams(location.search);
const slot=params.has('host')?'host':'student';
const savedKey='midway-mayhem:'+slot;
let credentials;
try {credentials=JSON.parse(sessionStorage.getItem(savedKey));}catch{}
if(params.has('code')&&credentials?.code!==params.get('code'))credentials=null;
let state,clockOffset=0,busy=false,polling=false,board3d,boardLoading=false,renderKey='',mapKey='',mapFrame=0;
const serverNow=()=>Date.now()+clockOffset;
const miniHost=createMiniGameHost({now:serverNow});
const miniContext=s=>({snapshot:s.minigame,playerId:s.player?.miniPlayerId,canPlay:Boolean(s.player?.qualified)});
window.addEventListener('pagehide',()=>miniHost.destroy());
window.addEventListener('pageshow',e=>{if(e.persisted&&state){delete $('content').dataset.miniRound;render();}});
const error=message=>{$('error').hidden=!message;$('error').textContent=message;};
async function call(input,signal){
  const res=await postSession('/api/mayhem',{...credentials,...input},{signal});
  return {...res.data,status:res.status};
}
function accept(next){
  if(state&&(next.revision<state.revision||(next.revision===state.revision&&next.now<state.now)))return;
  clockOffset=next.now-Date.now();
  state=next;
  miniHost.update(miniContext(next));
  $('entry').hidden=true;
  $('session').hidden=false;
  $('room-label').textContent='Room '+state.code+' · Round '+state.round+'/'+state.rounds;
  const nextMapKey=state.phase+'|'+state.turn+'|'+state.teams.map(team=>team.position).join(',');
  const playingMini=state.phase==='mini';
  if(!playingMini&&!board3d&&mapKey!==nextMapKey){mapKey=nextMapKey;refreshMap();}
  $('stage').hidden=playingMini;
  $('world').hidden=playingMini||!board3d;
  $('session').classList.toggle('mini-round',playingMini);
  $('session').closest('main').classList.toggle('mini-active',playingMini);
  if(!playingMini)loadBoard();
  const key=JSON.stringify({
    phase:state.phase,since:state.since,turn:state.turn,driver:state.driver,roll:state.roll,remaining:state.remaining,
    player:state.player,question:state.question,game:state.game,
    roster:state.host&&state.shared?state.roster:['lobby','finished'].includes(state.phase)?state.roster:null,
    questionCount:state.questionCount
  });
  renderScores();
  $('session').classList.toggle('teacher-view',Boolean(state.host));
  if(key!==renderKey){renderKey=key;render();}
}
async function command(action,fields={}){
  if(busy||!state)return;
  busy=true;
  try{
    const r=await call({action,phase:state.phase,since:state.since,...fields});
    if(r.state)accept(r.state);
    error(r.error||'');
  }catch{error('Connection interrupted. Reconnecting…');}finally{busy=false;}
}
async function poll(){
  if(!credentials||busy||polling)return;
  polling=true;
  try{
    const input=state?.phase==='mini'?miniHost.input():null;
    const packet=input?{action:'mini-input',phase:state.phase,since:state.since,packet:input}:{action:'state'};
    const r=state?.phase==='mini' ? await readDuringSlowPoll(call,packet,{
      onSnapshot:next=>{if(!busy)accept(next);}
    }) : await call(packet);
    if(r.status>=500||r.status===429){error('Connection interrupted. Reconnecting…');return false;}
    if(busy)return;
    if(r.state&&(!state||r.state.revision>=state.revision)){accept(r.state);error('');}
    else if([403,404].includes(r.status)){credentials=null;sessionStorage.removeItem(savedKey);$('entry').hidden=false;$('session').hidden=true;error(r.error);}
  }catch{error('Connection interrupted. Reconnecting…');return false;}finally{polling=false;}
}
const button=(label,fn,disabled=false)=>{const b=node('button',label);b.type='button';b.disabled=disabled;b.onclick=fn;return b;};
const pipSlots={1:[5],2:[1,9],3:[1,5,9],4:[1,3,7,9],5:[1,3,5,7,9],6:[1,3,4,6,7,9]};
function dieFace(value=0){
  const face=node('span','','die-face');face.setAttribute('aria-hidden','true');
  if(value){for(const slot of pipSlots[value]||[]){const pip=node('i','','die-pip');pip.style.gridRow=String(Math.ceil(slot/3));pip.style.gridColumn=String((slot-1)%3+1);face.append(pip)}}
  else face.append(node('span','?','die-question'));
  return face;
}
function dieRollControl(canRoll,value=0){
  if(!canRoll){const waiting=node('div','','die-waiting');waiting.append(dieFace(value),node('strong',value?'LAST ROLL':'DIE READY'));return waiting;}
  const control=button('',()=>{control.classList.add('die-shake');command('roll')});
  control.className='die-roll-control';control.setAttribute('aria-label','Roll the die for your team');
  control.append(dieFace(value),node('strong','ROLL THE DIE'),node('small','Tap to move your team'));
  return control;
}
let scoreKey='';
function renderScores(){
  const s=state,key=JSON.stringify([s.phase,s.player?.team,s.teams.map(t=>t.score)]);
  if(key===scoreKey)return;
  scoreKey=key;
  const teams=s.teams.map((team,index)=>({team,index}));
  if(s.phase==='finished')teams.sort((a,b)=>b.team.score-a.team.score);
  $('scores').replaceChildren(...teams.map(({team:t,index:i})=>{
    const card=node('div',t.name+(i===s.player?.team?' · You':''),'score');
    card.style.setProperty('--team',t.color);
    card.append(node('b',t.score));return card;
  }));
}
function render(){
  const s=state,c=$('content');
  if(s.phase==='mini'){
    const roundKey=s.since+'|'+s.game;
    if(c.dataset.miniRound===roundKey)return;
    c.dataset.miniRound=roundKey;
    const container=node('section');
    c.replaceChildren();
    if(s.host||!s.player?.qualified){
      c.append(node('p',s.host?'Live mini-game · teacher view':'Live mini-game · spectator view','spectator-label'));
    }
    c.append(container);
    if(miniHost.supports(s.game))void miniHost.mount(s.game,container,miniContext(s));
    return;
  }
  delete c.dataset.miniRound;
  miniHost.destroy();
  const heading={lobby:'Waiting for players',lightning:'Lightning round',standings:'Team standings',roll:'Roll the die',route:'Choose a path',landing:'Team landing',qualifier:'Mini-game qualifier','round-result':'Round results',finished:'Final standings'};
  c.replaceChildren(node('h2',heading[s.phase]));
  const line=(v)=>c.append(node('p',v));
  if(s.shared&&s.host&&s.phase!=='lobby'){
    const dashboard=node('details','','teacher-overview');
    dashboard.open=!['roll','route','landing'].includes(s.phase);
    dashboard.append(node('summary','Teacher overview · '+s.roster.length+' students'));
    const answered=s.roster.reduce((sum,player)=>sum+(player.answers||0),0);
    const expected=s.phase==='lightning'?s.roster.length*(s.questionCount||0):s.phase==='qualifier'?s.roster.length*3:0;
    dashboard.append(node('p',expected?'Answers submitted · '+answered+' of '+expected:'Class accuracy · '+s.roster.reduce((sum,player)=>sum+player.correct,0)+' correct of '+s.roster.reduce((sum,player)=>sum+player.total,0)));
    const list=node('ul','','teacher-roster');
    s.roster.forEach(player=>{
      const team=s.teams[player.team];
      const progress=expected?' · '+(player.answers||0)+'/'+(s.phase==='lightning'?(s.questionCount||0):3)+' answered':' · '+player.correct+'/'+player.total+' correct';
      list.append(node('li',player.name+' · '+(team?.name||'Unassigned')+progress));
    });
    dashboard.append(list);
    c.append(dashboard);
  }
  if(s.phase==='lobby'){
    location.replace(slot==='host'?'/multiplayer/':'/join');
    return;
  }
  if(s.phase==='lightning'||s.phase==='qualifier'){
    if(s.phase==='qualifier')line('Get 2 of 3 right to play.');
    else line('+1 correct · −1 incorrect');
    if(s.question){
      line(s.question[0]);
      const choices=node('div','','answers');
      if(s.question[2]){
        line('Select every correct answer, then submit.');
        const selected=new Set();
        const submit=button('Submit answers',()=>command('answer',{choices:[...selected],sequence:s.player.sequence}),true);
        s.question[1].forEach((choice,index)=>{
          const toggle=button(choice,()=>{
            if(selected.has(index))selected.delete(index);else selected.add(index);
            toggle.setAttribute('aria-pressed',String(selected.has(index)));
            submit.disabled=selected.size===0;
          });
          toggle.setAttribute('aria-pressed','false');choices.append(toggle);
        });
        choices.append(submit);
      }else s.question[1].forEach((choice,i)=>choices.append(button(choice,()=>command('answer',{choice:i,sequence:s.player.sequence}))));
      c.append(choices);
    }else line(s.host?'Students are answering.':'Answers submitted. Waiting for the next phase.');
    if(s.player?.feedback && s.phase==='lightning')line(s.player.feedback);
    return;
  }
  const team=s.teams[s.turn];
  if(s.phase==='roll'||s.phase==='route'||s.phase==='landing'){
    line(team.name+' · '+s.driver);
    if(s.phase==='roll'){
      c.append(dieRollControl(s.canDrive));
      line(s.canDrive?'You’re driving this turn. Tap the die to move your team.':'Waiting for '+s.driver+' to roll for '+team.name+'.');
    }else if(s.phase==='route'){
      c.append(dieRollControl(false,s.roll));
      line('Your team rolled '+s.roll+' · '+s.remaining+' spaces left');
      const choices=node('div','','answers');
      s.routes.forEach((id,i)=>choices.append(button((i===0?'Stay in ':'Cross to ')+board.districts[nodes[id].district].name,()=>command('route',{destination:id}),!s.canDrive)));
      c.append(choices);
    }else{c.append(dieRollControl(false,s.roll));line('Rolled '+s.roll+' · '+team.landing+' space · +'+team.reward+' points');}
    return;
  }
  if(s.phase==='round-result')line(s.player?'Mini-game points for your team: '+s.player.lastAward:'Mini-game points are included in the team totals.');
  if(s.phase==='finished'){
    const top=Math.max(...s.teams.map(t=>t.score));
    const leaders=s.teams.filter(t=>t.score===top).map(t=>t.name);
    line(leaders.join(' and ')+(leaders.length===1?' wins':' tie')+' with '+top+' points.');
    if(s.host){
      const list=node('ul');
      s.roster.forEach(p=>list.append(node('li',p.name+' · '+p.correct+'/'+p.total+' correct')));
      c.append(list);
    }
    c.append(button('Return to setup',()=>{sessionStorage.removeItem(savedKey);
      sessionStorage.removeItem('teach-arcade-lobby:'+slot);
      location.assign(slot==='host'?'/multiplayer/':'/join');
    }));
  }
}
function refreshMap(){
  cancelAnimationFrame(mapFrame);
  if(!state||state.phase==='mini'||board3d)return;
  drawMap();
  if(state.teams.some(team=>boardMoving(team.movement,serverNow()))) mapFrame=requestAnimationFrame(refreshMap);
}
function drawMap(){
  const map=$('map');
  if(map.width!==960||map.height!==720){map.width=960;map.height=720;}
  const ctx=map.getContext('2d');ctx.resetTransform();ctx.fillStyle='#137d9a';ctx.fillRect(0,0,map.width,map.height);
  const now=serverNow();
  const active=state.teams[state.turn>=0?state.turn:state.player?.team];
  const focus=active?boardPoint(nodes,active.position,active.movement,now):{x:1200,y:900};
  const zoom=active?1.28:.39;
  ctx.setTransform(zoom,0,0,zoom,map.width/2-focus.x*zoom,map.height/2-focus.y*zoom);
  ctx.fillStyle='#137d9a';ctx.fillRect(0,0,2400,1800);
  for(const d of board.districts){
    ctx.fillStyle='#294b40';ctx.beginPath();ctx.ellipse(d.x,d.y+45,495,388,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=d.color;ctx.beginPath();ctx.ellipse(d.x,d.y,495,388,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#263e44';ctx.font='bold 42px system-ui';ctx.textAlign='center';ctx.fillText(d.name,d.x,d.y+10);
  }
  for(const n of nodes)for(const id of n.next){
    ctx.strokeStyle=n.bridge||nodes[id].bridge?'#885b41':'#fff1bc';ctx.lineWidth=31;ctx.beginPath();ctx.moveTo(n.x,n.y);ctx.lineTo(nodes[id].x,nodes[id].y);ctx.stroke();
  }
  for(const n of nodes){
    ctx.fillStyle={ticket:'#ffc048',surprise:'#a474da',item:'#61badd',scenic:'#88b982'}[n.type];
    ctx.beginPath();ctx.arc(n.x,n.y,24,0,Math.PI*2);ctx.fill();
  }
  state.teams.forEach((t,i)=>{
    const p=boardPoint(nodes,t.position,t.movement,now),same=state.teams.filter(x=>x.position===t.position),idx=same.indexOf(t);
    const x=p.x+(idx-(same.length-1)/2)*70;
    ctx.fillStyle=t.color;ctx.strokeStyle=state.turn===i?'white':'#13233b';ctx.lineWidth=8;ctx.beginPath();ctx.arc(x,p.y,37,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#13233b';ctx.font='bold 38px system-ui';ctx.fillText(i+1,x,p.y+13);
  });
}
setInterval(()=>{
  if(!state)return;
  const remaining=Math.max(0,state.deadline-(Date.now()+clockOffset));
  const label=state.deadline&&['lightning','qualifier','roll','route'].includes(state.phase)?Math.ceil(remaining/1000)+' seconds':'';
  if($('clock').textContent!==label)$('clock').textContent=label;
},150);
const livePolling=createLivePolling(poll,()=>state?.phase==='mini'
  ? (state.player?.qualified ? miniHost.interval() : 250)
  : state?.phase==='finished' ? 5000 : 225);
for(const type of ['keydown','keyup','pointerdown','pointerup','pointercancel']){
  window.addEventListener(type,event=>{
    if(state?.phase!=='mini'||!state.player?.qualified||event.repeat)return;
    if(type.startsWith('key')&&!/^(Arrow(Up|Down|Left|Right)|Key[WASD]|Space)$/.test(event.code))return;
    livePolling.wake();
  });
}
window.addEventListener('pagehide',event=>{if(!event.persisted)livePolling.stop();});
if(!credentials)error('Open the multiplayer lobby to enter a room.');
function loadBoard(){
  if(boardLoading||!window.WebGLRenderingContext)return;
  boardLoading=true;
  import('./board3d.js').then(module=>{
    board3d=module.mount($('world'),()=>state,serverNow);
    $('map').hidden=true;
  }).catch(()=>{$('world').hidden=true;$('map').hidden=false;if(state)refreshMap();});
}
