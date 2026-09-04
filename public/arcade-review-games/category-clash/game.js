(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = 'teachArcade.categoryClash.v1';
  const palette = ['#4de3d1','#ffd45c','#ff6b7a','#9c7cff','#55a7ff','#ff9d4d','#78dd75','#ef82d5'];
  const sample = {
    version: 1, title: 'Brainwave Battle', timerEnabled: true, timerSeconds: 30, finalEnabled: true,
    teams: [{name:'Team Nova',color:palette[0]},{name:'Quiz Crew',color:palette[1]},{name:'Bright Sparks',color:palette[2]}],
    categories: [
      ['Word Works',['A word that means the opposite of another word.','What is an antonym?'],['The main character in a story.','Who is the protagonist?'],['A comparison using like or as.','What is a simile?']],
      ['Number Lab',['The product of 7 and 8.','What is 56?'],['The name for a triangle with three equal sides.','What is an equilateral triangle?'],['The value of 3 squared plus 4 squared.','What is 25?']],
      ['Science Signals',['The force that pulls objects toward Earth.','What is gravity?'],['The process plants use to make food from light.','What is photosynthesis?'],['The smallest unit of a living organism.','What is a cell?']],
      ['World Window',['The largest ocean on Earth.','What is the Pacific Ocean?'],['The imaginary line dividing the Northern and Southern Hemispheres.','What is the equator?'],['The continent containing the Sahara Desert.','What is Africa?']],
      ['Mixed Bag',['The number of sides on a hexagon.','What is six?'],['The instrument used to measure temperature.','What is a thermometer?'],['The author of a written work.','Who is the writer?']]
    ].map((c,ci)=>({name:c[0],questions:c.slice(1).map((q,qi)=>({question:q[0],answer:q[1],points:(qi+1)*100,power:ci===2&&qi===1}))})),
    final:{category:'Big Picture',question:'Name one habit that helps a team learn successfully, and explain why it works.',answer:'Answers vary: examples include listening, sharing evidence, practicing, asking questions, or giving constructive feedback.'}
  };
  let data, state, timerId = null, secondsLeft = 30, timerRunning = false, audioCtx = null;

  function clone(value){ return JSON.parse(JSON.stringify(value)); }
  function normalize(raw){
    const safe = raw && typeof raw === 'object' ? raw : clone(sample);
    return {
      version:1, title:String(safe.title||'Untitled Clash').slice(0,80), timerEnabled:safe.timerEnabled!==false,
      timerSeconds:Math.min(300,Math.max(5,Number(safe.timerSeconds)||30)), finalEnabled:safe.finalEnabled!==false,
      teams:(Array.isArray(safe.teams)?safe.teams:sample.teams).slice(0,8).map((t,i)=>({name:String(t.name||`Team ${i+1}`).slice(0,30),color:/^#[0-9a-f]{6}$/i.test(t.color)?t.color:palette[i]})).concat([]).slice(0,8),
      categories:(Array.isArray(safe.categories)?safe.categories:sample.categories).slice(0,6).map((c,ci)=>({name:String(c.name||`Category ${ci+1}`).slice(0,50),questions:(Array.isArray(c.questions)?c.questions:[]).slice(0,5).map((q,qi)=>({question:String(q.question||''),answer:String(q.answer||''),points:Math.max(0,Number(q.points)||((qi+1)*100)),power:Boolean(q.power)}))})),
      final:{category:String(safe.final?.category||'Final Face-off').slice(0,50),question:String(safe.final?.question||''),answer:String(safe.final?.answer||'')}
    };
  }
  function ensureTeams(){ while(data.teams.length<2)data.teams.push({name:`Team ${data.teams.length+1}`,color:palette[data.teams.length]}); }
  function loadLocal(){ try{return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY)));}catch{return clone(sample);} }
  function persist(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(data)); }
  function announce(message){ $('notice').textContent=message; clearTimeout(announce.timeout); announce.timeout=setTimeout(()=>$('notice').textContent='',2800); }
  function sound(kind='tap'){
    if(state && !state.soundOn)return;
    try{ audioCtx ||= new (window.AudioContext||window.webkitAudioContext)(); const osc=audioCtx.createOscillator(),gain=audioCtx.createGain(); osc.connect(gain);gain.connect(audioCtx.destination);osc.type='sine';osc.frequency.value=kind==='good'?660:kind==='bad'?180:kind==='win'?880:360;gain.gain.setValueAtTime(.06,audioCtx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.18);osc.start();osc.stop(audioCtx.currentTime+.18);}catch{/* Audio is optional. */}
  }
  function show(view){ ['setupView','boardView','questionView','finalView','winnerView'].forEach(id=>$(id).hidden=id!==view); window.scrollTo({top:0,behavior:'smooth'}); }

  function renderSetup(){
    ensureTeams(); $('titleInput').value=data.title; $('timerEnabled').checked=data.timerEnabled; $('timerSeconds').value=data.timerSeconds; $('finalEnabled').checked=data.finalEnabled; $('finalEditor').hidden=!data.finalEnabled;
    $('teamCount').innerHTML=Array.from({length:7},(_,i)=>`<option value="${i+2}" ${(i+2)===data.teams.length?'selected':''}>${i+2}</option>`).join('');
    $('teamEditor').innerHTML=data.teams.map((t,i)=>`<div class="team-row"><label class="field"><span>Color</span><input type="color" data-team-color="${i}" value="${t.color}" aria-label="${escapeHtml(t.name)} color"></label><label class="field"><span>Team ${i+1}</span><input data-team-name="${i}" value="${escapeHtml(t.name)}" maxlength="30"></label></div>`).join('');
    $('categoryEditor').innerHTML=data.categories.map((c,ci)=>`<article class="category-card"><div class="category-head"><input data-cat-name="${ci}" value="${escapeHtml(c.name)}" maxlength="50" aria-label="Category ${ci+1} name"><button class="remove-btn" data-remove-cat="${ci}" aria-label="Remove ${escapeHtml(c.name)}">×</button></div>${c.questions.map((q,qi)=>questionEditor(q,ci,qi)).join('')}<button class="btn secondary add-question" data-add-question="${ci}" ${c.questions.length>=5?'disabled':''}>+ Add question</button></article>`).join('');
    $('addCategoryBtn').disabled=data.categories.length>=6; $('finalCategory').value=data.final.category; $('finalQuestion').value=data.final.question; $('finalAnswer').value=data.final.answer;
  }
  function questionEditor(q,ci,qi){ return `<details class="question-edit"><summary>${q.points} points · Question ${qi+1}${q.power?' · ⚡ Power Play':''}</summary><div class="question-fields"><label class="field"><span>Question</span><textarea rows="2" data-q="question" data-ci="${ci}" data-qi="${qi}">${escapeHtml(q.question)}</textarea></label><label class="field"><span>Answer</span><textarea rows="2" data-q="answer" data-ci="${ci}" data-qi="${qi}">${escapeHtml(q.answer)}</textarea></label><div class="question-options"><label class="field"><span>Points</span><input type="number" min="0" step="50" data-q="points" data-ci="${ci}" data-qi="${qi}" value="${q.points}"></label><label class="toggle"><input type="checkbox" data-q="power" data-ci="${ci}" data-qi="${qi}" ${q.power?'checked':''}><span>Power Play</span></label><button class="remove-btn" data-remove-question="${ci},${qi}" aria-label="Remove question ${qi+1}">×</button></div></div></details>`; }
  function escapeHtml(v){ const d=document.createElement('div');d.textContent=v;return d.innerHTML; }
  function bindSetupChanges(){
    $('setupView').addEventListener('input',e=>{
      const el=e.target;
      if(el.id==='titleInput')data.title=el.value;
      else if(el.id==='timerEnabled'){data.timerEnabled=el.checked;$('timerSeconds').disabled=!el.checked;}
      else if(el.id==='timerSeconds')data.timerSeconds=Math.min(300,Math.max(5,Number(el.value)||30));
      else if(el.id==='finalEnabled'){data.finalEnabled=el.checked;$('finalEditor').hidden=!el.checked;}
      else if(el.id==='finalCategory')data.final.category=el.value; else if(el.id==='finalQuestion')data.final.question=el.value; else if(el.id==='finalAnswer')data.final.answer=el.value;
      else if(el.dataset.teamName!==undefined)data.teams[+el.dataset.teamName].name=el.value;
      else if(el.dataset.teamColor!==undefined)data.teams[+el.dataset.teamColor].color=el.value;
      else if(el.dataset.catName!==undefined)data.categories[+el.dataset.catName].name=el.value;
      else if(el.dataset.q){const q=data.categories[+el.dataset.ci].questions[+el.dataset.qi];q[el.dataset.q]=el.dataset.q==='power'?el.checked:el.dataset.q==='points'?Math.max(0,Number(el.value)||0):el.value;}
      persist();
    });
    $('setupView').addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;
      if(b.dataset.removeCat!==undefined){data.categories.splice(+b.dataset.removeCat,1);renderSetup();persist();}
      if(b.dataset.addQuestion!==undefined){const qs=data.categories[+b.dataset.addQuestion].questions;if(qs.length<5)qs.push({question:'',answer:'',points:(qs.length+1)*100,power:false});renderSetup();persist();}
      if(b.dataset.removeQuestion){const [ci,qi]=b.dataset.removeQuestion.split(',').map(Number);data.categories[ci].questions.splice(qi,1);renderSetup();persist();}
    });
  }
  function changeTeamCount(count){ while(data.teams.length<count)data.teams.push({name:`Team ${data.teams.length+1}`,color:palette[data.teams.length]});data.teams=data.teams.slice(0,count);renderSetup();persist(); }
  function validate(){ const qs=data.categories.flatMap(c=>c.questions); if(!data.title.trim())return 'Add a game title first.';if(!data.categories.length)return 'Add at least one category.';if(!qs.length)return 'Add at least one question.';if(qs.some(q=>!q.question.trim()||!q.answer.trim()))return 'Every question needs both a question and an answer.';if(data.finalEnabled&&(!data.final.question.trim()||!data.final.answer.trim()))return 'Complete the final question and answer, or turn off the final round.';return ''; }
  function startGame(){
    const problem=validate();if(problem){announce(problem);return;}
    state={soundOn:state?.soundOn!==false,scores:data.teams.map(()=>0),activeTeam:0,completed:{},current:null,powerWager:null,finalWagers:[],finalResults:[]};
    renderBoard();show('boardView');sound('good');
  }
  function renderBoard(){
    $('boardTitle').textContent=data.title;$('scoreboard').innerHTML=data.teams.map((t,i)=>`<button class="score-card ${i===state.activeTeam?'active':''}" style="--team:${t.color}" data-active-team="${i}" aria-label="Make ${escapeHtml(t.name)} active"><span>${escapeHtml(t.name)}</span><strong>${state.scores[i]}</strong></button>`).join('');
    $('turnAnnouncer').textContent=`${data.teams[state.activeTeam].name} is the active team.`;
    const max=Math.max(...data.categories.map(c=>c.questions.length));$('gameBoard').style.setProperty('--cols',data.categories.length);
    let html=data.categories.map(c=>`<div class="category-label" role="columnheader">${escapeHtml(c.name)}</div>`).join('');
    for(let qi=0;qi<max;qi++)html+=data.categories.map((c,ci)=>{const q=c.questions[qi];if(!q)return '<div aria-hidden="true"></div>';const done=state.completed[`${ci}-${qi}`];return `<button class="square" role="gridcell" data-square="${ci},${qi}" ${done?'disabled':''} aria-label="${escapeHtml(c.name)}, ${q.points} points${q.power?', Power Play':''}${done?', completed':''}">${done?'✓':q.points}${q.power&&!done?'<span class="power-mark">⚡ POWER PLAY</span>':''}</button>`;}).join('');
    $('gameBoard').innerHTML=html;const allDone=data.categories.every((c,ci)=>c.questions.every((_,qi)=>state.completed[`${ci}-${qi}`]));$('finalBtn').hidden=!(allDone&&data.finalEnabled);if(allDone&&!data.finalEnabled)setTimeout(showWinner,250);
  }
  function openQuestion(ci,qi){
    state.current={ci,qi};const q=data.categories[ci].questions[qi];state.powerWager=q.power?null:q.points;$('questionCategory').textContent=data.categories[ci].name;$('questionValue').textContent=`${q.points} points`;$('questionText').textContent=q.question;$('answerText').textContent=q.answer;$('answerArea').hidden=true;$('revealBtn').hidden=false;$('judgeControls').hidden=true;
    $('powerPanel').hidden=!q.power;$('powerWager').max=Math.max(0,state.scores[state.activeTeam]);$('powerWager').value=Math.min(q.points,Math.max(0,state.scores[state.activeTeam]));$('lockWagerBtn').disabled=false;$('revealBtn').disabled=q.power;
    $('answeringTeam').innerHTML=data.teams.map((t,i)=>`<option value="${i}" ${i===state.activeTeam?'selected':''}>${escapeHtml(t.name)}</option>`).join('');resetTimer();$('timerBox').hidden=!data.timerEnabled;show('questionView');$('questionText').focus();sound();
  }
  function revealAnswer(){ if(state.current&&state.powerWager!==null){$('answerArea').hidden=false;$('revealBtn').hidden=true;$('judgeControls').hidden=false;pauseTimer();sound();} }
  function judge(correct){ const team=+$('answeringTeam').value,q=data.categories[state.current.ci].questions[state.current.qi],value=q.power?state.powerWager:q.points;state.scores[team]+=correct?value:-value;state.completed[`${state.current.ci}-${state.current.qi}`]=true;state.activeTeam=correct?team:(state.activeTeam+1)%data.teams.length;pauseTimer();sound(correct?'good':'bad');state.current=null;renderBoard();show('boardView'); }
  function resetTimer(){pauseTimer();secondsLeft=data.timerSeconds;renderTimer();}
  function renderTimer(){ $('timerDisplay').textContent=secondsLeft;$('timerFill').style.width=`${Math.max(0,secondsLeft/data.timerSeconds*100)}%`;$('timerFill').style.background=secondsLeft<=5?'var(--coral)':'var(--cyan)'; }
  function startTimer(){if(timerRunning||secondsLeft<=0)return;timerRunning=true;timerId=setInterval(()=>{secondsLeft--;renderTimer();if(secondsLeft<=0){pauseTimer();sound('bad');announce('Time is up! Reveal the answer when ready.');}},1000);}
  function pauseTimer(){timerRunning=false;clearInterval(timerId);timerId=null;}
  function openAdjust(){ $('adjustRows').innerHTML=data.teams.map((t,i)=>`<div class="adjust-row"><strong>${escapeHtml(t.name)}: ${state.scores[i]}</strong><input type="number" step="10" value="0" aria-label="Score change for ${escapeHtml(t.name)}" data-adjust-input="${i}"><button class="btn secondary" type="button" data-apply-adjust="${i}">Apply</button></div>`).join('');$('adjustDialog').showModal(); }
  function startFinal(){
    show('finalView');$('finalRoundTitle').textContent=data.final.category;$('finalWagers').hidden=false;$('lockFinalBtn').hidden=false;$('finalPrompt').hidden=true;$('finalControls').hidden=true;$('finalQuestionText').textContent=data.final.question;$('finalAnswerText').textContent=data.final.answer;
    $('finalWagers').innerHTML=data.teams.map((t,i)=>`<label class="wager-card field" style="--team:${t.color}"><span>${escapeHtml(t.name)} · Score ${state.scores[i]}</span><input type="number" min="0" max="${Math.max(0,state.scores[i])}" value="0" data-final-wager="${i}" aria-label="${escapeHtml(t.name)} final wager"></label>`).join('');
  }
  function lockFinal(){const inputs=[...document.querySelectorAll('[data-final-wager]')];state.finalWagers=inputs.map((el,i)=>Math.min(Math.max(0,state.scores[i]),Math.max(0,Number(el.value)||0)));$('finalWagers').hidden=true;$('lockFinalBtn').hidden=true;$('finalPrompt').hidden=false;$('finalControls').hidden=false;$('revealFinalBtn').hidden=false;$('finalAnswerArea').hidden=true;}
  function revealFinal(){ $('finalAnswerArea').hidden=false;$('revealFinalBtn').hidden=true;$('finalJudge').hidden=false;$('finalJudge').innerHTML=data.teams.map((t,i)=>`<label class="toggle"><input type="checkbox" data-final-correct="${i}"><span>${escapeHtml(t.name)} correct</span></label>`).join('');$('finishFinalBtn').hidden=false; }
  function finishFinal(){document.querySelectorAll('[data-final-correct]').forEach((el,i)=>{state.scores[i]+=el.checked?state.finalWagers[i]:-state.finalWagers[i];});showWinner();}
  function showWinner(){ const max=Math.max(...state.scores),winners=data.teams.filter((_,i)=>state.scores[i]===max).map(t=>t.name);$('winnerTitle').textContent=winners.length>1?'It’s a tie!':`${winners[0]} wins!`;$('winnerSummary').textContent=winners.length>1?`${winners.join(' and ')} finish together at ${max} points.`:`A brilliant clash ends with ${max} points.`;$('finalScores').innerHTML=data.teams.map((t,i)=>`<div class="final-score" style="--team:${t.color}"><span>${escapeHtml(t.name)}</span><strong>${state.scores[i]}</strong></div>`).join('');show('winnerView');sound('win'); }
  function download(){ const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${data.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'category-clash'}.json`;a.click();URL.revokeObjectURL(a.href);announce('Game set downloaded.'); }
  function loadFile(file){const reader=new FileReader();reader.onload=()=>{try{data=normalize(JSON.parse(reader.result));ensureTeams();persist();renderSetup();announce('Game set loaded.');}catch{announce('That file is not valid Category Clash JSON.');}};reader.readAsText(file);}
  async function toggleFullscreen(){try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch{announce('Full-screen mode is unavailable in this browser.');}}
  function wire(){
    bindSetupChanges();$('teamCount').addEventListener('change',e=>changeTeamCount(+e.target.value));$('addCategoryBtn').onclick=()=>{if(data.categories.length<6){data.categories.push({name:`Category ${data.categories.length+1}`,questions:[{question:'',answer:'',points:100,power:false}]});renderSetup();persist();}};
    $('sampleBtn').onclick=()=>{if(confirm('Replace the current editor with the built-in sample?')){data=clone(sample);persist();renderSetup();announce('Sample game loaded.');}};$('saveBtn').onclick=download;$('loadBtn').onclick=()=>$('fileInput').click();$('fileInput').onchange=e=>e.target.files[0]&&loadFile(e.target.files[0]);$('startBtn').onclick=startGame;
    $('gameBoard').onclick=e=>{const b=e.target.closest('[data-square]');if(b&&!b.disabled){const [ci,qi]=b.dataset.square.split(',').map(Number);openQuestion(ci,qi);}};$('scoreboard').onclick=e=>{const b=e.target.closest('[data-active-team]');if(b){state.activeTeam=+b.dataset.activeTeam;renderBoard();sound();}};
    $('lockWagerBtn').onclick=()=>{const max=Math.max(0,state.scores[state.activeTeam]),w=Math.max(0,Number($('powerWager').value)||0);if(w>max){announce(`Wager cannot exceed ${max} points.`);return;}state.powerWager=w;$('lockWagerBtn').disabled=true;$('revealBtn').disabled=false;announce(`${data.teams[state.activeTeam].name} wagers ${w} points.`);};
    $('revealBtn').onclick=revealAnswer;$('correctBtn').onclick=()=>judge(true);$('incorrectBtn').onclick=()=>judge(false);$('timerStartBtn').onclick=startTimer;$('timerPauseBtn').onclick=pauseTimer;$('timerResetBtn').onclick=resetTimer;
    $('adjustBtn').onclick=openAdjust;$('adjustRows').onclick=e=>{const b=e.target.closest('[data-apply-adjust]');if(b){const i=+b.dataset.applyAdjust,input=document.querySelector(`[data-adjust-input="${i}"]`);state.scores[i]+=Number(input.value)||0;input.value=0;openAdjust();renderBoard();sound();}};
    $('resetBtn').onclick=()=>{if(confirm('Reset scores and reopen every square?'))startGame();};$('finalBtn').onclick=startFinal;$('lockFinalBtn').onclick=lockFinal;$('revealFinalBtn').onclick=revealFinal;$('finishFinalBtn').onclick=finishFinal;
    $('rematchBtn').onclick=startGame;$('newGameBtn').onclick=()=>{show('setupView');renderSetup();};$('fullscreenBtn').onclick=toggleFullscreen;$('soundBtn').onclick=()=>{state ||= {};state.soundOn=state.soundOn===false;$('soundBtn').setAttribute('aria-pressed',state.soundOn);$('soundBtn').innerHTML=`${state.soundOn?'🔊':'🔇'} <span>Sound</span>`;if(state.soundOn)sound();};
    document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select')||$('setupView').hidden===false)return;if(e.key.toLowerCase()==='f')toggleFullscreen();if(e.key.toLowerCase()==='m')$('soundBtn').click();if(!$('questionView').hidden&&e.code==='Space'){e.preventDefault();revealAnswer();}if(!$('boardView').hidden&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){const d=e.key==='ArrowRight'?1:-1;state.activeTeam=(state.activeTeam+d+data.teams.length)%data.teams.length;renderBoard();}});
  }
  data=loadLocal();state={soundOn:true};renderSetup();wire();
})();
