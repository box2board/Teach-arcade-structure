import {QUESTION_SETS,GAMES,loadQuestionSet,gamesForSet,gameUrl} from '../review-lab/catalog.js';
const $=id=>document.getElementById(id);
let user=null,configured=false,saved=new Set(),savedView=false,limit=24,previewRequest=0;
let selectedSet=null,preferredGame=null,pendingSave=null,returnRoute='sets';
const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
async function api(action,body){
 const response=await fetch(`/api/teacher?action=${action}`,{method:body?'POST':'GET',credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json();if(!response.ok){if(response.status===401){user=null;saved.clear();paintAccount();render();}const error=new Error(data.error||'Account request failed.');error.status=response.status;throw error;}return data;
}
function notice(text){$('notice').textContent=text;}
function route(){
 const params=new URLSearchParams(location.hash.slice(1)),name=location.hash.slice(1).split('&')[0]||'home';
 const valid=['home','sets','saved','games','assignments','classes','reports','account'].includes(name)?name:'home';
 for(const id of ['home','sets','games','future','account'])$(id).hidden=true;
 if(['sets','saved'].includes(valid)){savedView=valid==='saved';$('sets').hidden=false;render();}
 else if(valid==='games'){
  selectedSet=QUESTION_SETS.find(s=>s.id===params.get('set'));
  if(selectedSet){$('games').hidden=false;renderGames();}else{savedView=false;$('sets').hidden=false;render();notice('Choose a topic first, then pick your game.');}
 }else if(['assignments','classes','reports'].includes(valid))$('future').hidden=false;
 else $(valid).hidden=false;
 document.querySelectorAll('nav a').forEach(a=>{if(a.hash===`#${valid}`)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 $('breadcrumb').textContent={home:'Home',sets:'Question Library',saved:'Saved Sets',games:'Choose a Game',account:'Account',assignments:'Coming later',classes:'Coming later',reports:'Coming later'}[valid];
 if($('detail').open)$('detail').close();
 $('main').focus({preventScroll:true});
 window.scrollTo(0,0);
}
function paintAccount(){
 $('account-button').textContent=user?'My account':configured?'Sign in / Create account':'Accounts coming soon';
 $('login-form').hidden=!!user||!configured;$('account-unavailable').hidden=configured||!!user;$('verify-form').hidden=true;$('profile').hidden=!user;$('logout').hidden=!user;
 $('send-code').disabled=!configured;
 $('retry-save').hidden=!user||!pendingSave;
 if(user){$('profile').replaceChildren(node('h2','Teacher account'),node('p',user.email),node('p',`Plan: ${user.plan} · Billing is not enabled.`));notice('Signed in · Your saved question sets belong to your teacher account.');}
 else notice(configured?'Browse the public library, or sign in to save question sets.':'Preview mode · The public library is live. Teacher sign-in and saving require the development account service to be connected.');
}
async function finishPendingSave(){
 if(!pendingSave||!user)return false;
 const button=$('retry-save');button.disabled=true;
 try{const id=pendingSave;await api('save',{setId:id});saved.add(id);pendingSave=null;button.hidden=true;$('auth-status').textContent='';render();notice('Question set saved to your teacher account.');location.hash=returnRoute;return true;}
 catch(error){button.hidden=!user;$('auth-status').textContent=user?'You are signed in, but your topic could not be saved. Select Retry saving to try again.':error.message;notice($('auth-status').textContent);return false;}
 finally{button.disabled=false;}
}
function chooseGame(set){location.hash=`games&set=${encodeURIComponent(set.id)}`;}
function renderGames(){
 $('selected-title').textContent=selectedSet.title;
 $('selected-meta').textContent=`${selectedSet.subject} · ${selectedSet.questionCount} questions · Topic carried into game setup`;
 $('preview-selected').onclick=()=>previewSet(selectedSet);
 const controls={'raceway-rivals':'Keyboard or touch · Choose question count and laps','acorn-dash':'Keyboard or touch · Choose park difficulty','category-clash':'Classroom teams or individual review · Configure your board','review-pinball':'Flipper controls · Choose a table and Classic or Assisted mode','power-clash':'Keyboard · Solo vs. CPU or local two-player','snow-day-defenders':'Choose snow gear and review settings in the game'};
 const games=[...gamesForSet(selectedSet.id)].sort((a,b)=>Number(b.id===preferredGame)-Number(a.id===preferredGame));
 $('game-catalog').replaceChildren(...games.map(g=>{
  const card=node('article',undefined,'launch-game'),img=node('img');img.src=g.image;img.alt=g.imageAlt;img.loading='lazy';img.width=640;img.height=360;
  const content=node('div',undefined,'launch-game-content');content.append(node('p',g.mode,'eyebrow'),node('h2',g.title),node('p',g.description),node('p',controls[g.id]||'Choose available settings in the game','muted'));
  const link=node('a',`Open ${g.title} setup ↗`,'primary');link.href=gameUrl(g.id,selectedSet.id)+'&from=teacher-hq';link.target='_blank';link.rel='noopener';link.setAttribute('aria-label',`Open ${g.title} setup for ${selectedSet.title} in a new tab`);
  content.append(link);card.append(img,content);return card;
 }));
}
function categories(){const previous=$('category').value;const categories=[...new Set(QUESTION_SETS.filter(s=>!$('subject').value||s.subject===$('subject').value).map(s=>s.category||'Foundations'))].sort();$('category').replaceChildren(new Option('All categories',''),...categories.map(c=>new Option(c,c)));if(categories.includes(previous))$('category').value=previous;}
function render(){
 $('library-title').textContent=savedView?'Saved Sets':'Question Library';
 $('saved-help').hidden=!savedView||!!user;
 $('saved-help').textContent=configured?'Sign in to save topics to your account. Public practice needs no sign-in.':'Saving is coming soon. Use the public library to choose a topic and play now.';
 $('preferred-note').hidden=!preferredGame;
 if(preferredGame){const game=GAMES.find(g=>g.id===preferredGame),clear=node('button','Show all games equally');clear.onclick=()=>{preferredGame=null;render();};$('preferred-note').replaceChildren(node('p',`Choose a topic for ${game.title}. You can still pick a different game next.`),clear);}
 $('public-tab').setAttribute('aria-pressed',String(!savedView));$('saved-tab').setAttribute('aria-pressed',String(savedView));
 const q=$('search').value.trim().toLowerCase();
 const matches=QUESTION_SETS.filter(s=>(!savedView||saved.has(s.id))&&(!$('subject').value||s.subject===$('subject').value)&&(!$('category').value||(s.category||'Foundations')===$('category').value)&&[s.title,s.subject,s.category||''].join(' ').toLowerCase().includes(q));
 $('count').textContent=`${matches.length} question sets${savedView?' saved':''} · Showing ${Math.min(limit,matches.length)}`;
 const cards=matches.slice(0,limit).map(s=>{
  const card=node('article',undefined,'set');card.dataset.subject=s.subject;card.append(node('p',s.subject,'eyebrow'),node('h2',s.title),node('p',`${s.category||'Foundations'} · ${s.questionCount} questions · Grades ${s.gradeBand||'7–12'}`,'muted'));
  const actions=node('div',undefined,'set-actions'),play=node('button','Choose a game →','primary'),preview=node('button','Preview questions'),save=node('button',saved.has(s.id)?'Saved ✓':configured?'Save':'Save · coming soon');
  play.onclick=()=>chooseGame(s);play.setAttribute('aria-label',`Choose a game for ${s.title}`);
  save.disabled=!configured;save.title=configured?'Save to your teacher account':'Saving becomes available when teacher accounts are connected.';
  save.setAttribute('aria-label',`${saved.has(s.id)?'Unsave':'Save'} ${s.title}`);save.setAttribute('aria-pressed',String(saved.has(s.id)));preview.onclick=()=>previewSet(s);save.onclick=async()=>{
   if(!configured)return;
   if(!user){pendingSave=s.id;returnRoute=savedView?'saved':'sets';location.hash='account';return;}
   save.disabled=true;try{const wasSaved=saved.has(s.id);await api(wasSaved?'unsave':'save',{setId:s.id});if(wasSaved)saved.delete(s.id);else saved.add(s.id);render();const next=document.querySelector(`[data-save-id="${s.id}"]`);(next||$('library-title')).focus({preventScroll:true});notice(wasSaved?'Question set removed from your saved library.':'Question set saved to your teacher account.');}catch(e){notice(e.message);save.disabled=false;}
  };save.dataset.saveId=s.id;actions.append(play,preview,save);card.append(actions);return card;
 });
 if(!cards.length){const empty=node('div',undefined,'empty');empty.append(node('p',savedView&&!user?(configured?'Sign in to build your saved library.':'Saving is not available in this preview. You can still browse and play.'):savedView&&!saved.size?'No saved topics yet. Find a topic in the public library and select Save.':'No matching topics. Try a different search or subject.'));const back=node('button',savedView?'Browse public topics':'Clear filters');back.onclick=()=>{if(savedView)location.hash='sets';else{$('search').value='';$('subject').value='';$('category').value='';categories();render();}};empty.append(back);if(savedView&&!user&&configured){const sign=node('a','Sign in','text-link');sign.href='#account';empty.append(sign);}cards.push(empty);}
 $('catalog').replaceChildren(...cards);$('more').hidden=limit>=matches.length;
}
async function previewSet(set){
 const request=++previewRequest;$('detail-title').textContent=set.title;$('detail-meta').textContent=`${set.subject} · ${set.questionCount} questions`;$('detail-questions').textContent='Loading questions…';$('detail-choose').onclick=()=>{$('detail').close();chooseGame(set);};$('detail').showModal();
 try{const bank=await loadQuestionSet(set.id);if(request!==previewRequest||!$('detail').open)return;
 $('detail-questions').replaceChildren(...bank.questions.map((q,i)=>{const box=node('article',undefined,'question'),list=node('ol');list.type='A';q.choices.forEach(c=>list.append(node('li',c)));const answer=node('details');answer.append(node('summary','Show answer & explanation'),node('p',`${q.choices[q.answer]}${q.explanation?' — '+q.explanation:''}`));box.append(node('h3',`${i+1}. ${q.question}`),list,answer);return box;}));
 }catch{if(request===previewRequest)$('detail-questions').textContent='This set could not load. Close the preview and try again.';}
}
$('close-detail').onclick=()=>{$('detail').close();previewRequest++;};
$('account-button').onclick=()=>{location.hash='account';};
$('public-tab').onclick=()=>{limit=24;location.hash='sets';};$('saved-tab').onclick=()=>{limit=24;location.hash='saved';};
$('search').oninput=()=>{limit=24;render();};$('subject').onchange=()=>{categories();limit=24;render();};$('category').onchange=()=>{limit=24;render();};$('more').onclick=()=>{const previous=limit;limit+=24;render();const card=$('catalog').children[previous];(card?.querySelector('button')||$('library-title')).focus();};
$('login-form').onsubmit=async e=>{e.preventDefault();$('send-code').disabled=true;try{await api('login',{email:$('email').value});$('login-form').hidden=true;$('verify-form').hidden=false;$('auth-status').textContent='Check your inbox for your sign-in code.';$('code').focus();}catch(error){$('auth-status').textContent=error.message;}finally{$('send-code').disabled=false;}};
$('back-login').onclick=()=>{$('verify-form').hidden=true;$('login-form').hidden=false;$('code').value='';$('auth-status').textContent='';};
$('verify-form').onsubmit=async e=>{e.preventDefault();const button=e.submitter;button.disabled=true;try{await api('verify',{email:$('email').value,code:$('code').value});$('code').value='';await account();if(user){$('auth-status').textContent='';if(pendingSave)await finishPendingSave();else location.hash=returnRoute;}}catch(error){$('auth-status').textContent=error.message;}finally{button.disabled=false;}};
$('retry-save').onclick=finishPendingSave;
$('retry-account').onclick=async()=>{const button=$('retry-account');button.disabled=true;try{await account();}finally{button.disabled=false;}};
$('logout').onclick=async()=>{try{await api('logout',{});user=null;pendingSave=null;$('auth-status').textContent='';saved.clear();paintAccount();render();}catch(error){notice(error.message);}};
async function account(){
 $('retry-account').hidden=true;
 try{
  const data=await api('session');configured=data.configured;user=data.user;
  if(user){try{const favorites=await api('favorites');saved=new Set(favorites.ids);}catch(error){saved.clear();paintAccount();render();$('retry-account').hidden=false;notice(error.status===401?'Your session has ended. Sign in again; public practice is still available.':'Signed in, but saved sets could not load. Open Account to retry the connection.');return;}}
  paintAccount();render();
 }catch(error){configured=error.status===401;user=null;saved.clear();paintAccount();render();$('retry-account').hidden=false;notice(error.status===401?'Your session has ended. Sign in again; public practice is still available.':'Account service unavailable. Browse topics and launch public practice without signing in.');}
}
const subjects=[...new Set(QUESTION_SETS.map(s=>s.subject))].sort();subjects.forEach(s=>{$('subject').append(new Option(s,s));const row=node('a',undefined,'subject-row');row.href='#sets';row.dataset.subject=s;const symbols={'Social Studies':'◎',Science:'⚗',Math:'∑',ELA:'Aa'};row.append(node('span',symbols[s]||'✦','subject-symbol'),node('strong',s),node('span',`${QUESTION_SETS.filter(q=>q.subject===s).length} sets →`));row.onclick=()=>{savedView=false;limit=24;$('subject').value=s;$('search').value='';$('category').value='';categories();render();};$('subject-summary').append(row);});
window.addEventListener('hashchange',route);categories();render();route();account();
document.querySelectorAll('[data-preferred-game]').forEach(a=>{a.onclick=()=>{preferredGame=a.dataset.preferredGame;savedView=false;render();};});
