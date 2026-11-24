import {characters,characterById} from '../../public/multiplayer/lib/characters.js';
import {getMiniGame,multiplayerIds} from './minigames.js';
import {lobbyName} from './lobby-policy.js';
import {act, advance, board, nodes, questionIndex} from '../../public/multiplayer/mayhem/rules.js';
import {loadQuestionSet} from '../../public/review-lab/catalog.js';
import {questions as demo} from './demo-questions.js';
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const bounded=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
const token=()=>crypto.randomUUID();
const lobbyConnected=(player,now)=>now-(player.lastSeen??0)<20000;
const rosterBrief=(player,now)=>({connected:lobbyConnected(player,now),ready:Boolean(player.ready)});
const colors=['#f6b941','#4ee1cc','#ff7d8c','#9b9fff','#e5a1ed','#9be277','#ff9f60','#7aceff'];
function validKey(key, count) {
  if(!Array.isArray(key))return bounded(key,0,count-1);
  return key.length>0 && key.length<=count && new Set(key).size===key.length &&
    key.every(choice=>bounded(choice,0,count-1));
}
function sanitize(items) {
  if(!Array.isArray(items)||items.length<1||items.length>500) return null;
  const validText=(s,limit)=>typeof s==='string'&&s.trim().length&&s.length<=limit;
  if(!items.every(q=>Array.isArray(q)&&validText(q[0],1000)&&Array.isArray(q[1])&&q[1].length>=2&&q[1].length<=8&&q[1].every(a=>validText(a,500))&&validKey(q[2],q[1].length))) return null;
  return items.map(([prompt,choices,answer])=>[prompt,choices,Array.isArray(answer)&&answer.length===1?answer[0]:answer]);
}
function view(room, actor, now, revision=0) {
  const member=room.players.find(p=>p.id===actor);
  const host=room.host===actor;
  const driver=room.players.find(p=>p.id===room.driver);
  const player=member && {characterId:member.characterId,miniPlayerId:member.lobbyId,name:member.name,...(room.shared&&room.phase==='lobby'?rosterBrief(member,now):{}),team:member.team,qualified:member.qualified>=2,feedback:member.feedback,sequence:member.answers,lastAward:member.lastAward??0};
  let question=null;
  if(member && ((room.phase==='lightning'&&member.answers<room.questions.length)||(room.phase==='qualifier'&&member.answers<3))) {
    const [prompt,choices,answer]=room.questions[questionIndex(room,member)];
    question=[prompt,choices,...(Array.isArray(answer)?[true]:[])];
  }
  return {code:room.code,host,player,shared:room.shared??false,...(host&&room.shared?{locked:room.locked}:{}),teams:room.teams,round:room.round,rounds:room.rounds,phase:room.phase,since:room.since,deadline:room.deadline,now,revision,
    teamCount:room.teamCount,turn:room.turn,roll:room.roll,remaining:room.remaining,driver:driver?.name,canDrive:actor===room.driver,
    minigame:room.phase==='mini'?getMiniGame(room.game)?.snapshot(room.miniState,now)??null:null,
    routes:room.phase==='route'?nodes[room.teams[room.turn].position].next:[],question,game:room.game,
    questionCount:host&&room.shared?room.questions.length:undefined,
    questionSetTitle:host&&room.shared?room.questionSetTitle:undefined,
    roster:room.players.map(p=>({characterId:p.characterId,name:p.name,team:p.team,...(host?{correct:p.correct,total:p.total,...(room.shared?{answers:p.answers,lobbyId:p.lobbyId,...(room.phase==='lobby'?rosterBrief(p,now):{})}:{})}:{})}))};
}
export async function api(request, db, {lobby=false, createCode, teacherSet, reviewEnabled=false}={}) {
  if(request.method!=='POST')return reply({error:'Use POST.'},405);
  const raw=await request.text();
  if(raw.length>500000)return reply({error:'Question set is too large.'},413);
  let input;
  try {input=JSON.parse(raw);} catch {return reply({error:'Invalid request.'},400);}
  if(!input||typeof input!=='object')return reply({error:'Invalid request.'},400);
  const now=Date.now();
  if(input.action==='create') {
    if(!lobby||!createCode)return reply({error:'Create a room in the shared lobby.'},403);
    let bank=teacherSet;
    if(!bank && (!input.bank||input.bank==='demo'))bank={title:'Mixed review sample',questions:demo};
    if(!bank){
      try {
        const original=await loadQuestionSet(input.bank);
        bank={title:original.title,questions:original.questions.map(q=>[q.question,q.choices,q.answer])};
      }catch{return reply({error:'Choose an available question set.'},400);}
    }
    const questions=sanitize(bank.questions);
    if(!questions||!bounded(input.teams,2,8)||!bounded(input.rounds,1,12))return reply({error:'Choose 2–8 teams, 1–12 rounds and a complete question set.'},400);
    const reviewGame=reviewEnabled&&getMiniGame(input.reviewGame)?input.reviewGame:null;
    const questionSetTitle=bank.title;
    for(let i=0;i<8;i++) {
      const code=createCode??Array.from(crypto.getRandomValues(new Uint8Array(6)),n=>'23456789ABCDEFGHJKLMNPQRSTUVWXYZ'[n%32]).join('');
      const room={code,reviewGame,miniPool:reviewGame?[reviewGame]:multiplayerIds(),...(lobby?{shared:true,locked:false,questionSetTitle}:{}),host:token(),questions,players:[],teamCount:input.teams,rounds:reviewGame?1:input.rounds,round:1,turn:-1,phase:'lobby',since:now,deadline:0,
        teams:Array.from({length:input.teams},(_,i)=>({name:'Team '+(i+1),color:colors[i],score:0,position:board.startSpaces[i%4],character:['fox','frog','rabbit','robot','bear','cat','dog','panda'][i]}))};
      const result=await db.prepare('INSERT OR IGNORE INTO mayhem_rooms (code,updated_at,state) VALUES (?,?,?)').bind(code,now,JSON.stringify(room)).run();
      if(result.meta.changes)return reply({token:room.host,state:view(room,room.host,now)},201);
      if(createCode)return reply({error:'Room code already exists.'},409);
    }
    return reply({error:'Could not create a room. Try again.'},503);
  }
  const code=String(input.code??'').trim().toUpperCase();
  if(!/^\d{6}$/.test(code)&&!/^[23456789A-HJ-NP-Z]{6}$/.test(code))return reply({error:'Enter a valid room code.'},400);
  const actor=input.token;
  const maxAttempts=['join','mini-input'].includes(input.action)?24:8;
  for(let attempt=0;attempt<maxAttempts;attempt++){
    const row=await db.prepare('SELECT revision, updated_at, state FROM mayhem_rooms WHERE code=?').bind(code).first();
    if(!row||now-row.updated_at>86400000)return reply({error:'Room not found or expired.'},404);
    const room=JSON.parse(row.state);
    if(room.phase==='closed')return reply({error:'The host closed this lobby.'},404);
    if(lobby&&!room.shared)return reply({error:'This room uses the original game lobby.'},404);
    if(room.shared&&!lobby&&['join','start','lock','rename','remove','ready','leave','close'].includes(input.action))
      return reply({error:'Use the shared multiplayer lobby.'},403);
    if(lobby&&['lookup','projection'].includes(input.action)) {
      const playing=room.phase!=='lobby';
      return reply({code,open:!playing&&!room.locked&&room.players.length<64,
        phase:room.phase,count:playing?room.players.length:room.players.filter(p=>lobbyConnected(p,now)).length,
        ...(input.action==='projection'?{round:room.round,rounds:room.rounds,turn:room.turn,driver:room.players.find(p=>p.id===room.driver)?.name,
          teams:room.teams.map(team=>({name:team.name,score:team.score,color:team.color}))}: {})});
    }
    const joining=input.action==='join';
    if(lobby&&!joining&&!['state','ready','leave'].includes(input.action)&&actor!==room.host)
      return reply({error:'Only the host can manage this lobby.'},403);
    if(!joining && actor!==room.host && !room.players.some(p=>p.id===actor))return reply({error:'Rejoin this room.'},403);
    advance(room,now,Math.random);
    let identity=actor;
    if(joining){
      if(lobby&&(typeof input.joinId!=='string'||!/^[-a-f0-9]{36}$/i.test(input.joinId)))return reply({error:'Reload and retry joining.'},400);
      const existing=lobby&&room.players.find(player=>player.joinId===input.joinId);
      if(existing)identity=existing.id;
      else {
      const typed=typeof input.name==='string'?input.name.trim().slice(0,24):'';
      if(!typed||room.phase!=='lobby'||room.locked||room.players.length>=64)return reply({error:'This lobby is closed or full.'},409);
      identity=token();
      room.players.push({characterId:characterById(input.characterId)?.id ?? characters[room.players.length % characters.length].id,id:identity,lobbyId:token(),name:lobby?lobbyName(typed,room):typed,
        ...(lobby?{joinId:input.joinId,lastSeen:now}:{}),team:null,answers:0,qualified:0,correct:0,total:0});
      }
    }
    const member=lobby&&room.players.find(candidate=>candidate.id===identity);
    if(member&&room.phase==='lobby'&&now-(member.lastSeen??0)>=8000)member.lastSeen=now;
    let unavailable=false;
    if(lobby&&['ready','leave'].includes(input.action)){
      if(!member||room.phase!=='lobby')unavailable=true;
      else if(input.action==='ready')member.ready=input.ready===true;
      else room.players=room.players.filter(candidate=>candidate!==member);
    }else if(lobby&&input.action==='close'){
      if(room.phase!=='lobby')unavailable=true;
      else{room.phase='closed';room.players=[];room.questions=[];}
    }else if(lobby&&input.action==='start'&&room.players.filter(player=>lobbyConnected(player,now)).length<room.teamCount){
      return reply({error:'Wait until there is at least one connected student per team.'},409);
    }else if(lobby&&['lock','rename','remove','prune-disconnected'].includes(input.action)) {
      const player=room.players.find(candidate=>candidate.lobbyId===input.playerId);
      if(room.phase!=='lobby')unavailable=true;
      else if(input.action==='lock')room.locked=input.locked===true;
      else if(input.action==='prune-disconnected'){
        const connected=room.players.filter(candidate=>lobbyConnected(candidate,now));
        room.players=connected;
      }
      else if(!player)unavailable=true;
      else if(input.action==='rename')player.name=lobbyName(input.name,room,player.id);
      else room.players=room.players.filter(candidate=>candidate!==player);
    }else if(!joining&&input.action!=='state')unavailable=!act(room,actor,input,now,Math.random);
    const state=JSON.stringify(room);
    const changed=state!==row.state;
    if(changed){
      const saved=await db.prepare('UPDATE mayhem_rooms SET state=?, updated_at=?, revision=revision+1 WHERE code=? AND revision=?').bind(state,now,code,row.revision).run();
      if(!saved.meta.changes){
        if(joining||input.action==='mini-input'){
          // A class often joins together. Spread out retries so clients do
          // not compete for the same room revision on every attempt.
          const ceiling=Math.min(100,10*(attempt+1));
          await new Promise(resolve=>setTimeout(resolve,5+Math.random()*ceiling));
        }
        continue;
      }
    }
    return reply({...(joining?{token:identity}:{}),...(input.action==='prune-disconnected'?{removed:JSON.parse(row.state).players.length-room.players.length}:{}),...(unavailable?{error:'That action is unavailable.'}:{}),
      state:view(room,identity,now,row.revision+Number(changed))},unavailable?409:200);
  }
  return reply({error:'Room is busy. Try again.'},503);
}
