/* Persistent scenery + keyed HTML pieces. No gameplay rules live here. */
(function(){'use strict';
const specialNames={double:'Double Attack territory',shield:'Shield territory',challenge:'Challenge territory',stronghold:'Stronghold territory'};
const icons={double:'⚡',shield:'⬡',challenge:'◆',stronghold:'★'};
let mountedBoard, mountedArena, pieces=new Map();
function mount(arena,board){
 if(mountedArena===arena&&mountedBoard===board)return;
 const image=document.createElement('img');
 image.className='map-art';image.src=board.image;image.alt='';
 image.width=board.width;image.height=board.height;image.draggable=false;
 image.decoding='async';image.fetchPriority='high';
 const overlay=document.createElement('div');overlay.className='territory-overlay';
 pieces=new Map();
 for(const t of board.territories){
  const button=document.createElement('button');button.type='button';
  button.className='territory';button.dataset.id=t.id;
  button.style.setProperty('--x',`${t.x}%`);button.style.setProperty('--y',`${t.y}%`);
  button.innerHTML='<span class="control-piece" aria-hidden="true"><span class="owner-symbol"></span><span class="state-mark"></span></span><span class="special" aria-hidden="true"></span><span class="shield-indicator" aria-hidden="true">⬡</span>';
  button.querySelector('.special').textContent=icons[t.special]||'';
  overlay.append(button);pieces.set(t.id,button);
 }
 arena.style.aspectRatio=`${board.width} / ${board.height}`;
 arena.replaceChildren(image,overlay);mountedArena=arena;mountedBoard=board;
}
window.TTMapRenderer={render(arena,board,state,legal){
 mount(arena,board);
 for(const t of board.territories){
  const b=pieces.get(t.id),team=state.teams[state.owners[t.id]];
  const selected=t.id===state.source,target=legal.includes(t.id),shielded=!!state.shields[t.id];
  b.classList.toggle('selected',selected);b.classList.toggle('legal',target);
  b.classList.toggle('captured',state.lastCapture===t.id);b.classList.toggle('shielded',shielded);
  b.style.setProperty('--team',team.color);
  b.querySelector('.owner-symbol').textContent=team.symbol;
  b.querySelector('.state-mark').textContent=selected?'↑':target?'⌖':'';
  const label=[t.name,`controlled by ${team.name}`,specialNames[t.special],shielded?'active shield':'',selected?'selected attacker':'',target?'legal target':''].filter(Boolean).join(', ');
  b.setAttribute('aria-label',label);b.setAttribute('aria-pressed',String(selected));b.title=label;
  b.setAttribute('aria-disabled',String(state.paused||state.ended));
 }
}};
})();
