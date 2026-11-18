import {teacherSetsRequest as api} from '../sets-client.js';
import {matchesSetSearch,matchesSetFields,mountSetFilters,originalSetLine} from '../../review-lab/set-filters.js';
import {GAMES,QUESTION_SETS,loadQuestionSet} from '../../review-lab/catalog.js';
import {originalCopy} from '../originals.js';
import {mountQuestionPicker} from './question-picker.js';
import {SET_SUBJECTS,teacherSetId,completeQuestion,setInput,teacherBank,MAX_QUESTIONS,correctAnswers} from '../set-contract.js';
const $=id=>document.getElementById(id),el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
let user=null,view='browse',offset=0,communityOffset=0,communityDone=false,version=0,editing=null,dirty=false,busy=false,search='',lastList=[];
const originals=QUESTION_SETS.filter(s=>!s.id.startsWith('teacher:'));
const query=new URLSearchParams(location.search);
const filters=mountSetFilters($('original-filters'),originals,['primaryGrade','gradeBand','subject','category','difficulty'],
 ()=>list(),{gradeBand:query.get('band')});
const discoveryView=()=>['browse','public','originals'].includes(view);
const communitySubject=subject=>subject==='English Language Arts'?'ELA':SET_SUBJECTS.includes(subject)?subject:'Other';
const blank=()=>({question:'',choices:['','','',''],answer:[],explanation:''});
const subjectColors={'Math':'#baa6fd','Science':'#81e6d5','Social Studies':'#fbd28c','English Language Arts':'#9dc9fc','ELA':'#9dc9fc','Fine Arts':'#fbd0ee'};
function colorCard(box,subject){box.style.setProperty('--subject-color',subjectColors[subject]||'#acb7d3');}
function status(text){$('set-status').textContent=text;}
function show(id){for(const section of ['set-library','set-editor','set-detail'])$(section).hidden=section!==id;}
function action(text,fn){const button=el('button',text);button.type='button';button.onclick=async()=>{button.disabled=true;try{await fn();}catch(error){status(error.message);}finally{button.disabled=false;}};return button;}
function signedIn(){if(user)return true;status('Sign in to create, copy, or save sets. Your public library is available to browse.');$('sign-in').focus();return false;}
function canLeave(){return !busy&&(!dirty||window.confirm('Leave without saving your latest changes?'));}
function resetUrl(){history.replaceState(null,'','/teacher/sets/?view='+view);}
function rememberSavedSet(){
 view='mine';
 $('set-search').value=search='';
 history.replaceState(null,'','/teacher/sets/?view=mine&edit='+encodeURIComponent(editing.id));
}
async function goToMySets(){
 if(!canLeave())return;
 dirty=false;
 view='mine';
 $('set-search').value=search='';
 show('set-library');
 resetUrl();
 await list();
 document.querySelector('[data-view="mine"]').focus();
}
function sourceLabel(node,official){
 node.classList.toggle('original-badge',official);
 node.replaceChildren();
 if(official){
  const emblem=el('img');emblem.src='/assets/images/teach-arcade-logo.png';emblem.alt='';emblem.width=24;emblem.height=24;
  node.append(emblem,'Teach Arcade Original');
 }else node.textContent='Teacher-created';
}
async function discoverCommunity(term,offset,selected={}){
 return (await api('public',null,{q:term,offset:String(offset),search:'catalog',...(selected.subject?{subject:communitySubject(selected.subject)}:{}),...(selected.primaryGrade?{primaryGrade:selected.primaryGrade}:{}),...(selected.gradeBand?{gradeBand:selected.gradeBand}:{}),...(selected.category?{topic:selected.category}:{}),...(selected.difficulty?{difficulty:selected.difficulty}:{})})).sets;
}
async function list(reset=true){
 if(reset){offset=0;communityOffset=0;communityDone=false;lastList=[];$('teacher-sets').replaceChildren();}
 const request=++version;$('more-sets').hidden=true;status('Loading question sets…');
 document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
 if(!user)$('sign-in').href='/teacher/?return=teacher-sets'+(view==='mine'?'&view=mine':'')+'#account';
 $('original-filters').hidden=!discoveryView();
 $('set-search').placeholder=discoveryView()?'Title, subject, topic, or keyword':'Search by title';
 $('collection-help').textContent=view==='mine'?'Your new sets start as private drafts.':view==='saved'?'Saved shortcuts follow changes made by the creator.':'Open a set to preview questions, pick a game, or make an editable copy.';
 if(discoveryView()){
  const selected=filters.values();
  const matches=view==='public'?[]:originals.filter(s=>matchesSetFields(s,selected)&&matchesSetSearch(s,search));
  if(selected.gradeBand==='elementary')matches.sort((a,b)=>Number(a.primaryGrade.replace('K','0'))-Number(b.primaryGrade.replace('K','0')));
  const contextualFilter=selected.primaryGrade||selected.gradeBand||selected.category||selected.difficulty;
  const includesCommunity=view!=='originals'&&(!selected.subject||SET_SUBJECTS.includes(communitySubject(selected.subject)));
  const official=matches.slice(offset,offset+25);
  let community=[],unavailable=false;
  if(includesCommunity&&!communityDone){
   try{community=await discoverCommunity(search,communityOffset,selected);}
   catch{unavailable=true;}
  }
  if(request!==version)return;
  if(includesCommunity&&!unavailable){
   communityOffset+=community.length;
   communityDone=community.length<25;
  }
  const cards=[];
  for(let i=0;i<Math.max(official.length,community.length);i++){
   if(official[i])cards.push(originalCard(official[i]));
   if(community[i])cards.push(card(community[i]));
  }
  lastList.push(...official,...community);
  $('teacher-sets').append(...cards);
  $('more-sets').hidden=offset+25>=matches.length&&(!includesCommunity||communityDone||unavailable);
  if(contextualFilter&&view!=='originals')$('collection-help').textContent='Grade, topic, and difficulty filters show sets with matching labels. Clear them to include teacher sets without those labels.';
  if(unavailable){
   status('Teacher-created sets are temporarily unavailable.');
   $('teacher-sets').append(action('Retry teacher sets',()=>list()));
  }else{
   if(!lastList.length)$('teacher-sets').append(el('p','No sets match. Try another search or clear a filter.'));
   status(`${lastList.length} sets shown.`);
  }
  return;
 }
 if(!user&&view!=='public'){$('teacher-sets').append(el('p','Sign in to see your collection, or explore the Community library.'));status('Public sets are available without signing in.');return;}
 try{const data=await api(view,null,{q:search,offset:String(offset)});if(request!==version)return;
  lastList.push(...data.sets);$('teacher-sets').append(...data.sets.map(card));$('more-sets').hidden=data.sets.length<25;
  if(!lastList.length)$('teacher-sets').append(el('p',view==='mine'?'Your shelf is ready. Create your first private question set.':'No sets found. Try another search or come back as teachers publish sets.'));
  status(`${lastList.length} sets shown.`);
 }catch(error){if(request!==version)return;status(error.message);$('teacher-sets').append(action('Retry loading',()=>list(reset)));}
}
function originalCard(set){
 const box=el('article');box.className='set original-set';colorCard(box,set.subject);
 const badge=el('p');sourceLabel(badge,true);
 box.append(badge,el('h2',set.title),el('p',originalSetLine(set)));
 if(set.primaryGrade)box.append(el('p',set.description));
 const buttons=el('div');buttons.className='set-actions';buttons.append(action('Preview & play',()=>openOriginal(set.id)),action('Copy to My Sets',()=>customizeOriginal(set.id)));box.append(buttons);return box;
}
function renderQuestionsPreview(questions){
 $('teacher-set-questions').replaceChildren(...questions.map((q,i)=>{const d=el('details');d.append(el('summary',`${i+1}. ${q.question||'Unfinished question'}`));const choices=el('ol');choices.type='A';for(const [n,text]of q.choices.entries())choices.append(el('li',(text||'Unfinished choice')+(correctAnswers(q).includes(n)?' ✓':'')));d.append(choices);if(q.explanation)d.append(el('p',q.explanation));return d;}));
}
function renderGameLinks(id){
 $('teacher-set-games').replaceChildren(el('p','Play this set. Games with fixed rounds or timed play may repeat questions from shorter sets.'));
 for(const game of GAMES.filter(g=>g.supportsQuestionBank)){const a=el('a',game.title+' ↗');a.href=game.url+'?set='+encodeURIComponent(id)+'&from=teacher-hq';a.target='_blank';a.rel='noopener';$('teacher-set-games').append(a);}
}
async function openOriginal(id){
 if(!canLeave())return;const request=++version;status('Loading Teach Arcade Original…');
 try{const bank=await loadQuestionSet(id);if(request!==version)return;
  if(id.startsWith('teacher:'))throw Error('Choose a Teach Arcade Original.');
  dirty=false;show('set-detail');history.replaceState(null,'','?original='+encodeURIComponent(id));
  sourceLabel($('set-source-label'),true);$('teacher-set-title').textContent=bank.title;
  $('teacher-set-meta').textContent=originalSetLine({...bank,questionCount:bank.questions.length});
  const description=$('teacher-set-description');
  description.replaceChildren(el('span',bank.description||'Ready-made review questions from Teach Arcade.'));
  if(bank.standards?.length){
   const framework=bank.standards[0].startsWith('NGSS ')?'NGSS practice connections':
    bank.standards[0].startsWith('Ohio SS 2026 ')?'Ohio Social Studies (2026)':'Ohio Learning Standards';
   description.append(el('br'),el('span',framework+' · '+bank.standards.map(id=>id.replace(/^(NGSS |Ohio SS 2026 )/,'')).join(', ')));
  }
  const play=el('a','Open in My Cabinet →');play.href='/teacher/#games&set='+encodeURIComponent(id);
  $('teacher-set-actions').replaceChildren(action('Copy to My Sets',()=>customizeOriginal(id)),play);
  renderGameLinks(id);renderQuestionsPreview(bank.questions);status('Official Original · Make a private copy to remove, add, or edit questions.');$('teacher-set-title').tabIndex=-1;$('teacher-set-title').focus();
 }catch(error){if(request===version)status(error.message);}
}
async function customizeOriginal(id){
 if(busy||!canLeave())return;
 if(!user){status('Sign in to customize an Original. Then return to Teach Arcade Originals and choose your set.');location.assign('/teacher/?return=teacher-sets&original='+encodeURIComponent(id)+'#account');return;}
 if(id.startsWith('teacher:')||!QUESTION_SETS.some(s=>s.id===id))throw Error('Choose a Teach Arcade Original.');
 busy=true;status('Creating your private copy…');let copied;
 try{copied=await api('create',originalCopy(await loadQuestionSet(id)));}finally{busy=false;}
 dirty=false;await editSet(copied.set.id);status('Private copy saved. Remove or edit questions to fit your lesson. The Teach Arcade Original stays unchanged.');
}
function card(set){const box=el('article');box.className='set';colorCard(box,set.subject);box.append(el('p',set.visibility==='public'?'Teacher-created · Public':'Private draft'),el('p',set.subject),el('h2',set.title),el('p',set.description),el('p',`${set.question_count} questions`));const buttons=el('div');buttons.className='set-actions';buttons.append(action('Preview & play',()=>openSet(set.id)));if(set.visibility==='public')buttons.append(action('Copy to My Sets',()=>copyTeacherSet(set.id)));if(set.owner_id===user?.id)buttons.append(action('Edit',()=>editSet(set.id)));box.append(buttons);return box;}
async function copyTeacherSet(id){
 if(!canLeave())return;
 if(!user){location.assign('/teacher/?return=teacher-sets&id='+encodeURIComponent(id)+'#account');return;}
 busy=true;let copied;
 try{copied=await api('copy',{id});}finally{busy=false;}
 await editSet(copied.set.id);
 status('Private copy created. You can add, remove, or edit questions.');
}
async function openSet(id){
 if(!canLeave())return;const request=++version;status('Loading set…');
 try{const {set}=await api('detail',null,{id});if(request!==version)return;dirty=false;show('set-detail');history.replaceState(null,'','?id='+encodeURIComponent(id));
  sourceLabel($('set-source-label'),false);$('teacher-set-title').textContent=set.title;$('teacher-set-meta').textContent=`${set.subject} · ${set.visibility} · ${set.questions.length} questions`;$('teacher-set-description').textContent=set.description;
  const controls=$('teacher-set-actions');controls.replaceChildren();
  if(user?.id===set.owner_id)controls.append(action('Edit this set',()=>editSet(set.id)));
  if(set.visibility==='public'&&!set.moderation_hidden)controls.append(action('Copy to My Sets',()=>copyTeacherSet(set.id)));
  controls.append(action('Save to My Question Sets',async()=>{if(!signedIn())return;await api('save',{id:set.id});status('Saved to your collection. This shortcut follows the creator’s updates.');}));
  if(view==='saved')controls.append(action('Remove saved shortcut',async()=>{await api('unsave',{id:set.id});show('set-library');resetUrl();await list();}));
  if(set.visibility==='public'&&set.owner_id!==user?.id){
   const label=el('label','Report reason');const reasons=el('select');reasons.setAttribute('aria-label','Report reason');
   for(const [value,text]of [['incorrect','Incorrect answers'],['inappropriate','Inappropriate content'],['copyright','Copyright concern'],['personal-data','Personal information'],['other','Other concern']]){const option=el('option',text);option.value=value;reasons.append(option);}
   label.append(reasons);controls.append(label,action('Report this set',async()=>{if(!signedIn())return;if(!window.confirm('Send this set for review? Reporting does not automatically hide it.'))return;await api('report',{id:set.id,reason:reasons.value});status('Report received. Thank you. A moderator can review it; this does not automatically hide the set.');}));
  }
  $('teacher-set-games').replaceChildren();
  try{teacherBank(set);renderGameLinks('teacher:'+set.id);}
  catch(error){$('teacher-set-games').append(el('p',error.message));}
  renderQuestionsPreview(set.questions);
  status(set.moderation_hidden?'Hidden from the community by a moderator. You can edit your original; publishing cannot remove this restriction.':set.visibility==='private'?'Private · Only you can access this set.':'Public · Anyone with access to this library can read, play, and copy this set.');$('teacher-set-title').tabIndex=-1;$('teacher-set-title').focus();
 }catch(error){if(request===version)status(error.message);}
}
async function editSet(id){
 if(!user){location.assign('/teacher/?return=teacher-sets&'+(id?'edit='+encodeURIComponent(id):'intent=create')+'#account');return;}
 if(!canLeave())return;
 const request=++version;
 if(id){
  const {set}=await api('detail',null,{id});
  if(request!==version)return;
  if(set.owner_id!==user.id)throw Error('Make a copy to edit another teacher’s set.');
  editing=set;
  rememberSavedSet();
 }else{
  editing={title:'',description:'',subject:'Social Studies',topic:'',primary_grade:'',grade_band:'',difficulty:'',visibility:'public',questions:[blank()]};
  resetUrl();
 }
 dirty=false;show('set-editor');$('set-title').value=editing.title;$('set-description').value=editing.description;$('set-subject').value=editing.subject;$('set-topic').value=editing.topic||'';$('set-primary-grade').value=editing.primary_grade||'';$('set-grade-band').value=editing.grade_band||'';$('set-difficulty').value=editing.difficulty||'';
 $('editor-heading').textContent=editing.id?'Edit your set':'Create a question set';$('editor-status').textContent='';$('reload-set').hidden=true;renderQuestions();editorState();$('set-title').focus();
}
function syncMetadata(){editing.title=$('set-title').value;editing.description=$('set-description').value;editing.subject=$('set-subject').value;editing.topic=$('set-topic').value;editing.primary_grade=$('set-primary-grade').value;editing.grade_band=$('set-grade-band').value;editing.difficulty=$('set-difficulty').value;}
function editorState(){
 $('view-my-sets').hidden=!editing.id;
 const isPublic=editing.visibility==='public';$('visibility-note').textContent=isPublic?'Public · New sets are shared with other teachers when saved.':'Private · Only you can access this draft.';
 $('save-set').textContent=isPublic?(editing.id?'Save public changes':'Save & share with teachers'):'Save private draft';$('publish-set').hidden=isPublic||!editing.id;$('private-set').hidden=!isPublic&&!!editing.id;$('private-set').textContent=isPublic?(editing.id?'Make private':'Save as private draft'):'Publish for other teachers';
 $('question-progress').textContent=`${editing.questions.filter(completeQuestion).length} complete / ${editing.questions.length} questions · ${dirty||!editing.id?'Unsaved changes':'Saved version'}`;
 $('add-question').disabled=$('import-question').disabled=editing.questions.length>=MAX_QUESTIONS;
 $('answer-compatibility').textContent=editing.questions.some(q=>correctAnswers(q).length>1)?'Multiple correct answers selected. Students must select every correct choice, then submit. No partial credit.':'';
}
function renderQuestions(){
 $('question-editor').replaceChildren(...editing.questions.map((q,i)=>{
  const field=el('fieldset');field.className='question-edit';field.append(el('legend',`Question ${i+1}`));
  const input=(label,value,max,set,tag='input')=>{const wrap=el('label',label),control=el(tag);if(tag==='input')control.type='text';control.value=value;control.maxLength=max;control.oninput=()=>{set(control.value);dirty=true;editorState();};wrap.append(control);return wrap;};
  field.append(input('Question',q.question,1000,v=>q.question=v,'textarea'));
  field.append(el('p','Check every correct answer. You can select more than one.'));
  const answers=el('div');answers.className='answer-list';
  for(let c=0;c<4;c++){const row=el('div');row.className='answer-edit';const radio=el('input');radio.type='checkbox';radio.name=`correct-${i}`;radio.checked=correctAnswers(q).includes(c);radio.setAttribute('aria-label',`Mark choice ${'ABCD'[c]} correct for question ${i+1}`);radio.onchange=()=>{q.answer=radio.checked?[...new Set([...correctAnswers(q),c])].sort((a,b)=>a-b):correctAnswers(q).filter(n=>n!==c);dirty=true;editorState();};row.append(radio,input(`Choice ${'ABCD'[c]}`,q.choices[c],500,v=>q.choices[c]=v));answers.append(row);}
  field.append(answers,input('Explanation (optional)',q.explanation,2000,v=>q.explanation=v,'textarea'));
  const tools=el('div');tools.className='question-tools';tools.append(action('Duplicate question',()=>{if(editing.questions.length>=MAX_QUESTIONS)return;editing.questions.splice(i+1,0,structuredClone(q));dirty=true;renderQuestions();editorState();}),action('Remove question',()=>{editing.questions.splice(i,1);dirty=true;renderQuestions();editorState();}));field.append(tools);return field;
 }));
}
async function save(visibility=editing.visibility){
 if(busy)return;syncMetadata();
 try{
  const input=setInput({...editing,visibility});
  if(visibility==='public'&&editing.visibility!=='public'&&!window.confirm('Publish this set? Other teachers will be able to read, play, save, and copy it. Do not include student names or personal information.'))return;
  if(visibility==='private'&&editing.id&&editing.visibility==='public'&&!window.confirm('Make this set private? Other teachers will lose access to the original. Copies they already made will remain theirs.'))return;
  busy=true;$('editor-fields').disabled=true;document.querySelectorAll('.editor-actions button').forEach(b=>b.disabled=true);$('editor-status').textContent='Saving…';
  const data=await api(editing.id?'update':'create',{...input,...(editing.id?{id:editing.id,revision:editing.revision}:{})});
  editing=data.set;dirty=false;rememberSavedSet();$('editor-heading').textContent='Edit your set';
  $('editor-status').textContent=editing.visibility==='public'?'Published to My Sets and the public library.':'Private draft saved in My Sets.';$('reload-set').hidden=true;renderQuestions();editorState();
 }catch(error){$('editor-status').textContent=error.message;if(error.status===409)$('reload-set').hidden=false;}
 finally{busy=false;$('editor-fields').disabled=false;document.querySelectorAll('.editor-actions button').forEach(b=>b.disabled=false);editorState();}
}
mountQuestionPicker({
 originals,discoverCommunity,loadQuestionSet,sourceLabel,
 editingId:()=>editing?.id,
 async discoverMine(term,offset){
  return (await api('mine',null,{q:term,offset:String(offset)})).sets;
 },
 async loadTeacherSet(id,scope){
  if(!teacherSetId(id))throw Error('Invalid question set.');
  const {set}=await api('detail',null,{id});
  if(scope==='mine'){
   if(set.owner_id!==user?.id)throw Error('This set is no longer in My Sets.');
   return {...set,id:'teacher:'+id,questions:set.questions.map((q,i)=>({...q,id:i+1})).filter(completeQuestion)};
  }
  if(set.visibility!=='public'||set.moderation_hidden)throw Error('This set is no longer public.');
  return teacherBank(set);
 },
 addQuestion(question){
  if(editing.questions.length>=MAX_QUESTIONS)throw Error('Your set already has 100 questions.');
  const duplicate=editing.questions.some(q=>q.question===question.question&&q.choices.every((choice,index)=>choice===question.choices[index]));
  if(duplicate)throw Error('This question is already in your draft.');
  const first=editing.questions[0];
  if(editing.questions.length===1&&!first.question&&!first.choices.some(Boolean)&&!first.explanation&&!correctAnswers(first).length)editing.questions=[];
  editing.questions.push({question:question.question,choices:[...question.choices],answer:correctAnswers(question),explanation:question.explanation||'',_versionId:question._versionId||null,_sourceKey:question._sourceKey||null,_attribution:question._attribution||{}});
  dirty=true;renderQuestions();editorState();
 }
});
window.addEventListener('pageshow',event=>{if(event.persisted&&!$('set-library').hidden)list();});
$('new-set').onclick=()=>editSet().catch(e=>status(e.message));
for(const button of document.querySelectorAll('[data-view]'))button.onclick=()=>{if(!canLeave())return;dirty=false;view=button.dataset.view;if(view==='public')filters.reset();show('set-library');resetUrl();list();};
document.querySelectorAll('[data-collection]').forEach(button=>button.onclick=()=>{
 const collection=button.dataset.collection;
 const fields=$('original-filters');
 filters.reset();
 fields.querySelector('[name=subject]').value=collection==='elementary'?'Math':collection==='history'?'Social Studies':'Science';
 if(collection==='elementary')fields.querySelector('[name=gradeBand]').value='elementary';
 filters.updateTopics();
 if(collection==='history')fields.querySelector('[name=category]').value='U.S. History';
 $('set-search').value=search='';view='browse';resetUrl();list();$('set-search').focus();
});
let searchTimer;
const runSearch=()=>{clearTimeout(searchTimer);search=$('set-search').value;list();};
$('set-search').oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{if(!$('set-library').hidden)runSearch();},250);};
$('set-search-form').onsubmit=e=>{e.preventDefault();runSearch();};$('more-sets').onclick=()=>{offset+=25;list(false);};
for(const id of ['close-editor','close-detail-set'])$(id).onclick=()=>{if(!canLeave())return;dirty=false;show('set-library');resetUrl();list();};
$('view-my-sets').onclick=goToMySets;
$('editor-form').onsubmit=e=>{e.preventDefault();save();};$('publish-set').onclick=()=>save('public');$('private-set').onclick=()=>save(editing.visibility==='public'?'private':'public');
$('add-question').onclick=()=>{if(editing.questions.length>=MAX_QUESTIONS)return;editing.questions.push(blank());dirty=true;renderQuestions();editorState();$('question-editor').lastElementChild?.querySelector('textarea')?.focus();};
for(const id of ['set-title','set-description','set-subject','set-topic','set-primary-grade','set-grade-band','set-difficulty'])$(id).oninput=()=>{dirty=true;syncMetadata();editorState();};
$('reload-set').onclick=()=>editSet(editing.id).catch(e=>status(e.message));
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
for(const subject of SET_SUBJECTS){const option=el('option',subject);option.value=subject;$('set-subject').append(option);}
try{const response=await fetch('/api/teacher?action=session',{credentials:'same-origin',cache:'no-store'});const data=await response.json();user=data.user||null;if(user){$('sign-in').textContent='My account';$('sign-in').href='/teacher/#account';}}catch{status('Account connection unavailable. You can still try the Community library.');}
$('new-set').disabled=false;
if(['browse','originals','public','mine','saved'].includes(query.get('view')))view=query.get('view');
const requestedOriginal=new URLSearchParams(location.search).get('original');
const initial=query.get('id');
const edit=query.get('edit');
if(teacherSetId(edit)){
 try{await editSet(edit);}catch(error){await list();status(error.message);}
}else if(requestedOriginal)await openOriginal(requestedOriginal);else if(initial)await openSet(initial);else if(query.get('create')==='1')await editSet();else await list();
