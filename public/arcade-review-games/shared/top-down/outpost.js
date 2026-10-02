// A second adventure uses only map data and the shared engine.
export function createAdventure(){
  const tiles=Array.from({length:17},()=>Array(25).fill('#'));
  for(const [x0,y0] of [[1,1],[13,1],[1,9],[13,9]])for(let y=y0;y<y0+7;y++)for(let x=x0;x<x0+11;x++)tiles[y][x]='.';
  for(const [x,y] of [[4,8],[12,4],[16,8]])tiles[y][x]='.';
  tiles[3][12]='~';tiles[5][12]='~';
  return {
    id:'mosslight-outpost',title:'Mosslight Outpost',mode:'explore',
    modes:[{id:'explore',label:'Explore',description:'Four rooms around a courtyard, six science review questions, a mirror-powered crossing, and a block gate. Restore the beacon.'}],
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
}
