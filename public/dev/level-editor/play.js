(()=>{
 try {
  const key=new URLSearchParams(location.search).get('draft');
  if(!key||!/^ta-level-play-[a-z0-9-]+$/.test(key))throw Error('Open a playtest from the Level Builder.');
  const raw=sessionStorage.getItem(key);if(!raw)throw Error('Playtest data is unavailable. Return to the builder and click Playtest again.');
  const doc=TALevelFile.parse(raw);
  const count=(doc.level.questionPoints||[]).length;
  if(count>window.TA_EGYPT_QUESTIONS.length)throw Error('This preview supports up to '+window.TA_EGYPT_QUESTIONS.length+' question points.');
  window.TA_GAME={id:doc.level.id,physicsPreset:doc.level.physicsPreset,level:doc.level,questions:window.TA_EGYPT_QUESTIONS,theme:window.TA_PYRAMID_V13_THEME};
  document.querySelector('h1').textContent='Level Builder Playtest';
  document.querySelector('.sub').textContent='Your edited level running in the existing V1.3 engine. Close this playtest to return to editing.';
 }catch(e){document.getElementById('status').textContent=e.message;window.TASideScroller.bootProductionGame=()=>{};document.addEventListener('DOMContentLoaded',()=>document.getElementById('status').textContent=e.message);}
})();
