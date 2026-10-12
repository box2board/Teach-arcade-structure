(async()=>{
 try{
  const params=new URLSearchParams(location.search),key=params.get('draft'),file=params.get('level');let doc;
  if(file){const url=new URL(file,location.href);if(url.origin!==location.origin||!url.pathname.endsWith('.json'))throw Error('Choose a JSON level on this website.');doc=await TALoadCreatorDocument(url.href);}
  else{if(!key||!/^ta-level-play-[a-z0-9-]+$/.test(key))throw Error('Open a playtest from the Level Builder.');const raw=sessionStorage.getItem(key);if(!raw)throw Error('Return to the builder and click Playtest again.');doc=TALevelFile.parse(raw);}
  const questions=await TALoadCreatorQuestions(doc.questionSet,window.TA_EGYPT_QUESTIONS);
  const count=(doc.level.questionPoints||[]).length+(doc.level.layers.questions||[]).flat().filter(Boolean).length;
  if(count>questions.length||(doc.level.questionPoints||[]).some(q=>q.questionIndex>=questions.length))throw Error('This level needs more questions than the selected set provides.');
  window.TA_GAME={id:doc.level.id,physicsPreset:doc.level.physicsPreset,level:doc.level,questions,theme:{...window.TA_PYRAMID_V13_THEME,name:'Level Builder',scene:doc.scene||'tomb'}};
  document.querySelector('h1').textContent='Level Builder Playtest';document.querySelector('.sub').textContent=(doc.questionSet?.title||'Ancient Egypt')+' · Your layout running in the V1.4 creator engine.';
  const shell=document.createElement('script');shell.src='/arcade-review-games/side-scroller-engine/v1.2/shell.js?v=1.2.1';document.body.appendChild(shell);
 }catch(e){document.getElementById('status').textContent=e.message;}
})();
