(()=>{const TA=window.TASideScroller=window.TASideScroller||{};
window.TA_GAME={id:'wwi-trench-run-prototype',physicsPreset:'earth',level:window.TA_WWI_LEVEL,questions:window.TA_WWI_QUESTIONS,theme:window.TA_WWI_THEME};
const bind=TA.Engine.prototype.bind;
TA.Engine.prototype.bind=function(){bind.call(this);const engine=this;document.querySelectorAll('[data-control]').forEach(button=>{let pulseAt=0;const pulse=()=>{const now=performance.now();if(now-pulseAt<35)return;pulseAt=now;const key=button.dataset.control;
if(key==='arrowleft'||key==='arrowright'){const dir=key==='arrowright'?1:-1;engine.moveX(dir*32);engine.player.vx=dir*120}else{engine.player.jumpBuffer=engine.config.player.jumpBuffer}
clearTimeout(button.__taTapTimer);engine.keys[key]=true;button.__taTapTimer=setTimeout(()=>{engine.keys[key]=false},220)};
button.addEventListener('pointerdown',()=>{button.__taPointerStarted=performance.now()},{capture:true});
button.addEventListener('pointerup',()=>{const elapsed=performance.now()-(button.__taPointerStarted??performance.now());if(elapsed<1300)pulse()},{passive:true});
button.addEventListener('click',()=>{const elapsed=button.__taPointerStarted==null?0:performance.now()-button.__taPointerStarted;if(elapsed<1300)pulse()},{passive:true});
})};
})();