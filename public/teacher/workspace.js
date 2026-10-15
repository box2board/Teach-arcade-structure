import {QUESTION_SETS,loadQuestionSet,gamesForSet,gameUrl} from '../review-lab/catalog.js';
const $=id=>document.getElementById(id);
let user=null,configured=false,saved=new Set(),savedView=false,limit=24,previewRequest=0;
const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
async function api(action,body){
 const response=await fetch(`/api/teacher?action=${action}`,{method:body?'POST':'GET',credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json();if(!response.ok){if(response.status===401){user=null;saved.clear();paintAccount();render();}throw new Error(data.error||'Account request failed.');}return data;
}
function notice(text){$('notice').textContent=text;}
function route(){
 const name=location.hash.slice(1)||'home',valid=['home','sets','assignments','classes','reports','account'].includes(name)?name:'home';
 for(const id of ['home','sets','future','account'])$(id).hidden=true;
 const future={assignments:['Assignments','Next, you’ll pair a question set with a game, choose settings, and share a simple student join link. Assignment creation is not available in this preview.'],classes:['Classes','Classes will help you organize assignments by teaching group. There is no student roster or student data in this preview.'],reports:['Reports','Academic accuracy and question-level results will stay separate from game scores. No results are being recorded in this preview.']};
 if(future[valid]){$('future').hidden=false;$('future-title').textContent=future[valid][0];$('future-copy').textContent=future[valid][1];}else $(valid).hidden=false;
 document.querySelectorAll('nav a').forEach(a=>{if(a.hash===`#${valid}`)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 $('breadcrumb').textContent={home:'Home',sets:'My Question Sets',account:'Account',assignments:'Assignments',classes:'Classes',reports:'Reports'}[valid];
}
function paintAccount(){
 $('account-button').textContent=user?'My account':'Sign in';
 $('login-form').hidden=!!user;$('verify-form').hidden=true;$('profile').hidden=!user;$('logout').hidden=!user;
 $('send-code').disabled=!configured;
 if(user){$('profile').replaceChildren(node('h2','Teacher account'),node('p',user.email),node('p',`Plan: ${user.plan} · Billing is not enabled.`));notice('Signed in · Your saved question sets belong to your teacher account.');}
 else notice(configured?'Browse the public library, or sign in to save question sets.':'Preview mode · The public library is live. Teacher sign-in and saving require the development account service to be connected.');
}
function categories(){const previous=$('category').value;const categories=[...new Set(QUESTION_SETS.filter(s=>!$('subject').value||s.subject===$('subject').value).map(s=>s.category||'Foundations'))].sort();$('category').replaceChildren(new Option('All categories',''),...categories.map(c=>new Option(c,c)));if(categories.includes(previous))$('category').value=previous;}
function render(){
 $('public-tab').setAttribute('aria-pressed',String(!savedView));$('saved-tab').setAttribute('aria-pressed',String(savedView));
 const q=$('search').value.trim().toLowerCase();
 const matches=QUESTION_SETS.filter(s=>(!savedView||saved.has(s.id))&&(!$('subject').value||s.subject===$('subject').value)&&(!$('category').value||(s.category||'Foundations')===$('category').value)&&[s.title,s.subject,s.category||''].join(' ').toLowerCase().includes(q));
 $('count').textContent=`${matches.length} question sets${savedView?' saved':''} · Showing ${Math.min(limit,matches.length)}`;
 const cards=matches.slice(0,limit).map(s=>{
  const card=node('article',undefined,'set');card.dataset.subject=s.subject;card.append(node('p',s.subject,'eyebrow'),node('h2',s.title),node('p',`${s.category||'Foundations'} · ${s.questionCount} questions · Grades ${s.gradeBand||'7–12'}`,'muted'));
  const actions=node('div',undefined,'set-actions'),preview=node('button','Preview questions'),save=node('button',saved.has(s.id)?'Saved ✓':'Save');
  save.setAttribute('aria-label',`${saved.has(s.id)?'Unsave':'Save'} ${s.title}`);save.setAttribute('aria-pressed',String(saved.has(s.id)));preview.onclick=()=>previewSet(s);save.onclick=async()=>{
   if(!user){location.hash='account';return;}
   save.disabled=true;try{const wasSaved=saved.has(s.id);await api(wasSaved?'unsave':'save',{setId:s.id});if(wasSaved)saved.delete(s.id);else saved.add(s.id);render();notice(wasSaved?'Question set removed from your saved library.':'Question set saved to your teacher account.');}catch(e){notice(e.message);save.disabled=false;}
  };actions.append(preview,save);card.append(actions);return card;
 });
 if(!cards.length)cards.push(node('p',savedView&&!user?'Sign in to build your saved library.':savedView&&!saved.size?'Your saved library is ready for its first topic. Browse the public library and select Save.':'No matching topics. Try a different search or subject.','empty'));
 $('catalog').replaceChildren(...cards);$('more').hidden=limit>=matches.length;
}
async function previewSet(set){
 const request=++previewRequest;$('detail-title').textContent=set.title;$('detail-meta').textContent=`${set.subject} · ${set.questionCount} questions`;$('detail-questions').textContent='Loading questions…';$('detail-games').replaceChildren();$('detail').showModal();
 try{const bank=await loadQuestionSet(set.id);if(request!==previewRequest||!$('detail').open)return;
 $('detail-questions').replaceChildren(...bank.questions.map((q,i)=>{const box=node('article',undefined,'question'),list=node('ol');list.type='A';q.choices.forEach(c=>list.append(node('li',c)));const answer=node('details');answer.append(node('summary','Show answer & explanation'),node('p',`${q.choices[q.answer]}${q.explanation?' — '+q.explanation:''}`));box.append(node('h3',`${i+1}. ${q.question}`),list,answer);return box;}));
 $('detail-games').replaceChildren(...gamesForSet(set.id).map(g=>{const link=node('a',`${g.title} ↗`);link.href=gameUrl(g.id,set.id);link.target='_blank';link.rel='noopener';return link;}));
 }catch{if(request===previewRequest)$('detail-questions').textContent='This set could not load. Close the preview and try again.';}
}
$('close-detail').onclick=()=>{$('detail').close();previewRequest++;};
$('account-button').onclick=()=>{location.hash='account';};
$('public-tab').onclick=()=>{savedView=false;limit=24;render();};$('saved-tab').onclick=()=>{savedView=true;limit=24;render();};
$('search').oninput=()=>{limit=24;render();};$('subject').onchange=()=>{categories();limit=24;render();};$('category').onchange=()=>{limit=24;render();};$('more').onclick=()=>{limit+=24;render();};
$('login-form').onsubmit=async e=>{e.preventDefault();$('send-code').disabled=true;try{await api('login',{email:$('email').value});$('login-form').hidden=true;$('verify-form').hidden=false;$('auth-status').textContent='Check your inbox for your sign-in code.';$('code').focus();}catch(error){$('auth-status').textContent=error.message;}finally{$('send-code').disabled=false;}};
$('back-login').onclick=()=>{$('verify-form').hidden=true;$('login-form').hidden=false;$('code').value='';$('auth-status').textContent='';};
$('verify-form').onsubmit=async e=>{e.preventDefault();const button=e.submitter;button.disabled=true;try{await api('verify',{email:$('email').value,code:$('code').value});$('code').value='';await account();if(user){$('auth-status').textContent='';location.hash='sets';}}catch(error){$('auth-status').textContent=error.message;}finally{button.disabled=false;}};
$('logout').onclick=async()=>{try{await api('logout',{});user=null;saved.clear();paintAccount();render();}catch(error){notice(error.message);}};
async function account(){try{const data=await api('session');configured=data.configured;user=data.user;if(user){const favorites=await api('favorites');saved=new Set(favorites.ids);}paintAccount();render();}catch{notice('Account service unavailable. You can still browse and preview public question sets.');}}
const subjects=[...new Set(QUESTION_SETS.map(s=>s.subject))].sort();subjects.forEach(s=>{$('subject').append(new Option(s,s));const row=node('a',undefined,'subject-row');row.href='#sets';row.dataset.subject=s;const symbols={'Social Studies':'◎',Science:'⚗',Math:'∑',ELA:'Aa'};row.append(node('span',symbols[s]||'✦','subject-symbol'),node('strong',s),node('span',`${QUESTION_SETS.filter(q=>q.subject===s).length} sets →`));row.onclick=()=>{savedView=false;limit=24;$('subject').value=s;$('search').value='';$('category').value='';categories();render();};$('subject-summary').append(row);});
window.addEventListener('hashchange',route);categories();render();route();account();
