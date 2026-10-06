(function(){
  /* A single coherent fictional continent. Territory borders share the same
     vertices so the board reads as a political map instead of a tile grid. */
  const names=[
    'North Cape','Frost Coast','Highland Reach','Pine March','Storm Coast','Eastwatch',
    'Westhaven','Silver Vale','Crownlands','Rivermeet','Redwood','Sun Coast',
    'Mist Bay','Iron Hills','Heartland','King\'s Crossing','Amber Plains','Dawnshore',
    'Southwest Reach','Lake Country','Greenfields','Gold Ridge','Southmarch','Cape Ember'
  ];
  const specials={3:'shield',6:'double',9:'challenge',14:'stronghold',17:'shield',20:'double'};
  const borders=[
    {y:58, xs:[168,252,348,452,556,660,748]},
    {y:178,xs:[104,218,338,458,578,700,816]},
    {y:300,xs:[66,194,326,458,590,722,850]},
    {y:422,xs:[112,226,344,462,580,698,812]},
    {y:542,xs:[190,278,370,462,554,646,730]}
  ];
  const shapes=[],labels=[];
  for(let r=0;r<4;r++){
    const a=borders[r],b=borders[r+1];
    for(let c=0;c<6;c++){
      const p1=[a.xs[c],a.y],p2=[a.xs[c+1],a.y],p3=[b.xs[c+1],b.y],p4=[b.xs[c],b.y];
      shapes.push(`${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]} ${p4[0]},${p4[1]}`);
      labels.push([Math.round((p1[0]+p2[0]+p3[0]+p4[0])/4),Math.round((a.y+b.y)/2)]);
    }
  }
  const adjacency=Array.from({length:24},(_,i)=>{
    const r=Math.floor(i/6),c=i%6,a=[];
    if(c)a.push(i-1);if(c<5)a.push(i+1);if(r)a.push(i-6);if(r<3)a.push(i+6);
    return a;
  });
  window.TT_BOARD={mapName:'The Crown Continent',territories:names.map((name,i)=>({id:`t${i+1}`,name,shape:shapes[i],label:labels[i],adjacent:adjacency[i].map(j=>`t${j+1}`),special:specials[i]||null}))};

  /* Map-specific art direction stays with the shared board so every curriculum
     edition receives the same visual upgrade without forking the game engine. */
  const style=document.createElement('style');
  style.textContent=`
    .arena{background:
      radial-gradient(ellipse at 18% 22%,rgba(96,190,213,.15),transparent 18%),
      radial-gradient(ellipse at 78% 72%,rgba(96,190,213,.12),transparent 20%),
      repeating-radial-gradient(ellipse at 50% 50%,rgba(255,255,255,.025) 0 1px,transparent 1px 9px),
      linear-gradient(160deg,#0a3550 0%,#071f36 52%,#041525 100%);
      border-color:#315f79;box-shadow:inset 0 0 70px #020a13,0 18px 40px #0007}
    .territory polygon{stroke:#d7e4d8;stroke-width:3;stroke-linejoin:round;opacity:.92;filter:drop-shadow(0 2px 2px rgba(0,0,0,.35))}
    .territory:nth-child(3n) polygon{opacity:.86}.territory:nth-child(4n) polygon{opacity:.89}
    .territory .territory-name{font-size:11px;letter-spacing:.035em;font-weight:850;paint-order:stroke;stroke:#07131f;stroke-width:3px;stroke-linejoin:round}
    .territory .owner-mark{font-size:19px;paint-order:stroke;stroke:#07131f;stroke-width:3px}
    .territory .special{font-size:23px}
    .territory.owned:hover polygon{filter:brightness(1.13) drop-shadow(0 3px 3px rgba(0,0,0,.45))}
    .map-panel{position:relative}.map-panel:after{content:'THE CROWN CONTINENT';position:absolute;right:18px;bottom:42px;color:rgba(214,235,239,.34);font:800 10px/1 system-ui;letter-spacing:.22em;pointer-events:none}
    @media(max-width:620px){.map-panel:after{display:none}}
  `;
  document.head.appendChild(style);
})();
