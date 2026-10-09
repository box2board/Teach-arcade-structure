// Optional DOM integration suite: npm install --prefix /tmp/teach-arcade-qa jsdom
// TEACH_ARCADE_JSDOM=/tmp/teach-arcade-qa/node_modules/jsdom/lib/api.js node scripts/test-review-lab-dom.mjs
const {JSDOM}=await import(process.env.TEACH_ARCADE_JSDOM||'jsdom');
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url).pathname;
const {BANK_SETS}=await import(root+'public/review-lab/bank-catalog.js');
const math=BANK_SETS.find(s=>s.subject==='Math'),science=BANK_SETS.find(s=>s.subject==='Science');
function bind(dom){const w=dom.window;w.scrollTo=()=>{};w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({measureText:()=>({width:50}),createLinearGradient:()=>({addColorStop(){}}),setTransform(){}},{get(t,p){return t[p]??(()=>{});},set(t,p,v){t[p]=v;return true;}});w.requestAnimationFrame=()=>0;
 for(const key of ['window','document','location','history','localStorage','Event','CustomEvent','HTMLElement','navigator'])Object.defineProperty(globalThis,key,{value:w[key],configurable:true});globalThis.requestAnimationFrame=()=>0;globalThis.devicePixelRatio=1;globalThis.matchMedia=()=>({matches:false});w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};globalThis.addEventListener=w.addEventListener.bind(w);return w;
}
async function page(route,query=''){const html=await fs.readFile(root+'public/review-lab/'+route+'index.html','utf8');return new JSDOM(html,{url:'http://127.0.0.1:8765/review-lab/'+route+query,runScripts:'outside-only',pretendToBeVisual:true});}
let dom=await page('');let w=bind(dom);
await import(root+'public/review-lab/hub.js');assert.equal(w.document.querySelectorAll('.game-card').length,4);w.document.getElementById('browse-topics').click();assert.equal(w.document.querySelectorAll('[data-set]').length,253);
const subject=w.document.getElementById('topic-subject');subject.value='Math';subject.dispatchEvent(new w.Event('change'));assert.equal(w.document.querySelectorAll('[data-set]').length,76);w.document.querySelector('[data-set]').click();assert.equal(w.document.querySelectorAll('.game-card').length,4);assert([...w.document.querySelectorAll('#catalog a.primary')].every(a=>a.href.includes('?set=')));
console.log('PASS DOM: hub topic filtering and all four deep links.');
dom=await page('category-clash/','?set='+math.id);w=bind(dom);
w.eval(await fs.readFile(root+'public/review-lab/category-clash/questions.js','utf8'));
const customKey='teachArcade.categoryClash.'+w.CC_QUESTION_SET.id;
const savedDraft=JSON.stringify({...w.CC_QUESTION_SET,title:'My saved custom board'});
w.localStorage.setItem(customKey,savedDraft);
w.eval(await fs.readFile(root+'public/review-lab/category-clash/game.js','utf8'));
await import(root+'public/review-lab/category-clash/launch.js');for(let i=0;i<30&&!w.document.getElementById('bank-status').textContent.includes('loaded');i++)await new Promise(r=>setTimeout(r,10));
assert(w.document.getElementById('bank-status').textContent.includes('20 questions loaded'));assert.equal(w.document.querySelectorAll('#categoryEditor textarea[data-q="question"]').length,20);assert.equal(w.document.getElementById('multipleChoiceEnabled').checked,true);
w.document.querySelector('[name="playMode"][value="individual"]').click();w.document.getElementById('startBtn').click();assert.equal(w.document.getElementById('boardView').hidden,false);
console.log('PASS DOM: Category Clash math preset, all 20 clues, multiple-choice launch.');
w.document.getElementById('newGameBtn').click();
w.CategoryClash.loadQuestionSet({id:'sign-regression',title:'Math sign regression',finalEnabled:false,timerEnabled:false,categories:[{name:'Review',questions:[{question:'Which option is negative three?',answer:'−3',choices:['−3','3','−2','2'],answerIndex:0,points:100}]}]});
w.document.getElementById('startBtn').click();w.document.querySelector('[data-square]').click();
[...w.document.querySelectorAll('.individual-choice')].find(b=>b.textContent==='3').click();assert(w.document.querySelector('.incorrect-feedback'));
w.document.getElementById('continueIndividual').click();w.document.getElementById('newGameBtn').click();w.document.getElementById('startBtn').click();w.document.querySelector('[data-square]').click();
[...w.document.querySelectorAll('.individual-choice')].find(b=>b.textContent==='−3').click();assert(w.document.querySelector('.correct-feedback'));
w.document.getElementById('continueIndividual').click();w.document.getElementById('newGameBtn').click();w.document.getElementById('bank-custom').click();
assert.equal(w.document.getElementById('titleInput').value,'My saved custom board');assert.equal(w.localStorage.getItem(customKey),savedDraft);
console.log('PASS DOM: math signs grade correctly and original custom draft survives bank play.');
dom=await page('review-pinball/','?set='+science.id);w=bind(dom);await import(root+'public/review-lab/review-pinball/game.js');
assert.equal(w.document.getElementById('question-set').value,science.id);assert.equal(w.document.querySelectorAll('#question-set option').length,253);w.document.getElementById('start').click();for(let i=0;i<30&&!w.document.getElementById('overlay').hidden;i++)await new Promise(r=>setTimeout(r,10));
assert.equal(w.document.getElementById('overlay').hidden,true);console.log('PASS DOM: Pinball shared science preset and validated launch.');
dom=await page('acorn-dash/');w=bind(dom);await import(root+'public/arcade-review-games/crossing-quest/game.js');w.document.getElementById('choose-set').click();assert.equal(w.document.querySelectorAll('#question-set option').length,253);w.document.getElementById('question-set').value=math.id;w.document.getElementById('start').click();for(let i=0;i<30&&w.document.getElementById('panel').open;i++)await new Promise(r=>setTimeout(r,10));
assert.equal(w.document.getElementById('panel').open,false);console.log('PASS DOM: Acorn shared math selection and validated launch.');
process.exit(0);

