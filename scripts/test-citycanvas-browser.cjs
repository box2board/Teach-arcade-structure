// Requires Playwright and Chromium. Optionally set CITYCANVAS_PLAYWRIGHT and
// CITYCANVAS_BROWSER_PATH to their installed paths. Serves the unchanged app
// locally, with a test-only state probe added to the in-memory JS response.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.CITYCANVAS_PLAYWRIGHT||'playwright');
const base=path.resolve(__dirname,'../public/brain-arcade/citycanvas');
const server=http.createServer((req,res)=>{
 const file=path.basename(new URL(req.url,'http://localhost').pathname)||'index.html';
 if(!['index.html','game.js','simulation.js','activity.js','style.css'].includes(file)){res.writeHead(404);res.end();return;}
 let content=fs.readFileSync(path.join(base,file),'utf8');
 if(file==='game.js')content=content.replace(/\}\)\(\);\s*$/,'window.qa={get city(){return city},point:(x,y)=>{const r=canvas.getBoundingClientRect(),o=origin();return {x:r.left+o.x+(x+.5)*size,y:r.top+o.y+(y+.5)*size}},stats};})();');
 res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(content);
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({executablePath:process.env.CITYCANVAS_BROWSER_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.click('#pause');
 await page.waitForTimeout(100);const initial=await page.locator('#map').boundingBox();assert(initial.height>=720*.6,'Default map should use at least 60% of laptop height');
 await page.click('#expandMap');await page.waitForTimeout(100);const expanded=await page.locator('#map').boundingBox();assert(expanded.width>initial.width&&expanded.height>initial.height,'Expanded map grows in both dimensions');assert.equal(await page.locator('aside').isVisible(),false);await page.click('#expandMap');
 await page.click('[data-tool="inspect"]');assert(await page.locator('#cityDetails').getAttribute('open')!==null,'Inspect opens details');await page.locator('#cityDetails summary').click();
 const at=async(x,y)=>page.evaluate(([x,y])=>qa.point(x,y),[x,y]);
 const build=async(type,x,y)=>{await page.click(`[data-tool="${type}"]`);const p=await at(x,y);await page.mouse.click(p.x,p.y);};
 await build('road',12,16);assert.equal(await page.evaluate(()=>qa.city.at(12,16).type),'road');await page.click('#undo');assert.equal(await page.evaluate(()=>qa.city.at(12,16).type),'land');
 await build('road',12,16);await build('home',12,15);await page.click('#save');
 const cursorState=await page.evaluate(()=>JSON.stringify(qa.city.save()));await page.click('#cursor');let cp=await at(12,15);await page.mouse.click(cp.x,cp.y);assert.match(await page.locator('#inspect').innerText(),/Homes/);assert(await page.locator('#cityDetails').getAttribute('open')!==null);
 await page.locator('#cityDetails summary').click();cp=await at(12,16);const beforeCursor=await at(12,16);await page.mouse.move(cp.x,cp.y);await page.mouse.down();await page.mouse.move(cp.x-65,cp.y,{steps:5});await page.mouse.up();assert.notEqual((await at(12,16)).x,beforeCursor.x,'Cursor drag pans');assert.equal(await page.locator('#cityDetails').getAttribute('open'),null,'Drag does not open inspection');assert.equal(await page.evaluate(()=>JSON.stringify(qa.city.save())),cursorState,'Cursor click/drag never changes city');await page.click('[data-tool="home"]');assert.equal(await page.locator('#cursor').getAttribute('aria-pressed'),'false','Building tools leave Cursor mode');
 const saved=await page.evaluate(()=>JSON.stringify(qa.city.save()));
 await build('erase',12,15);await page.click('#load');await page.click('#loadConfirm');assert.equal(await page.evaluate(()=>JSON.stringify(qa.city.save())),saved,'Manual save/load restores map');
 await page.reload();await page.click('#pause');assert.equal(await page.evaluate(()=>JSON.stringify(qa.city.save())),saved,'Autosave restores after reload');
 await page.click('[data-tool="school"]');await page.click('#rotate');const p=await at(15,14);await page.mouse.click(p.x,p.y);assert.equal(await page.evaluate(()=>qa.city.at(15,14).w),2);assert.equal(await page.evaluate(()=>qa.city.at(15,14).h),3);await page.click('#undo');
 const fixture=await page.evaluate(()=>{const c=new CityCanvasSim.City();for(let x=2;x<=32;x++)c.build(x,16,'road');for(const [x,y,t]of [[2,14,'power'],[6,14,'water'],[23,14,'water'],[10,18,'park']])c.build(x,y,t);for(const [a,b,t]of [[9,12,'home'],[15,17,'shop'],[26,28,'industry']])for(let x=a;x<=b;x++){c.build(x,15,t);c.at(x,15).level=2;}c.mode='manager';c.update();return c.save();});
 await page.setInputFiles('#importFile',{name:'city.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});await page.click('#loadConfirm');
 assert(await page.locator('#neighborhoodCard').isVisible());await page.click('#pause');await page.click('#neighborhoodOpen');assert.match(await page.locator('#neighborhoodList').innerText(),/4\/4/);assert.match(await page.locator('#neighborhoodList').innerText(),/3\/3/);
 const month=await page.evaluate(()=>qa.city.month);await page.waitForTimeout(3800);assert.equal(await page.evaluate(()=>qa.city.month),month,'Goals dialog pauses simulation');await page.click('#goalsClose');
 await page.waitForFunction(()=>qa.city.earnedGoals.length===3);await page.click('#pause');
 const rewarded=await page.evaluate(()=>({funds:qa.city.funds,balance:qa.city.balance,earned:qa.city.earnedGoals}));assert.equal(rewarded.funds-fixture.funds-rewarded.balance,2700);
 const downloadPromise=page.waitForEvent('download');await page.click('#export');const download=await downloadPromise;const exported=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(exported.version,5);assert.equal(exported.earnedGoals.length,3);
 await page.reload();await page.click('#pause');assert.equal(await page.evaluate(()=>qa.city.earnedGoals.length),3);const funds=await page.evaluate(()=>qa.city.funds);await page.click('#pause');await page.waitForFunction(m=>qa.city.month>m,exported.month);await page.click('#pause');assert.equal(await page.evaluate(()=>qa.city.funds)-funds,await page.evaluate(()=>qa.city.balance),'No duplicate reward after reload');
 await page.click('#focus');await build('square',14,18);assert.equal(await page.evaluate(()=>qa.city.at(14,18).type),'square');await build('sports',19,18);assert.equal(await page.evaluate(()=>qa.city.at(19,18).w),4);
 await page.selectOption('#mode','free');await build('promenade',32,20);assert.equal(await page.evaluate(()=>qa.city.at(32,20).type),'promenade');await page.click('#focus');
 if(process.env.CITYCANVAS_SCREENSHOT)await page.screenshot({path:process.env.CITYCANVAS_SCREENSHOT});
 await page.selectOption('#layer','power');await page.selectOption('#layer','none');
 for(const viewport of [{width:1280,height:720},{width:1024,height:768},{width:390,height:844}]){await page.setViewportSize(viewport);await page.waitForTimeout(100);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal page overflow');assert((await page.locator('#map').boundingBox()).height>=150);}
 const touch=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,isMobile:true}),tp=await touch.newPage();tp.on('pageerror',e=>errors.push(e.message));await tp.goto(url);await tp.tap('#pause');await tp.tap('[data-tool="road"]');const point=await tp.evaluate(()=>qa.point(12,16));await tp.touchscreen.tap(point.x,point.y);assert.equal(await tp.evaluate(()=>qa.city.at(12,16).type),'road','Touch tap builds');await tp.tap('#undo');assert.equal(await tp.evaluate(()=>qa.city.at(12,16).type),'land');
 await tp.tap('#pan');const before=await tp.evaluate(()=>qa.point(12,16));const session=await touch.newCDPSession(tp);await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:point.x,y:point.y}]});await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x-70,y:point.y}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});const after=await tp.evaluate(()=>qa.point(12,16));assert.notEqual(before.x,after.x,'Touch pan moves camera');assert.equal(await tp.evaluate(()=>qa.city.at(12,16).type),'land','Pan does not build');
 const ctp=await touch.newPage();ctp.on('pageerror',e=>errors.push(e.message));await ctp.goto(url);await ctp.tap('#pause');const cursorSession=await touch.newCDPSession(ctp);
 await ctp.tap('#cursor');await ctp.waitForFunction(()=>document.querySelector('#cursor').getAttribute('aria-pressed')==='true');await ctp.evaluate(()=>{window.events=[];for(const name of ['pointerdown','pointermove','pointerup','pointercancel','losctpointercapture'])document.querySelector('#map').addEventListener(name,e=>events.push([name,e.clientX,e.clientY,e.button]));});const ct=await ctp.evaluate(()=>qa.point(12,16));await ctp.touchscreen.tap(ct.x,ct.y);assert(await ctp.locator('#cityDetails').getAttribute('open')!==null,'Cursor touch tap inspects');await ctp.locator('#cityDetails summary').tap();const cb=await ctp.evaluate(()=>qa.point(12,16));await cursorSession.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cb.x,y:cb.y}]});await cursorSession.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cb.x-50,y:cb.y}]});await cursorSession.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.notEqual((await ctp.evaluate(()=>qa.point(12,16))).x,cb.x,'Cursor touch drag pans');assert.equal(await ctp.locator('#cityDetails').getAttribute('open'),null);assert.equal(await ctp.evaluate(()=>qa.city.at(12,16).type),'land');
 assert.deepEqual(errors,[]);console.log('PASS: desktop building, undo, rotation, save/load/reload, goal dialog pause, month-end rewards, reward persistence, export/import, map overlays, responsive sizes, touch build/undo/pan, no browser errors');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
