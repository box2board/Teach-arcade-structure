import {setsForGame,loadQuestionSet} from '../catalog.js';
import {Race,ReviewSession,roadCurve,clamp} from './engine.js';
const $=id=>document.getElementById(id),ctx=$('road').getContext('2d'),input={};let race=new Race(),bank,review,batch=0,batchStart=0,batchEnd=0,stage=0,retryDeck=[],retryIndex=0,retrying=false,pitActive=false,locked=false,started=false,last=performance.now(),pausedState='race';
const carAtlas=new Image();carAtlas.src='cars-v2.png';
race.juice=0;
const canyon=new Image();canyon.src='canyon-v2.png';
const shuffle=a=>a.map(v=>({v,r:Math.random()})).sort((a,b)=>a.r-b.r).map(o=>o.v);
const heldKeys=new Set();
function resetInput(){heldKeys.clear();for(const k in input)input[k]=false}
function overlay(title,description){resetInput();$('overlay').hidden=false;$('title').textContent=title;$('description').textContent=description;for(const id of ['setup','question','resume','restart','summary','retryMissed','changeSetup'])$(id).hidden=true}
function settings(){return {questionCount:+$('questionCount').value,laps:+$('laps').value}}
function updatePlan(){const {questionCount,laps}=settings();$('racePlan').textContent=`${questionCount} unique questions · ${laps} lap${laps===1?'':'s'} · ${questionCount*laps} answers total. ${questionCount/4-1} checkpoint${questionCount===8?'':'s'} per lap, plus a recharge at each new lap. About 40 seconds of driving per full charge. Each lap repeats the same questions in a new order.`}
$('questionCount').onchange=$('laps').onchange=updatePlan;updatePlan();
let loadVersion=0;
async function load(){const version=++loadVersion;bank=null;$('start').disabled=true;try{const loaded=await loadQuestionSet($('topic').value);if(version!==loadVersion)return;bank=loaded;for(const o of $('questionCount').options)o.disabled=+o.value>bank.questions.length;if($('questionCount').selectedOptions[0].disabled)$('questionCount').value='8';$('start').disabled=bank.questions.length<8;updatePlan();$('description').textContent='Race three rivals through Canyon Circuit. Questions recharge your juice.'}catch{if(version!==loadVersion)return;$('description').textContent='Could not load this topic. Change the selection to retry.'}}
$('topic').innerHTML=setsForGame('raceway-rivals').map(t=>`<option value="${t.id}">${t.title}</option>`).join('');const preset=new URLSearchParams(location.search).get('set');if([...$('topic').options].some(o=>o.value===preset))$('topic').value=preset;$('topic').onchange=load;load();
function start(){if(!bank)return;race=new Race(settings());review=new ReviewSession(bank,settings());stage=0;retrying=false;pitActive=false;started=true;race.juice=0;resetInput();pit();const url=new URL(location.href);url.searchParams.set('set',bank.id);try{history.replaceState(null,'',url)}catch{}}
$('start').onclick=start;$('restart').onclick=start;
$('changeSetup').onclick=()=>{started=false;pitActive=false;retrying=false;review=null;race=new Race(settings());race.juice=0;$('countdown').hidden=true;overlay('Take the wheel','Choose your question count and laps.');$('setup').hidden=false;updatePlan()};
function pit(){if(!started||pitActive||review.complete)return;race.state='pit';pitActive=true;batch=0;batchStart=review.index;batchEnd=batchStart+4;race.juice=0;const lap=review.lap,group=(review.index%review.questionCount)/4;overlay(stage===0?'Charge your car':group===0?`Lap ${lap} — recharge`:`Checkpoint ${group} / ${race.segmentsPerLap-1}`,`Lap ${lap} / ${race.laps} · Four questions charge the next stretch. All racers pause here.`);$('question').hidden=false;ask()}
function beginCountdown(seconds=3){race.state='countdown';race.countdown=seconds;race.countdownKind=seconds===3?'start':'checkpoint';race.greenTime=0;resetInput();$('overlay').hidden=true;$('countdown').hidden=false;$('road').focus({preventScroll:true})}
function ask(){const q=retrying?retryDeck[retryIndex]:review.question;locked=false;$('pitCount').textContent=retrying?`Retry ${retryIndex+1} / ${retryDeck.length}`:`${bank.title} · Lap ${review.lap} / ${review.laps} · Question ${batch+1} / 4`;$('prompt').textContent=q.question;$('feedback').textContent='';$('next').hidden=true;const opts=shuffle(q.choices.map((text,index)=>({text,index})));$('choices').replaceChildren();opts.forEach((o,i)=>{const b=document.createElement('button');b.textContent=`${i+1}. ${o.text}`;b.onclick=()=>answer(o.index,b);b.dataset.answer=o.index;$('choices').append(b)})}
function answer(index,button){if(locked)return;locked=true;const q=retrying?retryDeck[retryIndex]:review.question,ok=retrying?index===q.answer:review.answer(index);if(retrying)review.retries.push({id:q.id,correct:ok});else race.juice=clamp(race.juice+(ok?25:10),0,100);button.classList.add(ok?'correct':'wrong');[...$('choices').children].forEach(b=>{b.disabled=true;if(+b.dataset.answer===q.answer)b.classList.add('correct')});$('feedback').textContent=(ok?(retrying?'Correct! ':'Correct! +25 juice. '):(retrying?'Correct answer: ':'+10 recovery juice. Correct answer: ')+q.choices[q.answer]+'. ')+q.explanation;$('next').textContent=retrying?(retryIndex+1===retryDeck.length?'See results':'Next retry'):(review.index===batchEnd?(stage===0?'To the starting grid':'Back to racing'):'Next question');$('next').hidden=false}
$('next').onclick=()=>{if(!locked)return;locked=false;batch++;if(retrying){retryIndex++;if(retryIndex===retryDeck.length){retrying=false;pitActive=false;results()}else ask();return}if(review.index===batchEnd){if(stage>0)race.stopsCompleted++;stage++;pitActive=false;resetInput();beginCountdown(stage===1?3:2);$('message').textContent='Hold SPACE · ← → steer · ↓ brake'}else ask()};
function results(){overlay('Checkered flag!',`Finished ${race.place} of 4 · ${Math.round(race.time)} driving seconds`);$('summary').hidden=false;$('summary').replaceChildren();const p=document.createElement('p');p.textContent=`${review.questionCount} unique questions × ${review.laps} lap${review.laps===1?'':'s'} · ${review.records.length} answers. First lap: ${review.firstCorrect} / ${review.questionCount}. Across all laps: ${review.correct} / ${review.deck.length} (${Math.round(review.correct/review.deck.length*100)}%).`; $('summary').append(p);for(let lap=1;lap<=review.laps;lap++){const note=document.createElement('p');note.textContent=`Lap ${lap}: ${review.records.filter(r=>r.lap===lap&&r.correct).length} / ${review.questionCount} correct`;$('summary').append(note)}if(review.retries.length){const note=document.createElement('p');note.textContent=`Retry round: ${review.retries.filter(r=>r.correct).length} / ${review.retries.length} correct. First-attempt score stays unchanged.`;$('summary').append(note)}for(const r of review.missed){const details=document.createElement('details'),s=document.createElement('summary'),body=document.createElement('p');s.textContent=r.question;body.textContent=`Your answer: ${r.choices[r.selected]}. Correct: ${r.choices[r.answer]}. ${r.explanation}`;details.append(s,body);$('summary').append(details)}$('retryMissed').hidden=review.missed.length===0||review.retries.length>0;$('restart').hidden=false;$('changeSetup').hidden=false}
$('retryMissed').onclick=()=>{retryDeck=shuffle(review.missed);retryIndex=0;retrying=true;pitActive=true;overlay('One more try','Revisit missed questions. Your first-attempt score is kept separate.');$('question').hidden=false;ask()};
function pause(){if(!started||pitActive||race.state==='finished')return;if(race.state==='paused'){resume();return}pausedState=race.state;race.state='paused';$('countdown').hidden=true;overlay('Race paused','Pick up where you left off.');$('resume').hidden=false}function resume(){race.state=pausedState;$('overlay').hidden=true;resetInput();$('road').focus({preventScroll:true})}$('pause').onclick=pause;$('resume').onclick=resume;
const keys={Space:'gas',KeyW:'gas',ArrowUp:'gas',KeyS:'brake',ArrowDown:'brake',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
function syncKeys(){for(const action of ['gas','brake','left','right'])input[action]=[...heldKeys].some(code=>keys[code]===action)}
document.addEventListener('keydown',e=>{
 if(e.target.matches?.('select,input,textarea')||e.target.isContentEditable)return;
 if(keys[e.code]&&started&&['race','countdown','recovering'].includes(race.state)){
  e.preventDefault();heldKeys.add(e.code);syncKeys();
 }
 if(e.repeat)return;
 if(e.code==='KeyP')pause();
 if(pitActive&&!locked&&'1234'.includes(e.key))$('choices').children[+e.key-1]?.click();
});
document.addEventListener('keyup',e=>{
 if(heldKeys.delete(e.code)){e.preventDefault();syncKeys()}
});
window.addEventListener('blur',()=>{resetInput();if(started&&['race','countdown','recovering'].includes(race.state))pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden){resetInput();if(started&&['race','countdown','recovering'].includes(race.state))pause()}});
document.querySelectorAll('[data-key]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);if(started&&['race','countdown','recovering'].includes(race.state))input[b.dataset.key]=true};b.onpointerup=b.onpointercancel=()=>input[b.dataset.key]=false});
function poly(points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill()}
const curve=roadCurve;
function project(z,x){const scale=1/(1+z/120),y=210+310*scale,center=480+(curve(race.distance+z)-curve(race.distance))*140*(1-scale);return {x:center+x*390*scale,y,scale,center}}
function car(x,y,s,color){if(!carAtlas.complete||!carAtlas.naturalWidth)return;const atlasIndex=color==='#55e8d2'?0:color==='#ff667b'?1:color==='#ffcf62'?2:3;const sw=carAtlas.naturalWidth/4,sh=carAtlas.naturalHeight;ctx.save();ctx.translate(x,y+55*s);if(atlasIndex===0)ctx.rotate(race.steering*.065);ctx.drawImage(carAtlas,atlasIndex*sw,sh*.26,sw,sh*.48,-70*s,-115*s,140*s,115*s);ctx.restore()}
// Scenery follows lap distance so every repeated lap has the same landmarks.
const districts=['Cactus Run','Red Rock Bend','Canyon Outpost','Summit Sprint'];
function districtAt(distance){return Math.floor((distance%race.lapLength)/race.lapLength*4)%4}
function roadside(z,side,kind,index){
 const p=project(z,side*(1.45+(index%3)*.15));
 ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.scale,p.scale);
 ctx.fillStyle='#17242c55';ctx.beginPath();ctx.ellipse(0,2,65,14,0,0,Math.PI*2);ctx.fill();
 if(kind===0){
  ctx.strokeStyle='#305e43';ctx.lineWidth=20;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-140);ctx.moveTo(0,-60);ctx.lineTo(-35,-60);ctx.lineTo(-35,-100);ctx.moveTo(0,-85);ctx.lineTo(35,-85);ctx.lineTo(35,-125);ctx.stroke();
  ctx.strokeStyle='#75a567';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-3,-10);ctx.lineTo(-3,-133);ctx.stroke();
 }else if(kind===1){
  poly([[-65,0],[-50,-85],[-25,-150],[20,-155],[52,-110],[65,0]],'#a55a3b');
  poly([[-25,-150],[20,-155],[52,-110],[65,0],[15,0]],'#d18a56');
  for(let y=-25;y>-130;y-=27){ctx.fillStyle='#673f3555';ctx.fillRect(-35,y,75,6)}
 }else if(kind===2){
  ctx.fillStyle='#c09363';ctx.fillRect(-72,-70,144,70);poly([[-87,-70],[0,-117],[87,-70]],'#614e48');
  ctx.fillStyle='#283849';ctx.fillRect(-48,-52,26,24);ctx.fillRect(24,-52,26,24);ctx.fillRect(-12,-48,24,48);
  ctx.fillStyle='#efd19d';ctx.fillRect(-78,-67,156,7);
 }else{
  ctx.fillStyle='#344956';ctx.fillRect(-6,-115,12,115);
  poly([[-62,-160],[58,-160],[58,-112],[-62,-112]],'#ffcf62');
  ctx.fillStyle='#27394a';ctx.font='bold 35px system-ui';ctx.textAlign='center';
  const turn=curve(race.distance+z+350)-curve(race.distance+z);
  ctx.fillText(turn>0?'»':'«',0,-124);
 }
 ctx.restore();
}
function drawRoadside(){
 const start=Math.max(0,Math.floor(race.distance/260));
 for(let i=start+7;i>=start;i--){const z=i*260-race.distance;if(z<0||z>1600)continue;
  const district=districtAt(i*260);
  for(const side of [-1,1]){
   const kind=i%5===0?3:district===0?0:district===1?1:district===2?(i%3===0?2:0):(i%2?1:0);
   roadside(z,side,kind,i);
  }
 }
}
function drawGantry(z,finish,lapLine,start=false){
 const p=project(z,0),s=p.scale,w=430*s,h=165*s;
 // Paint the crossing itself on the road rather than a floating label.
 for(let row=0;row<2;row++)for(let col=0;col<12;col++){
  const near=project(Math.max(0,z+row*15),0),far=project(z+(row+1)*15,0);
  const a=-1+col/6,b=a+1/6;
  poly([[near.center+a*390*near.scale,near.y],[near.center+b*390*near.scale,near.y],[far.center+b*390*far.scale,far.y],[far.center+a*390*far.scale,far.y]],finish||lapLine?((row+col)%2?'#182737':'#f4f4e7'):'#55e8d2');
 }
 ctx.fillStyle='#182e40';ctx.fillRect(p.center-w-8*s,p.y-h,16*s,h);ctx.fillRect(p.center+w-8*s,p.y-h,16*s,h);
 ctx.fillStyle=finish?'#152b3e':'#0b7569';ctx.fillRect(p.center-w,p.y-h,2*w,50*s);
 // Checkered end caps remain visible even when the lettering is distant.
 for(const side of [-1,1])for(let row=0;row<3;row++)for(let col=0;col<3;col++){
  ctx.fillStyle=(row+col)%2?'#152b3e':'#f1f6ec';ctx.fillRect(p.center+side*(w-52*s)+col*12*s,p.y-h+7*s+row*12*s,12*s,12*s);
 }
 ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font=`bold ${Math.max(9,26*s)}px system-ui`;
 ctx.fillText(finish?'FINISH':start?'START':lapLine?'LAP LINE':'CHECKPOINT',p.center,p.y-h+33*s);
 if(!finish){ctx.fillStyle='#55e8d2';for(const side of [-1,1]){ctx.beginPath();ctx.arc(p.center+side*w,p.y-h-13*s,9*s,0,Math.PI*2);ctx.fill()}}
}
function drawLandmarks(){
 const gate=race.nextGate,remaining=gate-race.distance;
 for(const offset of [1200,800,400]){
  const z=remaining-offset;if(z<0||z>1500)continue;
  const p=project(z,-1.22),s=p.scale;
  ctx.fillStyle='#213747';ctx.fillRect(p.x-4*s,p.y-90*s,8*s,90*s);
  ctx.fillStyle='#e9f0df';ctx.fillRect(p.x-40*s,p.y-110*s,80*s,55*s);
  ctx.fillStyle='#16394b';ctx.textAlign='center';ctx.font=`bold ${Math.max(8,32*s)}px system-ui`;ctx.fillText(String(offset/100),p.x,p.y-72*s);
 }
 if(remaining>=0&&remaining<1600)drawGantry(remaining,gate===race.totalDistance,gate%race.lapLength===0);
 // The launch line passes beneath the car as the green flag drops.
 const line=Math.floor(race.distance/race.lapLength)*race.lapLength+70;
 if(race.distance<line&&line-race.distance<1600)drawGantry(line-race.distance,false,true,true);
}
function drawRouteStatus(){
 if(!started)return;
 const lapDistance=race.distance%race.lapLength;
 ctx.fillStyle='#0b1b2be8';ctx.fillRect(18,16,238,52);
 ctx.fillStyle='#eff7ff';ctx.textAlign='left';ctx.font='bold 17px system-ui';ctx.fillText(districts[districtAt(race.distance)],30,38);
 ctx.fillStyle='#345063';ctx.fillRect(30,49,210,5);ctx.fillStyle='#55e8d2';ctx.fillRect(30,49,210*lapDistance/race.lapLength,5);
 for(let i=1;i<race.segmentsPerLap;i++){ctx.fillStyle='#fff1c8';ctx.fillRect(30+210*i/race.segmentsPerLap-2,47,4,9)}
}

function draw(){const sky=ctx.createLinearGradient(0,0,0,260);sky.addColorStop(0,'#2f6b95');sky.addColorStop(1,'#cde1da');ctx.fillStyle=sky;ctx.fillRect(0,0,960,540);ctx.fillStyle='#ffe4a0';ctx.beginPath();ctx.arc(740,80,33,0,Math.PI*2);ctx.fill();poly([[0,210],[0,145],[100,120],[175,175],[290,105],[420,190],[550,135],[680,180],[810,115],[960,165],[960,240]],'#866b65');ctx.fillStyle='#bc8856';ctx.fillRect(0,210,960,330);if(canyon.complete&&canyon.naturalWidth)ctx.drawImage(canyon,-12-Math.sin(race.distance/850)*12,-15,984,555);
for(let z=1600;z>=0;z-=20){const a=project(z,0),b=project(z+20,0),stripe=Math.floor((race.distance+z)/60)%2;poly([[a.center-430*a.scale,a.y],[a.center+430*a.scale,a.y],[b.center+430*b.scale,b.y],[b.center-430*b.scale,b.y]],stripe?'#f4e2c1':'#b64e46');poly([[a.center-390*a.scale,a.y],[a.center+390*a.scale,a.y],[b.center+390*b.scale,b.y],[b.center-390*b.scale,b.y]],stripe?'#344250':'#384755');if(stripe)for(const lane of [-.33,.33]){const p=project(z,lane),q=project(z+20,lane);poly([[p.x-3*p.scale,p.y],[p.x+3*p.scale,p.y],[q.x+3*q.scale,q.y],[q.x-3*q.scale,q.y]],'#dce4db')}}
drawRoadside();drawLandmarks();
const objects=[];for(let i=Math.floor(race.distance/620);i<Math.floor(race.distance/620)+4;i++){if(i<1)continue;const pos=i*620,z=pos-race.distance;if(z< -40||z>1600)continue;const lane=[-.65,0,.65][i%3],kind=i%5===0?'shield':i%3===0?'boost':'cone';objects.push({z,lane,kind,id:i})}race.rivals.forEach(r=>{const z=r.distance-race.distance;if(z> -35&&z<1600)objects.push({z,lane:r.x,kind:'car',r})});objects.sort((a,b)=>b.z-a.z).forEach(o=>{const p=project(Math.max(-25,o.z),o.lane);if(o.kind==='car'){car(p.x,p.y-55*p.scale,p.scale,o.r.color);return}if(race.pickups.has(o.id))return;const sz=40*p.scale;if(o.kind==='cone')poly([[p.x,p.y-sz],[p.x-sz*.4,p.y],[p.x+sz*.4,p.y]],'#ff943d');else{ctx.fillStyle=o.kind==='boost'?'#ffdc63':'#55d9ff';ctx.fillRect(p.x-sz/2,p.y-sz,sz,sz);ctx.fillStyle='#18334a';ctx.font=`bold ${Math.max(8,sz*.6)}px system-ui`;ctx.textAlign='center';ctx.fillText(o.kind==='boost'?'»':'◆',p.x,p.y-sz*.22)}if(started&&race.state==='race'&&race.previousDistance<o.id*620&&race.distance>=o.id*620&&Math.abs(race.x-o.lane)<.22){if(o.kind==='cone'){if(!race.hits.has(o.id)&&!race.cooldown){race.hit(o.id);$('message').textContent=race.shield>0?'Shield blocked the obstacle!':'Obstacle! Steer around the cones.'}}else{race.collect(o.id,o.kind);$('message').textContent=o.kind==='boost'?'BOOST PAD!':'Shield collected · 8 seconds'}}});if(race.boost>0){ctx.fillStyle='#ffd35a';ctx.fillRect(480+race.x*310-10,500,20,35)}if(race.speed>300&&race.state==='race'){ctx.save();ctx.strokeStyle=`rgba(255,245,215,${Math.min(.4,(race.speed-300)/800)})`;ctx.lineWidth=2;for(let i=0;i<10;i++){const side=i%2?-1:1,t=((race.distance/220+i*.17)%1),y=245+t*285,x=480+side*(290+t*230);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+side*35*t,y+32*t);ctx.stroke()}ctx.restore()}ctx.save();if(race.state==='recovering'){const fall=1-race.recoveryTime/1.4;ctx.globalAlpha=1-fall*.85;ctx.translate(race.fallSide*fall*110,fall*220);ctx.rotate(race.fallSide*fall*.04)}car(480+race.x*310,445,1.3,'#55e8d2');ctx.restore();if(race.shield>0&&race.state!=='recovering'){ctx.strokeStyle='#55d9ff';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(480+race.x*310,481,42,53,0,0,Math.PI*2);ctx.stroke()}drawRouteStatus()}
function frame(now){const dt=clamp((now-last)/1000,0,.05);last=now;if(started&&['race','countdown','recovering'].includes(race.state)){const before=race.state;race.update(dt,input);if(race.contactTime>0)$('message').textContent=race.shield>0?'Shield absorbed contact!':'Light contact — keep your racing line';if(race.state==='recovering'&&before!=='recovering'){resetInput();$('message').textContent='Off the track! Returning to the road…'}if(race.state==='race'&&before==='recovering')$('message').textContent='Back on track — hold SPACE and steer through the bends';if(race.state==='pit')pit();if(race.state==='finished')results()}
 const counting=started&&race.state==='countdown',green=started&&race.state==='race'&&race.greenTime>0;
 $('countdown').hidden=!(counting||green);$('countdown').classList.toggle('green',green);$('countNumber').textContent=counting?Math.ceil(race.countdown-1e-6):'GO!';$('flagText').textContent=counting?(race.countdownKind==='start'?'Get ready · Hold SPACE':'Back to the wheel · Hold SPACE'):race.countdownKind==='start'?'GREEN FLAG':'RACE ON';
 draw();$('juice').setAttribute('aria-valuenow',Math.round(race.juice));$('juice').setAttribute('aria-valuetext',`${Math.round(race.juice)} percent juice`);$('juiceValue').textContent=Math.ceil(race.juice)+'%';$('juiceNeedle').style.transform=`rotate(${race.juice*1.8-90}deg)`;$('juice').classList.toggle('low',race.juice<=25);$('juice').classList.toggle('empty',race.juice===0);$('recovery').hidden=!(started&&race.state==='recovering');$('speed').textContent=Math.round(race.speed*.5)+' mph';$('position').textContent=race.place+' / 4';$('lap').textContent=`Lap ${race.lap} / ${race.laps}`;$('reviewProgress').textContent=review?`${review.records.length} / ${review.deck.length} answers`:'Choose your race';
 if(started&&race.state==='race'&&race.juice===0)$('message').textContent='Empty tank — coast on your momentum to the checkpoint';
 $('checkpointDistance').textContent=started?`${Math.ceil(Math.max(0,race.nextGate-race.distance)/100)} track units to ${race.nextGate===race.totalDistance?'finish':'recharge'}`:'Four questions per charge';requestAnimationFrame(frame)}requestAnimationFrame(frame);

const gameShell=$('gameShell');
function fullscreenActive(){return !!(document.fullscreenElement||document.webkitFullscreenElement||gameShell.classList.contains('theater'))}
function syncFullscreen(){const active=fullscreenActive();$('fullscreen').textContent=active?'Exit fullscreen':'Fullscreen';$('fullscreen').setAttribute('aria-pressed',String(active));resetInput()}
let fullscreenRequest=0;
$('fullscreen').onclick=()=>{
 const request=++fullscreenRequest;
 if(started&&['race','countdown','recovering'].includes(race.state))pause();
 if(fullscreenActive()){
  gameShell.classList.remove('theater');
  if(document.fullscreenElement||document.webkitFullscreenElement){const exit=document.exitFullscreen||document.webkitExitFullscreen;try{Promise.resolve(exit.call(document)).catch(()=>{})}catch{}}
 }else{
  // Fill the viewport immediately, even if the browser delays or lacks native fullscreen.
  gameShell.classList.add('theater');
  const enter=gameShell.requestFullscreen||gameShell.webkitRequestFullscreen;
  if(enter)try{Promise.resolve(enter.call(gameShell)).then(()=>{
   if(request!==fullscreenRequest&&(document.fullscreenElement||document.webkitFullscreenElement)){
    const exit=document.exitFullscreen||document.webkitExitFullscreen;return exit.call(document);
   }
  }).catch(()=>{})}catch{}
 }
 syncFullscreen();
};
function fullscreenChanged(){if(document.fullscreenElement||document.webkitFullscreenElement)gameShell.classList.remove('theater');syncFullscreen()}
document.addEventListener('fullscreenchange',fullscreenChanged);document.addEventListener('webkitfullscreenchange',fullscreenChanged);
document.addEventListener('keydown',e=>{if(e.code==='Escape'&&gameShell.classList.contains('theater')){fullscreenRequest++;gameShell.classList.remove('theater');syncFullscreen()}});
