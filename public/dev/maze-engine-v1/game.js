(()=>{
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const ui={score:document.getElementById('score'),lives:document.getElementById('lives'),orbs:document.getElementById('orbs'),dots:document.getElementById('dots'),mode:document.getElementById('mode'),status:document.getElementById('status'),powerFill:document.getElementById('powerFill'),questionLayer:document.getElementById('questionLayer'),qText:document.getElementById('qText'),qProgress:document.getElementById('qProgress'),answers:document.getElementById('answers'),banner:document.getElementById('banner'),endLayer:document.getElementById('endLayer'),endTitle:document.getElementById('endTitle'),endText:document.getElementById('endText')};
const BASE_MAP=[
'##################',
'#o.....#....#....o#',
'#.###.#.##.#.###.#',
'#.....#....#.....#',
'#.###.######.###.#',
'#o#............#o#',
'#.#.##.####.##.#.#',
'#...##......##...#',
'###.##.####.##.###',
'#......#..#......#',
'#.####.#..#.####.#',
'#o.....#..#.....o#',
'#.###.##..##.###.#',
'#...#........#...#',
'###.#.######.#.###',
'#o..............o#',
'#......o..o......#',
'##################'];
const DIR={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}},OPP={up:'down',down:'up',left:'right',right:'left'};
const settings={easy:{speed:4.6,enemy:3.1,lives:4,power:10500},medium:{speed:5.2,enemy:3.7,lives:3,power:8500},hard:{speed:5.7,enemy:4.35,lives:2,power:6500}};
let map,rows,cols,tile,player,enemies,state,last=0,selected=0,questionOrder=[];
function reset(){const diff=document.getElementById('difficulty').value,s=settings[diff];map=BASE_MAP.map(r=>r.split(''));rows=map.length;cols=map[0].length;tile=canvas.width/cols;state={score:0,lives:s.lives,orbs:0,totalOrbs:0,dots:0,totalDots:0,powerUntil:0,paused:false,ended:false,diff,s};for(const row of map)for(const c of row){if(c==='o')state.totalOrbs++;if(c==='.')state.totalDots++;}player={x:1.5,y:1.5,dir:'right',want:'right',spawn:{x:1.5,y:1.5}};enemies=[mkEnemy(16.5,1.5,'#ff6b6b','hunter'),mkEnemy(16.5,15.5,'#b878ff','ambush'),mkEnemy(1.5,15.5,'#57e389','wander')];questionOrder=shuffle([...window.MAZE_QUESTION_SET.questions.keys()]).slice(0,state.totalOrbs);ui.endLayer.classList.remove('open');ui.questionLayer.classList.remove('open');state.paused=false;status('Collect the Quiz Orbs and clear the maze.','');updateHud();}
function mkEnemy(x,y,color,brain){return{x,y,dir:'left',spawn:{x,y},color,brain,lastChoice:0};}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function wallCell(x,y){const cx=Math.floor(x),cy=Math.floor(y);return cy<0||cy>=rows||cx<0||cx>=cols||map[cy][cx]==='#';}
function centered(e){return Math.abs(e.x-(Math.floor(e.x)+.5))<.07&&Math.abs(e.y-(Math.floor(e.y)+.5))<.07;}
function canFrom(e,dir){const d=DIR[dir],cx=Math.floor(e.x),cy=Math.floor(e.y);return map[cy+d.y]?.[cx+d.x]!=='#'&&map[cy+d.y]?.[cx+d.x]!=null;}
function snap(e){e.x=Math.floor(e.x)+.5;e.y=Math.floor(e.y)+.5;}
function moveEntity(e,dt,speed,isPlayer=false){if(centered(e)){snap(e);if(isPlayer&&canFrom(e,e.want))e.dir=e.want;if(!canFrom(e,e.dir)){if(isPlayer&&canFrom(e,e.want))e.dir=e.want;else return;}}const d=DIR[e.dir];e.x+=d.x*speed*dt;e.y+=d.y*speed*dt;}
function setWant(dir){if(state.paused||state.ended)return;player.want=dir;if(centered(player)&&canFrom(player,dir))player.dir=dir;}
function chooseEnemy(e){if(!centered(e))return;snap(e);let choices=Object.keys(DIR).filter(d=>canFrom(e,d));if(choices.length>1)choices=choices.filter(d=>d!==OPP[e.dir]);if(!choices.length)choices=[OPP[e.dir]];let target={x:player.x,y:player.y};if(e.brain==='ambush'){const pd=DIR[player.dir];target={x:player.x+pd.x*3,y:player.y+pd.y*3};}if(e.brain==='wander'&&Math.random()<.55){e.dir=choices[Math.floor(Math.random()*choices.length)];return;}if(performance.now()<state.powerUntil){choices.sort((a,b)=>distAfter(e,b,target)-distAfter(e,a,target));}else{choices.sort((a,b)=>distAfter(e,a,target)-distAfter(e,b,target));}e.dir=choices[0]||e.dir;}
function distAfter(e,dir,t){const d=DIR[dir],x=e.x+d.x,y=e.y+d.y;return Math.hypot(x-t.x,y-t.y);}
function playerCell(){return{x:Math.floor(player.x),y:Math.floor(player.y)};}
function consume(){const c=playerCell(),v=map[c.y][c.x];if(v==='.') {map[c.y][c.x]=' ';state.dots++;state.score+=10;} else if(v==='o'){map[c.y][c.x]=' ';state.orbs++;state.score+=40;openQuestion();}updateHud();}
function openQuestion(){state.paused=true;const qi=questionOrder[state.orbs-1]??((state.orbs-1)%window.MAZE_QUESTION_SET.questions.length),q=window.MAZE_QUESTION_SET.questions[qi];state.currentQ=q;selected=0;ui.qProgress.textContent=`${state.orbs} of ${state.totalOrbs}`;ui.qText.textContent=q.q;ui.answers.innerHTML='';q.a.forEach((txt,i)=>{const b=document.createElement('button');b.className='answer'+(i===0?' selected':'');b.textContent=`${i+1}. ${txt}`;b.onclick=()=>answer(i);ui.answers.appendChild(b)});ui.questionLayer.classList.add('open');}
function refreshSelected(){[...ui.answers.children].forEach((b,i)=>b.classList.toggle('selected',i===selected));ui.answers.children[selected]?.focus();}
function answer(i){if(!state.currentQ)return;const correct=i===state.currentQ.correct;if(correct){state.score+=200;state.powerUntil=performance.now()+state.s.power;status('Correct — Power Mode activated!','good');banner('POWER MODE');}else{state.score=Math.max(0,state.score-35);status(`Not quite — ${state.currentQ.explain}`,'bad');}ui.questionLayer.classList.remove('open');state.currentQ=null;state.paused=false;updateHud();checkWin();}
function collide(){for(const e of enemies){if(Math.hypot(e.x-player.x,e.y-player.y)<.48){if(performance.now()<state.powerUntil){state.score+=250;e.x=e.spawn.x;e.y=e.spawn.y;e.dir='left';banner('+250 LAB GLITCH');}else{loseLife();}break;}}}
function loseLife(){state.lives--;updateHud();if(state.lives<=0){finish(false);return;}state.paused=true;status('Lab Glitch collision — regroup!','bad');banner('LIFE LOST');setTimeout(()=>{player.x=player.spawn.x;player.y=player.spawn.y;player.dir='right';player.want='right';enemies.forEach(e=>{e.x=e.spawn.x;e.y=e.spawn.y;e.dir='left'});state.paused=false;},700);}
function checkWin(){if(state.orbs>=state.totalOrbs)finish(true);}
function finish(win){state.ended=true;state.paused=true;ui.endLayer.classList.add('open');ui.endTitle.textContent=win?'Maze Complete!':'Experiment Interrupted';ui.endText.textContent=win?`You cleared all ${state.totalOrbs} Quiz Orbs with ${state.score.toLocaleString()} points.`:`Final score: ${state.score.toLocaleString()}. Try again with a new randomized question order.`;}
function updateHud(){ui.score.textContent=state.score.toLocaleString();ui.lives.textContent='●'.repeat(Math.max(0,state.lives));ui.orbs.textContent=`${state.orbs} / ${state.totalOrbs}`;ui.dots.textContent=`${state.dots} / ${state.totalDots}`;const remain=Math.max(0,state.powerUntil-performance.now());ui.powerFill.style.width=`${Math.min(100,remain/state.s.power*100)}%`;ui.mode.textContent=remain>0?'Power':'Explore';}
function status(msg,cls){ui.status.textContent=msg;ui.status.className='status-line'+(cls?' '+cls:'');}
function banner(msg){ui.banner.textContent=msg;ui.banner.classList.add('show');clearTimeout(banner.t);banner.t=setTimeout(()=>ui.banner.classList.remove('show'),850);}
function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#02070b';ctx.fillRect(0,0,canvas.width,canvas.height);for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const c=map[y][x],px=x*tile,py=y*tile;if(c==='#'){ctx.fillStyle='#0d2739';ctx.fillRect(px,py,tile,tile);ctx.strokeStyle='#22708e';ctx.lineWidth=2;ctx.strokeRect(px+3,py+3,tile-6,tile-6);}else{ctx.fillStyle=((x+y)%2)?'#031019':'#04141f';ctx.fillRect(px,py,tile,tile);}if(c==='.')drawDot(px+tile/2,py+tile/2,2.8,'#b7f3ff');if(c==='o'){const r=7+Math.sin(performance.now()/170)*1.8;drawDot(px+tile/2,py+tile/2,r,'#ff9c4a');ctx.strokeStyle='#7ceaff';ctx.strokeRect(px+tile*.28,py+tile*.28,tile*.44,tile*.44);}}
 drawPlayer();enemies.forEach(drawEnemy);}
function drawDot(x,y,r,color){ctx.beginPath();ctx.fillStyle=color;ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
function drawPlayer(){const x=player.x*tile,y=player.y*tile,power=performance.now()<state.powerUntil;ctx.save();ctx.translate(x,y);const d=DIR[player.dir],ang=Math.atan2(d.y,d.x);ctx.rotate(ang);ctx.fillStyle=power?'#ffe36a':'#59d9ff';ctx.beginPath();ctx.arc(0,0,tile*.29,.25,Math.PI*2-.25);ctx.lineTo(0,0);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(tile*.05,-tile*.12,tile*.045,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawEnemy(e){const x=e.x*tile,y=e.y*tile,v=performance.now()<state.powerUntil;ctx.save();ctx.translate(x,y);ctx.fillStyle=v?'#eaf6ff':e.color;ctx.beginPath();ctx.roundRect(-tile*.25,-tile*.22,tile*.5,tile*.46,8);ctx.fill();ctx.fillStyle=v?'#39718a':'#081018';ctx.fillRect(-tile*.13,-tile*.07,tile*.08,tile*.08);ctx.fillRect(tile*.05,-tile*.07,tile*.08,tile*.08);ctx.restore();}
function loop(ts){const dt=Math.min(.025,(ts-last)/1000||0);last=ts;if(!state.paused&&!state.ended){moveEntity(player,dt,state.s.speed,true);consume();for(const e of enemies){chooseEnemy(e);moveEntity(e,dt,state.s.enemy,false);}collide();}updateHud();draw();requestAnimationFrame(loop);}
function key(e){if(ui.questionLayer.classList.contains('open')){if(['ArrowDown','ArrowRight'].includes(e.key)){e.preventDefault();selected=(selected+1)%ui.answers.children.length;refreshSelected();}else if(['ArrowUp','ArrowLeft'].includes(e.key)){e.preventDefault();selected=(selected-1+ui.answers.children.length)%ui.answers.children.length;refreshSelected();}else if(e.key==='Enter'){e.preventDefault();answer(selected);}else if(/^[1-4]$/.test(e.key)){answer(Number(e.key)-1);}return;}const mapKey={ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right'};if(mapKey[e.key]){e.preventDefault();setWant(mapKey[e.key]);}}
document.addEventListener('keydown',key,{passive:false});document.querySelectorAll('.dpad button').forEach(b=>{const d=b.dataset.dir;['pointerdown','touchstart'].forEach(ev=>b.addEventListener(ev,e=>{e.preventDefault();setWant(d)},{passive:false}));});document.getElementById('restartBtn').onclick=reset;document.getElementById('playAgain').onclick=reset;document.getElementById('difficulty').onchange=reset;document.getElementById('fullBtn').onclick=()=>document.getElementById('stageCard').requestFullscreen?.();
reset();requestAnimationFrame(loop);
})();