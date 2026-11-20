/* Run with Playwright installed; optionally set CHROMIUM_EXECUTABLE. */
const {chromium}=require('playwright');const assert=require('node:assert/strict');const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,headless:true,args:process.env.CHROMIUM_EXECUTABLE?['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--single-process','--no-zygote']:[]});
 const url=process.env.PANEL_QUEST_URL||'file://'+path.resolve('public/prototypes/panel-quest/index.html');const errors=[],endings=new Set(),fit=[];let runs=0;
 const page=await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
 const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('panel-quest:paris-print-shop:v3')));
 async function checkFit(label,vertical=true){const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,height:innerHeight,body:document.documentElement.scrollHeight,next:document.querySelector('#next:not([hidden])')?.getBoundingClientRect().bottom,box:document.querySelector('#interaction')?.getBoundingClientRect().bottom}));assert(dimensions.scroll<=dimensions.width+1,'Horizontal overflow '+label);if(vertical&&dimensions.width>=1000)assert((dimensions.next||dimensions.box||0)<dimensions.height,label+' controls below fold '+JSON.stringify(dimensions));fit.push({label,...dimensions});}
 for(const dims of [[1366,768],[1280,720],[1024,768],[768,1024],[390,844]]){
  await page.setViewportSize({width:dims[0],height:dims[1]});await page.goto(url);await page.evaluate(()=>localStorage.clear());await page.reload();await page.click('#startBtn');await page.click('[data-inspect]');await page.click('#next');await checkFit(dims.join('x')+' unanswered');await page.locator('.context-note summary').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('panel-quest:paris-print-shop:v3')).support.includes('q0'));assert((await state()).support.includes('q0'));await page.locator('.context-note summary').click();
  const right=await page.evaluate(()=>window.PANEL_QUEST_EDITION.scenes.q0.question.correctIndex);await page.click('[data-answer="'+right+'"]');await checkFit(dims.join('x')+' feedback');
  await page.keyboard.press('e');assert(await page.locator('#notebook').evaluate(e=>e.open));await page.keyboard.press('Escape');assert.equal(await page.locator('#notebook').evaluate(e=>e.open),false);
  if(process.env.QA_DIR)await page.screenshot({path:path.join(process.env.QA_DIR,'panel-'+dims.join('x')+'.png'),fullPage:true});
 }
 await page.setViewportSize({width:1280,height:720});
 for(const route of ['ledger','market'])for(const edit of ['rights','constitution'])for(const source of route==='market'?['protect','attribute']:['none'])for(const final of ['public','archive'])for(const wrong of [false,true])for(const notes of ['seal','copies']){
  await page.goto(url);await page.evaluate(()=>localStorage.clear());await page.reload();await page.click('#startBtn');let count=0;
  while(true){assert(++count<40);const saved=await state();const s=await page.evaluate(id=>window.PANEL_QUEST_EDITION.scenes[id],saved.scene);
   if(s.type==='ending')break;
   if(s.type==='question'){
    if(wrong){await page.click('[data-answer="'+((s.question.correctIndex+1)%4)+'"]');assert(await page.locator('#feedback.error').isVisible());}
    if(saved.scene==='q2'){
     const order=await page.locator('[data-answer]').evaluateAll(bs=>bs.map(b=>b.dataset.answer));await page.reload();await page.click('#resume');assert.deepEqual(await page.locator('[data-answer]').evaluateAll(bs=>bs.map(b=>b.dataset.answer)),order);
    }
    await page.click('[data-answer="'+s.question.correctIndex+'"]');await checkFit(saved.scene+' '+(wrong?'retry':'first'));await page.click('#next');
   }else if(s.type==='publication'){
    assert.equal(await page.locator('#next').isVisible(),false);await page.click('#publish');assert(await page.locator('#publicationFeedback.error').isVisible());
    for(const claim of s.claims.filter(c=>!c.when||Object.entries(c.when.flags||{}).every(([k,v])=>saved.flags[k]===v)))await page.selectOption('[data-evidence="'+claim.id+'"]',claim.accept.find(id=>saved.clues.includes(id)));
    await page.fill('#pageReason','The selected evidence supports the page claim because it describes the same event and its significance.');
    await page.reload();await page.click('#resume');assert((await page.locator('#pageReason').inputValue()).startsWith('The selected evidence'));
    await page.click('#publish');assert(await page.locator('#next').isVisible());await checkFit(saved.scene+' printed');await page.click('#next');
   }else if(s.type==='investigation'){
    assert.equal(await page.locator('#next').isVisible(),false);for(const item of s.items)await page.click('[data-inspect="'+item.id+'"]');assert(await page.locator('#next').isVisible());await page.click('#next');
   }else{const id=saved.scene==='route-a'?route:saved.scene==='route-b'?edit:saved.scene==='source'?source:saved.scene==='notes-decision'?notes:final;await page.click('[data-choice="'+id+'"]');}
  }
  const saved=await state();assert.equal(Object.values(saved.answers).filter(a=>a.solved).length,10);assert.equal(Object.values(saved.answers).filter(a=>a.solved&&!a.wrong.length).length,wrong?0:10);endings.add(await page.locator('.ending-copy h1').innerText());assert(await page.locator('#replay').isVisible());assert.equal(saved.values.pages,3);assert.equal(saved.flags.notes,notes==='seal'?'sealed':'copies');assert((await page.locator('.character-epilogue').innerText()).includes('What became of the shop'));await page.locator('.character-epilogue summary').click();assert((await page.locator('.character-epilogue').innerText()).includes('Camille'));assert.equal(saved.flags.final==='archive',await page.locator('.ending-copy h1').innerText()==='The keeper of the record');await page.locator('.finished-pages summary').click();assert.equal(await page.locator('.printed-page').count(),3);await page.locator('.learning-record summary').click();assert((await page.locator('#learningRecord').innerText()).includes('Student explanation:'));const downloaded=page.waitForEvent('download');await page.click('#downloadRecord');assert((await downloaded).suggestedFilename().endsWith('learning-record.txt'));
  if(process.env.QA_DIR&&endings.size===3)await page.screenshot({path:path.join(process.env.QA_DIR,'ending.png'),fullPage:true});
  await page.click('#replay');assert.equal((await state()).scene,'briefing');assert.equal((await state()).clues.length,0);runs++;
 }
 assert.equal(runs,48);assert.equal(endings.size,3);assert.deepEqual(errors,[]);
 console.log(JSON.stringify({runs,endings:[...endings],errors,layoutChecks:fit.length,viewports:fit.slice(0,10)},null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
