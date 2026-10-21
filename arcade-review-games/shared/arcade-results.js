(()=>{'use strict';
const arcade='/arcade-review-games/';
const routes={
 '/arcade-review-games/territory-takedown/':{screen:'#winnerView',replay:'#rematchBtn'},
 '/arcade-review-games/territory-takedown/french-revolution/':{screen:'#winnerView',replay:'#rematchBtn'},
 '/arcade-review-games/survey-showdown/':{screen:'#winner',replay:'#rematch'},
 '/arcade-review-games/social-studies/wwi-trench-run.html':{screen:'#results-modal',replay:'.result-actions button'},
 '/arcade-review-games/social-studies/pyramid-escape-run.html':{screen:'#results-modal',replay:'.result-actions button'},
 '/arcade-review-games/social-studies/cold-war-shadow-run/':{screen:'#finishModal',replay:'#playAgain'},
 '/arcade-review-games/science/volcano-ascent/':{screen:'#results-modal',replay:'.result-actions button'},
 '/arcade-review-games/science/moon-mission-run.html':{screen:'#results-modal',replay:'.result-actions button'},
 '/arcade-review-games/science/concept-stack-cells/':{screen:'#gameover-modal',replay:'#replay-button'},
 '/arcade-review-games/science/scientific-method.html':{screen:'#winMessage',kind:'maze'},
 '/arcade-review-games/math/algebra-city-run.html':{screen:'#results-modal',replay:'.result-actions button'},
 '/arcade-review-games/math/slope-street-sprint.html':{screen:'#results-modal',replay:'.result-actions button'},
 '/arcade-review-games/math/math-track-racer.html':{screen:'#overlay',replay:'#btnStart',ready:()=>/final score|run complete|time is up|finished/i.test(document.querySelector('#overlayTitle')?.textContent||'')},
 '/arcade-review-games/math/math-rush-genesis-addition.html':{screen:'#end-overlay',replay:'#restart-btn'},
 '/arcade-review-games/ela/grammar-gauntlet.html':{screen:'#endOverlay',replay:'#replayBtn'},
 '/arcade-review-games/ela/undertext-rifts-mood-tone.html':{screen:'#endOverlay',replay:'#playAgainButton'}
};
const path=location.pathname.endsWith('/')?location.pathname:location.pathname;
const config=routes[path];if(!config)return;
const style=document.createElement('style');
style.textContent='.ta-result-actions{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:18px 0 2px;width:100%}.ta-result-actions button,.ta-result-actions a{box-sizing:border-box!important;min-height:46px!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:11px 14px!important;border:1px solid rgba(148,163,184,.45)!important;border-radius:12px!important;background:#172033!important;color:#fff!important;font:700 14px/1.25 system-ui,sans-serif!important;text-align:center!important;text-decoration:none!important;cursor:pointer!important}.ta-result-actions button:hover,.ta-result-actions a:hover{background:#24334d!important;border-color:#67e8f9!important}.ta-result-actions .ta-result-download{background:#facc15!important;color:#111827!important;border-color:#facc15!important}.ta-result-actions .ta-result-download:hover{background:#fde047!important}.ta-result-actions .ta-result-replay{background:#22d3ee!important;color:#082f49!important;border-color:#22d3ee!important}.ta-result-actions .ta-result-replay:hover{background:#67e8f9!important}@media(max-width:560px){.ta-result-actions{grid-template-columns:1fr!important}}.ta-result-dialog{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:18px;background:rgba(2,6,23,.82);font:16px/1.5 system-ui,sans-serif;color:#f8fafc}.ta-result-dialog[hidden]{display:none}.ta-result-card{width:min(620px,100%);max-height:calc(100dvh - 36px);overflow:auto;padding:24px;border:1px solid #334155;border-radius:22px;background:linear-gradient(155deg,#172554,#0f172a 65%);box-shadow:0 24px 80px #0009}.ta-result-card h2{margin:0 0 8px;font-size:clamp(1.5rem,5vw,2.2rem)}.ta-result-card p{color:#cbd5e1}.ta-result-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:18px 0}.ta-result-metrics div{padding:12px;border:1px solid #334155;border-radius:12px;background:#0f172a}.ta-result-actions a{font-size:14px}';
document.head.appendChild(style);
const normalizeText=v=>String(v||'').replace(/\s+/g,' ').trim();
function safeName(v){return normalizeText(v).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'arcade-results'}
function downloadReport(title,lines){
 const body=[title,'Teach Arcade · Arcade Review Results','Completed: '+new Date().toLocaleString(),'','Performance summary',...lines].filter(Boolean).join('\n');
 const blob=new Blob([body+'\n'],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=safeName(title)+'-results.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function actionBar(screen,replay,customLines){
 if(screen.querySelector(':scope > .ta-result-actions'))return;
 const bar=document.createElement('div');bar.className='ta-result-actions';bar.setAttribute('aria-label','Results actions');
 const clean=screen.cloneNode(true);clean.querySelectorAll('.ta-result-actions,button,a,input,select,textarea').forEach(n=>n.remove());
 const content=normalizeText(clean.innerText||clean.textContent||'');
 const lines=customLines||content.split(/\n+/).map(normalizeText).filter(Boolean);
 const title=normalizeText(document.title.replace(/\s*[|·]\s*Teach Arcade.*$/i,'').replace(/\s*-\s*Teach Arcade.*$/i,''));
 const dl=document.createElement('button');dl.type='button';dl.className='ta-result-download';dl.textContent='Download results';dl.addEventListener('click',()=>downloadReport(title,lines));
 bar.append(dl);
 if(replay){replay.textContent='Play Again';replay.classList.add('ta-result-replay');replay.setAttribute('aria-label','Play this game again');bar.append(replay)}
 else {const again=document.createElement('button');again.type='button';again.className='ta-result-replay';again.textContent='Play Again';again.addEventListener('click',()=>location.reload());bar.append(again)}
 const back=document.createElement('a');back.href=arcade;back.textContent='Return to Arcade';bar.append(back);
 const target=screen.querySelector('dialog,.modal-content,.card')||screen;target.append(bar);
}
function visible(el){
 if(!el||el.hidden)return false;const s=getComputedStyle(el);
 return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>0&&el.getClientRects().length>0;
}
function makeMazeDialog(){
 const shell=document.createElement('div');shell.className='ta-result-dialog';shell.setAttribute('role','dialog');shell.setAttribute('aria-modal','true');shell.setAttribute('aria-labelledby','ta-maze-result-title');
 const card=document.createElement('section');card.className='ta-result-card';const h=document.createElement('h2');h.id='ta-maze-result-title';h.textContent='Maze Complete';card.append(h);
 const msg=document.createElement('p');msg.textContent='You cleared all 10 Quiz Orbs.';card.append(msg);
 const metrics=document.createElement('div');metrics.className='ta-result-metrics';metrics.setAttribute('aria-label','Performance');
 const actions=document.createElement('div');actions.className='ta-result-actions';
 const data=()=>window.TA_ARCADE_PERFORMANCE||{};
 const formatMetrics=()=>{metrics.replaceChildren();const d=data();[['Score',d.score],['Accuracy',d.accuracy==null?'—':d.accuracy+'%'],['Questions',((d.answered==null?10:d.answered)+' / '+(d.total||10))],['Time',d.elapsed==null?'—':d.elapsed+' sec']].forEach(([label,value])=>{const item=document.createElement('div');const strong=document.createElement('strong');strong.textContent=label+': ';item.append(strong,document.createTextNode(String(value==null?'—':value)));metrics.append(item)})};
 formatMetrics();card.append(metrics);const lines=()=>{const d=data();return ['Score: '+(d.score??0),'Accuracy: '+(d.accuracy??0)+'%','Questions answered: '+(d.answered??10)+' / '+(d.total??10),'Time: '+(d.elapsed??0)+' seconds']};
 const dl=document.createElement('button');dl.type='button';dl.className='ta-result-download';dl.textContent='Download results';dl.addEventListener('click',()=>downloadReport(document.title,lines()));actions.append(dl);
 const again=document.createElement('button');again.type='button';again.className='ta-result-replay';again.textContent='Play Again';again.addEventListener('click',()=>location.reload());actions.append(again);
 const back=document.createElement('a');back.href=arcade;back.textContent='Return to Arcade';actions.append(back);card.append(actions);shell.append(card);document.body.append(shell);return shell;
}
let mazeDialog=null,scheduled=false;
function check(){
 scheduled=false;const screen=document.querySelector(config.screen);if(!screen||!visible(screen))return;
 if(config.ready&&!config.ready())return;
 if(config.kind==='maze'){
   if(mazeDialog){mazeDialog.hidden=false;return}
   mazeDialog=makeMazeDialog();return;
 }
 let replay=null;try{replay=config.replay?screen.querySelector(config.replay):null}catch{}
 actionBar(screen,replay);
}
function schedule(){if(scheduled)return;scheduled=true;setTimeout(check,120)}
const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','style','class','aria-hidden']});
schedule();setInterval(check,700);
window.TAArcadeResults={download:downloadReport};
})();