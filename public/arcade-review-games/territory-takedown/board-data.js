(function(){
const raw=[
['North Cape','170,72 250,48 314,78 302,168 220,188 142,148',[232,116]],['Frost Coast','250,48 360,42 410,82 392,170 302,168 314,78',[352,112]],['Highland Reach','360,42 480,58 502,150 450,192 392,170 410,82',[439,118]],['Pine March','480,58 590,44 650,90 628,174 550,194 502,150',[559,116]],['Storm Coast','590,44 704,70 758,132 724,204 628,174 650,90',[668,120]],['Eastwatch','704,70 792,112 838,190 802,252 724,204 758,132',[772,166]],['Westhaven','142,148 220,188 212,270 126,300 76,238 102,180',[157,225]],['Silver Vale','220,188 302,168 330,250 286,316 212,270',[268,242]],['Crownlands','302,168 392,170 450,192 430,286 330,250',[376,222]],['Rivermeet','450,192 502,150 550,194 566,282 500,326 430,286',[497,238]],['Redwood','550,194 628,174 724,204 700,286 620,318 566,282',[629,242]],['Sun Coast','724,204 802,252 824,330 750,360 700,286',[758,278]],['Mist Bay','76,238 126,300 160,374 112,438 54,390 42,310',[101,342]],['Iron Hills','126,300 212,270 286,316 268,406 160,374',[207,337]],['Heartland','286,316 330,250 430,286 500,326 466,410 368,428 268,406',[374,350]],["King's Crossing",'500,326 566,282 620,318 604,408 530,442 466,410',[535,362]],['Amber Plains','620,318 700,286 750,360 716,430 650,452 604,408',[666,367]],['Dawnshore','750,360 824,330 844,412 792,474 716,430',[780,403]],['Southwest Reach','112,438 160,374 268,406 250,490 194,544 116,514 74,470',[172,457]],['Lake Country','268,406 368,428 350,506 286,558 250,490',[310,473]],['Greenfields','368,428 466,410 530,442 508,522 430,568 350,506',[432,480]],['Gold Ridge','530,442 604,408 650,452 626,528 552,572 508,522',[570,486]],['Southmarch','650,452 716,430 792,474 750,538 680,570 626,528',[690,500]],['Cape Ember','552,572 626,528 680,570 642,614 566,628 500,594',[583,583]],
['Westwatch Isle','45,150 70,137 96,150 104,178 91,205 64,211 42,191 37,169',[70,174]],['Northstar Isle','821,105 846,96 870,108 879,132 868,155 843,165 820,151 811,127',[845,131]],['Ember Isle','817,523 845,510 873,524 884,550 873,578 845,589 818,575 807,548',[846,550]]
];
const specials={3:'shield',6:'double',9:'challenge',14:'stronghold',17:'shield',20:'double',24:'challenge',25:'shield',26:'double'};
const adj=[[1,6,7],[0,2,7,8],[1,3,8,9],[2,4,9,10],[3,5,10,11,25],[4,11,25],[0,7,12,24],[0,1,6,8,13],[1,2,7,9,13,14],[2,3,8,10,14,15],[3,4,9,11,15,16],[4,5,10,16,17],[6,13,18,24],[7,8,12,14,18,19],[8,9,13,15,19,20],[9,10,14,16,20,21],[10,11,15,17,21,22],[11,16,22,26],[12,13,19],[13,14,18,20],[14,15,19,21,23],[15,16,20,22,23],[16,17,21,23,26],[20,21,22,26],[6,12],[4,5],[17,22,23]];
window.TT_BOARD={mapName:'The Crownlands',territories:raw.map((r,i)=>({id:`t${i+1}`,name:r[0],shape:r[1],label:r[2],adjacent:adj[i].map(j=>`t${j+1}`),special:specials[i]||null}))};

/* Decoration only. The continent itself is no longer a second drawing: the
   playable territory paths ARE the landmass, so hit areas and coastline cannot diverge. */
const art=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 650">
<rect width="900" height="650" fill="#168fc6"/>
<g fill="none" stroke="#70cbea" stroke-width="4" opacity=".25"><path d="M15 112q55-22 110 0t110 0M680 585q55-22 120 0M10 505q45-18 90 0"/></g>
<path d="M445 285Q480 265 515 286Q548 310 514 337Q480 358 446 338Q420 315 445 285Z" fill="#45bce0" stroke="#dff6ff" stroke-width="4"/>
<g fill="none" stroke="#46b7df" stroke-linecap="round"><path d="M478 61Q465 130 476 205Q480 245 463 282" stroke-width="10"/><path d="M452 340Q425 380 398 420Q370 462 350 505" stroke-width="10"/><path d="M515 337Q560 360 595 398Q620 422 647 450" stroke-width="8"/></g>
<g fill="#247642" stroke="#245b38" stroke-width="2"><path d="M150 196l16-35 16 35h-8l12 23h-40l12-23zM190 218l16-35 16 35h-8l12 23h-40l12-23zM585 206l16-35 16 35h-8l12 23h-40l12-23zM625 224l15-32 15 32h-8l12 22h-38l12-22zM380 377l16-35 16 35h-8l12 23h-40l12-23zM635 398l16-35 16 35h-8l12 23h-40l12-23z"/></g>
<g stroke="#4c5865" stroke-width="3" fill="#7c8b98"><path d="M334 126l31-56 31 56-15-8-16 23-16-23zM392 139l27-49 28 49-14-7-14 21-14-21zM192 410l34-61 35 61-18-9-17 25-17-25zM668 326l34-61 35 61-18-9-17 25-17-25z"/></g>
<g stroke="#6b4024" stroke-width="3" fill="#f2d27a"><path d="M548 286v-37h18v37M542 286h30v23h-30zM704 478v-29h16v29M698 478h28v21h-28zM243 305v-28h15v28M237 305h27v20h-27z"/></g>
</svg>`;
const artUrl=`url("data:image/svg+xml,${encodeURIComponent(art)}")`;
const style=document.createElement('style');style.textContent=`
.arena{background:#168fc6 ${artUrl} center/100% 100% no-repeat!important;border-color:#65c4e5;box-shadow:inset 0 0 32px #075a8b44,0 18px 40px #0007}
.territory polygon{fill:color-mix(in srgb,#82c95c 82%,var(--team) 18%)!important;fill-opacity:1!important;stroke:#f4e4b6!important;stroke-width:2.2!important;stroke-linejoin:round;transition:.18s}
.territory:nth-of-type(2) polygon,.territory:nth-of-type(3) polygon{fill:color-mix(in srgb,#e4f1f1 84%,var(--team) 16%)!important}
.territory:nth-of-type(19) polygon,.territory:nth-of-type(24) polygon{fill:color-mix(in srgb,#efc65b 82%,var(--team) 18%)!important}
.territory:nth-of-type(n+25) polygon{fill:color-mix(in srgb,#5aa34c 80%,var(--team) 20%)!important;stroke-width:4!important}
.territory:hover polygon{filter:brightness(1.07)}
.territory.selected polygon{stroke:#ffd45b!important;stroke-width:8!important;filter:drop-shadow(0 0 8px #ffd45b)!important}
.territory.legal polygon{stroke:#41e7df!important;stroke-width:8!important;filter:drop-shadow(0 0 9px #41e7df)!important}
.territory .territory-name{display:none!important}.territory .owner-mark{font-size:19px;paint-order:stroke;stroke:#08243a;stroke-width:3px}.territory .special{font-size:22px}
.map-panel:after{content:'THE CROWNLANDS';position:absolute;right:20px;bottom:42px;color:#ffffff88;font:900 10px/1 system-ui;letter-spacing:.22em;pointer-events:none;text-shadow:0 1px 3px #07547e}
@media(max-width:620px){.map-panel:after{display:none}.territory polygon{stroke-width:1.6!important}.territory:nth-of-type(n+25) polygon{stroke-width:3!important}}
`;document.head.appendChild(style);
})();