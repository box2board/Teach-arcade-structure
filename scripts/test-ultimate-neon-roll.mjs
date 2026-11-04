import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../public/mini-games/games/ultimate-skeeball/index.html',import.meta.url),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function harness(){
 let callback,now=1000;const counts={gradients:0,playerWrites:0,measurements:0},nodes=new Map(),events=[];
 const gradient={addColorStop(){}};
 const ctx=new Proxy({createLinearGradient(){counts.gradients++;return gradient;},createRadialGradient(){counts.gradients++;return gradient;}},{get(o,k){return o[k]??(()=>{});},set(o,k,v){o[k]=v;return true;}});
 function node(id){if(!nodes.has(id)){let text='',markup='';const classes=new Set();nodes.set(id,{tagName:'DIV',value:'1',disabled:false,style:{},hidden:false,width:960,height:750,classList:{contains:k=>classes.has(k),toggle(k,v){if(v)classes.add(k);else classes.delete(k);}},getContext:()=>ctx,getBoundingClientRect(){counts.measurements++;return {width:740,height:550};},setPointerCapture(){},addEventListener(){},setAttribute(){},blur(){},get textContent(){return text},set textContent(t){text=String(t)},get innerHTML(){return markup},set innerHTML(v){markup=v;if(id==='players')counts.playerWrites++;}});}return nodes.get(id);}
 const document={addEventListener(){},getElementById:node,querySelector:()=>node('machine'),createElement:()=>node('offscreen')};const window={matchMedia:()=>({matches:false}),addEventListener(){},dispatchEvent(e){events.push(e)}};
 const sandbox={document,window,console,Math,performance:{now:()=>now},CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts.detail}},requestAnimationFrame:fn=>callback=fn};
 const code=source.replace('updateUI();requestAnimationFrame(frame);\n})();',`window.__test={shot(p,a=0){power=p;aim=a;shoot();},snapshot:()=>({state,remaining,ball:ball?{x:ball.x,s:ball.s,y:ball.y,phase:ball.phase}:null,score:players[current]?.score,used}),pause,resize:()=>resizeDirty=true};\nupdateUI();requestAnimationFrame(frame);\n})();`);
 vm.runInNewContext(code,sandbox);const api=window.SparksMinigames.ultimateSkeeball;
 function frame(dt=1/60){now+=dt*1000;callback(now);}
 return {api,test:window.__test,frame,counts,events,nodes};
}
const h=harness();h.api.start({playerCount:1});h.frame();const firstWrites=h.counts.playerWrites;for(let i=0;i<120;i++)h.frame();assert.equal(h.counts.playerWrites,firstWrites,'idle frames must not rebuild player cards');assert.equal(h.counts.measurements,1,'layout should only be measured after resize');assert.equal(h.api.getState().performance.cabinetBuilds,1,'static cabinet must be cached');h.test.resize();h.frame();assert.equal(h.counts.measurements,2);assert.equal(h.api.getState().performance.cabinetBuilds,1,'same size must reuse cabinet');
const traces=[];for(const fps of [30,60,120]){const h=harness();h.api.start({playerCount:1});h.frame();h.test.shot(.6,0);for(let i=0;i<fps;i++)h.frame(1/fps);traces.push(h.test.snapshot());}
for(const t of traces.slice(1)){assert.equal(t.ball?.phase,traces[0].ball?.phase);assert(Math.abs(t.ball.s-traces[0].ball.s)<.002,'ball travel should agree across frame rates');assert(Math.abs(t.remaining-traces[0].remaining)<.002);}
const slow=harness();slow.api.start({playerCount:1});slow.frame();for(let i=0;i<10;i++)slow.frame(.08);assert(Math.abs(slow.test.snapshot().remaining-59.2)<.002,'80ms frames must not slow the round clock');
const paused=slow.test.snapshot().remaining;slow.api.pause();slow.frame(1);assert.equal(slow.test.snapshot().remaining,paused);slow.api.resume();slow.frame();assert.equal(slow.test.snapshot().remaining,paused,'resume must reset elapsed time');
for(const power of [.2,.5,.8,1]){const h=harness();h.api.start({playerCount:1});h.frame();for(let n=0;n<9;n++){h.test.shot(power);for(let i=0;i<300&&h.test.snapshot().ball;i++)h.frame();h.frame();}for(let i=0;i<120;i++)h.frame();assert.equal(h.test.snapshot().state,'finished');assert.equal(h.events.length,1);assert.equal(h.events[0].detail.gameId,'ultimate-neon-roll');assert(Number.isFinite(h.events[0].detail.results[0].score));h.api.start({playerCount:1});assert.equal(h.test.snapshot().used,0);}
console.log('PASS: cabinet reuse, resize-only measurement, stable player DOM, 30/60/120fps trajectories, long-frame clock, pause/resume, nine-shot scoring, completion once and replay.');
