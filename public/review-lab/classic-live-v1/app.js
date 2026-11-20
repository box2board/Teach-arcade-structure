import { BANK_SETS } from '../bank-catalog.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const views = {
  setup: $('#setupView'),
  lobby: $('#lobbyView'),
  game: $('#gameView')
};
const phases = {
  question: $('#questionPhase'),
  reveal: $('#revealPhase'),
  leaderboard: $('#leaderboardPhase'),
  results: $('#resultsPhase')
};

const state = {
  set: null,
  questions: [],
  questionLimit: 20,
  questionSeconds: 30,
  index: 0,
  phase: 'setup',
  phaseSeconds: 0,
  timer: null,
  paused: false,
  pauseStartedAt: 0,
  pausedDurationMs: 0,
  players: [],
  responseTimers: [],
  answers: new Map(),
  currentQuestionStartedAt: 0,
  redemptionQueue: [],
  usedRedemptions: new Set(),
  totalClassCorrect: 0,
  totalClassAnswers: 0,
  hardest: null,
  event: null
};

const NAMES = ['PixelFox','Maya','Noah','Jordan','Ava','Eli','Sophia','Liam','Emma','Mateo','Olivia','Mason','Harper','Lucas','Amelia','Ethan','Zoe','Nora'];

function setView(name){
  Object.values(views).forEach(v => v.classList.remove('active'));
  views[name].classList.add('active');
}
function setPhase(name){
  Object.values(phases).forEach(v => v.classList.remove('active'));
  phases[name].classList.add('active');
  state.phase = name;
  $('#phaseLabel').textContent = name.toUpperCase();
  $('#pauseBtn').disabled = name !== 'question';
  $('#skipBtn').disabled = name === 'results';
}
function shuffle(arr){
  const copy = [...arr];
  for(let i=copy.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
}
function escapeHtml(value){
  return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

function populateSetSelect(){
  const select = $('#setSelect');
  const grouped = new Map();
  for(const set of BANK_SETS){
    const key = `${set.subject} · ${set.category}`;
    if(!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(set);
  }
  select.innerHTML = '';
  [...grouped.entries()].sort(([a],[b])=>a.localeCompare(b)).forEach(([label, sets])=>{
    const group=document.createElement('optgroup');
    group.label=label;
    sets.sort((a,b)=>a.title.localeCompare(b.title)).forEach(set=>{
      const opt=document.createElement('option');
      opt.value=set.id;
      opt.textContent=set.title;
      group.appendChild(opt);
    });
    select.appendChild(group);
  });
  const preferred = BANK_SETS.find(s=>/world war i/i.test(s.title)) || BANK_SETS.find(s=>/enlightenment/i.test(s.title)) || BANK_SETS[0];
  if(preferred) select.value=preferred.id;
  updateSetMeta();
  $('#openLobbyBtn').disabled = !preferred;
}
function updateSetMeta(){
  const meta = BANK_SETS.find(s=>s.id === $('#setSelect').value);
  if(!meta) return;
  $('#setMeta').innerHTML = `<strong>${escapeHtml(meta.title)}</strong> · ${escapeHtml(meta.subject)} · ${escapeHtml(meta.category)} · ${meta.questionCount} questions · ${escapeHtml(meta.gradeBand)}`;
}

async function loadSelectedSet(){
  const meta = BANK_SETS.find(s=>s.id === $('#setSelect').value);
  if(!meta) throw new Error('Question set not found.');
  const response = await fetch(`../question-sets/library/${meta.file}`);
  if(!response.ok) throw new Error(`Could not load ${meta.title}.`);
  const bank = await response.json();
  state.set = bank;
  state.questionLimit = Number($('#countSelect').value);
  state.questionSeconds = Number($('#timeSelect').value);
  state.questions = shuffle(bank.questions).slice(0, Math.min(state.questionLimit, bank.questions.length));
}

function seedPlayers(){
  state.players = NAMES.map((name,index)=>({
    id:index,
    name,
    score:0,
    streak:0,
    longestStreak:0,
    correct:0,
    answered:0,
    skill:index===0 ? 0.76 : 0.58 + Math.random()*0.34,
    speed:index===0 ? 0.62 : 0.35 + Math.random()*0.58
  }));
}
function renderRoster(){
  $('#playerCount').textContent = `${state.players.length} joined`;
  $('#roster').innerHTML = state.players.map(p=>`<span>${escapeHtml(p.name)}</span>`).join('');
}

function resetRun(){
  stopTimer();
  clearResponseTimers();
  state.index=0;
  state.redemptionQueue=[];
  state.usedRedemptions.clear();
  state.totalClassCorrect=0;
  state.totalClassAnswers=0;
  state.hardest=null;
  state.paused=false;
  state.pauseStartedAt=0;
  state.pausedDurationMs=0;
  state.event=null;
  seedPlayers();
  $('#pauseBtn').textContent='Pause';
  document.body.classList.remove('paused');
}

function currentRound(){
  if(state.index < state.questions.length) return {question:state.questions[state.index], redemption:false};
  const redIndex = state.index - state.questions.length;
  if(redIndex < state.redemptionQueue.length) return {question:state.redemptionQueue[redIndex], redemption:true};
  return null;
}

function startQuestion(){
  const round=currentRound();
  if(!round){ finishGame(); return; }
  clearResponseTimers();
  state.answers = new Map();
  state.currentQuestionStartedAt = performance.now();
  state.pausedDurationMs=0;
  state.pauseStartedAt=0;
  state.paused=false;
  $('#pauseBtn').textContent='Pause';
  document.body.classList.remove('paused');
  state.event = shouldTriggerEvent() ? {type:'double', label:'🎟 DOUBLE TICKET ROUND'} : null;
  setPhase('question');

  const totalPlanned = state.questions.length + state.redemptionQueue.length;
  $('#roundLabel').textContent = round.redemption ? `REDEMPTION ROUND · ${state.index+1}` : `QUESTION ${state.index+1} OF ${totalPlanned}`;
  $('#topicLabel').textContent = state.set.title;
  $('#questionText').textContent = round.question.question;
  $('#answeredCount').textContent = `0 / ${state.players.length} answered`;
  $('#accuracyLive').textContent = 'Waiting for answers…';
  $('#answeredBar').style.width='0%';
  $('#eventBanner').classList.toggle('hidden', !state.event);
  $('#eventBanner').textContent = state.event?.label || '';

  renderTeacherChoices(round.question);
  renderStudentQuestion(round.question, round.redemption);
  scheduleBots(round.question, state.questionSeconds);
  startCountdown(state.questionSeconds, endQuestion);
}

function renderTeacherChoices(question){
  $('#teacherChoices').innerHTML = question.choices.map((choice,i)=>`
    <div class="teacher-choice"><span class="choice-letter">${String.fromCharCode(65+i)}</span><span>${escapeHtml(choice)}</span></div>
  `).join('');
}
function renderStudentQuestion(question, redemption){
  $('#studentPrompt').textContent = `${redemption ? '🔄 Redemption · ' : ''}${question.question}`;
  $('#studentFeedback').className='student-feedback';
  $('#studentFeedback').textContent='';
  $('#studentChoices').innerHTML = question.choices.map((choice,i)=>`<button type="button" class="student-choice" data-answer="${i}"><strong>${String.fromCharCode(65+i)}.</strong> ${escapeHtml(choice)}</button>`).join('');
  $$('#studentChoices button').forEach(btn=>btn.addEventListener('click',()=>{
    const elapsed=performance.now()-state.currentQuestionStartedAt-state.pausedDurationMs;
    submitAnswer(0,Number(btn.dataset.answer),elapsed);
  }));
  renderStudentStats();
}

function scheduleBots(question, secondsRemaining=state.questionSeconds){
  const windowMs=Math.max(1000, secondsRemaining*1000);
  for(const player of state.players.slice(1)){
    if(state.answers.has(player.id)) continue;
    const target=700 + (1-player.speed)*windowMs*.45 + Math.random()*1200;
    const delay=Math.max(350,Math.min(windowMs-150,target));
    const handle=setTimeout(()=>{
      if(state.phase!=='question' || state.paused || state.answers.has(player.id)) return;
      let choice;
      if(Math.random() < player.skill){ choice=question.correctAnswer; }
      else { choice=shuffle([0,1,2,3].filter(i=>i!==question.correctAnswer))[0]; }
      submitAnswer(player.id, choice, delay);
    }, delay);
    state.responseTimers.push(handle);
  }
}

function submitAnswer(playerId, choice, elapsedMs){
  if(state.phase!=='question' || state.paused || state.answers.has(playerId)) return;
  const round=currentRound();
  if(!round) return;
  const player=state.players.find(p=>p.id===playerId);
  const correct=choice===round.question.correctAnswer;
  const speedRatio=Math.max(0,1-(elapsedMs/(state.questionSeconds*1000)));
  const speedBonus=correct ? Math.round(speedRatio*100) : 0;
  if(correct){
    player.streak += 1;
    player.longestStreak=Math.max(player.longestStreak,player.streak);
    const streakBonus=Math.min(125, Math.max(0,player.streak-1)*25);
    const eventMultiplier=state.event?.type==='double' ? 2 : 1;
    player.score += (500 + speedBonus + streakBonus) * eventMultiplier;
    player.correct += 1;
  }else{
    player.streak=0;
  }
  player.answered += 1;
  state.answers.set(playerId,{choice,correct,elapsedMs});

  if(playerId===0){
    $$('#studentChoices button').forEach(b=>{b.disabled=true;b.classList.toggle('selected',Number(b.dataset.answer)===choice)});
    $('#studentFeedback').className=`student-feedback ${correct?'good':'bad'}`;
    $('#studentFeedback').textContent=correct ? `Correct! ${state.event?.type==='double'?'Double tickets! ':''}+${player.score ? 'score updated' : ''}` : 'Answer locked in.';
    renderStudentStats();
  }
  updateResponseMeter();
  if(state.answers.size===state.players.length){ endQuestion(); }
}

function updateResponseMeter(){
  const answered=state.answers.size;
  const correct=[...state.answers.values()].filter(a=>a.correct).length;
  $('#answeredCount').textContent=`${answered} / ${state.players.length} answered`;
  $('#answeredBar').style.width=`${(answered/state.players.length)*100}%`;
  $('#accuracyLive').textContent=answered ? `${Math.round(correct/answered*100)}% correct so far` : 'Waiting for answers…';
}

function endQuestion(){
  if(state.phase!=='question') return;
  stopTimer();
  clearResponseTimers();
  state.paused=false;
  state.pauseStartedAt=0;
  $('#pauseBtn').textContent='Pause';
  document.body.classList.remove('paused');
  const round=currentRound();
  if(!round) return;

  for(const player of state.players){
    if(!state.answers.has(player.id)){
      player.streak=0;
      state.answers.set(player.id,{choice:null,correct:false,elapsedMs:state.questionSeconds*1000});
    }
  }

  const counts=[0,0,0,0];
  let correctCount=0;
  for(const ans of state.answers.values()){
    if(ans.choice!==null) counts[ans.choice] += 1;
    if(ans.correct) correctCount += 1;
  }
  const accuracy=correctCount/state.players.length;
  state.totalClassCorrect += correctCount;
  state.totalClassAnswers += state.players.length;
  if(!state.hardest || accuracy < state.hardest.accuracy){ state.hardest={question:round.question.question,accuracy}; }
  if(!round.redemption && accuracy < .6 && !state.usedRedemptions.has(round.question.id)){
    state.redemptionQueue.push(round.question);
    state.usedRedemptions.add(round.question.id);
  }

  renderReveal(round.question,counts,accuracy,round.redemption);
  setPhase('reveal');
  startCountdown(5,showLeaderboard);
}

function renderReveal(question,counts,accuracy,redemption){
  $('#revealQuestion').textContent=question.question;
  $('#distribution').innerHTML=question.choices.map((choice,i)=>{
    const pct=Math.round((counts[i]/state.players.length)*100);
    const correct=i===question.correctAnswer;
    return `<div class="dist-row ${correct?'correct':''}"><div class="dist-label"><span class="choice-letter">${String.fromCharCode(65+i)}</span><span>${escapeHtml(choice)}</span></div><div class="dist-track"><span style="width:${pct}%"></span></div><strong>${pct}%</strong></div>`;
  }).join('');
  $('#classResult').textContent=`${redemption?'Redemption result':'Class result'}: ${Math.round(accuracy*100)}% correct${!redemption && accuracy<.6?' · queued for a Redemption Round':''}`;
  const demo=state.answers.get(0);
  $('#studentPrompt').textContent=`Correct answer: ${String.fromCharCode(65+question.correctAnswer)}. ${question.choices[question.correctAnswer]}`;
  $('#studentChoices').innerHTML='';
  $('#studentFeedback').className=`student-feedback ${demo.correct?'good':'bad'}`;
  $('#studentFeedback').textContent=demo.correct ? '✓ Correct — tickets added.' : 'Not quite — review the correct answer above.';
  renderStudentStats();
}

function showLeaderboard(){
  if(state.phase!=='reveal') return;
  stopTimer();
  setPhase('leaderboard');
  renderLeaderboard();
  $('#timerDisplay').textContent='—';
  $('#studentPrompt').textContent='Leaderboard break — waiting for the teacher to start the next question.';
  $('#studentChoices').innerHTML='';
}
function renderLeaderboard(){
  const ranked=[...state.players].sort((a,b)=>b.score-a.score || b.correct-a.correct || a.name.localeCompare(b.name));
  $('#leaderboard').innerHTML=ranked.slice(0,5).map((p,i)=>`<div class="rank-row"><span class="rank-num">${i+1}</span><span class="rank-name">${escapeHtml(p.name)}</span><span class="rank-score">${Math.round(p.score).toLocaleString()} 🎟</span></div>`).join('');
  renderStudentStats();
}
function nextQuestion(){
  if(state.phase!=='leaderboard') return;
  stopTimer();
  state.index += 1;
  startQuestion();
}

function startCountdown(seconds,onDone){
  stopTimer();
  state.phaseSeconds=seconds;
  $('#timerDisplay').textContent=state.phaseSeconds;
  state.timer=setInterval(()=>{
    if(state.paused) return;
    state.phaseSeconds -= 1;
    $('#timerDisplay').textContent=Math.max(0,state.phaseSeconds);
    if(state.phaseSeconds<=0){ stopTimer(); onDone(); }
  },1000);
}
function stopTimer(){ if(state.timer){clearInterval(state.timer);state.timer=null;} }
function clearResponseTimers(){ state.responseTimers.forEach(clearTimeout);state.responseTimers=[]; }
function shouldTriggerEvent(){
  return state.index>0 && state.index%5===0 && state.index<state.questions.length;
}

function renderStudentStats(){
  const ranked=[...state.players].sort((a,b)=>b.score-a.score || b.correct-a.correct);
  const me=state.players[0];
  const rank=ranked.findIndex(p=>p.id===0)+1;
  $('#studentRank').textContent=`#${rank || '—'}`;
  $('#studentTickets').textContent=`${Math.round(me.score).toLocaleString()} 🎟`;
  $('#studentStreak').textContent=`${me.streak} 🔥`;
  const level=Math.min(5,1+Math.floor(me.score/2500));
  $('#cabinet').className=`cabinet level-${level}`;
  $('#cabinetLevel').textContent=`LEVEL ${level}`;
}

function finishGame(){
  stopTimer();
  clearResponseTimers();
  setPhase('results');
  $('#timerDisplay').textContent='—';
  $('#pauseBtn').disabled=true;
  $('#skipBtn').disabled=true;
  const ranked=[...state.players].sort((a,b)=>b.score-a.score || b.correct-a.correct);
  const top=ranked.slice(0,3);
  const order=[top[1],top[0],top[2]].filter(Boolean);
  $('#podium').innerHTML=order.map(p=>{
    const actual=ranked.indexOf(p)+1;
    return `<div class="podium-card ${actual===1?'first':''}"><strong>${actual===1?'🥇':actual===2?'🥈':'🥉'} ${escapeHtml(p.name)}</strong><span>${Math.round(p.score).toLocaleString()} Tickets</span></div>`;
  }).join('');
  const avg=Math.round((state.totalClassCorrect/Math.max(1,state.totalClassAnswers))*100);
  const longest=Math.max(...state.players.map(p=>p.longestStreak));
  $('#summaryStats').innerHTML=`<div><strong>${avg}%</strong><span>Class accuracy</span></div><div><strong>${longest}</strong><span>Longest streak</span></div><div><strong>${state.redemptionQueue.length}</strong><span>Redemption rounds</span></div>`;
  $('#studentPrompt').textContent=`Game complete. Class accuracy: ${avg}%.`;
  $('#studentChoices').innerHTML='';
  renderStudentStats();
}

function teacherSkip(){
  if(state.phase==='question') endQuestion();
  else if(state.phase==='reveal'){ stopTimer(); showLeaderboard(); }
  else if(state.phase==='leaderboard') nextQuestion();
}
function togglePause(){
  if(state.phase!=='question') return;
  state.paused=!state.paused;
  if(state.paused){
    state.pauseStartedAt=performance.now();
    clearResponseTimers();
  }else{
    if(state.pauseStartedAt){
      state.pausedDurationMs += performance.now()-state.pauseStartedAt;
      state.pauseStartedAt=0;
    }
    const round=currentRound();
    if(round) scheduleBots(round.question, Math.max(1,state.phaseSeconds));
  }
  $('#pauseBtn').textContent=state.paused?'Resume':'Pause';
  document.body.classList.toggle('paused',state.paused);
}

$('#setSelect').addEventListener('change',updateSetMeta);
$('#openLobbyBtn').addEventListener('click',async()=>{
  $('#openLobbyBtn').disabled=true;
  $('#openLobbyBtn').textContent='Loading…';
  try{
    await loadSelectedSet();
    resetRun();
    renderRoster();
    setView('lobby');
  }catch(err){
    $('#setMeta').textContent=err.message;
  }finally{
    $('#openLobbyBtn').disabled=false;
    $('#openLobbyBtn').textContent='Open Class Lobby';
  }
});
$('#startGameBtn').addEventListener('click',()=>{
  setView('game');
  $('#skipBtn').disabled=false;
  startQuestion();
});
$('#skipBtn').addEventListener('click',teacherSkip);
$('#pauseBtn').addEventListener('click',togglePause);
$('#restartBtn').addEventListener('click',()=>{
  resetRun();
  renderRoster();
  setView('lobby');
});

populateSetSelect();
