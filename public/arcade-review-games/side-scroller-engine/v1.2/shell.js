(()=>{const TA=window.TASideScroller=window.TASideScroller||{};
function installSharedUI(){
 if(document.getElementById('ta-side-scroller-ui'))return;
 const style=document.createElement('style');style.id='ta-side-scroller-ui';
 style.textContent=`
 #question-modal[hidden],#results-modal[hidden]{display:none!important}
 #question-modal:not([hidden]),#results-modal:not([hidden]){position:fixed!important;inset:0!important;z-index:1000!important;display:grid!important;place-items:center!important;padding:16px!important;background:rgba(2,6,23,.72)!important}
 #question-modal:not([hidden]) dialog,#results-modal:not([hidden]) dialog{position:relative!important;inset:auto!important;margin:0!important;max-height:calc(100dvh - 32px)!important;overflow:auto!important}\n #question-choices button{transition:transform .08s ease,box-shadow .08s ease,outline-color .08s ease}\n #question-choices button.ta-key-selected{outline:3px solid #facc15!important;outline-offset:2px!important;box-shadow:inset 6px 0 0 #facc15!important;transform:translateX(4px)}\n .ta-question-keyboard-hint{margin:8px 0 10px;font-size:.76rem;font-weight:800;letter-spacing:.02em;opacity:.72}
 #ta-difficulty-modal{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:16px;background:rgba(2,6,23,.82)}
 #ta-difficulty-card{width:min(680px,96vw);max-height:calc(100dvh - 32px);overflow:auto;background:#fff;color:#172033;border-radius:20px;padding:22px;box-shadow:0 28px 90px #000a}
 #ta-difficulty-card h2{margin:0 0 6px;font-size:1.45rem}#ta-difficulty-card>p{margin:0 0 16px;color:#526077}
 .ta-difficulty-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
 .ta-difficulty{font:inherit;text-align:left;border:2px solid #d7deea;border-radius:14px;padding:15px;background:#f8fafc;color:#172033;cursor:pointer}
 .ta-difficulty:hover,.ta-difficulty:focus-visible{border-color:#475569;outline:3px solid #facc15;outline-offset:2px}
 .ta-difficulty strong{display:block;font-size:1.05rem;margin-bottom:6px}.ta-difficulty span{display:block;font-size:.78rem;line-height:1.4;color:#526077}
 .ta-difficulty[data-difficulty="hard"]{background:#fff7f7}.ta-difficulty[data-difficulty="medium"]{background:#fffbeb}
 @media(max-width:699px){.ta-question-keyboard-hint{display:none}.ta-difficulty-grid{grid-template-columns:1fr}}
\n `;
 document.head.appendChild(style);
 installQuestionKeyboard();
}
function installQuestionKeyboard(){
 if(TA.questionKeyboardInstalled)return;TA.questionKeyboardInstalled=true;
 const modal=document.getElementById('question-modal'),choices=document.getElementById('question-choices');if(!modal||!choices)return;
 let selected=0;
 const buttons=()=>[...choices.querySelectorAll('button:not([disabled])')];
 const select=i=>{const list=buttons();if(!list.length)return;selected=(i+list.length)%list.length;[...choices.querySelectorAll('button')].forEach(b=>b.classList.remove('ta-key-selected'));const b=list[selected];b.classList.add('ta-key-selected');b.scrollIntoView({block:'nearest'});};
 const prepare=()=>{const list=buttons();if(!list.length)return;selected=0;select(0);let hint=modal.querySelector('.ta-question-keyboard-hint');if(!hint){hint=document.createElement('p');hint.className='ta-question-keyboard-hint';hint.textContent='Keyboard: ↑ ↓ select · Enter answer';choices.before(hint);}};
 new MutationObserver(()=>{if(!modal.hidden)requestAnimationFrame(prepare)}).observe(modal,{attributes:true,attributeFilter:['hidden']});
 choices.addEventListener('pointermove',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const list=buttons(),i=list.indexOf(b);if(i>=0)select(i)});
 addEventListener('keydown',e=>{if(modal.hidden)return;const nav=e.key==='ArrowDown'||e.key==='ArrowUp',submit=e.key==='Enter';if(!nav&&!submit)return;e.preventDefault();e.stopImmediatePropagation();const list=buttons();if(!list.length)return;if(nav){select(selected+(e.key==='ArrowDown'?1:-1));return}if(submit&&!e.repeat){const b=list[selected];if(b)b.click();}},true);
}
function chooseDifficulty(game,onChoose){
 const old=document.getElementById('ta-difficulty-modal');if(old)old.remove();
 const modal=document.createElement('div');modal.id='ta-difficulty-modal';modal.innerHTML='<section id="ta-difficulty-card" role="dialog" aria-modal="true" aria-labelledby="ta-difficulty-title"><h2 id="ta-difficulty-title">Choose difficulty</h2><p>'+game.theme.name+' uses the same questions and controls on every setting. Difficulty changes the platforming challenge.</p><div class="ta-difficulty-grid"><button class="ta-difficulty" data-difficulty="easy"><strong>Easy</strong><span>Standard hazards · All checkpoints · Correct-answer gameplay bonuses</span></button><button class="ta-difficulty" data-difficulty="medium"><strong>Medium</strong><span>Hazards 15% faster · Half checkpoints · Correct-answer gameplay bonuses</span></button><button class="ta-difficulty" data-difficulty="hard"><strong>Hard</strong><span>Hazards 30% faster · No checkpoints · No correct-answer gameplay bonuses</span></button></div></section>';
 document.body.appendChild(modal);const buttons=[...modal.querySelectorAll('[data-difficulty]')];buttons.forEach(b=>b.addEventListener('click',()=>{const d=b.dataset.difficulty;modal.remove();onChoose(d)}));buttons[0]?.focus();
}
function boot(){
 installSharedUI();
 const game=window.TA_GAME;if(!game)throw new Error('TA_GAME package is missing.');
 const canvas=document.getElementById('game'),status=document.getElementById('status'),debugEl=document.getElementById('level-debug');
 if(!canvas)throw new Error('Production shell requires #game canvas.');
 const physics=(window.TA_PHYSICS_PRESETS||{})[game.physicsPreset||game.level.physicsPreset||'earth'];if(!physics)throw new Error('Unknown physics preset.');
 const gameplay=TA.LevelValidator.validate(game.level,physics),visual=TA.VisualValidator.validate(game.level),debug=new URLSearchParams(location.search).has('debug');
 if(status)status.textContent='Choose a difficulty to begin '+game.theme.name+'.';
 if(debugEl){debugEl.hidden=!debug;if(debug){const gi=gameplay.issues.length?gameplay.issues.map(i=>'⚠️ '+i.type).join(' · '):'✓ pass';const vi=visual.issues.length?visual.issues.map(i=>(i.severity==='error'?'❌ ':'⚠️ ')+i.label+' — '+i.message).join('<br>'):'✓ pass';debugEl.innerHTML='<strong>Gameplay QA:</strong> '+gi+'<br><strong>Visual QA:</strong> '+vi;}}
 chooseDifficulty(game,difficulty=>{if(status)status.textContent=game.theme.name+' · '+TA.DIFFICULTY_PRESETS[difficulty].label+' — reach the '+(game.theme.labels?.goal||'finish')+'.';const engine=new TA.Engine({canvas,config:{player:physics},level:game.level,theme:game.theme,questions:game.questions||[],themeId:game.id||'default',difficulty});engine.validation=gameplay;engine.visualValidation=visual;engine.debugLevel=debug;window.TA_ACTIVE_GAME=engine;engine.start()});
}
TA.installSharedUI=installSharedUI;TA.bootProductionGame=boot;if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();})();