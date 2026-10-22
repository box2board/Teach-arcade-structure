import {GAMES} from '../../review-lab/catalog.js';
import {SET_SUBJECTS,completeQuestion,setInput,teacherBank,MAX_QUESTIONS} from '../set-contract.js';
const $=id=>document.getElementById(id),el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
let user=null,view='mine',offset=0,version=0,editing=null,dirty=false,busy=false,search='',lastList=[];
const blank=()=>({question:'',choices:['','','',''],answer:-1,explanation:''});
async function api(action,body,params={}){
 const query=new URLSearchParams({action,...params});const response=await fetch('/api/teacher-sets?'+query,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json();if(!response.ok){const error=new Error(data.error||'Question sets are unavailable.');error.status=response.status;throw error;}return data;
}
function status(text){$('set-status').textContent=text;}
function show(id){for(const section of ['set-library','set-editor','set-detail'])$(section).hidden=section!==id;}
function action(text,fn){const button=el('button',text);button.type='button';button.onclick=async()=>{button.disabled=true;try{await fn();}catch(error){status(error.message);}finally{button.disabled=false;}};return button;}
function signedIn(){if(user)return true;status('Sign in to create, copy, or save sets. Your public library is available to browse.');$('sign-in').focus();return false;}
function canLeave(){return !busy&&(!dirty||window.confirm('Leave without saving your latest changes?'));}
function resetUrl(){history.replaceState(null,'','/teacher/sets/');}
async function list(reset=true){
 if(reset){offset=0;lastList=[];$('teacher-sets').replaceChildren();}
 const request=++version;$('more-sets').hidden=true;status('Loading question sets…');
 document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
 $('collection-help').textContent=view==='mine'?'Your sets start private. Only you can edit the originals.':view==='saved'?'Saved sets follow the creator’s updates. If a creator makes a set private, it will no longer appear here. Independent copies remain yours.':'Community sets are public. Save a shortcut to follow updates, or make a private copy you can edit.';
 if(!user&&view!=='public'){$('teacher-sets').append(el('p','Sign in to see your collection, or explore the Community library.'));status('Public sets are available without signing in.');return;}
 try{const data=await api(view,null,{q:search,offset:String(offset)});if(request!==version)return;
  lastList.push(...data.sets);$('teacher-sets').append(...data.sets.map(card));$('more-sets').hidden=data.sets.length<25;
  if(!lastList.length)$('teacher-sets').append(el('p',view==='mine'?'Your shelf is ready. Create your first private question set.':'No sets found. Try another search or come back as teachers publish sets.'));
  status(`${lastList.length} sets shown.`);
 }catch(error){if(request!==version)return;status(error.message);$('teacher-sets').append(action('Retry loading',()=>list(reset)));}
}
function card(set){const box=el('article');box.className='set';box.append(el('p',`${set.subject} · ${set.visibility==='public'?'Public':'Private draft'}`),el('h2',set.title),el('p',set.description),el('p',`${set.question_count} questions`));const buttons=el('div');buttons.className='set-actions';buttons.append(action('Open set',()=>openSet(set.id)));if(set.owner_id===user?.id)buttons.append(action('Edit',()=>editSet(set.id)));box.append(buttons);return box;}
async function openSet(id){
 if(!canLeave())return;const request=++version;status('Loading set…');
 try{const {set}=await api('detail',null,{id});if(request!==version)return;dirty=false;show('set-detail');history.replaceState(null,'','?id='+encodeURIComponent(id));
  $('teacher-set-title').textContent=set.title;$('teacher-set-meta').textContent=`${set.subject} · ${set.visibility} · ${set.questions.length} questions`;$('teacher-set-description').textContent=set.description;
  const controls=$('teacher-set-actions');controls.replaceChildren();
  if(user?.id===set.owner_id)controls.append(action('Edit this set',()=>editSet(set.id)));
  else controls.append(action('Make a private copy',async()=>{if(!signedIn())return;const copied=await api('copy',{id:set.id});await editSet(copied.set.id);status('Private copy created. Your edits will not change the original.');}));
  controls.append(action('Save to My Question Sets',async()=>{if(!signedIn())return;await api('save',{id:set.id});status('Saved to your collection. This shortcut follows the creator’s updates.');}));
  if(view==='saved')controls.append(action('Remove saved shortcut',async()=>{await api('unsave',{id:set.id});show('set-library');resetUrl();await list();}));
  $('teacher-set-games').replaceChildren();
  try{teacherBank(set);$('teacher-set-games').append(el('p','Play this set:'));for(const game of GAMES.filter(g=>g.supportsQuestionBank)){const a=el('a',game.title+' ↗');a.href=game.url+'?set='+encodeURIComponent('teacher:'+set.id)+'&from=teacher-hq';a.target='_blank';a.rel='noopener';$('teacher-set-games').append(a);}}
  catch{$('teacher-set-games').append(el('p','Add at least 12 complete questions to play this draft.'));}
  $('teacher-set-questions').replaceChildren(...set.questions.map((q,i)=>{const d=el('details');d.append(el('summary',`${i+1}. ${q.question||'Unfinished question'}`));const choices=el('ol');choices.type='A';for(const [n,text]of q.choices.entries())choices.append(el('li',(text||'Unfinished choice')+(n===q.answer?' ✓':'')));d.append(choices,el('p',q.explanation));return d;}));
  status(set.visibility==='private'?'Private · Only you can access this set.':'Public · Anyone with access to this library can read, play, and copy this set.');$('teacher-set-title').tabIndex=-1;$('teacher-set-title').focus();
 }catch(error){if(request===version)status(error.message);}
}
async function editSet(id){
 if(!user){location.assign('/teacher/?return=teacher-sets&intent=create#account');return;}
 if(!canLeave())return;
 if(id){const {set}=await api('detail',null,{id});if(set.owner_id!==user.id)throw Error('Make a copy to edit another teacher’s set.');editing=set;}
 else editing={title:'',description:'',subject:'Social Studies',visibility:'private',questions:[blank()]};
 version++;dirty=false;resetUrl();show('set-editor');$('set-title').value=editing.title;$('set-description').value=editing.description;$('set-subject').value=editing.subject;
 $('editor-heading').textContent=editing.id?'Edit your set':'Create a question set';$('editor-status').textContent='';$('reload-set').hidden=true;renderQuestions();editorState();$('set-title').focus();
}
function syncMetadata(){editing.title=$('set-title').value;editing.description=$('set-description').value;editing.subject=$('set-subject').value;}
function editorState(){
 const isPublic=editing.visibility==='public';$('visibility-note').textContent=isPublic?'Public · Saving changes updates the set for everyone who uses the original.':'Private · Only you can access this draft. Publishing is a separate step.';
 $('save-set').textContent=isPublic?'Save public changes':'Save private draft';$('publish-set').hidden=isPublic;$('private-set').hidden=!isPublic;
 $('question-progress').textContent=`${editing.questions.filter(completeQuestion).length} complete / ${editing.questions.length} questions · ${dirty||!editing.id?'Unsaved changes':'Saved version'}`;
 $('add-question').disabled=editing.questions.length>=MAX_QUESTIONS;
}
function renderQuestions(){
 $('question-editor').replaceChildren(...editing.questions.map((q,i)=>{
  const field=el('fieldset');field.className='question-edit';field.append(el('legend',`Question ${i+1}`));
  const input=(label,value,max,set,tag='input')=>{const wrap=el('label',label),control=el(tag);if(tag==='input')control.type='text';control.value=value;control.maxLength=max;control.oninput=()=>{set(control.value);dirty=true;editorState();};wrap.append(control);return wrap;};
  field.append(input('Question',q.question,1000,v=>q.question=v,'textarea'));
  const answers=el('div');answers.className='answer-list';
  for(let c=0;c<4;c++){const row=el('div');row.className='answer-edit';const radio=el('input');radio.type='radio';radio.name=`correct-${i}`;radio.checked=q.answer===c;radio.setAttribute('aria-label',`Mark choice ${'ABCD'[c]} correct for question ${i+1}`);radio.onchange=()=>{q.answer=c;dirty=true;editorState();};row.append(radio,input(`Choice ${'ABCD'[c]}`,q.choices[c],500,v=>q.choices[c]=v));answers.append(row);}
  field.append(answers,input('Explanation (optional)',q.explanation,2000,v=>q.explanation=v,'textarea'));
  const tools=el('div');tools.className='question-tools';tools.append(action('Duplicate question',()=>{if(editing.questions.length>=MAX_QUESTIONS)return;editing.questions.splice(i+1,0,structuredClone(q));dirty=true;renderQuestions();editorState();}),action('Remove question',()=>{editing.questions.splice(i,1);dirty=true;renderQuestions();editorState();}));field.append(tools);return field;
 }));
}
async function save(visibility=editing.visibility){
 if(busy)return;syncMetadata();
 try{
  const input=setInput({...editing,visibility});
  if(visibility==='public'&&editing.visibility!=='public'&&!window.confirm('Publish this set? Other teachers will be able to read, play, save, and copy it. Do not include student names or personal information.'))return;
  if(visibility==='private'&&editing.visibility==='public'&&!window.confirm('Make this set private? Other teachers will lose access to the original. Copies they already made will remain theirs.'))return;
  busy=true;$('editor-fields').disabled=true;document.querySelectorAll('.editor-actions button').forEach(b=>b.disabled=true);$('editor-status').textContent='Saving…';
  // New sets are always inserted privately before an explicit publication update.
  let data=await api(editing.id?'update':'create',{...input,...(editing.id?{id:editing.id,revision:editing.revision}:{})});
  editing=data.set;dirty=false;
  if(visibility==='public'&&editing.visibility!=='public'){dirty=true;data=await api('update',{...input,id:editing.id,revision:editing.revision});editing=data.set;dirty=false;}
  $('editor-status').textContent=editing.visibility==='public'?'Published · Other teachers can now use this set.':'Private draft saved to your account.';$('reload-set').hidden=true;renderQuestions();editorState();
 }catch(error){$('editor-status').textContent=error.message;if(error.status===409)$('reload-set').hidden=false;}
 finally{busy=false;$('editor-fields').disabled=false;document.querySelectorAll('.editor-actions button').forEach(b=>b.disabled=false);editorState();}
}
$('new-set').onclick=()=>editSet().catch(e=>status(e.message));
for(const button of document.querySelectorAll('[data-view]'))button.onclick=()=>{if(!canLeave())return;dirty=false;view=button.dataset.view;show('set-library');resetUrl();list();};
$('set-search-form').onsubmit=e=>{e.preventDefault();search=$('set-search').value;list();};$('more-sets').onclick=()=>{offset+=25;list(false);};
for(const id of ['close-editor','close-detail-set'])$(id).onclick=()=>{if(!canLeave())return;dirty=false;show('set-library');resetUrl();list();};
$('editor-form').onsubmit=e=>{e.preventDefault();save();};$('publish-set').onclick=()=>save('public');$('private-set').onclick=()=>save('private');
$('add-question').onclick=()=>{if(editing.questions.length>=MAX_QUESTIONS)return;editing.questions.push(blank());dirty=true;renderQuestions();editorState();$('question-editor').lastElementChild?.querySelector('textarea')?.focus();};
for(const id of ['set-title','set-description','set-subject'])$(id).oninput=()=>{dirty=true;syncMetadata();editorState();};
$('reload-set').onclick=()=>editSet(editing.id).catch(e=>status(e.message));
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
for(const subject of SET_SUBJECTS){const option=el('option',subject);option.value=subject;$('set-subject').append(option);}
try{const response=await fetch('/api/teacher?action=session',{credentials:'same-origin',cache:'no-store'});const data=await response.json();user=data.user||null;if(user)$('sign-in').textContent='My account';}catch{status('Account connection unavailable. You can still try the Community library.');}
$('new-set').disabled=false;
if(!user)view='public';
const initial=new URLSearchParams(location.search).get('id');if(initial)await openSet(initial);else if(user&&new URLSearchParams(location.search).get('create')==='1')await editSet();else await list();
