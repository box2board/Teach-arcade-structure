import {createExpedition} from './model.js';
import {createWorld} from './world.js';
const root=document.getElementById('expedition');
const $=id=>document.getElementById(id);
function el(tag,text,className){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;}
function button(text,action,className=''){const b=el('button',text,className);b.type='button';b.addEventListener('click',action);return b;}
let model,world,pack,started=false,finalResponse=null;
const timelineDrafts=new Map();
let explanationDraft={first:null,second:null,text:""}, navSignature="";
const dialog=$('exp-dialog'),body=$('dialog-body');
function open(title){world?.setActive(false);body.replaceChildren();$('dialog-title').textContent=title;dialog.scrollTop=0;if(!dialog.open)dialog.showModal();}
function close(){dialog.close();world.setActive(started&&!finalResponse&&!document.hidden);$('exp-map').focus({preventScroll:true});}
$('dialog-close').addEventListener('click',close);
dialog.addEventListener('cancel',e=>{e.preventDefault();if(started)close();});
dialog.addEventListener('keydown',e=>{
  if(e.target.closest('textarea,input,select'))return;
  const dir={ArrowDown:1,ArrowRight:1,ArrowUp:-1,ArrowLeft:-1}[e.key];
  if(dir){const buttons=[...body.querySelectorAll('button:not(:disabled)')];if(!buttons.length)return;e.preventDefault();const i=buttons.indexOf(document.activeElement);buttons[i<0?(dir>0?0:buttons.length-1):(i+dir+buttons.length)%buttons.length].focus();}
});
function update(){const area=model.area,r=model.report();$('area-title').textContent=area.title;$('area-period').textContent=area.subtitle;$('discovery-count').textContent=`${r.discoveries}/${r.total} discoveries`;$('station-count').textContent=`${model.completed.size}/${pack.areas.length} stations restored`;
  $('objective').textContent=model.completed.has(area.id)?(model.finished?'All stations restored. Build your final explanation.':'Station restored. Travel to the next area.'):model.ready?'Return to the central station. Connect your discoveries.':`Find ${area.discoveries.filter(d=>!model.discovered.has(d.id)).length} remaining discoveries in this area.`;
  $('next-area').hidden=!model.completed.has(area.id)||model.areaIndex===pack.areas.length-1;$('final-task').hidden=!model.finished;
  const signature=`${model.areaIndex}:${model.completed.size}`;
  if(signature!==navSignature){navSignature=signature;
  $('area-nav').replaceChildren(...pack.areas.map((a,i)=>{const b=button(`${i+1}. ${a.title}`,()=>travel(i));b.disabled=i>0&&!model.completed.has(pack.areas[i-1].id);b.setAttribute('aria-current',i===model.areaIndex?'step':'false');return b;}));
  }
}
function travel(index){if(model.travel(index)){world.reset();update();close();}}
function showQuestion(question,onAnswer,onContinue=()=>{update();close();}){
  const prompt=el('h3',question.prompt);const choices=el('div',undefined,'choices');const feedback=el('p',undefined,'feedback');feedback.setAttribute('role','status');
  body.append(prompt,choices,feedback);
  const ordered=question.choices.map((text,index)=>({text,index}));
  // Fisher–Yates keeps the correct option from always occupying the first slot.
  for(let i=ordered.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ordered[i],ordered[j]]=[ordered[j],ordered[i]];}
  ordered.forEach(option=>{const b=button(option.text,()=>{
    const result=onAnswer(option.index);if(!result)return;
    if(result.correct){choices.querySelectorAll('button').forEach(n=>n.disabled=true);b.classList.add('correct');feedback.textContent=`Connected. ${question.explanation}`;const next=button('Continue',onContinue,'primary');body.append(next);next.focus();}
    else{b.disabled=true;b.classList.add('wrong');feedback.textContent=`Try another connection. ${question.explanation}`;choices.querySelector('button:not(:disabled)')?.focus();}
  },'choice');choices.append(b);});
  choices.querySelector('button')?.focus();
}
function discover(item){if(model.discovered.has(item.id))return;open(item.title);
  body.append(el('p',`${item.date} · ${item.theater}`,'kicker'),el('p',item.summary,'summary'));
  const source=el('a','Historical summary — view source','source');source.href=item.source;source.target='_blank';source.rel='noopener noreferrer';body.append(source);
  showQuestion(item.question,index=>model.answer(item.id,index),()=>{
    update();if(model.ready)station();else close();
  });
}
function station(){
  const area=model.area;open('Restore the connection station');
  if(model.completed.has(area.id)){body.append(el('p','This area’s discoveries are connected. Its station is restored.'));if(model.finished)body.append(button('Build final explanation',showFinal,'primary'));else body.append(button('Travel to the next area',()=>travel(model.areaIndex+1),'primary'));return;}
  if(!model.ready){body.append(el('p','The station needs every discovery in this area. Find the numbered gold markers around the map.'));body.append(button('Return to exploration',close,'primary'));return;}
  if(model.timelines.get(area.id)?.correct){connection();return;}
  body.append(el('p','Arrange the recovered events from earliest to latest. Use the move buttons; no dragging is required.'));
  let order=timelineDrafts.get(area.id)||[...area.discoveries].reverse();const list=el('ol',undefined,'timeline');const feedback=el('p',undefined,'feedback');feedback.setAttribute('role','status');
  const paint=()=>{list.replaceChildren(...order.map((d,i)=>{const li=el('li');li.append(el('span',`${d.title} · ${d.date}`));const controls=el('div');const up=button('↑',()=>{[order[i-1],order[i]]=[order[i],order[i-1]];timelineDrafts.set(area.id,[...order]);paint();list.children[i-1].querySelector('button:not(:disabled)')?.focus();});up.disabled=i===0;up.setAttribute('aria-label',`Move ${d.title} earlier`);const down=button('↓',()=>{[order[i+1],order[i]]=[order[i],order[i+1]];timelineDrafts.set(area.id,[...order]);paint();list.children[i+1].querySelector('button:not(:disabled)')?.focus();});down.disabled=i===order.length-1;down.setAttribute('aria-label',`Move ${d.title} later`);controls.append(up,down);li.append(controls);return li;}));};
  paint();body.append(list,feedback,button('Check chronology',()=>{const result=model.checkTimeline(order.map(d=>d.id));if(result.correct){timelineDrafts.delete(area.id);connection();}else feedback.textContent='Check the dates in your journal, then adjust the order. A time sequence shows when; the next challenge asks why.';},'primary'));
}
function connection(){open('Connect cause and consequence');body.append(el('p','You restored the timeline. Now explain the connection.','kicker'));showQuestion(model.area.connection,index=>model.checkConnection(index),()=>{
  update();open('Station restored');
  body.append(el('p',`${model.area.title} is now connected.`, 'intro-tagline'));
  if(model.finished)body.append(button('Build final explanation',showFinal,'primary'));
  else body.append(button('Explore next area',()=>travel(model.areaIndex+1),'primary'));
  body.append(button('Stay in this area',close));
});}
function journal(){open('Discovery journal');body.append(el('p',`${model.discovered.size} discoveries recovered. Summaries are written for this activity; linked sources provide the historical context.`));
  pack.areas.forEach(a=>{body.append(el('h3',a.title));a.discoveries.forEach(d=>{const card=el('article',undefined,'journal-card');if(model.discovered.has(d.id)){card.append(el('h4',d.title),el('p',`${d.date} · ${d.theater}`,'kicker'),el('p',d.summary));const a=el('a','View source');a.href=d.source;a.target='_blank';a.rel='noopener noreferrer';card.append(a);}else card.append(el('p','Undiscovered — find this area’s numbered markers.'));body.append(card);});});}
function showFinal(){if(!model.finished)return;open('Build your explanation');body.append(el('p',pack.finalPrompt));const form=el('form');const all=pack.areas.flatMap(a=>a.discoveries);
  const selects=[];['First discovery','Second discovery'].forEach((label,i)=>{const l=el('label',label);const select=el('select');select.id=`final-event-${i}`;l.htmlFor=select.id;all.forEach(d=>{const o=el('option',d.title);o.value=d.id;select.append(o);});select.selectedIndex=i;const saved=i===0?explanationDraft.first:explanationDraft.second;if(saved)select.value=saved;select.addEventListener("change",()=>{if(i===0)explanationDraft.first=select.value;else explanationDraft.second=select.value;});selects.push(select);form.append(l,select);});
  const l=el('label','Explain the connection with a detail from each discovery.');l.htmlFor='explanation';const text=el('textarea');text.id='explanation';text.rows=5;text.required=true;text.minLength=40;text.maxLength=2000;text.placeholder='The first event changed… This connects to the second event because…';text.value=explanationDraft.text;text.addEventListener('input',()=>{explanationDraft.text=text.value;});
  form.append(l,text,el('p','Your written explanation is saved in your results for teacher review. It is not automatically graded.','kicker'));
  const feedback=el('p',undefined,'feedback');feedback.setAttribute('role','status');const submit=el('button','Finish expedition','primary');submit.type='submit';form.append(feedback,submit);form.addEventListener('submit',e=>{e.preventDefault();if(selects[0].value===selects[1].value){feedback.textContent='Choose two different discoveries.';return;}finalResponse={first:all.find(d=>d.id===selects[0].value).title,second:all.find(d=>d.id===selects[1].value).title,text:text.value.trim()};if(finalResponse.text.length<40){feedback.textContent='Add a fuller explanation using details from both discoveries.';finalResponse=null;return;}showResults();});body.append(form);
}
function reportText(){const r=model.report();return `${pack.title}\nDiscoveries: ${r.discoveries}/${r.total}\nDiscovery challenges correct on first try: ${r.firstTry}/${r.total}\nChronology stations correct on first try: ${r.timelineFirstTry}/${pack.areas.length}\nConnection stations correct on first try: ${r.connectionFirstTry}/${pack.areas.length}\nReview again: ${r.review.join(', ')||'No discovery challenges needed a retry.'}\n\n${finalResponse.first} → ${finalResponse.second}\n${finalResponse.text}\n\nWritten explanation: teacher review required.\nThis is a local practice summary, not a verified student record.`;}
function showResults(){open('Expedition complete');const r=model.report();body.append(el('p','All stations restored. Your discoveries now form a connected story.'));const list=el('dl',undefined,'results-grid');[['Discovery first tries',`${r.firstTry}/${r.total}`],['Chronology first tries',`${r.timelineFirstTry}/${pack.areas.length}`],['Connection first tries',`${r.connectionFirstTry}/${pack.areas.length}`]].forEach(([label,value])=>{const cell=el('div');cell.append(el('dt',label),el('dd',value));list.append(cell);});body.append(list,el('h3','Your explanation'),el('p',`${finalResponse.first} → ${finalResponse.second}`,'kicker'),el('p',finalResponse.text,'written-response'),el('p','Teacher review required; writing is not automatically graded.','kicker'),el('h3','Review again'),el('p',r.review.join(', ')||'You answered every discovery challenge correctly on the first try.'));
  body.append(button('Download learning summary',()=>{const url=URL.createObjectURL(new Blob([reportText()],{type:'text/plain'}));const a=el('a');a.href=url;a.download=`${pack.id}-learning-summary.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},'primary'),button('Replay',()=>{model=createExpedition(pack);finalResponse=null;timelineDrafts.clear();explanationDraft={first:null,second:null,text:''};navSignature='';world.reset();started=true;update();close();}));
}
async function init(){const response=await fetch(root.dataset.pack,{signal:AbortSignal.timeout(12000)});if(!response.ok)throw new Error('Could not load the expedition');pack=await response.json();model=createExpedition(pack);
  world=createWorld($('exp-map'),{getArea:()=>model.area,isCollected:id=>model.discovered.has(id),isRestored:id=>model.completed.has(id),onInteract:item=>item.id==='station'?station():discover(item),onHint:({nearby,target,direction,active})=>{
    $('status').textContent=nearby?`${nearby.title} — E / Space or Open`:`${target.title}: head ${direction}.`;
    $('open-discovery').disabled=!active||!nearby;
  }});
  update();$('journal').addEventListener('click',journal);$('station').addEventListener('click',station);$('next-area').addEventListener('click',()=>travel(model.areaIndex+1));$('final-task').addEventListener('click',showFinal);$('open-discovery').addEventListener('click',()=>world.interact());
  $('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await root.requestFullscreen();}catch{$('status').textContent='Fullscreen is unavailable here. The game still works in this window.';}});
  $('exp-map').addEventListener('pointerdown',()=>{$('exp-map').focus({preventScroll:true});});
  document.querySelectorAll('[data-dir]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);world.touch(b.dataset.dir,true);});['pointerup','pointercancel','lostpointercapture'].forEach(type=>b.addEventListener(type,()=>world.touch(b.dataset.dir,false)));});
  window.addEventListener('blur',()=>world.setActive(false));
  window.addEventListener('focus',()=>world.setActive(started&&!dialog.open&&!finalResponse&&!document.hidden));
  document.addEventListener('visibilitychange',()=>{world.setActive(started&&!dialog.open&&!finalResponse&&!document.hidden);});

  window.addEventListener('keydown',e=>{if(!started||dialog.open||e.target.closest('input,textarea,select'))return;if(e.key.toLowerCase()==='j'){e.preventDefault();journal();}});
  open(pack.title);$('dialog-close').hidden=true;body.append(el('p',pack.tagline,'intro-tagline'),el('p','Explore the archive areas. Recover discoveries, rebuild timelines, and connect the events to restore each station.'));
  const goals=el('ul');pack.goals.forEach(g=>goals.append(el('li',g)));body.append(goals,el('p','Move: arrows / WASD · Sprint: Shift · Interact: E / Space · Journal: J. Touch controls are below the map.','kicker'),el('p',pack.scope,'kicker'),button('Begin expedition',()=>{started=true;$('dialog-close').hidden=false;world.reset();close();},'primary'));
}
init().catch(error=>{console.error(error);$('status').textContent='The expedition could not load. Refresh to try again.';$('objective').textContent='Loading failed';$('exp-map').hidden=true;$('status').append(button('Retry loading',()=>location.reload(),'primary'));});
