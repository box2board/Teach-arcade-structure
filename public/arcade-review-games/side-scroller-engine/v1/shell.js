(()=>{const TA=window.TASideScroller=window.TASideScroller||{};
function boot(){
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
TA.bootProductionGame=boot;if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();})();