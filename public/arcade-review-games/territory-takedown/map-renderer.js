(function(){'use strict';
function boot(){
 const NS='http://www.w3.org/2000/svg',arena=document.getElementById('arena');if(!arena||!window.TT_BOARD)return;
 const viewBox=window.TT_BOARD.viewBox||'0 0 1536 1024',map=window.TT_MAP_IMAGE||'';
 arena.setAttribute('viewBox',viewBox);arena.setAttribute('preserveAspectRatio','xMidYMid meet');
 const css=`
 .arena{background:#168fc5!important;aspect-ratio:3/2;width:100%;height:auto;overflow:hidden}
 .tt-map-image{pointer-events:none}
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
 function ensureMap(){
  let img=arena.querySelector('#tt-map-image');
  if(!img){img=document.createElementNS(NS,'image');img.id='tt-map-image';img.classList.add('tt-map-image');img.setAttribute('x','0');img.setAttribute('y','0');arena.insertBefore(img,arena.firstChild)}
  /* The source artwork contains unused gray canvas below the illustrated island.
     Scale the useful upper ~2/3 to the full game canvas and let the SVG clip the remainder. */
  img.setAttribute('width','1536');img.setAttribute('height','1536');img.setAttribute('preserveAspectRatio','none');
  if(map){img.setAttribute('href',map);img.setAttributeNS('http://www.w3.org/1999/xlink','href',map)}
 }
 let busy=false;
 function enhance(){if(busy)return;busy=true;try{
  arena.setAttribute('viewBox',viewBox);arena.setAttribute('preserveAspectRatio','xMidYMid meet');ensureMap();
  [...arena.querySelectorAll('g.territory')].forEach(g=>{
   const t=window.TT_BOARD.territories.find(x=>x.id===g.dataset.id);if(!t)return;
   const [x,y]=t.label;
   g.querySelectorAll('polygon,path,.owner-mark,.territory-name').forEach(n=>n.remove());
   let dot=g.querySelector('.control-dot');if(!dot){dot=document.createElementNS(NS,'circle');dot.classList.add('control-dot');g.insertBefore(dot,g.firstChild)}
   dot.setAttribute('cx',x);dot.setAttribute('cy',y);dot.setAttribute('r','40');
   const special=g.querySelector('.special');if(special){special.setAttribute('x',x+54);special.setAttribute('y',y-46)}
  });
 }finally{busy=false}}
 new MutationObserver(enhance).observe(arena,{childList:true,subtree:true});enhance();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
