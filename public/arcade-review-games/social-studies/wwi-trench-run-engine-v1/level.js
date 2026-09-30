(()=>{const B=TASideScroller.LevelBuilder,review=(id,x,y,reward,extra={})=>({id:'q'+id,questionIndex:id-1,x,y,w:36,h:54,visualY:y,reward,...extra});
window.TA_WWI_LEVEL=B.build({
id:'wwi-trench-run-production-v1',physicsPreset:'earth',tileSize:32,world:{width:3200,height:480},spawn:{x:64,y:290},finish:{x:3070,y:268,w:58,h:116},
design:{style:'trench-to-no-mans-land',target:'classroom',engine:'1.0.3'},
terrainSegments:[
{from:0,to:17,top:11},{from:17,to:29,top:13},{from:29,to:51,top:11},
{from:51,to:64,top:13},{from:64,to:75,top:12},{from:75,to:88,top:11},{from:88,to:100,top:11}
],
hazardTiles:[{col:42,row:10},{col:46,row:10},{col:78,row:10},{col:82,row:10},{col:85,row:10}],
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
{id:'sandbag-lip',x:410,y:318,w:125},{id:'duckboard-a',x:575,y:398,w:150},{id:'dugout-roof',x:760,y:312,w:165},
{id:'fire-step-a',x:990,y:318,w:118},{id:'crater-edge-a',x:1260,y:300,w:112},{id:'crater-edge-b',x:1500,y:304,w:106},
{id:'duckboard-b',x:1690,y:398,w:145},{id:'trench-step-b',x:1940,y:342,w:112},{id:'signal-platform',x:2195,y:326,w:132},
{id:'crater-edge-c',x:2490,y:304,w:110},{id:'sandbag-rise',x:2730,y:314,w:120},{id:'command-roof',x:2900,y:252,w:190}
],
gates:[{id:'dugout-door',questionId:'q3',x:940,y:0,w:24,h:384},{id:'wire-clearance',questionId:'q7',x:2380,y:0,w:24,h:384}],
collectibles:[{x:455,y:286},{x:900,y:274},{x:1360,y:264},{x:2140,y:300},{x:2780,y:278}],
movers:[
{type:'rat',x:610,y:380,w:28,h:18,axis:'x',range:90,speed:88,movement:'groundPatrol',behavior:'hazard'},
{type:'shell',x:1320,y:64,w:30,h:30,movement:'falling',triggerDistance:175,gravity:1450,resetDelay:1.15,behavior:'hazard'},
{type:'rat',x:1755,y:380,w:28,h:18,axis:'x',range:60,speed:105,movement:'groundPatrol',behavior:'hazard'},
{type:'shell',x:2550,y:58,w:30,h:30,movement:'falling',triggerDistance:190,gravity:1500,resetDelay:1.1,behavior:'hazard'}
]});})();