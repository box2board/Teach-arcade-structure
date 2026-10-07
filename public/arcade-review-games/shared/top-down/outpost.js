// A second adventure uses only map data and the shared engine.
export const layouts=[{id:'classic',label:'Eastbound Light'},{id:'westward',label:'Westward Relay'},{id:'southbound',label:'Southbound Signal'}];
export function chooseAdventure(mode,random=Math.random){return createAdventure(mode,layouts[Math.min(2,Math.floor(random()*layouts.length))].id);}
export function createAdventure(mode='explore',layout='classic'){
  if(!['explore','medium','hard'].includes(mode))throw Error('Unknown Outpost mode: '+mode);
  if(!layouts.some(l=>l.id===layout))throw Error('Unknown Outpost layout: '+layout);
  const tiles=Array.from({length:17},()=>Array(25).fill('#'));
  for(const [x0,y0] of [[1,1],[13,1],[1,9],[13,9]])for(let y=y0;y<y0+7;y++)for(let x=x0;x<x0+11;x++)tiles[y][x]='.';
  for(const [x,y] of [[4,8],[12,4],[16,8]])tiles[y][x]='.';
  tiles[3][12]='~';tiles[5][12]='~';
  const map={
    id:'mosslight-outpost',title:'Mosslight Outpost',mode,
    modes:[{id:'explore',label:'Easy',description:'Six review questions, a mirror crossing, and a single-crate gate.'},{id:'medium',label:'Medium',description:'Eight review questions, a two-crate gate, and a review-earned crank to raise the beacon drawbridge.'},{id:'hard',label:'Hard',description:'Twelve review questions, a mirror that needs several pushes, a three-crate gate, and a crank drawbridge.'}],
    start:{x:3,y:13},startMessage:'Read the Dock sign, then earn the Moss key from the survey chest.',
    tiles:tiles.map(row=>row.join('')),
    blocks:[{id:'prism-cart',kind:'mirror',x:4,y:3,orientation:'/'},{id:'relay-crate',x:15,y:6}],
    plates:[{id:'relay-plate',x:19,y:6}],
    doors:[
      {id:'dock-gate',x:4,y:8,key:'moss',label:'north gate',lockedText:'Moss key required. Earn it from the Dock survey chest.'},
      {id:'beacon-gate',x:16,y:8,plate:'relay-plate',label:'beacon gate',openText:'Beacon gate opened! The relay crate is holding its floor switch.'}
    ],
    inventory:[
      {id:'moss-key',type:'key',value:'moss',label:'Moss key'},
      {id:'focusing-lens',type:'item',value:'lens',label:'Focusing lens'},
      {id:'beacon-cell',type:'item',value:'cell',label:'Beacon cell'},
      {id:'field-token',type:'item',value:'field-token',label:'Field token',appearance:'treasure',optional:true}
    ],
    objects:[
      {id:'dock-sign',type:'sign',x:2,y:13,text:'Earn a Moss key from the survey chest, then take the north passage. Restore the beacon with a focusing lens and a power cell from the other stations.'},
      {id:'survey-chest',type:'challenge',x:9,y:11,label:'Survey chest',questionCount:2,reward:{type:'key',value:'moss',label:'Moss key',message:'Moss key earned! Walk into the north gate of the Dock.'}},
      {id:'optics-sign',type:'sign',x:1,y:5,text:'Push the silver mirror one tile east onto the marked socket. While still facing it, interact to rotate it and aim the light south. Use the CROSS switch on the east side to raise the east crossing. Earn the focusing lens before leaving.'},
      {id:'lens-chest',type:'challenge',x:10,y:6,label:'Lens chest',questionCount:2,reward:{type:'item',value:'lens',label:'Focusing lens',message:'Focusing lens earned! Take it to the beacon after opening the crossing.'}},
      {id:'optics-source',type:'emitter',x:2,y:3,direction:'right'},
      {id:'optics-receiver',type:'receiver',x:5,y:6},
      {id:'cross-switch',type:'bridgeSwitch',x:10,y:5,label:'CROSS',receiver:'optics-receiver',bridge:'east-crossing',raiseText:'Bridge raised! The east crossing leads to the Relay station.'},
      {id:'east-crossing',type:'bridge',x:12,y:4},
      {id:'relay-sign',type:'sign',x:14,y:4,text:'The relay crate must stay on the amber floor switch to hold the south gate open. Earn the beacon cell from this station’s chest, then carry both supplies south.'},
      {id:'cell-chest',type:'challenge',x:21,y:2,label:'Beacon cell chest',questionCount:2,reward:{type:'item',value:'cell',label:'Beacon cell',message:'Beacon cell earned! Open the south block gate and restore the beacon.'}},
      {id:'beacon',type:'exit',x:20,y:12,requiredItems:['lens','cell']},
      {id:'field-token',type:'item',appearance:'treasure',x:22,y:14,item:'field-token',label:'Field token',optional:true,bonusPoints:50,text:'Field token collected! +50 optional treasure points.'},
      {id:'dock-column',type:'obstacle',appearance:'column',x:6,y:14},
      {id:'relay-column',type:'obstacle',appearance:'column',x:22,y:3},
      {id:'dock-column-west',type:'obstacle',appearance:'column',x:6,y:10},
      {id:'optics-column',type:'obstacle',appearance:'column',x:8,y:2},
      {id:'beacon-column-north',type:'obstacle',appearance:'column',x:18,y:10},
      {id:'beacon-column-south',type:'obstacle',appearance:'column',x:18,y:14}
    ],
    puzzles:[],clues:[],progressLabel:'Stations',
    milestones:[{when:{opened:['dock-gate']}},{when:{opened:['east-crossing']}},{when:{doorOpen:'beacon-gate'}},{when:{exitReady:'beacon'}}],
    completion:{label:'BEACON RESTORED',title:'Adventure complete',summary:'You restored Mosslight’s beacon by surveying the site, directing light across the courtyard, and powering the relay gate.'},
    decorations:[{x:1,y:10},{x:11,y:15},{x:1,y:1},{x:11,y:7},{x:13,y:1},{x:23,y:7},{x:13,y:10},{x:23,y:15},{x:5,y:3,appearance:'mirror-target'}],
    rooms:[
      {name:'01 · Dock',theme:'garden',min:1,max:11,minY:9,maxY:15,viewMin:0,viewMax:12,viewMinY:8,viewMaxY:16,objective:'Earn the Moss key from the survey chest, then follow the north passage.',objectiveRules:[{when:{opened:['dock-gate']},text:'The north gate is open. Visit Optics, then follow the crossing east.'},{when:{keys:['moss']},text:'Walk into the north gate with your Moss key.'}]},
      {name:'02 · Optics',theme:'garden',min:1,max:12,minY:1,maxY:8,viewMin:0,viewMax:12,viewMinY:0,viewMaxY:8,objective:'Earn the lens, then align the mirror and use CROSS to open the east route.',objectiveRules:[{when:{opened:['east-crossing'],items:['lens']},text:'Carry the lens east across the raised crossing to the Relay station.'},{when:{opened:['east-crossing']},text:'The crossing is safe. Earn the lens from this room’s chest before leaving.'}]},
      {name:'03 · Relay',theme:'signals',min:13,max:23,minY:1,maxY:8,viewMin:12,viewMax:24,viewMinY:0,viewMaxY:8,objective:'Earn the beacon cell and push the crate onto the floor switch.',objectiveRules:[{when:{doorOpen:'beacon-gate',items:['cell']},text:'Carry your supplies through the south gate to the beacon.'}]},
      {name:'04 · Beacon',theme:'garden',min:13,max:23,minY:9,maxY:15,viewMin:12,viewMax:24,viewMinY:8,viewMaxY:16,objective:'The beacon needs the lens from Optics and the cell from Relay.',objectiveRules:[{when:{exitReady:'beacon'},text:'Stand on the beacon and interact to restore it.'}]}
    ]
  };
  if(mode==='explore')return applyLayout(map,layout);
  map.inventory.push({id:'bridge-crank',type:'tool',value:'crank',label:'Bridge crank',appearance:'crank'});
  map.objects.push(
    {id:'crank-chest',type:'challenge',x:16,y:2,label:'Mechanic chest',questionCount:2,reward:{type:'tool',value:'crank',label:'Bridge crank',message:'Bridge crank earned! Use it at the LIFT socket in the Beacon station.'}},
    {id:'beacon-lift',type:'bridgeSwitch',appearance:'crank-switch',x:19,y:10,label:'LIFT',requiresTool:'crank',bridge:'beacon-drawbridge',lockedText:'Bridge crank required. Earn it from the Mechanic chest in Relay.',raiseText:'Drawbridge lowered into place! Your crank stays in your bag. Cross south to restore the beacon.',openText:'The drawbridge is in place and safe to cross.'},
    {id:'beacon-drawbridge',type:'bridge',appearance:'drawbridge',x:20,y:11,lockedText:'The drawbridge is folded away. Earn the bridge crank in Relay, then use the LIFT socket.'},
    {id:'beacon-sign',type:'sign',x:14,y:9,text:'The canal divides this station. Earn a bridge crank from the Mechanic chest in Relay, then face LIFT and interact to unfold the drawbridge. Carry the lens and cell across to the beacon.'}
  );
  const canal=Array.from(map.tiles[11]);for(let x=13;x<=23;x++)canal[x]=x===20?'.':'~';map.tiles[11]=canal.join('');
  map.blocks.push({id:'relay-crate-east',x:17,y:4});map.plates.push({id:'relay-plate-east',x:21,y:4});
  const gate=map.doors.find(d=>d.id==='beacon-gate');delete gate.plate;gate.plates=['relay-plate','relay-plate-east'];
  gate.lockedText='Keep a crate on every amber floor switch to open the south gate.';
  gate.openText='All counterweights are in place. The south gate is open!';
  if(mode==='hard'){
    map.blocks.push({id:'relay-crate-north',x:15,y:3});map.plates.push({id:'relay-plate-north',x:19,y:3});gate.plates.push('relay-plate-north');
    const mirror=map.blocks.find(b=>b.kind==='mirror');mirror.y=5;
    map.objects.find(o=>o.id==='optics-sign').text='Move the silver mirror onto the marked socket at the end of the eastbound light. It starts two rows south and one column west of the socket. Push it north twice, then east once; interact to rotate it south. Use CROSS when the receiver glows.';
    for(const chest of map.objects.filter(o=>o.type==='challenge'))chest.questionCount=3;
  }
  const crates=mode==='hard'?'three':'two';
  map.objects.find(o=>o.id==='relay-sign').text=`Park ${crates} crates on the ${crates} amber floor switches. Every switch must stay occupied to open the south gate. Earn the beacon cell and bridge crank here before leaving.`;
  const exit=map.objects.find(o=>o.id==='beacon');exit.requires=['beacon-lift'];exit.lockedText='Raise the beacon drawbridge using the LIFT socket first.';
  map.milestones.splice(3,0,{when:{opened:['beacon-drawbridge']}});
  map.rooms[2].objective=`Earn the cell and crank; park all ${crates} crates on the floor switches.`;
  map.rooms[2].objectiveRules=[{when:{doorOpen:'beacon-gate',items:['cell'],tools:['crank']},text:'Carry your supplies and crank through the south gate.'},{when:{doorOpen:'beacon-gate'},text:'The gate is open. Earn the beacon cell and crank before leaving.'}];
  map.rooms[3].objective='Earn the bridge crank in Relay, then use LIFT to cross the canal.';
  map.rooms[3].objectiveRules=[{when:{exitReady:'beacon'},text:'Cross the drawbridge, stand on the beacon, and interact to restore it.'},{when:{tools:['crank'],not:{opened:['beacon-drawbridge']}},text:'Face the LIFT socket and interact to unfold the drawbridge.'},{when:{opened:['beacon-drawbridge']},text:'The bridge is safe. Bring the lens and cell to the beacon.'}];
  map.completion.summary=`You restored the beacon by directing light, balancing ${crates} counterweights, and using a review-earned crank to cross the canal.`;
  return applyLayout(map,layout);
}
function applyLayout(map,layout){
  map.layout=layout;map.layoutLabel=layouts.find(l=>l.id===layout).label;
  if(layout==='classic')return withHints(map);
  const object=id=>map.objects.find(o=>o.id===id),mirror=map.blocks.find(b=>b.kind==='mirror');
  const west=layout==='westward',hard=map.mode==='hard';
  Object.assign(mirror,west?{x:8,y:hard?5:3}:{x:5,y:hard?3:4});
  Object.assign(object('optics-source'),{y:west?3:5});
  Object.assign(object('optics-receiver'),west?{x:7,y:6}:{x:5,y:7});
  Object.assign(map.decorations.find(d=>d.appearance==='mirror-target'),west?{x:7,y:3}:{x:5,y:5});
  object('optics-sign').text=west?
    `Move the mirror onto the marked socket: ${hard?'push north twice, then west once':'push west once'}. Rotate it to send the light south, then use CROSS and earn the lens.`:
    `Push the mirror south ${hard?'twice':'once'} onto the marked socket. Rotate it to send the light south, then use CROSS and earn the lens.`;
  const crates=map.blocks.filter(b=>b.kind!=='mirror');
  crates.forEach((b,i)=>{
    Object.assign(b,west?{x:21,y:[6,4,3][i]}:{x:[15,19,17][i],y:3});
    Object.assign(map.plates[i],west?{x:17,y:[6,4,3][i]}:{x:[15,19,17][i],y:6});
  });
  if(west)Object.assign(object('relay-column'),{x:23,y:5});
  object('relay-sign').text=`Push ${crates.length===1?'the crate':'each crate'} ${west?'west':'south'} onto an amber floor switch. Every switch must stay occupied. Earn the beacon cell${map.mode==='explore'?'':' and bridge crank'} before leaving.`;
  if(map.mode!=='explore'){
    Object.assign(object('crank-chest'),west?{x:21,y:5}:{x:14,y:2});
    const crossing=west?18:22;
    Object.assign(object('beacon-drawbridge'),{x:crossing});
    Object.assign(object('beacon-lift'),{x:crossing-1});
    const canal=Array.from(map.tiles[11]);for(let x=13;x<=23;x++)canal[x]=x===crossing?'.':'~';map.tiles[11]=canal.join('');
    if(west)Object.assign(object('beacon-column-north'),{x:14,y:10});
  }
  return withHints(map);
}
function withHints(map){
  const rules=[],rooms=map.rooms;
  const add=(id,room,when,title,steps,extra={})=>rules.push({id,room:rooms[room].name,when,title,steps,...extra});
  const chest=(id,room,when,objectId)=>{
    const object=map.objects.find(o=>o.id===objectId);
    add(id,room,when,object.label,[`A review chest in this station holds your next reward.`,`Look for the ${object.label}. Its reward is ${object.reward.label}.`,`Stand next to the ${object.label}, face it and press E or Space. Select answers with arrows and Enter. Finish every question in that chest to collect ${object.reward.label}.`]);
  };
  chest('dock-key',0,{not:{any:[{keys:['moss']},{usedKeys:['moss']}]}},'survey-chest');
  add('dock-gate',0,{not:{opened:['dock-gate']}},'Open the north passage',['Your key belongs to a nearby locked passage.','Find the north gate at the top of Dock.','Walk into the north gate while carrying the Moss key. It opens automatically and records the key as Used.']);
  add('dock-route',0,{},'Visit the other stations',['The next supplies are beyond Dock.','Go north to Optics, then cross east to Relay.','Earn the focusing lens in Optics and the beacon cell in Relay. Follow each room’s signs to open the route.']);
  const mirror=map.blocks.find(b=>b.kind==='mirror'),socket=map.decorations.find(d=>d.appearance==='mirror-target');
  const moves=[];
  if(mirror.y!==socket.y)moves.push(`push ${mirror.y>socket.y?'north':'south'} ${Math.abs(mirror.y-socket.y)} tile(s)`);
  if(mirror.x!==socket.x)moves.push(`push ${mirror.x>socket.x?'west':'east'} ${Math.abs(mirror.x-socket.x)} tile(s)`);
  add('optics-cross',1,{not:{opened:['east-crossing']}},'Raise the crossing',['The receiver is powered. Find its crossing control.','Look for the CROSS switch on the east side of Optics.','Stand next to CROSS, face it and press E or Space. The raised crossing stays open even if you later move the mirror.'],{receiver:'optics-receiver',powered:true});
  add('optics-mirror',1,{not:{opened:['east-crossing']}},'Direct the light',['Trace the light beam and look for the marked mirror socket.','Push the silver mirror onto the socket, then interact with it to rotate the light south toward the receiver.',`From this layout’s starting arrangement: ${moves.join(', then ')}. Face the mirror and rotate it once; use CROSS when the receiver glows. If you have moved it elsewhere, Undo or Reset puzzle can recover the starting arrangement without removing earned rewards.`],{receiver:'optics-receiver',powered:false});
  chest('optics-lens',1,{not:{items:['lens']}},'lens-chest');
  add('optics-route',1,{},'Continue to Relay',['Your next stop is east.','Take the raised crossing to Relay.','Leave Optics through the east crossing. Earn the beacon cell there; Medium and Hard also need the Mechanic chest’s crank.']);
  chest('relay-cell',2,{not:{items:['cell']}},'cell-chest');
  if(map.mode!=='explore')chest('relay-crank',2,{not:{tools:['crank']}},'crank-chest');
  const crates=map.blocks.filter(b=>b.kind!=='mirror');
  const route=crates.map((b,i)=>{const p=map.plates[i];return `The crate starting at column ${b.x}, row ${b.y}: push ${p.x!==b.x?(p.x>b.x?'east':'west'):(p.y>b.y?'south':'north')} ${Math.abs(p.x-b.x)+Math.abs(p.y-b.y)} tile(s).`;}).join(' ');
  add('relay-weights',2,{not:{doorOpen:'beacon-gate'}},'Balance the counterweights',['The south gate is linked to the amber floor switches.','A crate must remain on every amber switch at the same time. Approach the crate from the side opposite its switch.',`From the starting arrangement: ${route} If a crate is trapped, use Undo or Reset puzzle. Earned cell and crank rewards remain in your bag.`]);
  add('relay-route',2,{},'Go to the beacon',['The south route is ready.','Leave the crates on their switches and take the south gate.','Walk through the south gate into Beacon. Bring the lens and cell; Medium and Hard also need your crank.']);
  chest('beacon-lens',3,{not:{items:['lens']}},'lens-chest');
  rules.at(-1).steps=['The beacon is missing its focusing lens.','Return to Optics to find the lens chest.','Finish the lens chest’s questions in Optics, collect the focusing lens, then return to Beacon.'];
  chest('beacon-cell',3,{not:{items:['cell']}},'cell-chest');
  rules.at(-1).steps=['The beacon is missing its power cell.','Return to Relay to find the beacon cell chest.','Finish that chest’s questions, collect the beacon cell, then return through the south gate.'];
  if(map.mode!=='explore'){
    chest('beacon-crank',3,{not:{tools:['crank']}},'crank-chest');
    rules.at(-1).steps=['The canal needs a tool-earned crossing.','The Mechanic chest in Relay awards the bridge crank.','Return to Relay, finish the Mechanic chest’s questions and collect the crank. Bring it to LIFT in Beacon.'];
    add('beacon-lift',3,{not:{opened:['beacon-drawbridge']}},'Unfold the drawbridge',['Look for a socket beside the canal.','The LIFT socket uses your bridge crank.','Stand beside LIFT on the north side of the canal, face it and press E or Space. The drawbridge unfolds, and the crank stays in your bag.']);
  }
  add('beacon-finish',3,{},'Restore the beacon',['Your supplies are ready for the beacon.','Find the beacon on the south side of this station.','Stand on the beacon itself and press E or Space to finish the adventure.']);
  map.hintRules=rules;
  return map;
}
