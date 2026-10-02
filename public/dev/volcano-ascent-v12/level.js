(()=>{const B=TASideScroller.LevelBuilder;window.TA_VOLCANO_LEVEL=B.build({
id:'volcano-ascent-graybox',physicsPreset:'earth',tileSize:32,world:{width:5200,height:480},spawn:{x:64,y:346},finish:{x:5070,y:82,w:54,h:94},
design:{kind:'production',identity:'A rising expedition where the player repeatedly earns height through climbing, bounce launches, moving lifts, and breakable shortcuts rather than simply running right.',targetMinutes:[5,8],routeStyle:'ascending-switchback-expedition',pacing:'climb-recover-launch-climb-finale',verticality:'high',primaryMechanics:['climbables','bounceSurfaces','movingPlatforms','breakables'],signatureMechanic:'climbables',signatureSetPiece:'a final multi-stage crater ascent combining spring launch, lift transfer, and ladder climb'},
zones:[
{id:'base',label:'Base Camp',from:0,to:850,role:'orientation',mechanics:['climbables']},
{id:'shaft',label:'Survey Shaft',from:850,to:1750,role:'vertical-climb',mechanics:['climbables','movingPlatforms']},
{id:'vents',label:'Vent Field',from:1750,to:2700,role:'launch-chain',mechanics:['bounceSurfaces','movingPlatforms']},
{id:'fault',label:'Fault Gallery',from:2700,to:3600,role:'route-choice',mechanics:['breakables','climbables']},
{id:'chimney',label:'Magma Chimney',from:3600,to:4450,role:'precision-ascent',mechanics:['movingPlatforms','climbables']},
{id:'crater',label:'Crater Rim',from:4450,to:5200,role:'finale',mechanics:['bounceSurfaces','movingPlatforms','climbables']}
],
terrainSegments:[{from:0,to:22,top:12},{from:26,to:38,top:11},{from:43,to:55,top:10},{from:60,to:72,top:12},{from:78,to:89,top:10},{from:94,to:105,top:12},{from:111,to:122,top:10},{from:128,to:138,top:12},{from:145,to:163,top:11}],
platforms:[
{id:'base-upper',x:470,y:264,w:210,h:18},{id:'shaft-mid',x:960,y:250,w:190,h:18},{id:'shaft-high',x:1260,y:154,w:230,h:18},{id:'shaft-exit',x:1510,y:218,w:210,h:18},
{id:'vent-perch',x:1940,y:192,w:170,h:18},{id:'vent-high',x:2300,y:118,w:210,h:18},{id:'vent-exit',x:2500,y:222,w:190,h:18},
{id:'fault-upper',x:2930,y:210,w:230,h:18},{id:'fault-secret',x:3180,y:128,w:230,h:18},{id:'fault-exit',x:3380,y:232,w:180,h:18},
{id:'chimney-a',x:3770,y:242,w:170,h:18},{id:'chimney-b',x:4040,y:146,w:210,h:18},{id:'chimney-exit',x:4260,y:218,w:180,h:18},
{id:'crater-a',x:4620,y:250,w:160,h:18},{id:'crater-step',x:4760,y:190,w:150,h:18},{id:'crater-b',x:4820,y:112,w:160,h:18},{id:'summit',x:5000,y:176,w:180,h:18}
],
climbables:[
{id:'base-ladder',x:535,y:264,w:34,h:120},{id:'shaft-ladder',x:1035,y:154,w:34,h:192},{id:'shaft-exit-ladder',x:1575,y:218,w:34,h:134},
{id:'fault-ladder',x:2995,y:210,w:34,h:142},{id:'secret-ladder',x:3245,y:128,w:34,h:96},{id:'chimney-ladder',x:3835,y:242,w:34,h:110},{id:'chimney-high-ladder',x:4100,y:146,w:34,h:96},{id:'summit-ladder',x:4875,y:112,w:34,h:240}
],
bounceSurfaces:[
{id:'vent-spring-a',x:1810,y:370,w:56,h:14,bounce:860},{id:'vent-spring-b',x:2170,y:338,w:56,h:14,bounce:900},{id:'crater-spring',x:4500,y:338,w:58,h:14,bounce:900}
],
movingPlatforms:[
{id:'shaft-lift',x:1180,y:300,w:92,h:16,axis:'y',range:105,speed:60},{id:'vent-lift',x:2380,y:260,w:96,h:16,axis:'y',range:105,speed:65},{id:'chimney-lift',x:3960,y:280,w:92,h:16,axis:'y',range:115,speed:68},{id:'crater-lift',x:4665,y:320,w:96,h:16,axis:'y',range:86,speed:66}
],
breakables:[
{id:'fault-block-a',x:3100,y:274,w:36,h:32,breakMode:'headbutt',breakSpeed:260},{id:'fault-block-b',x:3140,y:274,w:36,h:32,breakMode:'headbutt',breakSpeed:260}
],
movers:[
{id:'rock-a',type:'rock',x:760,y:330,w:28,h:22,axis:'x',range:70,speed:55,movement:'groundPatrol',interaction:'hazard'},
{id:'crawler-a',type:'crawler',x:1530,y:196,w:28,h:22,axis:'x',range:65,speed:58,movement:'groundPatrol',interaction:'stompable'},
{id:'rock-b',type:'rock',x:3470,y:306,w:28,h:22,axis:'x',range:60,speed:60,movement:'groundPatrol',interaction:'hazard'},
{id:'crawler-b',type:'crawler',x:4280,y:196,w:28,h:22,axis:'x',range:60,speed:62,movement:'groundPatrol',interaction:'stompable'}
],
questionPoints:[
{id:'q1',x:620,y:0,visualY:210,questionIndex:0,reward:'checkpoint'},{id:'q2',x:1110,y:0,visualY:198,questionIndex:1,reward:'boost'},
{id:'q3',x:1620,y:0,visualY:166,questionIndex:2,reward:'checkpoint'},{id:'q4',x:2050,y:0,visualY:140,questionIndex:3,reward:'boost'},
{id:'q5',x:2580,y:0,visualY:170,questionIndex:4,reward:'checkpoint'},{id:'q6',x:3040,y:0,visualY:158,questionIndex:5,reward:'boost'},
{id:'q7',x:3500,y:0,visualY:178,questionIndex:6,reward:'checkpoint'},{id:'q8',x:3910,y:0,visualY:190,questionIndex:7,reward:'boost'},
{id:'q9',x:4380,y:0,visualY:164,questionIndex:8,reward:'checkpoint'},{id:'q10',x:4890,y:0,visualY:60,questionIndex:9,reward:'boost'}
],
checkpointTiles:[{col:27,row:10},{col:80,row:9},{col:130,row:9}],
collectibles:[{x:560,y:220},{x:1320,y:110},{x:1990,y:148},{x:2350,y:78},{x:3000,y:168},{x:3240,y:88},{x:4090,y:106},{x:4860,y:72}]
});})();