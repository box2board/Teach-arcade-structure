(()=>{const B=TASideScroller.LevelBuilder,review=(id,x,y,reward)=>({id:'q'+id,questionIndex:id-1,x,y,w:36,h:54,visualY:y,reward});
window.TA_MOON_LEVEL=B.build({
id:'moon-mission-production-v1',physicsPreset:'moon',tileSize:32,world:{width:3200,height:480},spawn:{x:64,y:290},finish:{x:3060,y:118,w:54,h:92},
design:{style:'low-gravity-lunar-expedition',target:'classroom',engine:'1.0.0'},
terrainSegments:[{from:0,to:14,top:11},{from:18,to:27,top:11},{from:32,to:43,top:12},{from:49,to:59,top:11},{from:66,to:77,top:12},{from:84,to:100,top:11}],
hazardTiles:[{col:20,row:10},{col:40,row:11},{col:56,row:10},{col:73,row:11},{col:89,row:10}],
checkpointTiles:[{col:35,row:11},{col:70,row:11}],
zones:[{id:'landing-zone',from:0,to:720,label:'Landing Zone',kind:'lunar'},{id:'crater-field',from:720,to:1540,label:'Crater Field',kind:'lunar'},{id:'research-outpost',from:1540,to:2380,label:'Research Outpost',kind:'base'},{id:'comms-ascent',from:2380,to:3200,label:'Communications Ascent',kind:'base'}],
questionPoints:[review(1,210,298,'boost'),review(2,390,176,'clearHazard'),review(3,690,214,'checkpoint'),review(4,1015,142,'disableMover'),review(5,1320,266,'boost'),review(6,1640,184,'clearHazard'),review(7,1940,128,'checkpoint'),review(8,2250,224,'disableMover'),review(9,2580,146,'boost'),review(10,2960,104,'boost')],
platforms:[{id:'lander-ramp',x:350,y:230,w:130},{id:'crater-rock',x:650,y:268,w:120},{id:'relay-a',x:970,y:196,w:126},{id:'crater-rim',x:1260,y:320,w:126},{id:'outpost-deck',x:1590,y:238,w:150},{id:'solar-array',x:1890,y:182,w:150},{id:'cargo-deck',x:2200,y:278,w:140},{id:'antenna-step',x:2530,y:200,w:128},{id:'tower-deck',x:2890,y:158,w:190}],
gates:[{id:'airlock-1',questionId:'q3',x:860,y:0,w:24,h:352},{id:'power-field',questionId:'q6',x:1780,y:0,w:24,h:352},{id:'comms-lock',questionId:'q9',x:2700,y:0,w:24,h:352}],
collectibles:[{x:430,y:174},{x:820,y:265},{x:1510,y:218},{x:2110,y:225},{x:2840,y:245}],
movers:[{type:'drone',x:1120,y:188,w:34,h:22,axis:'x',range:150,speed:62,movement:'flyPatrol',behavior:'hazard'},{type:'meteor',x:2050,y:70,w:30,h:30,movement:'falling',triggerDistance:190,gravity:720,resetDelay:1.5,behavior:'hazard'},{type:'drone',x:2670,y:170,w:34,h:22,axis:'y',range:75,speed:48,movement:'flyPatrol',behavior:'hazard'}],
movingPlatforms:[{type:'cargoLift',x:520,y:310,w:110,h:18,axis:'y',range:105,speed:34},{type:'lunarFerry',x:1430,y:270,w:120,h:18,axis:'x',range:145,speed:46},{type:'towerLift',x:2780,y:300,w:108,h:18,axis:'y',range:135,speed:38}]
});})();