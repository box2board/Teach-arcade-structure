const blank=()=>Array.from({length:15},()=>Array(80).fill(0)),base=()=>{const t=blank();for(let r=11;r<15;r++)for(let c=0;c<80;c++)if(![24,25,52,53].includes(c))t[r][c]=1;return t},terrainW=base(),terrainE=base(),hazW=blank(),hazE=blank(),cpW=blank(),cpE=blank();
[24,52,64].forEach(c=>{hazW[10][c]=1;hazE[10][c]=1});[34,66].forEach(c=>{cpW[10][c]=1;cpE[10][c]=1});
const reviewPoint=(id,x,y,reward)=>({id:'q'+id,questionIndex:id-1,x,y,w:34,h:50,visualY:y,reward});
const egyptQuestions=[
 reviewPoint(1,224,302,'boost'),
 reviewPoint(2,336,230,'clearHazard'),
 reviewPoint(3,562,204,'checkpoint'),
 reviewPoint(4,872,218,'disableMover'),
 reviewPoint(5,1128,196,'boost'),
 reviewPoint(6,1424,224,'clearHazard'),
 reviewPoint(7,1584,302,'checkpoint'),
 reviewPoint(8,1748,204,'disableMover'),
 reviewPoint(9,2054,220,'boost'),
 reviewPoint(10,2392,155,'boost')
];
const wwiQuestions=[
 reviewPoint(1,224,302,'boost'),
 reviewPoint(2,334,224,'clearHazard'),
 reviewPoint(3,548,202,'checkpoint'),
 reviewPoint(4,876,228,'disableMover'),
 reviewPoint(5,1128,200,'boost'),
 reviewPoint(6,1420,226,'clearHazard'),
 reviewPoint(7,1584,302,'checkpoint'),
 reviewPoint(8,1750,204,'checkpoint'),
 reviewPoint(9,2048,222,'boost'),
 reviewPoint(10,2290,302,'boost')
];
window.TA_PHYSICS_PRESETS={earth:{width:26,height:38,speed:285,acceleration:1800,deceleration:2200,jumpVelocity:650,gravity:1800,maxFallSpeed:900,jumpCut:1.4,coyoteTime:.11,jumpBuffer:.12,cameraLookAhead:90,cameraSmoothing:.09},moon:{width:26,height:38,speed:245,acceleration:1050,deceleration:1250,jumpVelocity:470,gravity:620,maxFallSpeed:480,jumpCut:.65,coyoteTime:.16,jumpBuffer:.14,cameraLookAhead:105,cameraSmoothing:.075}};
const wwiPlatforms=[{id:'sandbags-1',x:292,y:274,w:112},{id:'duckboard-2',x:506,y:252,w:118},{id:'sandbags-3',x:846,y:278,w:104},{id:'timber-4',x:1080,y:250,w:128},{id:'sandbags-5',x:1380,y:276,w:112},{id:'timber-6',x:1702,y:254,w:132},{id:'sandbags-7',x:2010,y:272,w:116}];
const egyptPlatforms=[{id:'stone-1',x:300,y:280,w:116},{id:'stone-2',x:520,y:254,w:124},{id:'stone-3',x:840,y:268,w:100},{id:'stone-4',x:1085,y:246,w:132},{id:'stone-5',x:1385,y:274,w:118},{id:'stone-6',x:1700,y:250,w:138},{id:'stone-7',x:2015,y:270,w:120},{id:'finish-ledge',x:2350,y:205,w:190,h:18}];
window.TA_LEVELS={wwi:{tileSize:32,world:{width:2560,height:480},spawn:{x:64,y:290},finish:{x:2440,y:230,h:122},design:{target:'classroom',difficultyCurve:['easy','moderate','moderate','challenging']},layers:{terrain:terrainW,hazards:hazW,checkpoints:cpW},questionPoints:wwiQuestions,platforms:wwiPlatforms,movers:[{type:'rat',x:560,y:334,w:28,h:18,axis:'x',range:150,speed:82,movement:'groundPatrol',behavior:'hazard'},{type:'rat',x:1450,y:334,w:28,h:18,axis:'x',range:120,speed:105,movement:'groundPatrol',behavior:'hazard'}]},egypt:{tileSize:32,world:{width:2560,height:480},spawn:{x:64,y:290},finish:{x:2470,y:135,w:48,h:70},design:{target:'classroom',difficultyCurve:['easy','moderate','moderate','challenging']},layers:{terrain:terrainE,hazards:hazE,checkpoints:cpE},questionPoints:egyptQuestions,platforms:egyptPlatforms,movers:[{type:'scarab',x:900,y:334,w:25,h:18,axis:'x',range:130,speed:95,movement:'groundPatrol',behavior:'hazard'},{type:'bat',x:1260,y:205,w:30,h:18,axis:'x',range:105,speed:78,movement:'flyPatrol',behavior:'hazard'},{type:'fallingStone',x:1885,y:95,w:30,h:30,movement:'falling',triggerDistance:155,gravity:1200,resetDelay:1.3,behavior:'hazard'}],movingPlatforms:[{type:'stoneLift',x:2205,y:300,w:112,h:18,axis:'y',range:96,speed:42}]}};
