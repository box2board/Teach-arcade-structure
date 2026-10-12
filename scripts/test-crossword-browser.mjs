import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
const {chromium}=createRequire(import.meta.url)('playwright');
const origin=process.env.CROSSWORD_TEST_ORIGIN||'http://127.0.0.1:8765';
const catalog=JSON.parse(fs.readFileSync('public/print-play-games/crossword-catalog.json')).resources;
let server;
if(!process.env.CROSSWORD_TEST_ORIGIN){
 server=spawn('python3',['-u','-m','http.server','8765','--bind','127.0.0.1','--directory','public']);
 server.stderr.resume();
 process.on('exit',()=>server.kill());
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('exit',code=>reject(new Error('Local server exited '+code)));});
}
const browser=await chromium.launch({headless:true,...(process.env.CROSSWORD_CHROMIUM_PATH?{executablePath:process.env.CROSSWORD_CHROMIUM_PATH}:{}),args:['--disable-gpu']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
await page.goto(origin+'/print-play-games/');await page.locator('.library-status').waitFor();
assert.equal(await page.locator('.crossword-card:visible').count(),12);
assert.equal(requests.filter(u=>/\.(pdf|webp)(?:$|\?)/.test(u)).length,0,'Preview or PDF preloaded');
const categoryCounts={};
for(const category of new Set(catalog.map(r=>r.category))){
 await page.locator('[data-category]').filter({hasText:category}).click();
 categoryCounts[category]=catalog.filter(r=>r.category===category).length;
 assert.match(await page.locator('.library-status').innerText(),new RegExp(`^${categoryCounts[category]} topics`));
}
await page.locator('[data-category=""]').click();
await page.locator('[data-next]').click();assert.equal(await page.locator('.library-pagination span').innerText(),'Page 2 of 7');
await page.locator('[data-prev]').click();assert.equal(await page.locator('.library-pagination span').innerText(),'Page 1 of 7');
const input=page.locator('#crossword-search');await input.fill('not-a-real-topic');assert.equal(await page.locator('.crossword-card:visible').count(),0);
let focusChecks=0,hoverChecks=0,downloadChecks=0;
for(const r of catalog){
 await input.fill(r.title);const card=page.locator('#crossword-'+r.id);assert.ok(await card.isVisible(),r.id);
 const links=card.locator('[data-preview]');
 for(let i=0;i<4;i++){
  const link=links.nth(i);await link.focus();const popup=page.locator('.library-preview');assert.ok(await popup.isVisible(),r.id+' focus option '+i);
  const expected=(await link.getAttribute('data-preview')).split('|');
  assert.deepEqual(await popup.locator('img').evaluateAll(imgs=>imgs.map(img=>new URL(img.src).pathname)),expected);
  await page.waitForFunction(()=>[...document.querySelectorAll('.library-preview img')].every(img=>img.complete&&img.naturalWidth>0));
  focusChecks++;
  if(focusChecks%40===0)console.log('Checked',focusChecks,'focus previews');
  const href=await link.getAttribute('href');const response=await page.request.get(origin+href);assert.equal(response.status(),200);assert.equal((await response.body()).subarray(0,5).toString(),'%PDF-');downloadChecks++;
  await page.keyboard.press('Escape');assert.ok(await popup.isHidden());
 }
 // Real pointer hover validates the delayed preview path for every resource.
 const easy=links.nth(1);await input.focus();await page.mouse.move(0,0);await easy.hover();await page.waitForTimeout(210);assert.ok(await page.locator('.library-preview').isVisible(),r.id+' pointer hover');hoverChecks++;
}
await input.fill('');await page.locator('.crossword-library').scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/crossword-qa/desktop.png',fullPage:false});
const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const mobileRequests=[];mobile.on('request',r=>mobileRequests.push(r.url()));await mobile.goto(origin+'/print-play-games/');
await mobile.locator('#crossword-search').fill('World War II');assert.equal(await mobile.locator('.crossword-card:visible').count(),2);
assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await mobile.locator('.crossword-library').scrollIntoViewIfNeeded();await mobile.screenshot({path:'/tmp/crossword-qa/mobile.png'});
assert.equal(mobileRequests.filter(u=>/\.(pdf|webp)(?:$|\?)/.test(u)).length,0);
assert.deepEqual(errors,[]);
const nojs=await browser.newPage({javaScriptEnabled:false});await nojs.goto(origin+'/print-play-games/');assert.equal(await nojs.locator('.crossword-card a[download]').count(),304);
await browser.close();server?.kill();
const report={status:'passed',categoryCounts,focusChecks,hoverChecks,downloadChecks,initialPreviewOrPdfRequests:0,mobilePreviewOrPdfRequests:0,mobileHorizontalOverflow:false,noJavaScriptDownloads:304,browserErrors:errors};
fs.writeFileSync('docs/crosswords/browser-validation.json',JSON.stringify(report,null,2)+'\n');console.log(report);
