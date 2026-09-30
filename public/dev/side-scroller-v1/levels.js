(()=>{const B=TASideScroller.LevelBuilder,review=(id,x,y,reward,extra={})=>({id:'q'+id,questionIndex:id-1,x,y,w:36,h:54,visualY:y,reward,...extra});
const wwi=B.build({
id:'wwi-trench-run-v2',physicsPreset:'earth',tileSize:32,world:{width:3200,height:480},spawn:{x:64,y:290},finish:{x:3070,y:268,w:58,h:116},
design:{style:'trench-to-no-mans-land',target:'classroom',version:'v2'},
terrainSegments:[
{from:0,to:17,top:11},{from:17,to:29,top:13},{from:29,to:51,top:11},
{from:51,to:64,top:13},{from:64,to:75,top:12},{from:75,to:88,top:11},{from:88,to:100,top:11}
],
hazardTiles:[{col:42,row:9},{col:46,row:9},{col:78,row:9},{col:82,row:9},{col:85,row:9}],
checkpointTiles:[{col:28,row:12},{col:67,row:11}],
zones:[
{id:'front-trench',from:0,to:960,label:'Front Trench',kind:'trench'},
{id:'no-mans-land-a',from:960,to:1664,label:"No Man's Land",kind:'battlefield'},
{id:'communication-trench',from:1664,to:2432,label:'Communication Trench',kind:'trench-deep'},
{id:'no-mans-land-b',from:2432,to:2816,label:"No Man's Land",kind:'battlefield'},
{id:'command-post',from:2816,to:3200,label:'Command Post',kind:'bunker'}
],
questionPoints:[
review(1,230,298,'boost',{stationType:'orders'}),
review(2,560,356,'clearHazard',{stationType:'radio'}),
review(3,835,258,'checkpoint',{stationType:'map'}),
review(4,1120,298,'disableMover',{stationType:'intel'}),
review(5,1450,246,'boost',{stationType:'orders'}),
review(6,1740,356,'clearHazard',{stationType:'radio'}),
review(7,2010,290,'checkpoint',{stationType:'map'}),
review(8,2260,276,'disableMover',{stationType:'intel'}),
review(9,2600,250,'boost',{stationType:'orders'}),
review(10,2960,214,'boost',{stationType:'radio'})
],
platforms:[
{id:'sandbag-lip',x:410,y:318,w:125},
{id:'duckboard-a',x:575,y:398,w:150},
{id:'dugout-roof',x:760,y:312,w:165},
{id:'fire-step-a',x:990,y:318,w:118},
{id:'crater-edge-a',x:1260,y:300,w:112},
{id:'crater-edge-b',x:1500,y:304,w:106},
{id:'duckboard-b',x:1690,y:398,w:145},
{id:'trench-step-b',x:1940,y:342,w:112},
{id:'signal-platform',x:2195,y:326,w:132},
{id:'crater-edge-c',x:2490,y:304,w:110},
{id:'sandbag-rise',x:2730,y:314,w:120},
{id:'command-roof',x:2900,y:252,w:190}
],
gates:[
{id:'dugout-door',questionId:'q3',x:940,y:0,w:24,h:384},
{id:'wire-clearance',questionId:'q7',x:2380,y:0,w:24,h:384}
],
collectibles:[{x:455,y:286},{x:900,y:274},{x:1360,y:264},{x:2140,y:300},{x:2780,y:278}],
movers:[
{type:'rat',x:600,y:390,w:28,h:18,axis:'x',range:125,speed:88,movement:'groundPatrol',behavior:'hazard'},
{type:'shell',x:1320,y:64,w:30,h:30,movement:'falling',triggerDistance:175,gravity:1450,resetDelay:1.15,behavior:'hazard'},
{type:'rat',x:1840,y:390,w:28,h:18,axis:'x',range:145,speed:105,movement:'groundPatrol',behavior:'hazard'},
{type:'shell',x:2550,y:58,w:30,h:30,movement:'falling',triggerDistance:190,gravity:1500,resetDelay:1.1,behavior:'hazard'}
]});
const egypt=B.build({id:'egypt-tomb-descent',physicsPreset:'earth',tileSize:32,world:{width:2880,height:480},spawn:{x:64,y:290},finish:{x:2760,y:220,w:48,h:100},design:{style:'tomb-exploration',target:'classroom'},terrainSegments:[{from:0,to:18,top:11},{from:20,to:31,top:10},{from:31,to:46,top:12},{from:46,to:60,top:11},{from:60,to:72,top:12},{from:75,to:90,top:10}],hazardTiles:[{col:25,row:9},{col:39,row:11},{col:55,row:10},{col:66,row:11}],checkpointTiles:[{col:33,row:11},{col:61,row:11}],zones:[{id:'desert-approach',from:0,to:640,label:'Desert Approach',kind:'outside'},{id:'tomb-entry',from:640,to:1120,label:'Tomb Entrance',kind:'interior'},{id:'burial-passages',from:1120,to:2000,label:'Burial Passages',kind:'interior-dark'},{id:'deep-chamber',from:2000,to:2880,label:'Deep Chamber',kind:'interior-deep'}],questionPoints:[review(1,224,302,'boost'),review(2,486,230,'clearHazard'),review(3,704,216,'checkpoint'),review(4,884,286,'disableMover'),review(5,1090,276,'boost'),review(6,1280,236,'clearHazard'),review(7,1540,272,'checkpoint'),review(8,1760,222,'disableMover'),review(9,2070,286,'boost'),review(10,2510,176,'boost')],platforms:[{id:'approach-step',x:438,y:280,w:112},{id:'entrance-lintel',x:665,y:266,w:118},{id:'descent-shelf',x:835,y:336,w:118},{id:'lower-bridge',x:1040,y:330,w:126},{id:'shaft-step-a',x:1238,y:290,w:105},{id:'shaft-step-b',x:1378,y:238,w:105},{id:'gallery',x:1510,y:322,w:132},{id:'altar',x:1720,y:276,w:128},{id:'pit-stone-a',x:1980,y:340,w:105},{id:'pit-stone-b',x:2140,y:282,w:108},{id:'lift-landing',x:2460,y:226,w:120},{id:'final-ledge',x:2630,y:205,w:190,h:18}],gates:[{id:'seal-1',questionId:'q2',x:620,y:0,w:26,h:320},{id:'seal-2',questionId:'q4',x:990,y:0,w:26,h:384},{id:'seal-3',questionId:'q6',x:1465,y:0,w:26,h:352},{id:'seal-4',questionId:'q8',x:1930,y:0,w:26,h:384},{id:'seal-5',questionId:'q10',x:2600,y:0,w:26,h:320}],collectibles:[{x:360,y:300},{x:1160,y:292},{x:1430,y:198},{x:2220,y:240},{x:2690,y:165}],movers:[{type:'scarab',x:760,y:302,w:25,h:18,axis:'x',range:105,speed:95,movement:'groundPatrol',behavior:'hazard'},{type:'bat',x:1320,y:190,w:30,h:18,axis:'x',range:120,speed:78,movement:'flyPatrol',behavior:'hazard'},{type:'fallingStone',x:1810,y:88,w:30,h:30,movement:'falling',triggerDistance:145,gravity:1200,resetDelay:1.3,behavior:'hazard'}],movingPlatforms:[{type:'stoneLift',x:2340,y:318,w:108,h:18,axis:'y',range:105,speed:42}]});
const moon=B.build({id:'moon-mission',physicsPreset:'moon',tileSize:32,world:{width:3200,height:480},spawn:{x:64,y:290},finish:{x:3060,y:118,w:54,h:92},design:{style:'low-gravity-lunar-expedition',target:'classroom'},terrainSegments:[{from:0,to:14,top:11},{from:18,to:27,top:11},{from:32,to:43,top:12},{from:49,to:59,top:11},{from:66,to:77,top:12},{from:84,to:100,top:11}],hazardTiles:[{col:20,row:10},{col:40,row:11},{col:56,row:10},{col:73,row:11},{col:89,row:10}],checkpointTiles:[{col:35,row:11},{col:70,row:11}],zones:[{id:'landing-zone',from:0,to:720,label:'Landing Zone',kind:'lunar'},{id:'crater-field',from:720,to:1540,label:'Crater Field',kind:'lunar'},{id:'research-outpost',from:1540,to:2380,label:'Research Outpost',kind:'base'},{id:'comms-ascent',from:2380,to:3200,label:'Communications Ascent',kind:'base'}],questionPoints:[review(1,210,302,'boost'),review(2,390,176,'clearHazard'),review(3,690,214,'checkpoint'),review(4,1015,142,'disableMover'),review(5,1320,266,'boost'),review(6,1640,184,'clearHazard'),review(7,1940,128,'checkpoint'),review(8,2250,224,'disableMover'),review(9,2580,146,'boost'),review(10,2960,104,'boost')],platforms:[{id:'lander-ramp',x:350,y:230,w:130},{id:'crater-rock',x:650,y:268,w:120},{id:'relay-a',x:970,y:196,w:126},{id:'crater-rim',x:1260,y:320,w:126},{id:'outpost-deck',x:1590,y:238,w:150},{id:'solar-array',x:1890,y:182,w:150},{id:'cargo-deck',x:2200,y:278,w:140},{id:'antenna-step',x:2530,y:200,w:128},{id:'tower-deck',x:2890,y:158,w:190}],gates:[{id:'airlock-1',questionId:'q3',x:860,y:0,w:24,h:352},{id:'power-field',questionId:'q6',x:1780,y:0,w:24,h:352},{id:'comms-lock',questionId:'q9',x:2700,y:0,w:24,h:352}],collectibles:[{x:430,y:174},{x:820,y:265},{x:1510,y:218},{x:2110,y:225},{x:2840,y:245}],movers:[{type:'drone',x:1120,y:188,w:34,h:22,axis:'x',range:150,speed:62,movement:'flyPatrol',behavior:'hazard'},{type:'meteor',x:2050,y:70,w:30,h:30,movement:'falling',triggerDistance:190,gravity:720,resetDelay:1.5,behavior:'hazard'},{type:'drone',x:2670,y:170,w:34,h:22,axis:'y',range:75,speed:48,movement:'flyPatrol',behavior:'hazard'}],movingPlatforms:[{type:'cargoLift',x:520,y:310,w:110,h:18,axis:'y',range:105,speed:34},{type:'lunarFerry',x:1430,y:270,w:120,h:18,axis:'x',range:145,speed:46},{type:'towerLift',x:2780,y:300,w:108,h:18,axis:'y',range:135,speed:38}]});
window.TA_LEVELS={wwi,egypt,moon}})();