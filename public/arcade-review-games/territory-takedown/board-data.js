(function(){
  /* Crownlands gameplay regions. The shapes are now interaction overlays; the
     illustrated world beneath them is the visual map. */
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
  window.TT_BOARD={mapName:'The Crownlands',territories:raw.map((r,i)=>({id:`t${i+1}`,name:r[0],shape:r[1],label:r[2],adjacent:adj[i].map(j=>`t${j+1}`),special:specials[i]||null}))};

  /* Flat board-game illustration. It intentionally stays simple: one readable
     landmass, water, forests, mountains, river/lake, desert and landmarks. */
  const art=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 650">
    <rect width="900" height="650" fill="#1589c9"/>
    <path d="M0 85Q110 60 205 82T410 68T620 78T900 62V0H0Z" fill="#35a9dc" opacity=".42"/>
    <g fill="none" stroke="#79ccec" stroke-width="5" opacity=".35"><path d="M25 120q55-25 110 0t110 0"/><path d="M680 560q55-24 120 0"/><path d="M18 520q50-20 92 0"/></g>
    <path d="M150 72L250 48 360 42 480 58 590 44 704 70 792 112 838 190 802 252 824 330 844 412 792 474 750 538 680 570 642 614 566 628 500 594 430 568 350 506 286 558 194 544 116 514 74 470 112 438 54 390 42 310 76 238 102 180 142 148Z" fill="#8bcf58" stroke="#f4e7bd" stroke-width="9" stroke-linejoin="round"/>
    <path d="M315 44L480 58 520 150 450 192 392 170 302 168Z" fill="#dbeef1" opacity=".96"/>
    <path d="M74 470L112 438 160 374 268 406 250 490 194 544 116 514Z" fill="#f2c95f"/>
    <path d="M500 594L508 522 552 572 626 528 680 570 642 614 566 628Z" fill="#e7bb55"/>
    <path d="M430 286Q480 260 520 292Q550 315 500 345Q460 365 430 332Z" fill="#43bce1" stroke="#e8f8ff" stroke-width="5"/>
    <path d="M475 58Q455 130 470 205Q485 245 470 286" fill="none" stroke="#49bde2" stroke-width="11" stroke-linecap="round"/>
    <path d="M470 332Q440 380 405 420Q375 458 350 506" fill="none" stroke="#49bde2" stroke-width="11" stroke-linecap="round"/>
    <path d="M500 345Q555 360 604 408Q635 430 650 452" fill="none" stroke="#49bde2" stroke-width="9" stroke-linecap="round"/>
    <g stroke="#274a32" stroke-width="3" stroke-linejoin="round">
      <g fill="#25713e"><path d="M160 180l18-38 18 38h-10l15 28h-46l15-28z"/><path d="M205 205l17-36 17 36h-9l14 26h-44l14-26z"/><path d="M245 165l16-34 16 34h-8l13 25h-42l13-25z"/><path d="M185 250l15-32 15 32h-8l12 23h-38l12-23z"/></g>
      <g fill="#1f7741"><path d="M585 195l17-36 17 36h-9l14 26h-44l14-26z"/><path d="M635 225l16-34 16 34h-8l13 25h-42l13-25z"/><path d="M675 190l15-32 15 32h-8l12 23h-38l12-23z"/></g>
      <g fill="#25713e"><path d="M390 355l17-36 17 36h-9l14 26h-44l14-26z"/><path d="M335 390l15-32 15 32h-8l12 23h-38l12-23z"/><path d="M440 410l16-34 16 34h-8l13 25h-42l13-25z"/></g>
      <g fill="#1f7741"><path d="M625 390l17-36 17 36h-9l14 26h-44l14-26z"/><path d="M680 420l15-32 15 32h-8l12 23h-38l12-23z"/></g>
    </g>
    <g stroke="#485564" stroke-width="4" stroke-linejoin="round"><path d="M330 128l35-62 35 62-18-9-17 25-18-25z" fill="#8998a7"/><path d="M390 140l30-54 31 54-15-8-16 23-15-23z" fill="#788998"/><path d="M190 405l38-67 38 67-19-10-19 27-19-27z" fill="#7d8993"/><path d="M235 420l31-55 31 55-15-8-16 23-15-23z" fill="#6f7e8b"/><path d="M665 325l38-68 39 68-20-10-19 28-19-28z" fill="#788795"/></g>
    <g fill="#fff"><path d="M350 91l15-25 14 25-14-7z"/><path d="M409 105l11-19 11 19-11-6z"/><path d="M213 364l15-26 15 26-15-7z"/><path d="M690 280l13-23 14 23-14-7z"/></g>
    <g stroke="#693f24" stroke-width="4"><path d="M548 286v-40h20v40M542 286h32v25h-32z" fill="#f4d47a"/><path d="M539 246l13-15 13 15M565 246l-13-15" fill="#d85b3f"/><path d="M706 478v-32h17v32M700 478h29v22h-29z" fill="#f1d07a"/><path d="M699 446l10-13 10 13" fill="#d85b3f"/><path d="M245 305v-30h16v30M239 305h28v21h-28z" fill="#f1d07a"/><path d="M239 275l10-13 10 13" fill="#d85b3f"/></g>
    <g fill="#d89a39" stroke="#75461f" stroke-width="3"><path d="M145 493q15-18 30 0v20h-30z"/><path d="M735 170q15-18 30 0v20h-30z"/></g>
    <g fill="#5da54b" stroke="#f4e7bd" stroke-width="6"><path d="M55 150q-30 25-8 62q28 22 55-3q18-35-5-64z"/><path d="M824 105q32-20 55 8q10 34-20 53q-34 7-48-22z"/><path d="M820 520q36-22 61 10q9 39-29 55q-38 3-48-28z"/></g>
    <g fill="#f3d574" stroke="#6d4529" stroke-width="3"><circle cx="72" cy="178" r="9"/><circle cx="846" cy="133" r="9"/><circle cx="846" cy="550" r="9"/></g>
  </svg>`;
  const artUrl=`url("data:image/svg+xml,${encodeURIComponent(art)}")`;
  const style=document.createElement('style');
  style.textContent=`
    .arena{background-color:#1589c9!important;background-image:${artUrl}!important;background-size:100% 100%!important;background-repeat:no-repeat!important;border-color:#6dc7e7;box-shadow:inset 0 0 40px #075a8b55,0 18px 40px #0007}
    .territory polygon{fill:var(--team,#26435d)!important;fill-opacity:.24!important;stroke:#fff5d6!important;stroke-width:3!important;stroke-linejoin:round;filter:none!important}
    .territory:hover polygon{fill-opacity:.38!important}
    .territory.selected polygon{fill-opacity:.42!important;stroke:#ffd45b!important;stroke-width:8!important;filter:drop-shadow(0 0 7px #ffd45b)!important}
    .territory.legal polygon{fill-opacity:.38!important;stroke:#41e7df!important;stroke-width:8!important;filter:drop-shadow(0 0 8px #41e7df)!important}
    .territory .territory-name{font-size:10px;letter-spacing:.02em;font-weight:950;paint-order:stroke;stroke:#092237;stroke-width:3px;stroke-linejoin:round}
    .territory .owner-mark{font-size:18px;paint-order:stroke;stroke:#092237;stroke-width:3px}
    .territory .special{font-size:22px}
    .map-panel{position:relative}.map-panel:after{content:'THE CROWNLANDS';position:absolute;right:20px;bottom:42px;color:rgba(255,255,255,.55);font:900 10px/1 system-ui;letter-spacing:.22em;pointer-events:none;text-shadow:0 1px 3px #07547e}
    @media(max-width:620px){.map-panel:after{display:none}.territory polygon{stroke-width:2!important}}
  `;
  document.head.appendChild(style);
})();