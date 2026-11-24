import {getMiniGame} from '../../../lib/multiplayer/minigames.js';
import {board,nodes,seconds,randomIndex} from './presentation.js';
import {boardStepMs} from './board-motion.js';
import {spaces} from '../lib/catalog.js';
import {miniGames} from '../lib/game-labels.js';
export {board,nodes} from './presentation.js';
const active = room => room.teams[room.turn];
function phase(room, name, now, length = 0) {
  room.phase = name;
  room.since = now;
  room.deadline = length ? now + length : 0;
}
function lightning(room, now) {
  for (const player of room.players) Object.assign(player,{answers:0,feedback:'',lastAward:0});
  phase(room,'lightning',now,seconds(room.round)*1000);
}
function nextTurn(room, now, random) {
  if (++room.turn === room.teams.length) {
    for (const player of room.players) Object.assign(player,{answers:0,qualified:0,feedback:''});
    phase(room,'qualifier',now,45000);
    return;
  }
  const members = room.players.filter(p => p.team === room.turn);
  const least = Math.min(...members.map(p=>p.turns));
  const pool = members.filter(p=>p.turns===least);
  const driver = pool[randomIndex(random,pool.length)];
  driver.turns++;
  room.driver = driver.id;
  room.roll = 0;
  room.remaining = 0;
  phase(room,'roll',now,12000);
}
function move(room, now, random, destination) {
  const team = active(room);
  const continuing = team.movement?.endsAt > now;
  const start = continuing ? team.movement.at : now;
  const path = continuing ? [...team.movement.path] : [team.position];
  function step(position) {
    path.push(position);
    team.position = position;
    room.remaining--;
  }
  function saveMovement() {
    if (path.length > 1) team.movement = {path, at:start, endsAt:start + (path.length - 1)*boardStepMs};
  }
  if (destination !== undefined) {
    step(destination);
  }
  while (room.remaining) {
    const options = nodes[team.position].next;
    if (options.length > 1) {
      saveMovement();
      phase(room,'route',now,12000);
      return;
    }
    step(options[0]);
  }
  team.landing = nodes[team.position].type;
  team.reward = spaces[team.landing].award;
  team.score += team.reward;
  saveMovement();
  phase(room,'landing',now,Math.max(1,(team.movement?.endsAt ?? now)-now+180));
}
function roll(room, now, random) {
  room.roll = room.remaining = 1+randomIndex(random,6);
  move(room,now,random);
}
function launchMini(room, now, random) {
  room.game = null;
  if (!room.players.some(p=>p.qualified>=2)) {
    finishRound(room,now);
    return;
  }
  const pool=room.miniPool;
  let options=pool.filter(id=>!room.playedGames?.includes(id));
  if(!options.length){room.playedGames=[];options=pool;}
  room.game = options[randomIndex(random,options.length)];
  (room.playedGames ??= []).push(room.game);
  room.seed = randomIndex(random,4294967296);
  const engine=getMiniGame(room.game);
  room.miniState=engine.create({players:room.players.filter(p=>p.qualified>=2).map(p=>({id:p.lobbyId,name:p.name,characterId:p.characterId,team:p.team})),now,seed:room.seed});
  phase(room,'mini',now,engine.durationMs);
}
function finishRound(room, now) {
  if (room.round === room.rounds) phase(room,'finished',now);
  else {
    room.round++;
    lightning(room,now);
  }
}

function openBoard(room, now, random) {
  room.turn = -1;
  nextTurn(room,now,random);
}

export function advance(room, now, random) {
  const engine=getMiniGame(room.game);
  if(room.phase==='mini'&&engine){
    room.miniState=engine.advance(room.miniState,now);
    if(engine.finished(room.miniState))room.deadline=Math.min(room.deadline,now);
  }
  while (room.deadline && now >= room.deadline) {
    const at = room.deadline;
    switch (room.phase) {
      case 'lightning':
      case 'standings': openBoard(room,at,random); break;
      case 'roll': roll(room,at,random); break;
      case 'route': move(room,at,random,nodes[active(room).position].next[0]); break;
      case 'landing': nextTurn(room,at,random); break;
      case 'qualifier': launchMini(room,at,random); break;
      case 'mini': {
        const engine=getMiniGame(room.game);
        room.miniState=engine.advance(room.miniState,at);
        const scores=new Map(engine.results(room.miniState,now).map(result=>[result.playerId,result.score]));
        for (const player of room.players.filter(p=>p.qualified>=2)) {
          player.lastAward = Math.min(10,Math.floor((scores.get(player.lobbyId)??0)/miniGames[room.game].divisor));
          room.teams[player.team].score += player.lastAward;
        }
        finishRound(room,at);
        break;
      }
      case 'round-result': finishRound(room,at); break;
    }
  }
}
export function questionIndex(room, player) {
  return (room.round*7 + player.answers + (room.phase==='qualifier'?13:0)) % room.questions.length;
}
export function act(room, actor, input, now, random=Math.random, advanced=false) {
  if(!advanced) advance(room,now,random);
  if (input.action === 'start' && actor === room.host && room.phase==='lobby' && room.players.length>=room.teamCount) {
    const roster = [...room.players];
    for (let i=roster.length-1;i>0;i--) {
      const j=randomIndex(random,i+1);
      [roster[i],roster[j]]=[roster[j],roster[i]];
    }
    if(room.shared)roster.sort((a,b)=>Number(now-(b.lastSeen??0)<20000)-Number(now-(a.lastSeen??0)<20000));
    roster.forEach((p,i)=>{p.team=i%room.teamCount;p.turns=0;});
    if(room.reviewGame){
      for(const player of roster) player.qualified=2;
      launchMini(room,now,random);
    }else lightning(room,now);
    return true;
  }
  const player=room.players.find(p=>p.id===actor);
  if (!player || input.phase !== room.phase || input.since !== room.since) return false;
  if (input.action==='answer' && ['lightning','qualifier'].includes(room.phase) && input.sequence===player.answers) {
    const limit=room.phase==='qualifier'?3:room.questions.length;
    if(player.answers>=limit) return false;
    const q=room.questions[questionIndex(room,player)];
    const key=Array.isArray(q[2])?q[2]:[q[2]];
    const choices=Array.isArray(q[2])?input.choices:[input.choice];
    if (!Array.isArray(choices)||!choices.length||choices.length>q[1].length||
        new Set(choices).size!==choices.length||choices.some(choice=>!Number.isInteger(choice)||choice<0||choice>=q[1].length))return false;
    const correct=choices.length===key.length&&choices.every(choice=>key.includes(choice));
    player.answers++;
    player.total++;
    if (correct) player.correct++;
    player.feedback=correct?'Correct':`Correct: ${key.map(choice=>q[1][choice]).join(', ')}`;
    if(room.phase==='lightning') {
      room.teams[player.team].score+=correct?1:-1;
      if(room.players.every(p=>p.answers===limit)) openBoard(room,now,random);
    }
    else {
      player.qualified+=Number(correct);
      if(room.players.every(p=>p.answers===3)) launchMini(room,now,random);
    }
    return true;
  }
  if(actor===room.driver && room.phase==='roll' && input.action==='roll') {roll(room,now,random);return true;}
  if(actor===room.driver && room.phase==='route' && input.action==='route' && nodes[active(room).position].next.includes(input.destination)) {
    move(room,now,random,input.destination);
    return true;
  }
  if(room.phase==='mini'&&getMiniGame(room.game)&&input.action==='mini-input'&&player.qualified>=2){
    const result=getMiniGame(room.game).input(room.miniState,player.lobbyId,input.packet,now);
    room.miniState=result.state;return result.accepted;
  }
  return false;
}
