import {QUESTION_SETS,GAMES,loadQuestionSet,gamesForSet,gameUrl} from '../review-lab/catalog.js';
import {TOOLS,CABINET_GAMES} from './cabinet-catalog.js';
const $=id=>document.getElementById(id);
let user=null,configured=false,saved=new Set(),savedView=false,limit=24,previewRequest=0;
let selectedSet=null,preferredGame=null,pendingSave=null,returnRoute='sets';
let cabinetEnabled=false,cabinetLoaded=false,bookmarks=new Set(),favoritesLoaded=false;
const codeCooldowns=new Map();let codeSending=false,codeTimer=null;
const loginEmail=()=>$('email').value.trim().toLowerCase();
function paintCodeWait(){
 const remaining=Math.max(0,Math.ceil(((codeCooldowns.get(loginEmail())||0)-Date.now())/1000));
 for(const id of ['send-code','resend-code'])$(id).disabled=!configured||codeSending||remaining>0;
 $('send-code').textContent=codeSending?'Sending…':'Email a sign-in code';
 $('resend-code').textContent=codeSending?'Sending…':'Send a new code';
 $('code-wait').textContent=remaining?`You can request another code in ${remaining} ${remaining===1?'second':'seconds'}. You can enter your current code now.`:'';
 $('code-wait').hidden=!!user;
 if(!remaining&&codeTimer!==null){clearInterval(codeTimer);codeTimer=null;}
}
function startCodeWait(seconds){
 if(!Number.isFinite(seconds)||seconds<=0||seconds>86400)return;
 codeCooldowns.set(loginEmail(),Date.now()+Math.ceil(seconds)*1000);
 if(codeTimer!==null)clearInterval(codeTimer);
 codeTimer=setInterval(paintCodeWait,1000);paintCodeWait();
}
const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
async function api(action,body){
 const response=await fetch(`/api/teacher?action=${action}`,{method:body?'POST':'GET',credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json();if(!response.ok){if(response.status===401){user=null;saved.clear();bookmarks.clear();cabinetLoaded=false;favoritesLoaded=false;paintAccount();render();}const error=new Error(data.error||'Account request failed.');error.status=response.status;error.retryAfter=data.retryAfter;throw error;}return data;
}
function notice(text){$('notice').textContent=text;}
function route(){
 const params=new URLSearchParams(location.hash.slice(1)),name=location.hash.slice(1).split('&')[0]||'home';
 const valid=['home','sets','saved','games','my-games','tools','create','assignments','classes','reports','account'].includes(name)?name:'home';
 for(const id of ['home','sets','games','my-games','tools','create','future','account'])$(id).hidden=true;
 if(['sets','saved'].includes(valid)){savedView=valid==='saved';$('sets').hidden=false;render();}
 else if(valid==='games'){
  selectedSet=QUESTION_SETS.find(s=>s.id===params.get('set'));
  if(selectedSet){$('games').hidden=false;renderGames();}else{savedView=false;$('sets').hidden=false;render();notice('Choose a topic first, then pick your game.');}
 }else if(['assignments','classes','reports'].includes(valid))$('future').hidden=false;
 else $(valid).hidden=false;
 renderCollections();
 document.querySelectorAll('nav a').forEach(a=>{if(a.hash===`#${valid}`)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 $('breadcrumb').textContent={home:'My Cabinet',sets:'Question Library',saved:'My Question Sets',games:'Choose a Game','my-games':'My Games',tools:'My Tools',create:'Create a Game · Planned',account:'Account',assignments:'Coming later',classes:'Coming later',reports:'Coming later'}[valid];
 if($('detail').open)$('detail').close();
 $('main').focus({preventScroll:true});
 window.scrollTo(0,0);
}
function paintAccount(){
 $('account-button').textContent=user?'My account':configured?'Sign in / Create account':'Accounts coming soon';
 $('login-form').hidden=!!user||!configured;$('account-unavailable').hidden=configured||!!user;$('verify-form').hidden=true;$('profile').hidden=!user;$('logout').hidden=!user;
 paintCodeWait();
 $('retry-save').hidden=!user||!pendingSave;
 if(user){$('profile').replaceChildren(node('h2','Your Arcade Cabinet'),node('p',user.email),node('p','Billing and creation limits are not enabled.'));notice('Signed in · Your Cabinet belongs to your teacher account.');}
 else notice(configured?'Browse the public library, or sign in to save question sets.':'Preview mode · The public library is live. Teacher sign-in and saving require the development account service to be connected.');
}
async function finishPendingSave(){
 if(!pendingSave||!user)return false;
 const button=$('retry-save');button.disabled=true;
 try{const item=pendingSave;if(typeof item==='string'){await api('save',{setId:item});saved.add(item);}else{await api('save-item',item);bookmarks.add(`${item.type}:${item.id}`);}pendingSave=null;button.hidden=true;$('auth-status').textContent='';render();notice('Added to your Arcade Cabinet.');location.hash=returnRoute;return true;}
 catch(error){button.hidden=!user;$('auth-status').textContent=user?'You are signed in, but this item could not be saved. Select Retry saving to try again.':error.message;notice($('auth-status').textContent);return false;}
 finally{button.disabled=false;}
}
function chooseGame(set){location.hash=`games&set=${encodeURIComponent(set.id)}`;}
function bookmarkButton(type,item){
 const key=`${type}:${item.id}`,isSaved=bookmarks.has(key),button=node('button',isSaved?'Remove from My Cabinet':'Add to My Cabinet');
 button.disabled=!configured||!cabinetEnabled||(!!user&&!cabinetLoaded);
 if(button.disabled){button.textContent='Cabinet saving · not connected';button.title='You can open this resource without saving. Account-backed saving is not connected yet.';}
 button.setAttribute('aria-pressed',String(isSaved));button.setAttribute('aria-label',`${isSaved?'Remove':'Add'} ${item.title} ${isSaved?'from':'to'} My Cabinet`);
 button.onclick=async()=>{
  if(!configured||!cabinetEnabled)return;
  if(!user){pendingSave={type,id:item.id};returnRoute=location.hash.slice(1)||'home';location.hash='account';return;}
  button.disabled=true;
  try{await api(isSaved?'remove-item':'save-item',{type,id:item.id});if(isSaved)bookmarks.delete(key);else bookmarks.add(key);renderCollections();notice(isSaved?'Removed from your Cabinet. The public resource is still available.':'Added to your Arcade Cabinet.');$('main').focus({preventScroll:true});}
  catch(error){notice(error.message);button.disabled=false;}
 };return button;
}
function renderCollections(){
 $('sets-summary').textContent=user&&favoritesLoaded?`${saved.size} saved public question sets`:'Public topics are ready to explore';
 for(const [type,items,container,routeName] of [['game',CABINET_GAMES,'cabinet-games','my-games'],['tool',TOOLS,'cabinet-tools','tools']]){
  const params=new URLSearchParams(location.hash.slice(1)),browse=params.get('view')==='browse',ready=!!user&&cabinetLoaded;
  const savedItems=items.filter(item=>bookmarks.has(`${type}:${item.id}`));
  $(type==='game'?'games-summary':'tools-summary').textContent=ready?`${savedItems.length} saved ${type==='game'?'games':'tools'}`:type==='game'?'Explore games to find your favorites':'Free to open without an account';
  $(`${type}-saved`).setAttribute('aria-pressed',String(!browse));$(`${type}-browse`).setAttribute('aria-pressed',String(browse));
  $(`${type}-availability`).textContent=!configured?'Preview mode · Account-backed saving is not connected. You can still explore and open public resources.':!cabinetEnabled?'Game and tool saving is not connected yet. Question-set saving is available with teacher sign-in.':user&&!cabinetLoaded?'Your collection could not load. Open Account to retry. Public resources remain available.':!user?'Sign in to add favorites to your Cabinet. Public resources need no sign-in.':'These are bookmarks. Removing one does not remove the public resource or change its content.';
  const shown=browse?items:ready?savedItems:[];
  if(!shown.length){const empty=node('div',undefined,'empty');empty.append(node('h2',ready?'Your shelf is ready for its first favorite.':'Make this shelf yours.'),node('p',ready?'Explore the public collection and choose Add to My Cabinet.':'Explore now. Your saved collection will appear here when account-backed saving is connected and you sign in.'));const link=node('a',type==='game'?'Explore games →':'Explore free tools →','primary');link.href=`#${routeName}&view=browse`;empty.append(link);$(container).replaceChildren(empty);continue;}
  $(container).replaceChildren(...shown.map(item=>{
   const card=node('article',undefined,type==='game'?'launch-game':'cabinet-tool');
   if(item.image){const img=node('img');img.src=item.image;img.alt=item.imageAlt;img.loading='lazy';img.width=640;img.height=360;card.append(img);}else {const art=node('span',item.symbol,type==='game'?'arcade-game-art':'tool-symbol');art.setAttribute('aria-hidden','true');card.append(art);}
   const content=node('div',undefined,'launch-game-content');content.append(node('p',type==='game'?item.collection:'FREE PUBLIC TOOL','eyebrow'),node('h2',item.title),node('p',item.description));
   if(item.subject)content.append(node('p',item.subject,'muted'));
   const open=node('a',type==='game'?(item.chooseTopic?'Choose a topic & play →':'Open game ↗'):'Open free tool ↗','primary');
   open.href=item.chooseTopic?'#sets':item.url;
   if(item.chooseTopic)open.onclick=()=>{preferredGame=item.id;savedView=false;render();};
   else{open.target='_blank';open.rel='noopener';open.setAttribute('aria-label',`Open ${item.title} in a new tab`);}
   content.append(open,bookmarkButton(type,item));card.append(content);return card;
  }));
 }
}
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
  content.append(bookmarkButton('game',g),link);card.append(img,content);return card;
 }));
}
function categories(){const previous=$('category').value;const categories=[...new Set(QUESTION_SETS.filter(s=>!$('subject').value||s.subject===$('subject').value).map(s=>s.category||'Foundations'))].sort();$('category').replaceChildren(new Option('All categories',''),...categories.map(c=>new Option(c,c)));if(categories.includes(previous))$('category').value=previous;}
function render(){
 renderCollections();
 $('library-title').textContent=savedView?'My Question Sets':'Question Library';
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
  const actions=node('div',undefined,'set-actions'),play=node('button','Choose a game →','primary'),preview=node('button','Preview questions'),save=node('button',saved.has(s.id)?'In My Cabinet ✓':configured?'Add to My Cabinet':'Cabinet saving · coming soon');
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
async function requestCode(){
 if(!configured||codeSending||(codeCooldowns.get(loginEmail())||0)>Date.now())return;
 codeSending=true;$('email').disabled=true;$('back-login').disabled=true;paintCodeWait();
 try{const data=await api('login',{email:$('email').value});startCodeWait(data.retryAfter||60);$('login-form').hidden=true;$('verify-form').hidden=false;$('code').value='';$('auth-status').textContent='Check your inbox for your sign-in code. Use the most recent code sent to you.';$('code').focus();}
 catch(error){if(error.status===429)startCodeWait(error.retryAfter);$('auth-status').textContent=error.message;}
 finally{codeSending=false;$('email').disabled=false;$('back-login').disabled=false;paintCodeWait();}
}
$('login-form').onsubmit=e=>{e.preventDefault();return requestCode();};
$('resend-code').onclick=requestCode;
$('email').oninput=()=>{paintCodeWait();if(codeTimer===null&&(codeCooldowns.get(loginEmail())||0)>Date.now())codeTimer=setInterval(paintCodeWait,1000);};
$('back-login').onclick=()=>{$('verify-form').hidden=true;$('login-form').hidden=false;$('code').value='';$('auth-status').textContent='';paintCodeWait();};
$('verify-form').onsubmit=async e=>{e.preventDefault();const button=e.submitter;button.disabled=true;try{await api('verify',{email:$('email').value,code:$('code').value});$('code').value='';await account();if(user){$('auth-status').textContent='';if(pendingSave)await finishPendingSave();else if(!returnToQuestionSets())location.hash=returnRoute;}}catch(error){$('auth-status').textContent=error.message;}finally{button.disabled=false;}};
$('retry-save').onclick=finishPendingSave;
for(const [type,name] of [['game','my-games'],['tool','tools']]){ $(`${type}-saved`).onclick=()=>{location.hash=name;};$(`${type}-browse`).onclick=()=>{location.hash=`${name}&view=browse`;};}
$('retry-account').onclick=async()=>{const button=$('retry-account');button.disabled=true;try{await account();}finally{button.disabled=false;}};
$('logout').onclick=async()=>{try{await api('logout',{});user=null;pendingSave=null;$('auth-status').textContent='';saved.clear();bookmarks.clear();cabinetLoaded=false;favoritesLoaded=false;paintAccount();render();}catch(error){notice(error.message);}};
function returnToQuestionSets(){
 const params=new URLSearchParams(location.search);if(params.get('return')!=='teacher-sets')return false;
 location.assign('/teacher/sets/'+(params.get('intent')==='create'?'?create=1':''));return true;
}
async function account(){
 $('retry-account').hidden=true;
 try{
  const data=await api('session');configured=data.configured;user=data.user;cabinetEnabled=data.cabinetEnabled===true;cabinetLoaded=false;bookmarks.clear();favoritesLoaded=false;
  if(user){try{const favorites=await api('favorites');saved=new Set(favorites.ids);favoritesLoaded=true;}catch(error){saved.clear();paintAccount();render();$('retry-account').hidden=false;notice(error.status===401?'Your session has ended. Sign in again; public practice is still available.':'Signed in, but saved sets could not load. Open Account to retry the connection.');return;}
   if(cabinetEnabled){try{const cabinet=await api('cabinet');bookmarks=new Set(cabinet.items.map(item=>`${item.type}:${item.id}`));cabinetLoaded=true;}catch(error){paintAccount();render();$('retry-account').hidden=false;notice(error.status===401?'Your session has ended. Sign in again.':'Your games and tools could not load. Open Account to retry.');return;}}
  }
  paintAccount();render();
 }catch(error){configured=error.status===401;user=null;saved.clear();bookmarks.clear();cabinetLoaded=false;favoritesLoaded=false;paintAccount();render();$('retry-account').hidden=false;notice(error.status===401?'Your session has ended. Sign in again; public practice is still available.':'Account service unavailable. Browse topics and launch public practice without signing in.');}
}
const subjects=[...new Set(QUESTION_SETS.map(s=>s.subject))].sort();subjects.forEach(s=>{$('subject').append(new Option(s,s));const row=node('a',undefined,'subject-row');row.href='#sets';row.dataset.subject=s;const symbols={'Social Studies':'◎',Science:'⚗',Math:'∑',ELA:'Aa'};row.append(node('span',symbols[s]||'✦','subject-symbol'),node('strong',s),node('span',`${QUESTION_SETS.filter(q=>q.subject===s).length} sets →`));row.onclick=()=>{savedView=false;limit=24;$('subject').value=s;$('search').value='';$('category').value='';categories();render();};$('subject-summary').append(row);});
window.addEventListener('hashchange',route);categories();render();route();account().then(()=>{if(user)returnToQuestionSets();});
document.querySelectorAll('[data-preferred-game]').forEach(a=>{a.onclick=()=>{preferredGame=a.dataset.preferredGame;savedView=false;render();};});
