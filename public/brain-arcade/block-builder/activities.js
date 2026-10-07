const brick=(type,x,y,z,color='#60748a',rotationY=0)=>({type,position:[x,y,z],color,rotationY});
export const castle=[brick('Arch-6',0,2,0),brick('Walls-2x2',-4,1.5,0),brick('Walls-2x2',4,1.5,0),brick('Bricks-2x2',-4,3.5,0),brick('Bricks-2x2',4,3.5,0),brick('Bricks-1x1',-4.5,4.5,-.5),brick('Bricks-1x1',4.5,4.5,-.5),brick('Walls-1x4',-5.5,1.5,1.5),brick('Walls-1x4',5.5,1.5,1.5)];
const robot=[brick('Bricks-2x2',-2,.5,0,'#2878d4'),brick('Bricks-2x2',2,.5,0,'#2878d4'),brick('Walls-2x2',-2,2.5,0,'#37c4c5'),brick('Walls-2x2',2,2.5,0,'#37c4c5'),brick('Beam-6',0,4.5,0,'#f4c542'),brick('Bricks-2x4',0,5.5,0,'#f4c542',Math.PI/2),brick('Bricks-2x2',0,6.5,0,'#f5f5ef')];
const outpost=[brick('Plates-8x8',0,1/6,0,'#60748a'),brick('Walls-2x2',-2,11/6,-2,'#f5f5ef'),brick('Walls-2x2',2,11/6,-2,'#f5f5ef'),brick('Beam-6',0,23/6,-2,'#37c4c5'),brick('Column-2x5',2,17/6,2,'#2878d4')];
export const activities=[
 {id:'robot-companion',kind:'Challenges',title:'Robot Companion',description:'Build a robot with a useful job.',extra:'Try adding a charging station.',build:robot,twists:['Make an underwater helper.','Build a tiny robot for a very big job.','Invent a robot whose job goes hilariously wrong.']},
 {id:'castle-gate',kind:'Starters',title:'Castle Gate',description:'A gate and unfinished walls. What lies beyond them?',extra:'Every piece is yours to change.',build:castle,twists:['Turn it into an ice fortress.','Create an overgrown ruin.','Build a colorful royal palace.']},
 {id:'space-outpost',kind:'Missions',title:'Space Outpost',description:'Build a home and research base for explorers.',extra:'Five flexible steps. Follow your imagination.',build:outpost,steps:['Build a shelter for your crew.','Add a landing area for visitors.','Create a research station with an unusual purpose.','Connect your buildings.','Add protection from an imaginary danger.'],twists:['Your planet is frozen. How will you adapt?','Your outpost sits on a crowded asteroid.','Enormous creatures live nearby.']}];

export function setupActivities(api){
 const workspace=document.getElementById('workspace');
 const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('./activities.css',import.meta.url);document.head.append(style);
 const bar=document.createElement('div');bar.className='activity-bar';bar.innerHTML='<div><span class="activity-eyebrow">YOUR NEXT IDEA</span><strong id="activityMode">Open Play · Your ideas. Your rules.</strong></div><button id="buildIdeas">Build Ideas</button>';workspace.prepend(bar);
 const goal=document.createElement('section');goal.className='activity-goal';goal.hidden=true;goal.setAttribute('aria-label','Current activity');bar.after(goal);
 const dialog=document.createElement('dialog');dialog.className='activity-dialog';dialog.setAttribute('aria-labelledby','ideasTitle');workspace.append(dialog);
 let active=null,step=0,tab='Challenges',hidden=false,twist=-1,returnFocus=null;
 const button=(label,action)=>{const b=document.createElement('button');b.textContent=label;b.onclick=action;return b;};
 function close(){dialog.close();returnFocus?.focus();}
 function open(title){if(!dialog.open)returnFocus=document.activeElement;dialog.replaceChildren();const head=document.createElement('div');head.className='activity-dialog-head';const h=document.createElement('h2');h.id='ideasTitle';h.textContent=title;head.append(h,button('Close',close));dialog.append(head);if(!dialog.open)dialog.showModal();}
 dialog.addEventListener('keydown',e=>e.stopPropagation());dialog.addEventListener('cancel',()=>returnFocus?.focus());
 function paragraph(text,parent=dialog){const p=document.createElement('p');p.textContent=text;parent.append(p);return p;}
 function renderGoal(){
  document.getElementById('activityMode').textContent=active?active.title:'Open Play · Your ideas. Your rules.';
  goal.hidden=!active;goal.replaceChildren();if(!active)return;
  const actions=document.createElement('div');actions.className='activity-buttons';
  if(!hidden){const copy=document.createElement('div');copy.className='activity-copy';const heading=document.createElement('strong');heading.textContent=active.steps?`Step ${step+1} of ${active.steps.length} · ${active.title}`:active.title;copy.append(heading);paragraph(active.steps?.[step]||active.description,copy);paragraph(twist>=0?active.twists[twist]:active.extra,copy).className='activity-hint';goal.append(copy);
   if(active.steps){const back=button('Back',()=>{step--;renderGoal();});back.disabled=step===0;actions.append(back,button(step===active.steps.length-1?'Finish mission':'I’m ready · Next',()=>{if(step===active.steps.length-1)finish();else{step++;renderGoal();}}));}else actions.append(button('Finish',finish));
   actions.append(button('Need a twist?',()=>{twist=(twist+1)%active.twists.length;renderGoal();}));
  }
  actions.append(button(hidden?'Show goal':'Hide goal',()=>{hidden=!hidden;renderGoal();}),button('Open Play',()=>{active=null;renderGoal();api.say('Open Play. Your creation is still here.');}));goal.append(actions);
 }
 function start(activity){active=activity;step=0;hidden=false;twist=-1;close();renderGoal();api.say(`${activity.title} started. Make it your own.`);}
 function choose(activity){
  if(activity.kind!=='Starters'){start(activity);return;}
  if(api.count()){open('Make room for your castle?');paragraph('Loading this starter replaces the blocks on the board. Download your current build first if you want a copy. You can also undo the replacement.');const row=document.createElement('div');row.className='activity-buttons';row.append(button('Download current build',api.download),button('Cancel',close),button('Replace with starter',()=>{api.replace(castle);start(activity);}));dialog.append(row);}else{api.replace(castle);start(activity);}
 }
 function finish(){if(!api.count()){api.say('Place a few blocks before finishing your creation.');return;}open('You made something your own!');paragraph(`Your ${active?.title||'creation'} is ready for its close-up. Keep building any time.`);paragraph('The picture uses your current camera angle. Close this panel to adjust the view first.');const row=document.createElement('div');row.className='activity-buttons';row.append(button('Keep Building',close),button('Download Picture',api.picture),button('Try Another Idea',showIdeas));dialog.append(row);}
 function showIdeas(){
  open('What will you build today?');paragraph('Choose a spark. Make it your own. Your board stays here while you browse.');
  const tabs=document.createElement('div');tabs.className='activity-buttons';for(const kind of ['Challenges','Starters','Missions']){const b=button(kind,()=>{tab=kind;showIdeas();});b.setAttribute('aria-pressed',tab===kind);tabs.append(b);}dialog.append(tabs);
  const a=activities.find(a=>a.kind===tab),card=document.createElement('article');card.className='activity-card';const img=document.createElement('img');img.src=api.preview(a.build);img.alt=`Example ${a.title} built with the available pieces`;const body=document.createElement('div');const title=document.createElement('h3');title.textContent=a.title;body.append(title);paragraph(a.description,body);paragraph(a.extra,body);if(a.kind!=='Starters')paragraph('Example for inspiration. Starting keeps your current blocks.',body).className='activity-hint';body.append(button(a.kind==='Starters'?'Use this starter':a.steps?'Start mission':'Build this',()=>choose(a)));card.append(img,body);dialog.append(card);
  const footer=document.createElement('div');footer.className='activity-buttons';footer.append(button('Back to building',close),button('Surprise me',()=>{const a=activities[Math.floor(Math.random()*activities.length)];tab=a.kind;showIdeas();}));dialog.append(footer);
 }
 document.getElementById('buildIdeas').onclick=showIdeas;
}
