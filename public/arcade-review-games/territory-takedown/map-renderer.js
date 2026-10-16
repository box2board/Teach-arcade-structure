(function(){'use strict';
function boot(){
 const NS='http://www.w3.org/2000/svg',arena=document.getElementById('arena');if(!arena||!window.TT_BOARD)return;
 arena.setAttribute('viewBox',window.TT_BOARD.viewBox||'0 0 1536 1024');
 const map=window.TT_MAP_IMAGE||'';
 const css=`
 .arena{background:#168fc5 url("${map}") center/100% 100% no-repeat!important}
 .territory polygon,.territory path,.territory .territory-name,.territory .owner-mark{display:none!important}
 .territory{cursor:pointer;outline:none}
 .territory .control-dot{fill:var(--team);stroke:#071426;stroke-width:9;transition:fill .18s,stroke .18s,transform .18s;transform-box:fill-box;transform-origin:center;filter:drop-shadow(0 3px 4px #0008)}
 .territory:hover .control-dot{transform:scale(1.08);stroke:#fff}
 .territory.selected .control-dot{stroke:#ffd45b;stroke-width:15;filter:drop-shadow(0 0 15px #ffd45b);transform:scale(1.12)}
 .territory.legal .control-dot{stroke:#41e7df;stroke-width:15;filter:drop-shadow(0 0 17px #41e7df);animation:dot-pulse 1s infinite}
 .territory.captured .control-dot{animation:dot-capture .65s ease-out}
 .territory.shielded .control-dot{stroke-dasharray:14 8}
 .territory .special{font-size:34px;fill:#ffd45b;paint-order:stroke;stroke:#071426;stroke-width:5px;filter:drop-shadow(0 2px 3px #000);pointer-events:none}
 @keyframes dot-pulse{50%{transform:scale(1.14)}}
 @keyframes dot-capture{35%{transform:scale(1.35)}70%{transform:scale(.92)}}`;
 if(!document.getElementById('tt-dot-map-css')){const style=document.createElement('style');style.id='tt-dot-map-css';style.textContent=css;document.head.appendChild(style)}
 let busy=false;
 function enhance(){if(busy)return;busy=true;try{
  arena.setAttribute('viewBox',window.TT_BOARD.viewBox||'0 0 1536 1024');
  [...arena.querySelectorAll('g.territory')].forEach(g=>{
   const t=window.TT_BOARD.territories.find(x=>x.id===g.dataset.id);if(!t)return;
   const [x,y]=t.label;
   g.querySelectorAll('polygon,path,.owner-mark,.territory-name').forEach(n=>n.remove());
   let dot=g.querySelector('.control-dot');if(!dot){dot=document.createElementNS(NS,'circle');dot.classList.add('control-dot');g.insertBefore(dot,g.firstChild)}
   dot.setAttribute('cx',x);dot.setAttribute('cy',y);dot.setAttribute('r','34');
   const special=g.querySelector('.special');if(special){special.setAttribute('x',x+48);special.setAttribute('y',y-42)}
  });
 }finally{busy=false}}
 new MutationObserver(enhance).observe(arena,{childList:true,subtree:true});enhance();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();