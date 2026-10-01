(()=>{const B=TASideScroller.LevelBuilder,review=(id,x,y,reward,stationType)=>({id:'q'+id,questionIndex:id-1,x,y,w:36,h:54,visualY:y,reward,stationType});
window.TA_ALGEBRA_LEVEL=B.build({
id:'algebra-city-run-v2',physicsPreset:'earth',tileSize:32,world:{width:3232,height:480},spawn:{x:64,y:290},finish:{x:3100,y:210,w:64,h:140},
design:{style:'neon-rooftop-run',target:'classroom',engine:'1.1.0'},
terrainSegments:[
{from:0,to:18,top:11},{from:19,to:31,top:10},{from:33,to:45,top:12},{from:47,to:59,top:9},
{from:61,to:73,top:11},{from:76,to:87,top:10},{from:89,to:101,top:12}
],
hazardTiles:[{col:12,row:10},{col:25,row:9},{col:40,row:11},{col:53,row:8},{col:68,row:10},{col:82,row:9},{col:95,row:11}],
checkpointTiles:[{col:34,row:11},{col:77,row:9}],
zones:[
{id:'downtown',from:0,to:650,label:'Downtown',kind:'downtown'},
{id:'equation-district',from:650,to:1300,label:'Equation District',kind:'equations'},
{id:'variable-heights',from:1300,to:1940,label:'Variable Heights',kind:'variables'},
{id:'inequality-row',from:1940,to:2580,label:'Inequality Row',kind:'inequalities'},
{id:'algebra-tower',from:2580,to:3232,label:'Algebra Tower',kind:'tower'}
],
questionPoints:[
review(1,220,292,'boost','expression'),review(2,505,250,'clearHazard','equation'),review(3,790,248,'checkpoint','variable'),
review(4,1080,300,'disableMover','distribute'),review(5,1370,210,'boost','equation'),review(6,1660,224,'clearHazard','inequality'),
review(7,1960,292,'checkpoint','coefficient'),review(8,2245,250,'disableMover','equation'),review(9,2630,242,'boost','expression'),
review(10,2940,190,'boost','final')
],
platforms:[
{id:'billboard-a',x:400,y:286,w:122},{id:'ac-unit-a',x:690,y:278,w:110},{id:'sign-ledger',x:865,y:228,w:122},
{id:'fire-escape-a',x:1040,y:334,w:118},{id:'billboard-b',x:1280,y:266,w:132},{id:'antenna-step',x:1470,y:220,w:108},
{id:'skybridge-a',x:1650,y:276,w:142},{id:'water-tower-deck',x:1840,y:318,w:132},{id:'billboard-c',x:2070,y:286,w:128},
{id:'fire-escape-b',x:2260,y:236,w:116},{id:'skybridge-b',x:2480,y:314,w:140},{id:'tower-ledge-a',x:2700,y:270,w:116},
{id:'tower-ledge-b',x:2870,y:222,w:118},{id:'finish-roof',x:3020,y:350,w:190}
],
gates:[
{id:'equation-gate',questionId:'q3',x:930,y:0,w:24,h:384},
{id:'variable-gate',questionId:'q6',x:1880,y:0,w:24,h:384},
{id:'tower-gate',questionId:'q9',x:2760,y:0,w:24,h:384}
],
collectibles:[{x:445,y:248},{x:910,y:190},{x:1510,y:182},{x:2310,y:198},{x:2915,y:184}],
movers:[
{type:'drone',x:560,y:205,w:30,h:20,axis:'x',range:105,speed:82,movement:'flyPatrol',behavior:'hazard'},
{type:'drone',x:1190,y:175,w:30,h:20,axis:'y',range:72,speed:70,movement:'flyPatrol',behavior:'hazard'},
{type:'drone',x:2000,y:310,w:30,h:20,axis:'x',range:90,speed:96,movement:'groundPatrol',behavior:'hazard'},
{type:'spark',x:2540,y:100,w:26,h:26,movement:'falling',triggerDistance:150,gravity:1220,resetDelay:1.2,behavior:'hazard'}
],
movingPlatforms:[
{id:'service-lift-a',x:1160,y:300,w:96,h:18,axis:'y',range:82,speed:40},
{id:'window-washer',x:2380,y:280,w:100,h:18,axis:'x',range:86,speed:44}
]
});})();