import {joinPath, studentJoinUrl} from './lib/join-link.js';
import {miniGames} from './lib/game-labels.js';
import {characterOptions} from './lib/character-options.js';
import {postSession,startSessionPolling} from './lib/session-network.js';
const app = document.querySelector('#app');
const message = document.querySelector('#notification');
const params = new URLSearchParams(location.search);
const path = location.pathname.replace(/\/$/, '');
const mode = [joinPath, '/multiplayer/join'].includes(path) ? 'student' : path === '/multiplayer/project' ? 'project' : 'host';
const key = 'teach-arcade-lobby:'+mode;
const joinKey = 'teach-arcade-lobby:attempt';
const codePattern = /^\d{6}$/;
const selectedCode = params.get('code');
let current = mode==='host'&&(params.has('set')||params.has('review')) ? null : load(key);
if (mode==='student' && selectedCode && current?.code!==selectedCode) current=null;
let setupChoices = {bank:params.get('set')??'demo'};
let bankSearch='';
let games=[];
let selectedGame=null;
let setUnavailable=false;
let stage = mode==='project' ? 'project' : current ? 'lobby' : mode==='host' ? 'set' : 'setup';
let info = null;
let editing = null;
let busy = false;
let polling = false;
let lastProjection = '';
let reviewEnabled=false;
let reviewGame=params.get('review')??'';
let teacherSetsConfigured=false;
function load(storeKey) {
  try { return JSON.parse(sessionStorage.getItem(storeKey)); }
  catch { return null; }
}

function text(value) {
  return String(value??'').replace(/[&<>"']/g, character =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[character]);
}

function notice(value) { message.textContent = value; }

function button(label, action, classes='', disabled=false) {
  return '<button type="button" data-action="'+action+'" class="'+classes+'" '+(disabled?'disabled':'')+'>'+label+'</button>';
}

function selectOptions(options, selected) {
  return options.map(({id,title})=>'<option value="'+text(id)+'" '+(id===selected?'selected':'')+'>'+text(title)+'</option>').join('');
}

function numericOptions(min,max,initial) {
  return selectOptions(Array.from({length:max-min+1},(_,index)=>({id:min+index,title:min+index})),initial);
}

function joinAddress(code) { return studentJoinUrl(location.origin, code); }
function joinLabel(url) { return (url.host === 'www.teacharcade.com' ? 'teacharcade.com' : url.host) + url.pathname; }

let banks=[];
let unavailableSet=null;
let cabinetNotice='';
const findBanks=()=>banks.filter(bank=>[bank.title,bank.subject,bank.category,bank.id]
  .some(value=>String(value??'').toLowerCase().includes(bankSearch.trim().toLowerCase())));
const bankOptions=matching=>selectOptions(matching.map(bank=>({
  ...bank,title:bank.id.startsWith('teacher:')?'My Cabinet · '+bank.title:bank.title
})),setupChoices.bank);

async function useGame(game) {
  selectedGame=game;
  if(!game)return;
  for(const setting of game.settings)setupChoices[setting.id]??=setting.default;
  banks=[{id:'demo',title:'Mixed review sample'}];
  if(game.banksPath){
    try{
      const response=await fetch(game.banksPath);
      if(response.ok)banks=banks.concat(await response.json());
    }catch{}
  }
  if(teacherSetsConfigured){
    try{
      const response=await fetch('/api/multiplayer?action=cabinet',{cache:'no-store',signal:AbortSignal.timeout(4000)});
      if(!response.ok)throw Error();
      const account=await response.json();
      banks.splice(1,0,...account.sets);
      if(!account.signedIn)cabinetNotice='Sign in to My Cabinet to use your saved question sets.';
    }catch{cabinetNotice='My Cabinet sets could not load. You can still use Teach Arcade Originals.';}
  }
  if(banks.some(bank=>bank.id===setupChoices.bank))return;
  if(setupChoices.bank.startsWith('teacher:')){
    try{
      const set=await api('cabinet-set',{set:setupChoices.bank});
      banks=[set,...banks];
      return;
    }catch(error){notice(error.message);}
  }
  setUnavailable=true;
  unavailableSet=setupChoices.bank;
  banks=[{id:unavailableSet,title:'Requested set unavailable'},...banks];
}

function setup() {
  if (mode==='student') {
    const code=info?.code??selectedCode??'';
    if (stage==='name') return '<section class="panel narrow"><h1>Join '+text(info.game)+'</h1><p class="muted">Enter a nickname for room '+text(code)+'.</p><form id="nickname"><label>Nickname<input name="name" maxlength="24" autocomplete="off" required></label><label>Character<select name="characterId">'+characterOptions+'</select></label><button class="primary">Join game</button> '+button('Change code','change-code')+'</form></section>';
    return '<section class="panel narrow"><h1>Join a game</h1><p class="muted">Enter the six-digit code from your teacher.</p><form id="lookup"><label>Game code<input name="code" maxlength="7" inputmode="numeric" value="'+text(code)+'" required></label><button class="primary">Continue</button></form></section>';
  }
  if(!selectedGame)return '<section class="panel"><h1>Host a game</h1><p>Game catalog unavailable. Reload to try again.</p></section>';
  if(stage==='set'){
    const matching=findBanks();
    return '<section class="panel narrow setup-step"><p class="step-kicker">STEP 1 OF 3 · QUESTIONS</p><h1>Start with your questions</h1><p class="muted">Choose the question set your class will use. Next, you’ll choose a game mode.</p>'+
      '<form id="choose-set"><label>Find a question set<input type="search" name="bankSearch" value="'+text(bankSearch)+'" placeholder="Search titles, subjects, and topics" autocomplete="off"></label><label>Question set<select name="bank" required>'+bankOptions(matching)+'</select></label><button type="submit" class="primary" '+(setUnavailable||!matching.some(bank=>bank.id===setupChoices.bank)?'disabled':'')+'>Continue to game mode</button></form>'+
      (cabinetNotice?'<p class="muted">'+text(cabinetNotice)+'</p>':'')+
      (teacherSetsConfigured?'<p><a href="/teacher/sets/?view=mine">Open My Question Sets</a></p>':'')+'</section>';
  }
  if(stage==='mode'){
    const bankTitle=banks.find(bank=>bank.id===setupChoices.bank)?.title||'Selected question set';
    const cards=games.map(game=>'<button type="button" class="mode-card '+(selectedGame.id===game.id?'selected':'')+'" data-action="choose-game:'+text(game.id)+'" aria-pressed="'+(selectedGame.id===game.id)+'"><span class="mode-icon" aria-hidden="true">🎡</span><span><small>BOARD GAME MODE</small><strong>'+text(game.title)+'</strong><em>Team play · question rounds · random arcade challenges</em></span><b class="mode-check">'+(selectedGame.id===game.id?'SELECTED':'CHOOSE')+'</b></button>').join('');
    return '<section class="panel narrow setup-step"><p class="step-kicker">STEP 2 OF 3 · GAME MODE</p><h1>Choose how to play</h1><p class="muted">Your question set is ready. Now choose the classroom game mode.</p><div class="chosen-set"><small>QUESTION SET</small><strong>'+text(bankTitle)+'</strong></div><div class="mode-list">'+cards+'</div><p class="actions">'+button('Back to questions','back-set')+button('Continue to team setup','to-settings','primary',!selectedGame)+'</p></section>';
  }
  const bankTitle=banks.find(bank=>bank.id===setupChoices.bank)?.title||'Selected question set';
  const reviewPicker=reviewEnabled?'<label>Review a mini-game<select name="reviewGame">'+selectOptions([{id:'',title:'Play the full session'},...Object.entries(miniGames).map(([id,game])=>({id,title:game.name}))],reviewGame)+'</select></label>':'';
  return '<section class="panel narrow setup-step"><p class="step-kicker">STEP 3 OF 3 · TEAM SETUP</p><h1>Set up '+text(selectedGame.title)+'</h1><p class="muted">Choose the team count and rounds, then open your lobby.</p><div class="chosen-set"><small>QUESTION SET · GAME MODE</small><strong>'+text(bankTitle)+'</strong><span>'+text(selectedGame.title)+' · mini-games selected randomly</span></div><form id="create"><input type="hidden" name="game" value="'+text(selectedGame.id)+'"><input type="hidden" name="bank" value="'+text(setupChoices.bank)+'"><div class="fields">'+
    selectedGame.settings.map(setting=>'<label>'+text(setting.label)+'<select name="'+text(setting.id)+'">'+
      numericOptions(setting.min,setting.max,setupChoices[setting.id])+'</select></label>').join('')+
    '</div>'+reviewPicker+'<button class="primary" '+(setUnavailable?'disabled':'')+'>Open '+text(selectedGame.title)+' lobby</button></form>'+button('Back to game mode','back-mode')+'</section>';
}

function rosterRows(state) {
  return state.roster.map(player=>{
    const renaming = editing===player.lobbyId;
    return '<li><strong>'+text(player.name)+'</strong><span class="roster-status">'+(player.connected?(player.ready?'Ready':'Connected'):'Disconnected')+'</span>'+
      button('Rename','rename:'+text(player.lobbyId))+button('Remove','remove:'+text(player.lobbyId),'danger')+
      (renaming?'<form id="rename"><label class="muted">New nickname <input name="name" aria-label="New nickname" value="'+text(player.name)+'" maxlength="24" required></label><button>Save</button></form>':'')+'</li>';
  }).join('');
}

function lobbyView() {
  if (!info?.state) return '<section class="panel"><h1>Opening room</h1></section>';
  const state=info.state;
  const disconnected=state.roster.filter(player=>!player.connected).length;
  if(mode==='student') return '<section class="panel narrow center"><h1>You’re in</h1><p><strong>'+text(state.player.name)+'</strong></p><p>'+text(info.game)+' · Room '+text(state.code)+'</p><p class="muted">Wait for your teacher to start the game.</p>'+button(state.player.ready?'Mark as waiting':'I’m ready','ready')+' '+button('Leave waiting room','clear')+'</section>';
  const url=joinAddress(state.code);
  const questionSet=state.questionSetTitle?'<p class="chosen-set"><strong>'+text(state.questionSetTitle)+'</strong> · '+text(state.questionCount)+' '+(state.questionCount===1?'question':'questions')+'</p>':'';
  return '<h1>'+text(info.game)+' lobby</h1>'+questionSet+'<div class="grid"><section class="panel"><h2>Class roster</h2><p>'+state.roster.filter(player=>player.connected).length+' connected · '+state.roster.filter(player=>player.connected&&player.ready).length+' ready'+(state.settingsSummary?' · '+text(state.settingsSummary):'')+'</p>'+
    '<p class="muted">'+text(state.lobbyRule)+'</p><ul class="roster">'+rosterRows(state)+'</ul>'+
    (disconnected?'<p class="muted">'+disconnected+' disconnected '+(disconnected===1?'player is':'players are')+' still listed. Remove them to clear old seats.</p>':'')+
    '<p class="actions">'+button(state.locked?'Unlock joining':'Lock joining','lock')+
    (disconnected?button('Remove disconnected ('+disconnected+')','prune-disconnected','danger'):'')+
    button('Start game','start','primary',!state.canStart)+button('Close lobby','clear')+'</p>'+
    '</section><aside class="panel"><h2>Room code</h2><div class="slot">'+text(state.code)+'</div>'+
    '<p class="muted"><a href="'+text(url.href)+'" target="_blank" rel="noopener">'+text(joinLabel(url))+'</a></p>'+
    '<p class="actions">'+button('Copy join link','copy')+'<a href="/multiplayer/project/?code='+text(state.code)+'" target="_blank" rel="noopener">Open projector view</a></p>'+
    '</aside></div>';
}

function render() {
  if (mode==='project') {
    const state=info;
    if (!state) app.innerHTML='<h1>Connecting to room</h1>';
    else {
      const url=joinAddress(state.code);
      const waiting=state.phase==='lobby';
      const phaseNames={lightning:'Lightning round',standings:'Team standings',roll:'Team turn',route:'Choose a path',landing:'Team landing',qualifier:'Mini-game qualifier',mini:'Arcade challenge','round-result':'Round results',finished:'Final standings'};
      const scoreboard=(state.teams||[]).slice().sort((a,b)=>b.score-a.score).map(team=>'<li><span class="project-team" style="--team:'+text(team.color)+'">'+text(team.name)+'</span><strong>'+text(team.score)+'</strong></li>').join('');
      app.innerHTML='<section class="panel project '+(waiting?'':'project-game')+'"><div class="project-main"><p class="brand">TEACH ARCADE · CLASSROOM SCREEN</p><h1>'+text(state.game)+'</h1><p class="project-phase">'+(waiting?'Students join here':text(phaseNames[state.phase]||'Game in progress'))+'</p><div class="slot">'+text(state.code)+'</div><p>'+state.count+' students '+(waiting?'joined':'playing')+(state.rounds?' · Round '+state.round+'/'+state.rounds:'')+'</p>'+(state.driver&&!waiting?'<p>Current driver · '+text(state.driver)+'</p>':'')+'</div>'+(waiting?'<div class="project-qr"><p>'+text(joinLabel(url))+'</p><img class="qr" src="'+text(state.qr)+'" alt="QR code for the student join page"></div>':'<aside class="project-score"><h2>Team scores</h2><ol>'+scoreboard+'</ol></aside>')+'</section>';
    }
  } else app.innerHTML=stage==='lobby'?lobbyView():setup();
  app.setAttribute('aria-busy','false');
}

async function api(action, fields={}) {
  const headers={'Content-Type':'application/json'};
  const response=await postSession('/api/multiplayer',{...current,...fields,action},{headers});
  const data=response.data;
  if(!response.ok) {
    const error=new Error(data.error||'The lobby could not process that request.');
    error.status=response.status;
    throw error;
  }
  return data;
}

function handoff(data) {
  const url=new URL(data.gamePath,location.origin);
  url.searchParams.set(mode==='host'?'host':'join','');
  url.searchParams.set('code',current.code);
  sessionStorage.setItem(data.credentialNamespace+':'+mode,JSON.stringify(current));
  location.replace(url);
}

function accept(data) {
  if(info?.state && info.state.revision>data.state.revision)return;
  const visible=state=>state&&[state.code,state.phase,state.locked,state.settingsSummary,state.roster,state.player?.name,state.player?.ready];
  const changed=JSON.stringify(visible(info?.state))!==JSON.stringify(visible(data.state));
  info=data;
  if(data.state.phase==='closed'){loseRoom();return;}
  if(data.state.phase!=='lobby') {handoff(data);return;}
  if(changed&&!editing) render();
}

async function refresh() {
  if(busy||polling||(!current&&mode!=='project')) return;
  polling=true;
  try {
    if(mode==='project') {
      const data=await api('projection',{code:selectedCode});
      const marker=JSON.stringify(data);
      if(marker!==lastProjection){lastProjection=marker;info=data;render();}
    } else {
      const data=await api('state');
      if(busy||!current||current.code!==data.state.code)return;
      accept(data);
    }
  } catch(error) {
    if([403,404].includes(error.status)) {
      if(mode==='project'){info=null; app.innerHTML='<h1>Room unavailable</h1>';}
      else {loseRoom();}
    }
    notice(error.message);
    return !(!error.status||error.status>=500||error.status===429);
  } finally { polling=false; }
}

function loseRoom() {
  sessionStorage.removeItem(key);
  current=null;
  info=null;
  editing=null;
  stage=mode==='host'?'set':'setup';
  render();
}

function attemptFor(code) {
  const past=load(joinKey);
  if(past?.code===code) return past.id;
  const bytes=crypto.getRandomValues(new Uint8Array(16));
  const value=Array.from(bytes,byte=>byte.toString(16).padStart(2,'0')).join('');
  const id=value.slice(0,8)+'-'+value.slice(8,12)+'-'+value.slice(12,16)+'-'+value.slice(16,20)+'-'+value.slice(20);
  sessionStorage.setItem(joinKey,JSON.stringify({code,id}));
  return id;
}

async function lookUp(raw) {
  const code=String(raw??'').replace(/\s/g,'');
  if(!codePattern.test(code)) throw new Error('Enter a six-digit code.');
  const room=await api('lookup',{code});
  if(!room.open) throw new Error('This room has closed to new players.');
  info=room;
  stage='name';
  render();
  app.querySelector('input[name=name]').focus();
}

function remember(data) {
  current={code:data.state.code,token:data.token};
  sessionStorage.setItem(key,JSON.stringify(current));
  stage='lobby';
  if(mode==='host')history.replaceState(null,'','/multiplayer/');
  accept(data);
}

async function run(action) {
  if(busy) return;
  busy=true;
  notice('');
  try{ await action(); }
  catch(error){ notice(error.message||'Connection interrupted. Try again.'); }
  finally{ busy=false; }
}

app.addEventListener('submit',event=>{
  event.preventDefault();
  const form=event.target;
  const data=new FormData(form);
  void run(async()=>{
    if(form.id==='choose-set'){
      const bank=data.get('bank');
      if(!bank||bank===unavailableSet||!banks.some(set=>set.id===bank))return;
      if(bank.startsWith('teacher:'))await api('cabinet-set',{set:bank});
      setupChoices.bank=bank;
      bankSearch=data.get('bankSearch')||'';
      stage='mode';render();return;
    }
    if(form.id==='create') remember(await api('create',{
      game:data.get('game'),bank:data.get('bank'),reviewGame:data.get('reviewGame'),...Object.fromEntries(selectedGame.settings.map(setting=>[setting.id,Number(data.get(setting.id))]))
    }));
    if(form.id==='lookup') await lookUp(data.get('code'));
    if(form.id==='nickname') remember(await api('join',{code:info.code,name:data.get('name'),characterId:data.get('characterId'),joinId:attemptFor(info.code)}));
    if(form.id==='rename') {
      const response=await api('rename',{playerId:editing,name:data.get('name')});
      editing=null;
      accept(response);
      render();
    }
  });
});

app.addEventListener('click',event=>{
  const control=event.target.closest('button[data-action]');
  if(!control) return;
  const [action,slot]=control.dataset.action.split(':');
  void run(async()=>{
    if(action==='choose-game'){
      const choice=games.find(game=>game.id===slot);
      if(choice){selectedGame=choice;for(const setting of choice.settings)setupChoices[setting.id]??=setting.default;render();}
    }
    if(action==='to-settings'){stage='settings';render();}
    if(action==='back-set'){stage='set';render();}
    if(action==='back-mode'){stage='mode';render();}
    if(action==='change-code') {stage='setup';info=null;render();}
    if(action==='clear') {
      if(confirm(mode==='host'?'Close this waiting room for everyone?':'Leave this waiting room?')) {
        await api(mode==='host'?'close':'leave');
        loseRoom();sessionStorage.removeItem(joinKey);
      }
    }
    if(action==='copy') {
      const link=joinAddress(current.code).href;
      try { await navigator.clipboard.writeText(link);notice('Join link copied.'); }
      catch { notice(link); }
    }
    if(action==='ready')accept(await api('ready',{ready:!info.state.player.ready}));
    if(action==='lock') accept(await api('lock',{locked:!info.state.locked}));
    if(action==='prune-disconnected'&&confirm('Remove all disconnected players from this waiting room?')) {
      const response=await api('prune-disconnected');
      accept(response);
      notice((response.removed??0)+' disconnected '+((response.removed??0)===1?'player':'players')+' removed.');
    }
    if(action==='start') accept(await api('start'));
    if(action==='rename') {editing=slot;render();app.querySelector('#rename input').focus();}
    if(action==='remove'&&confirm('Remove this player from the room?')) {
      editing=null;
      accept(await api('remove',{playerId:slot}));
      render();
    }
  });
});

if(mode==='project') document.querySelector('#header').hidden=true;
if(mode==='host'){
  try {
    const catalog=await api('catalog');
    games=catalog.games;
    reviewEnabled=catalog.reviewEnabled;
    teacherSetsConfigured=catalog.teacherSetsConfigured;
    await useGame(games.find(game=>game.id===params.get('game'))??games[0]);
    if(!current&&params.has('set')&&!setUnavailable)stage='mode';
    if(!current&&reviewEnabled&&Object.hasOwn(miniGames,reviewGame)){
      stage='settings';
      setupChoices.teams=2;
      setupChoices.rounds=1;
    }
  }catch(error){notice(error.message);}
  app.addEventListener('change',event=>{
    if(event.target.name==='bank'){
      setupChoices.bank=event.target.value;
      setUnavailable=setupChoices.bank===unavailableSet;
      const submit=app.querySelector('#choose-set button[type=submit]');
      if(submit)submit.disabled=setUnavailable||!setupChoices.bank;
      notice('');
      return;
    }
  });
  app.addEventListener('input',event=>{
    if(event.target.name!=='bankSearch')return;
    bankSearch=event.target.value;
    const select=app.querySelector('#choose-set select[name=bank]');
    if(!select)return;
    const matching=findBanks();
    const previous=setupChoices.bank;
    const selected=matching.some(bank=>bank.id===previous)?previous:matching[0]?.id;
    if(selected)setupChoices.bank=selected;
    setUnavailable=setupChoices.bank===unavailableSet;
    select.innerHTML=bankOptions(matching);
    const submit=app.querySelector('#choose-set button[type=submit]');
    if(submit)submit.disabled=setUnavailable||!matching.length;
  });
}
render();
if(mode==='student'&&!current&&selectedCode) await run(()=>lookUp(selectedCode));
startSessionPolling(refresh);
