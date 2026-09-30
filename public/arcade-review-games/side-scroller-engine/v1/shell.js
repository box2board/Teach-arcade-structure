(()=>{const TA=window.TASideScroller=window.TASideScroller||{};
function installSharedUI(){
 if(document.getElementById('ta-side-scroller-ui'))return;
 const style=document.createElement('style');style.id='ta-side-scroller-ui';
 style.textContent=`
 #question-modal[hidden],#results-modal[hidden]{display:none!important}
 #question-modal:not([hidden]),#results-modal:not([hidden]){position:fixed!important;inset:0!important;z-index:1000!important;display:grid!important;place-items:center!important;padding:16px!important;background:rgba(2,6,23,.72)!important}
 #question-modal:not([hidden]) dialog,#results-modal:not([hidden]) dialog{position:relative!important;inset:auto!important;margin:0!important;max-height:calc(100dvh - 32px)!important;overflow:auto!important}\n #question-choices button{transition:transform .08s ease,box-shadow .08s ease,outline-color .08s ease}\n #question-choices button.ta-key-selected{outline:3px solid #facc15!important;outline-offset:2px!important;box-shadow:inset 6px 0 0 #facc15!important;transform:translateX(4px)}\n .ta-question-keyboard-hint{margin:8px 0 10px;font-size:.76rem;font-weight:800;letter-spacing:.02em;opacity:.72}\n @media(max-width:699px){.ta-question-keyboard-hint{display:none}}\n `;
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
 addEventListener('keydown',e=>{if(modal.hidden)return;const list=buttons();if(!list.length)return;if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();e.stopImmediatePropagation();select(selected+(e.key==='ArrowDown'?1:-1));return}if(e.key==='Enter'&&!e.repeat){e.preventDefault();e.stopImmediatePropagation();const b=list[selected];if(b)b.click();}},true);
}
function boot(){
 installSharedUI();
 const game=window.TA_GAME;if(!game)throw new Error('TA_GAME package is missing.');
 const canvas=document.getElementById('game'),status=document.getElementById('status'),debugEl=document.getElementById('level-debug');
 if(!canvas)throw new Error('Production shell requires #game canvas.');
 const physics=(window.TA_PHYSICS_PRESETS||{})[game.physicsPreset||game.level.physicsPreset||'earth'];if(!physics)throw new Error('Unknown physics preset.');
 const gameplay=TA.LevelValidator.validate(game.level,physics),visual=TA.VisualValidator.validate(game.level),debug=new URLSearchParams(location.search).has('debug');
 if(status)status.textContent=game.theme.name+' — reach the '+(game.theme.labels?.goal||'finish')+'.';
 if(debugEl){debugEl.hidden=!debug;if(debug){const gi=gameplay.issues.length?gameplay.issues.map(i=>'⚠️ '+i.type).join(' · '):'✓ pass';const vi=visual.issues.length?visual.issues.map(i=>(i.severity==='error'?'❌ ':'⚠️ ')+i.label+' — '+i.message).join('<br>'):'✓ pass';debugEl.innerHTML='<strong>Gameplay QA:</strong> '+gi+'<br><strong>Visual QA:</strong> '+vi;}}
 const engine=new TA.Engine({canvas,config:{player:physics},level:game.level,theme:game.theme,questions:game.questions||[],themeId:game.id||'default'});
 engine.validation=gameplay;engine.visualValidation=visual;engine.debugLevel=debug;window.TA_ACTIVE_GAME=engine;engine.start();
}
TA.installSharedUI=installSharedUI;TA.bootProductionGame=boot;if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();})();