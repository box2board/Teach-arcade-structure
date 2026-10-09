import {enhanceTopicPicker} from '../topic-picker.js';
import {setsForGame,loadQuestionSet} from '../catalog.js';
import {prepareSnowQuestions} from './question-adapter.js';

const select=document.getElementById('topic-choice'),start=document.getElementById('start');
const status=document.getElementById('topic-status');
const sets=setsForGame('snow-day-defenders');
for(const set of sets){const option=document.createElement('option');option.value=set.id;option.textContent=`${set.subject} · ${set.title}`;select.append(option);}
const preset=new URLSearchParams(location.search).get('set');
if(sets.some(set=>set.id===preset))select.value=preset;
const picker=enhanceTopicPicker(select,sets);
let engine,loading=false;
async function load(){
  if(loading)return;
  loading=true;picker.setDisabled(true);select.disabled=start.disabled=true;document.getElementById('restart').disabled=true;
  status.textContent='Loading review questions…';
  try{
    const bank=await loadQuestionSet(select.value);
    const prepared=prepareSnowQuestions(bank);
    window.SNOW_QUESTION_SET=prepared;
    if(!engine)engine=await import('./game.js?v=17');
    else engine.configureQuestionSet(prepared);
    status.textContent=`${bank.questions.length} questions · No question timer · Earn gear before wave one`;
    const url=new URL(location.href);url.searchParams.set('set',select.value);history.replaceState(null,'',url);
    document.getElementById('topic-picker').hidden=false;
    start.disabled=document.getElementById('title').textContent==='3D graphics unavailable';
    document.getElementById('topic-retry').hidden=true;document.getElementById('restart').disabled=false;
  }catch(error){
    const graphicsUnavailable=document.getElementById('title').textContent==='3D graphics unavailable';
    status.textContent=graphicsUnavailable?'Questions loaded. This browser could not start 3D graphics.':'Questions could not load. Choose a topic and try again.';
    document.getElementById('topic-retry').hidden=graphicsUnavailable;
    start.disabled=true;
  }finally{loading=false;picker.setDisabled(false);select.disabled=false;}
}
select.addEventListener('change',load);
document.getElementById('topic-retry').addEventListener('click',load);
load();
