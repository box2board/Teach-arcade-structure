import fs from 'node:fs';
fs.mkdirSync('/tmp/crossword-qa',{recursive:true});
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
const {chromium}=createRequire(import.meta.url)('playwright');
const origin=process.env.CROSSWORD_TEST_ORIGIN||'http://127.0.0.1:8765';
const catalog=JSON.parse(fs.readFileSync('public/print-play-games/crossword-catalog.json')).resources;
const configs=JSON.parse(fs.readFileSync('crossword-data/subjects.json'));
const selected=process.env.CROSSWORD_SUBJECT?[process.env.CROSSWORD_SUBJECT]:Object.keys(configs);
let server;
if(!process.env.CROSSWORD_TEST_ORIGIN){
 server=spawn('python3',['-u','-m','http.server','8765','--bind','127.0.0.1','--directory','public']);server.stderr.resume();
 process.on('exit',()=>server.kill());
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('exit',code=>reject(new Error('Local server exited '+code)));});
}
const browser=await chromium.launch({headless:true,...(process.env.CROSSWORD_CHROMIUM_PATH?{executablePath:process.env.CROSSWORD_CHROMIUM_PATH}:{}),args:['--disable-gpu']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
await page.goto(origin+'/print-play-games/');await page.locator('.library-status').first().waitFor();
assert.equal(requests.filter(u=>/\.(pdf|webp)(?:$|\?)/.test(u)).length,0,'Preview or PDF preloaded');
let focusChecks=0,hoverChecks=0,downloadChecks=0;const reports={};
for(const slug of selected){
 const cfg=configs[slug];assert.ok(cfg);const items=catalog.filter(r=>r.subject===cfg.subject);
 const library=page.locator('#'+cfg.anchor),input=library.locator('input[type=search]');
 assert.equal(await library.locator('.crossword-card:visible').count(),Math.min(12,items.length));
 const categoryCounts={};
 for(const category of new Set(items.map(r=>r.category))){
  await library.locator('[data-category]').filter({hasText:category}).click();
  categoryCounts[category]=items.filter(r=>r.category===category).length;
  assert.match(await library.locator('.library-status').innerText(),new RegExp(`^${categoryCounts[category]} topic(?:s)?`));
 }
 await library.locator('[data-category=""]').click();
 if(items.length>12){
  await library.locator('[data-next]').click();assert.equal(await library.locator('.library-pagination span').innerText(),`Page 2 of ${Math.ceil(items.length/12)}`);
  await library.locator('[data-prev]').click();assert.equal(await library.locator('.library-pagination span').innerText(),`Page 1 of ${Math.ceil(items.length/12)}`);
 }
 await input.fill('not-a-real-topic');assert.equal(await library.locator('.crossword-card:visible').count(),0);
 for(const r of items){
  await input.fill(r.title);const card=library.locator('#crossword-'+r.id);assert.ok(await card.isVisible(),r.id);
  const links=card.locator('[data-preview]');
  for(let i=0;i<4;i++){
   const link=links.nth(i);await link.focus();const popup=page.locator('.library-preview:not([hidden])');assert.equal(await popup.count(),1,r.id+' focus option '+i);
   const expected=(await link.getAttribute('data-preview')).split('|');
   assert.deepEqual(await popup.locator('img').evaluateAll(imgs=>imgs.map(img=>new URL(img.src).pathname)),expected);
   await page.waitForFunction(()=>[...document.querySelectorAll('.library-preview:not([hidden]) img')].every(img=>img.complete&&img.naturalWidth>0));focusChecks++;
   const href=await link.getAttribute('href');const response=await page.request.get(origin+href);assert.equal(response.status(),200);assert.equal((await response.body()).subarray(0,5).toString(),'%PDF-');downloadChecks++;
   await page.keyboard.press('Escape');assert.equal(await page.locator('.library-preview:not([hidden])').count(),0);
  }
  await input.focus();await page.mouse.move(0,0);await links.nth(1).hover();await page.waitForTimeout(210);assert.equal(await page.locator('.library-preview:not([hidden])').count(),1,r.id+' pointer hover');hoverChecks++;
 }
 await input.fill('');await page.mouse.move(0,0);await input.blur();await library.scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/crossword-qa/'+slug+'-desktop.png',fullPage:false});
 reports[slug]={topics:items.length,categoryCounts,focusChecks:items.length*4,hoverChecks:items.length,downloadChecks:items.length*4};
}
const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const mobileRequests=[];mobile.on('request',r=>mobileRequests.push(r.url()));await mobile.goto(origin+'/print-play-games/');
for(const slug of selected){
 const cfg=configs[slug],items=catalog.filter(r=>r.subject===cfg.subject),library=mobile.locator('#'+cfg.anchor);
 const query=slug==='social-studies'?'World War II':items[0].title;
 await library.locator('input[type=search]').fill(query);assert.equal(await library.locator('.crossword-card:visible').count(),items.filter(r=>(r.title+' '+r.sourceTitle+' '+r.category).toLowerCase().includes(query.toLowerCase())).length);
 assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await library.scrollIntoViewIfNeeded();await mobile.screenshot({path:'/tmp/crossword-qa/'+slug+'-mobile.png'});
}
assert.equal(mobileRequests.filter(u=>/\.(pdf|webp)(?:$|\?)/.test(u)).length,0);assert.deepEqual(errors,[]);
const nojs=await browser.newPage({javaScriptEnabled:false});await nojs.goto(origin+'/print-play-games/');assert.equal(await nojs.locator('.crossword-card a[download]').count(),catalog.length*4);
await browser.close();server?.kill();
const report={status:'passed',subjects:reports,focusChecks,hoverChecks,downloadChecks,initialPreviewOrPdfRequests:0,mobilePreviewOrPdfRequests:0,mobileHorizontalOverflow:false,noJavaScriptDownloads:catalog.length*4,browserErrors:errors};
const dest=selected.length===1?`docs/crosswords/${selected[0]}/browser-validation.json`:'docs/crosswords/all-subjects-browser-validation.json';
fs.mkdirSync(dest.slice(0,dest.lastIndexOf('/')),{recursive:true});fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');console.log(report);
