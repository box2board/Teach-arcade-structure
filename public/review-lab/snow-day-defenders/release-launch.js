import {enhanceTopicPicker} from '../topic-picker.js';
import {setsForGame,loadQuestionSet} from '../catalog.js';
import {prepareSnowQuestions} from './question-adapter.js';
const select=document.getElementById('topic-choice'),go=document.getElementById('go'),status=document.getElementById('topic-status'),retry=document.getElementById('topic-retry');
const sets=setsForGame('snow-day-defenders');
for(const set of sets){const option=document.createElement('option');option.value=set.id;option.textContent=`${set.subject} · ${set.title}`;select.append(option);}
const preset=new URLSearchParams(location.search).get('set');if(sets.some(s=>s.id===preset))select.value=preset;
const picker=enhanceTopicPicker(select,sets);let busy=false,loaded=false;
async function load(){
 if(busy)return;busy=true;go.disabled=true;picker.setDisabled(true);status.textContent='Loading review questions…';retry.hidden=true;
 try{
  const bank=await loadQuestionSet(select.value);window.SNOW_QUESTION_SET=prepareSnowQuestions(bank);window.SNOW_RELEASE=true;
  if(loaded){location.reload();return;}
  await import('/dev/snow-day-visuals/game.js?v=release-1');loaded=true;
  status.textContent=`${bank.title} · ${bank.questions.length} questions · 60-second recruitment`;
  const url=new URL(location.href);url.searchParams.set('set',select.value);history.replaceState(null,'',url);
  go.disabled=false;
 }catch(error){const graphics=document.getElementById('cardtitle').textContent==='3D graphics unavailable';status.textContent=graphics?'Questions loaded, but 3D graphics are unavailable in this browser.':'Questions could not load. Choose a topic and retry.';retry.hidden=graphics;}
 finally{busy=false;picker.setDisabled(false);}
}
select.addEventListener('change',()=>{if(loaded){const url=new URL(location.href);url.searchParams.set('set',select.value);location.assign(url);}else load();});retry.onclick=load;load();
