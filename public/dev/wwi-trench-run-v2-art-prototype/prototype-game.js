(()=>{const TA=window.TASideScroller=window.TASideScroller||{};
window.TA_GAME={id:'wwi-trench-run-prototype',physicsPreset:'earth',level:window.TA_WWI_LEVEL,questions:window.TA_WWI_QUESTIONS,theme:window.TA_WWI_THEME};
const bind=TA.Engine.prototype.bind;
TA.Engine.prototype.bind=function(){bind.call(this);const engine=this;document.querySelectorAll('[data-control]').forEach(button=>{button.addEventListener('pointerdown',()=>{button.__taPointerStarted=performance.now()},{capture:true});button.addEventListener('click',()=>{const key=button.dataset.control,elapsed=performance.now()-(button.__taPointerStarted||0);if(elapsed<240){clearTimeout(button.__taTapTimer);engine.keys[key]=true;button.__taTapTimer=setTimeout(()=>{engine.keys[key]=false},190)}},{passive:true})})};
})();