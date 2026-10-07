(function(){
  /* Organic fictional strategy map. The 24 provinces use irregular shared
     boundaries and are laid out as one geographic landmass rather than a grid. */
  const raw=[
    ['North Cape','170,72 250,48 314,78 302,168 220,188 142,148',[232,116]],
    ['Frost Coast','250,48 360,42 410,82 392,170 302,168 314,78',[352,112]],
    ['Highland Reach','360,42 480,58 502,150 450,192 392,170 410,82',[439,118]],
    ['Pine March','480,58 590,44 650,90 628,174 550,194 502,150',[559,116]],
    ['Storm Coast','590,44 704,70 758,132 724,204 628,174 650,90',[668,120]],
    ['Eastwatch','704,70 792,112 838,190 802,252 724,204 758,132',[772,166]],

    ['Westhaven','142,148 220,188 212,270 126,300 76,238 102,180',[157,225]],
    ['Silver Vale','220,188 302,168 330,250 286,316 212,270',[268,242]],
    ['Crownlands','302,168 392,170 450,192 430,286 330,250',[376,222]],
    ['Rivermeet','450,192 502,150 550,194 566,282 500,326 430,286',[497,238]],
    ['Redwood','550,194 628,174 724,204 700,286 620,318 566,282',[629,242]],
    ['Sun Coast','724,204 802,252 824,330 750,360 700,286',[758,278]],

    ['Mist Bay','76,238 126,300 160,374 112,438 54,390 42,310',[101,342]],
    ['Iron Hills','126,300 212,270 286,316 268,406 160,374',[207,337]],
    ['Heartland','286,316 330,250 430,286 500,326 466,410 368,428 268,406',[374,350]],
    ["King's Crossing",'500,326 566,282 620,318 604,408 530,442 466,410',[535,362]],
    ['Amber Plains','620,318 700,286 750,360 716,430 650,452 604,408',[666,367]],
    ['Dawnshore','750,360 824,330 844,412 792,474 716,430',[780,403]],

    ['Southwest Reach','112,438 160,374 268,406 250,490 194,544 116,514 74,470',[172,457]],
    ['Lake Country','268,406 368,428 350,506 286,558 250,490',[310,473]],
    ['Greenfields','368,428 466,410 530,442 508,522 430,568 350,506',[432,480]],
    ['Gold Ridge','530,442 604,408 650,452 626,528 552,572 508,522',[570,486]],
    ['Southmarch','650,452 716,430 792,474 750,538 680,570 626,528',[690,500]],
    ['Cape Ember','552,572 626,528 680,570 642,614 566,628 500,594',[583,583]]
  ];
  const specials={3:'shield',6:'double',9:'challenge',14:'stronghold',17:'shield',20:'double'};
  const adj=[
    [1,6,7],[0,2,7,8],[1,3,8,9],[2,4,9,10],[3,5,10,11],[4,11],
    [0,7,12],[0,1,6,8,13],[1,2,7,9,13,14],[2,3,8,10,14,15],[3,4,9,11,15,16],[4,5,10,16,17],
    [6,13,18],[7,8,12,14,18,19],[8,9,13,15,19,20],[9,10,14,16,20,21],[10,11,15,17,21,22],[11,16,22],
    [12,13,19],[13,14,18,20],[14,15,19,21,23],[15,16,20,22,23],[16,17,21,23],[20,21,22]
  ];
  window.TT_BOARD={mapName:'The Crown Continent',territories:raw.map((r,i)=>({id:`t${i+1}`,name:r[0],shape:r[1],label:r[2],adjacent:adj[i].map(j=>`t${j+1}`),special:specials[i]||null}))};

  const style=document.createElement('style');
  style.textContent=`
    .arena{background:linear-gradient(165deg,#0c4160,#082c48 55%,#061b31);border-color:#42718a;box-shadow:inset 0 0 90px #020b15,0 18px 40px #0007}
    .territory polygon{stroke:#e2d6b9;stroke-width:3;stroke-linejoin:round;opacity:.84;filter:drop-shadow(0 3px 3px rgba(0,0,0,.4))}
    .territory .territory-name{font-size:10px;letter-spacing:.02em;font-weight:900;paint-order:stroke;stroke:#06101a;stroke-width:3px;stroke-linejoin:round}
    .territory .owner-mark{font-size:18px;paint-order:stroke;stroke:#06101a;stroke-width:3px}
    .territory .special{font-size:22px}
    .territory.owned:hover polygon{filter:brightness(1.14) drop-shadow(0 4px 4px rgba(0,0,0,.5))}
    .map-panel{position:relative}.map-panel:after{content:'THE CROWN CONTINENT';position:absolute;right:20px;bottom:42px;color:rgba(220,236,238,.34);font:800 10px/1 system-ui;letter-spacing:.22em;pointer-events:none}
    @media(max-width:620px){.map-panel:after{display:none}}
  `;
  document.head.appendChild(style);
})();