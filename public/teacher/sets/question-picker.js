import {matchesSetSearch} from '../../review-lab/set-filters.js';
import {correctAnswers} from '../set-contract.js';

export function mountQuestionPicker({originals, discoverCommunity, discoverMine, loadQuestionSet, loadTeacherSet, sourceLabel, editingId, addQuestion}) {
  const $=id=>document.getElementById(id);
  const dialog=$('question-picker');
  const selected=$('picker-questions');
  const title=$('picker-set-title');
  const source=$('picker-set-source');
  const hint=$('picker-set-hint');
  const search=$('picker-search');
  const questionSearch=$('picker-question-search');
  const list=$('picker-sets');
  const more=$('picker-more');
  const status=$('picker-status');
  const publicTab=$('picker-public');
  const mineTab=$('picker-mine');
  const added=new Set();
  let request=0, bankRequest=0, officialOffset=0, teacherOffset=0, teacherDone=false;
  let scope='public', term='', bank, activeSetButton;

  function button(label, run) {
    const control=document.createElement('button');
    control.type='button';
    control.textContent=label;
    control.onclick=run;
    return control;
  }

  function clearBank(message='Choose a set to see its questions.') {
    bankRequest++;
    bank=null;
    selected.hidden=source.hidden=true;
    title.textContent='Questions';
    hint.hidden=false;
    hint.textContent=message;
    activeSetButton?.setAttribute('aria-pressed','false');
    activeSetButton=null;
  }

  function addSetResult(set, official) {
    if(set.id===editingId())return;
    const label=official?'Teach Arcade Original':scope==='mine'?(set.visibility==='public'?'Public':'Private'):'Teacher-created';
    const control=button(set.title+' · '+label,()=>openBank(set,official,control));
    control.setAttribute('aria-pressed','false');
    list.append(control);
  }

  async function findSets(reset=true) {
    const current=++request;
    if(reset){
      term=search.value.trim();
      officialOffset=teacherOffset=0;
      teacherDone=false;
      clearBank();
      list.replaceChildren();
      list.closest('.picker-pane').scrollTop=0;
    }
    more.disabled=true;
    more.hidden=true;
    status.textContent='Loading sets…';
    const official=scope==='public'?originals.filter(set=>matchesSetSearch(set,term)):[];
    const page=official.slice(officialOffset,officialOffset+12);
    let teacherSets=[],unavailable=false;
    if(!teacherDone){
      try{teacherSets=await (scope==='public'?discoverCommunity:discoverMine)(term,teacherOffset);}
      catch{unavailable=true;}
    }
    if(current!==request||!dialog.open)return;
    officialOffset+=page.length;
    if(!unavailable){teacherOffset+=teacherSets.length;teacherDone=teacherSets.length<25;}
    for(let i=0;i<Math.max(page.length,teacherSets.length);i++){
      if(page[i])addSetResult(page[i],true);
      if(teacherSets[i])addSetResult(teacherSets[i],false);
    }
    status.textContent=unavailable?'Teacher sets are temporarily unavailable.':list.children.length?'':'No sets match your search.';
    more.textContent=unavailable?'Retry loading sets':'Load more sets';
    more.disabled=false;
    more.hidden=officialOffset>=official.length&&teacherDone;
  }

  async function openBank(set,official,control) {
    clearBank('Loading questions…');
    const current=bankRequest;
    const bankScope=scope;
    activeSetButton=control;
    control.setAttribute('aria-pressed','true');
    try{
      const result=await (official?loadQuestionSet(set.id):loadTeacherSet(set.id,bankScope));
      if(current!==bankRequest||!dialog.open)return;
      bank=result;
      title.textContent=bank.title;
      sourceLabel(source,official);
      if(bankScope==='mine')source.textContent=set.visibility==='public'?'My Sets · Public':'My Sets · Private';
      source.hidden=false;
      hint.hidden=true;
      questionSearch.value='';
      selected.hidden=false;
      renderBank();
      title.closest('.picker-pane').scrollTop=0;
      title.focus({preventScroll:true});
      title.scrollIntoView({block:'nearest'});
    }catch(error){
      if(current===bankRequest&&dialog.open)clearBank(error.message);
    }
  }

  function renderBank() {
    if(!bank)return;
    const term=questionSearch.value.trim().toLowerCase();
    const questions=bank.questions.filter(q=>[q.question,...q.choices].some(text=>text.toLowerCase().includes(term)));
    $('picker-question-list').replaceChildren(...questions.map(q=>{
      const row=document.createElement('article');
      const answer=document.createElement('details');
      const summary=document.createElement('summary');
      const choices=document.createElement('ol');
      const correct=correctAnswers(q);
      summary.textContent=q.question;
      for(const [index,choice] of q.choices.entries()){
        const item=document.createElement('li');
        item.textContent=choice+(correct.includes(index)?' (correct)':'');
        choices.append(item);
      }
      answer.append(summary,choices);
      const key=bank.id+'::'+q.id;
      const reusable={...q,...(bank.id.startsWith('teacher:')?{}:{_sourceKey:`original:${bank.id}:${q.id}`})};
      const add=button(added.has(key)?'Added':'＋ Add',()=>{
        try{
          addQuestion(reusable);
          added.add(key);
          add.textContent='Added';
          add.setAttribute('aria-label','Added: '+q.question);
          add.disabled=true;
          status.textContent='Question added to your draft.';
        }catch(error){status.textContent=error.message;}
      });
      add.setAttribute('aria-label',(added.has(key)?'Added: ':'Add question: ')+q.question);
      add.disabled=added.has(key);
      row.append(answer,add);
      return row;
    }));
    if(!questions.length)$('picker-question-list').textContent=bank.questions.length?'No questions match in this set.':'This set has no complete questions to add.';
  }

  function changeScope(next) {
    scope=next;
    const mine=scope==='mine';
    publicTab.setAttribute('aria-pressed',String(!mine));
    mineTab.setAttribute('aria-pressed',String(mine));
    $('picker-search-label').textContent=mine?'Search my sets':'Search public sets';
    search.placeholder=mine?'Set title':'Title, subject, or topic';
    search.value='';
    findSets();
  }

  $('import-question').onclick=()=>{
    added.clear();
    dialog.showModal();
    changeScope('public');
    search.focus();
  };
  $('close-question-picker').onclick=()=>dialog.close();
  publicTab.onclick=()=>{if(scope!=='public')changeScope('public');};
  mineTab.onclick=()=>{if(scope!=='mine')changeScope('mine');};
  $('picker-search-form').onsubmit=event=>{event.preventDefault();findSets();};
  questionSearch.oninput=renderBank;
  more.onclick=()=>findSets(false);
  dialog.addEventListener('close',()=>{request++;bankRequest++;});
}
