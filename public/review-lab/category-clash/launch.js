import {setsForGame,loadQuestionSet} from '../catalog.js';
import {enhanceTopicPicker} from '../topic-picker.js';
import {categoryClashBoard} from '../question-decks.js';
const select=document.getElementById('bank-topic'),status=document.getElementById('bank-status');
const sets=setsForGame('category-clash');
for(const set of sets){const option=document.createElement('option');option.value=set.id;option.textContent=set.title;select.append(option);}
const preset=new URLSearchParams(location.search).get('set');if(sets.some(s=>s.id===preset))select.value=preset;
const picker=enhanceTopicPicker(select,sets),loadButton=document.getElementById('bank-load'),custom=document.getElementById('bank-custom'),start=document.getElementById('startBtn');
let loading=false;
async function load(){
 if(loading)return;loading=true;picker.setDisabled(true);loadButton.disabled=custom.disabled=start.disabled=true;status.textContent='Loading review topic…';
 try{const bank=await loadQuestionSet(select.value);window.CategoryClash.loadQuestionSet(categoryClashBoard(bank));status.textContent=`${bank.title} · ${bank.questions.length} questions loaded`;const url=new URL(location.href);url.searchParams.set('set',bank.id);history.replaceState(null,'',url);start.disabled=false;}
 catch{status.textContent='This topic could not load. Try again or use your custom board.';start.disabled=true;}
 finally{loading=false;picker.setDisabled(false);loadButton.disabled=custom.disabled=false;}
}
loadButton.addEventListener('click',load);
custom.addEventListener('click',()=>{window.CategoryClash.useCustomDraft();start.disabled=false;status.textContent='Your custom draft is ready.';const url=new URL(location.href);url.searchParams.delete('set');history.replaceState(null,'',url);});
if(sets.some(s=>s.id===preset))load();
