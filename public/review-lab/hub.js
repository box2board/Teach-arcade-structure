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
  const sets=setsForGame(game.id),topics=sets.map(set=>set.title).join(', ');
  return `<article class="game-card">${game.image?`<img class="game-art" src="${escapeHTML(game.image)}" alt="${escapeHTML(game.imageAlt)}" width="640" height="411">`:`<div class="game-art racing-card" aria-hidden="true">🏁<strong>RACEWAY RIVALS</strong></div>`}<div class="game-details"><p class="eyebrow">${escapeHTML(game.mode)} ARCADE REVIEW</p><h2>${escapeHTML(game.title)}</h2><p>${escapeHTML(game.description)}</p><ul class="facts">${(game.facts||[`${game.levels} levels`,`${game.questionCount} questions per run`,'3 gameplay difficulties']).map(fact=>`<li>${escapeHTML(fact)}</li>`).join('')}</ul><p class="topic-label">${selectedSet?'Review topic':'Available topic'+(sets.length===1?'':'s')}: <strong>${escapeHTML(selectedSet?.title||topics)}</strong></p><a class="primary" href="${gameUrl(game.id,selectedSet?.id)}">${selectedSet?'Play '+escapeHTML(game.title):'Choose a topic &amp; play'}</a></div></article>`;
}
function render(){
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
    $('catalog-count').textContent=`${QUESTION_SETS.length} topic${QUESTION_SETS.length===1?'':'s'} available`;
    $('catalog').innerHTML='<h2 id="catalog-heading" class="sr-only">Review topics</h2><div class="topic-grid">'+QUESTION_SETS.map(set=>`<article class="topic-card"><p class="eyebrow">${escapeHTML(set.subject)}</p><h3>${escapeHTML(set.title)}</h3><p>${escapeHTML(set.description)}</p><p class="metadata">${set.questionCount} questions in this bank · ${gamesForSet(set.id).length} compatible game${gamesForSet(set.id).length===1?'':'s'}</p><button class="primary" type="button" data-set="${escapeHTML(set.id)}">Choose a game</button></article>`).join('')+'</div>';
    document.querySelectorAll('[data-set]').forEach(button=>button.onclick=()=>{navigate('games',button.dataset.set);$('catalog').querySelector('.primary')?.focus();});
  }
}
$('browse-games').onclick=()=>navigate('games');$('browse-topics').onclick=()=>navigate('topics');
window.addEventListener('popstate',()=>{readLocation();render();});
window.addEventListener('hashchange',()=>{readLocation();render();});
readLocation();render();
