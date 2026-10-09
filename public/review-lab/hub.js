import {GAMES,QUESTION_SETS,gamesForSet,setsForGame,gameUrl} from './catalog.js';
const $=id=>document.getElementById(id);
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let view='games',selectedSet;
function readLocation(){
  view=location.hash==='#topics'?'topics':'games';
  const id=new URLSearchParams(location.search).get('set');
  selectedSet=view==='games'?QUESTION_SETS.find(set=>set.id===id):undefined;
}
function navigate(nextView,setId){
  const url=new URL(location.href);url.hash=nextView;
  if(setId)url.searchParams.set('set',setId);else url.searchParams.delete('set');
  history.pushState(null,'',url);readLocation();render();
}
function gameCard(game){
  const sets=setsForGame(game.id),topics=`${sets.length} topics · Science, Math, Social Studies`;
  const facts=game.facts||[`${game.levels} levels`,`${game.questionCount} questions per run`,'3 gameplay difficulties'];
  const topic=selectedSet?.title||topics||game.topicLabel;
  return `<article class="game-card"><img class="game-art" src="${escapeHTML(game.image)}" alt="${escapeHTML(game.imageAlt)}" width="640" height="411"><div class="game-details"><p class="eyebrow">${escapeHTML(game.mode)} REVIEW GAME</p><h2>${escapeHTML(game.title)}</h2><p>${escapeHTML(game.description)}</p><ul class="facts">${facts.map(fact=>`<li>${escapeHTML(fact)}</li>`).join('')}</ul><p class="topic-label">${selectedSet?'Review topic':sets.length?'Available topic'+(sets.length===1?'':'s'):'Available now'}: <strong>${escapeHTML(topic)}</strong></p><a class="primary" href="${gameUrl(game.id,selectedSet?.id)}">${selectedSet?'Play '+escapeHTML(game.title):game.launchLabel?escapeHTML(game.launchLabel):'Choose a topic &amp; play'}</a></div></article>`;
}
function render(){
  $('topic-filters').hidden=view!=='topics';
  $('browse-games').setAttribute('aria-pressed',String(view==='games'));
  $('browse-topics').setAttribute('aria-pressed',String(view==='topics'));
  $('selection').hidden=!selectedSet;
  $('selection').innerHTML=selectedSet?`<p>Reviewing <strong>${escapeHTML(selectedSet.title)}</strong>. Choose a game for this topic.</p><button id="clear-topic" type="button">Change topic</button>`:'';
  if(selectedSet)$('clear-topic').onclick=()=>navigate('topics');
  if(view==='games'){
    const games=selectedSet?gamesForSet(selectedSet.id):GAMES;
    $('catalog-count').textContent=`${games.length} game${games.length===1?'':'s'} available`;
    $('catalog').innerHTML='<h2 id="catalog-heading" class="sr-only">Review games</h2>'+games.map(gameCard).join('');
  }else{
    const search=$('topic-search').value.toLowerCase().trim(),subject=$('topic-subject').value;
    const filtered=QUESTION_SETS.filter(s=>(!subject||s.subject===subject)&&(`${s.title} ${s.category||''}`.toLowerCase().includes(search)));
    $('catalog-count').textContent=`${filtered.length} topic${QUESTION_SETS.length===1?'':'s'} available`;
    $('catalog').innerHTML='<h2 id="catalog-heading" class="sr-only">Review topics</h2><div class="topic-grid">'+filtered.map(set=>`<article class="topic-card"><p class="eyebrow">${escapeHTML(set.subject)}</p><h3>${escapeHTML(set.title)}</h3><p>${escapeHTML(set.description)}</p><p class="metadata">${set.questionCount} questions in this bank · ${gamesForSet(set.id).length} compatible game${gamesForSet(set.id).length===1?'':'s'}</p><button class="primary" type="button" data-set="${escapeHTML(set.id)}">Choose a game</button></article>`).join('')+'</div>';
    document.querySelectorAll('[data-set]').forEach(button=>button.onclick=()=>{navigate('games',button.dataset.set);$('catalog').querySelector('.primary')?.focus();});
  }
}
$('browse-games').onclick=()=>navigate('games');$('browse-topics').onclick=()=>navigate('topics');
window.addEventListener('popstate',()=>{readLocation();render();});
window.addEventListener('hashchange',()=>{readLocation();render();});
readLocation();render();

$('topic-search').addEventListener('input',render);$('topic-subject').addEventListener('change',render);
