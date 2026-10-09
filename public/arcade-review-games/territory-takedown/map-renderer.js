(function(){'use strict';
const NS='http://www.w3.org/2000/svg';
const arena=document.getElementById('arena');if(!arena||!window.TT_BOARD)return;
arena.setAttribute('viewBox',window.TT_BOARD.viewBox||'0 0 1200 760');
const art=`<g class="tt-map-art" pointer-events="none">
<path class="biome snow" d="M170 170 C145 135 170 100 220 88 C315 53 405 67 520 91 C615 58 735 78 823 114 C858 136 876 165 870 198 C810 213 755 228 684 237 C610 219 545 216 470 226 C390 212 315 209 184 225Z"/>
<path class="biome desert" d="M128 520 C190 548 263 566 346 614 C325 643 312 670 310 696 C248 701 187 674 150 633 C121 601 111 554 128 520Z"/>
<path class="biome farms" d="M789 424 C870 441 916 455 969 466 C987 490 988 519 975 545 C956 574 926 592 890 599 C849 570 802 543 752 515 C754 481 767 450 789 424Z"/>
<g class="roads"><path d="M205 300 C310 330 410 365 515 390 C620 416 720 402 840 360"/><path d="M385 145 C430 230 505 325 590 410 C670 490 755 550 865 615"/><path d="M250 555 C365 545 475 552 590 590 C675 618 745 635 815 650"/></g>
<g class="water"><path d="M470 115 C450 170 459 226 493 279 C520 320 552 356 579 405 C598 438 610 461 610 482"/><ellipse cx="610" cy="493" rx="47" ry="29"/><path d="M610 522 C625 553 621 581 603 612"/></g>
<g class="mountains"><path d="M345 145l18-35 18 35 17-28 19 36z"/><path d="M390 155l17-34 17 34 16-27 18 34z"/><path d="M685 155l19-38 19 38 17-29 19 37z"/><path d="M730 170l18-36 18 36 17-28 19 36z"/><path d="M310 420l19-37 19 37 18-30 20 38z"/><path d="M355 435l18-35 18 35 17-28 19 36z"/></g>
<g class="forests"><circle cx="190" cy="270" r="13"/><circle cx="215" cy="285" r="15"/><circle cx="240" cy="270" r="12"/><circle cx="205" cy="315" r="13"/><circle cx="250" cy="310" r="14"/><circle cx="820" cy="300" r="12"/><circle cx="850" cy="325" r="15"/><circle cx="880" cy="345" r="13"/><circle cx="835" cy="365" r="14"/><circle cx="875" cy="385" r="12"/><circle cx="690" cy="560" r="12"/><circle cx="720" cy="575" r="14"/><circle cx="750" cy="565" r="12"/></g>
<g class="settlements"><g transform="translate(560 365)"><rect x="-17" y="-12" width="34" height="28" rx="3"/><rect x="-23" y="-22" width="12" height="18"/><rect x="11" y="-22" width="12" height="18"/></g><g transform="translate(315 520)"><rect x="-13" y="-9" width="26" height="19"/></g><g transform="translate(865 490)"><rect x="-13" y="-9" width="26" height="19"/></g><g transform="translate(740 245)"><rect x="-13" y="-9" width="26" height="19"/></g></g>
</g>`;
let busy=false;
function enhance(){if(busy)return;busy=true;try{
 arena.setAttribute('viewBox',window.TT_BOARD.viewBox||'0 0 1200 760');
 const groups=[...arena.querySelectorAll('g.territory')];
 groups.forEach(g=>{const id=g.dataset.id,t=window.TT_BOARD.territories.find(x=>x.id===id);if(!t||!t.path)return;const old=g.querySelector('polygon');if(old){const p=document.createElementNS(NS,'path');p.setAttribute('d',t.path);old.replaceWith(p)}});
 if(groups.length&&!arena.querySelector('.tt-map-art')){const holder=document.createElementNS(NS,'g');holder.innerHTML=art;const node=holder.firstElementChild;arena.insertBefore(node,groups[0]);}
}finally{busy=false}}
new MutationObserver(enhance).observe(arena,{childList:true});enhance();
})();