(function(){
  const raw=[
    ['North Cape','170,72 250,48 314,78 302,168 220,188 142,148',[232,116]],['Frost Coast','250,48 360,42 410,82 392,170 302,168 314,78',[352,112]],['Highland Reach','360,42 480,58 502,150 450,192 392,170 410,82',[439,118]],['Pine March','480,58 590,44 650,90 628,174 550,194 502,150',[559,116]],['Storm Coast','590,44 704,70 758,132 724,204 628,174 650,90',[668,120]],['Eastwatch','704,70 792,112 838,190 802,252 724,204 758,132',[772,166]],['Westhaven','142,148 220,188 212,270 126,300 76,238 102,180',[157,225]],['Silver Vale','220,188 302,168 330,250 286,316 212,270',[268,242]],['Crownlands','302,168 392,170 450,192 430,286 330,250',[376,222]],['Rivermeet','450,192 502,150 550,194 566,282 500,326 430,286',[497,238]],['Redwood','550,194 628,174 724,204 700,286 620,318 566,282',[629,242]],['Sun Coast','724,204 802,252 824,330 750,360 700,286',[758,278]],['Mist Bay','76,238 126,300 160,374 112,438 54,390 42,310',[101,342]],['Iron Hills','126,300 212,270 286,316 268,406 160,374',[207,337]],['Heartland','286,316 330,250 430,286 500,326 466,410 368,428 268,406',[374,350]],["King's Crossing",'500,326 566,282 620,318 604,408 530,442 466,410',[535,362]],['Amber Plains','620,318 700,286 750,360 716,430 650,452 604,408',[666,367]],['Dawnshore','750,360 824,330 844,412 792,474 716,430',[780,403]],['Southwest Reach','112,438 160,374 268,406 250,490 194,544 116,514 74,470',[172,457]],['Lake Country','268,406 368,428 350,506 286,558 250,490',[310,473]],['Greenfields','368,428 466,410 530,442 508,522 430,568 350,506',[432,480]],['Gold Ridge','530,442 604,408 650,452 626,528 552,572 508,522',[570,486]],['Southmarch','650,452 716,430 792,474 750,538 680,570 626,528',[690,500]],['Cape Ember','552,572 626,528 680,570 642,614 566,628 500,594',[583,583]]
  ];
  const specials={3:'shield',6:'double',9:'challenge',14:'stronghold',17:'shield',20:'double'};
  const adj=[[1,6,7],[0,2,7,8],[1,3,8,9],[2,4,9,10],[3,5,10,11],[4,11],[0,7,12],[0,1,6,8,13],[1,2,7,9,13,14],[2,3,8,10,14,15],[3,4,9,11,15,16],[4,5,10,16,17],[6,13,18],[7,8,12,14,18,19],[8,9,13,15,19,20],[9,10,14,16,20,21],[10,11,15,17,21,22],[11,16,22],[12,13,19],[13,14,18,20],[14,15,19,21,23],[15,16,20,22,23],[16,17,21,23],[20,21,22]];
  window.TT_BOARD={mapName:'The Crownlands',territories:raw.map((r,i)=>({id:`t${i+1}`,name:r[0],shape:r[1],label:r[2],adjacent:adj[i].map(j=>`t${j+1}`),special:specials[i]||null}))};

  const art=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 650">
  <defs><linearGradient id="sea" x2="0" y2="1"><stop stop-color="#219bd0"/><stop offset="1" stop-color="#0876b4"/></linearGradient></defs>
  <rect width="900" height="650" fill="url(#sea)"/>
  <g fill="none" stroke="#6dc8e8" stroke-width="4" opacity=".28"><path d="M20 105q50-20 100 0t100 0"/><path d="M675 575q55-22 120 0"/><path d="M15 505q45-18 90 0"/></g>
  <path d="M150 72 Q205 45 250 48 Q305 32 360 42 Q420 43 480 58 Q540 35 590 44 Q655 48 704 70 Q758 80 792 112 Q830 145 838 190 Q817 220 802 252 Q830 286 824 330 Q850 370 844 412 Q820 448 792 474 Q778 515 750 538 Q718 558 680 570 Q665 600 642 614 Q602 630 566 628 Q530 614 500 594 Q462 590 430 568 Q390 545 350 506 Q320 535 286 558 Q238 557 194 544 Q150 535 116 514 Q92 493 74 470 Q94 451 112 438 Q74 420 54 390 Q39 352 42 310 Q52 270 76 238 Q80 205 102 180 Q118 157 142 148 Q136 108 150 72Z" fill="#82c95c" stroke="#f4e4b6" stroke-width="8" stroke-linejoin="round"/>
  <path d="M300 62 Q380 32 480 58 Q510 95 512 142 Q468 160 420 151 Q360 170 300 148Z" fill="#dfeff0"/>
  <path d="M75 470Q112 438 160 400Q210 405 265 432Q255 500 194 544Q145 530 116 514Z" fill="#efc65b"/>
  <path d="M500 594Q530 540 565 520Q620 530 680 570Q665 600 642 614Q600 630 566 628Z" fill="#e9bd55"/>
  <path d="M445 285 Q480 265 515 286 Q548 310 514 337 Q480 358 446 338 Q420 315 445 285Z" fill="#45bce0" stroke="#dff6ff" stroke-width="4"/>
  <g fill="none" stroke="#46b7df" stroke-linecap="round"><path d="M478 61 Q465 130 476 205 Q480 245 463 282" stroke-width="10"/><path d="M452 340 Q425 380 398 420 Q370 462 350 505" stroke-width="10"/><path d="M515 337 Q560 360 595 398 Q620 422 647 450" stroke-width="8"/></g>
  <g fill="#237642" stroke="#245b38" stroke-width="2"><path d="M150 196l16-35 16 35h-8l12 23h-40l12-23z"/><path d="M190 218l16-35 16 35h-8l12 23h-40l12-23z"/><path d="M228 184l15-32 15 32h-8l12 22h-38l12-22z"/><path d="M585 206l16-35 16 35h-8l12 23h-40l12-23z"/><path d="M625 224l15-32 15 32h-8l12 22h-38l12-22z"/><path d="M380 377l16-35 16 35h-8l12 23h-40l12-23z"/><path d="M426 410l15-32 15 32h-8l12 22h-38l12-22z"/><path d="M635 398l16-35 16 35h-8l12 23h-40l12-23z"/></g>
  <g stroke="#4c5865" stroke-width="3" stroke-linejoin="round"><path d="M334 126l31-56 31 56-15-8-16 23-16-23z" fill="#82909d"/><path d="M392 139l27-49 28 49-14-7-14 21-14-21z" fill="#748592"/><path d="M192 410l34-61 35 61-18-9-17 25-17-25z" fill="#7d8993"/><path d="M668 326l34-61 35 61-18-9-17 25-17-25z" fill="#758693"/></g>
  <g fill="#fff"><path d="M352 93l13-23 13 23-13-7z"/><path d="M408 108l11-18 10 18-10-5z"/><path d="M211 375l15-26 14 26-14-7z"/><path d="M688 288l14-23 13 23-13-6z"/></g>
  <g stroke="#6b4024" stroke-width="3"><path d="M548 286v-37h18v37M542 286h30v23h-30z" fill="#f2d27a"/><path d="M542 249l12-14 12 14" fill="#d75b3f"/><path d="M704 478v-29h16v29M698 478h28v21h-28z" fill="#f2d27a"/><path d="M698 449l10-12 10 12" fill="#d75b3f"/><path d="M243 305v-28h15v28M237 305h27v20h-27z" fill="#f2d27a"/><path d="M237 277l10-12 10 12" fill="#d75b3f"/></g>
  <g fill="#5aa34c" stroke="#f4e4b6" stroke-width="6"><path d="M53 153q-27 24-6 58q26 20 50-3q17-31-4-59z"/><path d="M824 108q30-18 51 8q9 31-19 48q-31 6-44-20z"/><path d="M818 524q34-20 57 9q8 35-27 50q-34 2-44-26z"/></g>
  </svg>`;
  const artUrl=`url("data:image/svg+xml,${encodeURIComponent(art)}")`;
  const style=document.createElement('style');
  style.textContent=`
  .arena{background-color:#148bc2!important;background-image:${artUrl}!important;background-size:100% 100%!important;background-repeat:no-repeat!important;border-color:#65c4e5;box-shadow:inset 0 0 32px #075a8b44,0 18px 40px #0007}
  .territory polygon{fill:var(--team,#26435d)!important;fill-opacity:.11!important;stroke:rgba(255,247,218,.72)!important;stroke-width:2!important;stroke-linejoin:round;filter:none!important;transition:.18s}
  .territory:hover polygon{fill-opacity:.2!important;stroke:rgba(255,247,218,.95)!important}
  .territory.selected polygon{fill-opacity:.32!important;stroke:#ffd45b!important;stroke-width:7!important;filter:drop-shadow(0 0 7px #ffd45b)!important}
  .territory.legal polygon{fill-opacity:.27!important;stroke:#41e7df!important;stroke-width:7!important;filter:drop-shadow(0 0 8px #41e7df)!important}
  .territory .territory-name{font-size:10px;font-weight:950;paint-order:stroke;stroke:#08243a;stroke-width:3px}
  .territory .owner-mark{font-size:18px;paint-order:stroke;stroke:#08243a;stroke-width:3px}.territory .special{font-size:22px}
  .map-panel:after{content:'THE CROWNLANDS';position:absolute;right:20px;bottom:42px;color:rgba(255,255,255,.52);font:900 10px/1 system-ui;letter-spacing:.22em;pointer-events:none;text-shadow:0 1px 3px #07547e}
  @media(max-width:620px){.map-panel:after{display:none}.territory polygon{stroke-width:1.5!important}}
  `;
  document.head.appendChild(style);
})();