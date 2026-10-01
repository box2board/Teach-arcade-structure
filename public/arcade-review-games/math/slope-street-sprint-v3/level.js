(()=>{const B=TASideScroller.LevelBuilder,review=(id,x,y,reward,stationType)=>({id:'q'+id,questionIndex:id-1,x,y,w:36,h:54,visualY:y,reward,stationType});
window.TA_SLOPE_LEVEL=B.build({
id:'slope-street-sprint-v3',physicsPreset:'earth',tileSize:32,world:{width:6400,height:480},spawn:{x:64,y:290},finish:{x:6310,y:246,w:62,h:106},
design:{kind:'production',identity:'A continuous street run where changing road grade and momentum are the course itself, not scenery.',targetMinutes:[5,8],routeStyle:'continuous-forward-road',pacing:'flowing-with-grade-set-pieces',verticality:'terrain-driven',primaryMechanics:['slopes','terrainGaps','hazardEnemies'],signatureMechanic:'slopes',signatureSetPiece:'a long final climb followed by a sustained downhill run to Function Finish'},
terrainSegments:[
{from:0,to:12,top:11},{from:30,to:40,top:8},{from:56,to:66,top:11},{from:84,to:94,top:7},
{from:116,to:124,top:11},{from:137,to:146,top:9},{from:158,to:164,top:11},{from:178,to:186,top:7},{from:196,to:200,top:11}
],
slopes:[
{id:'grade-1-up',x1:384,y1:352,x2:960,y2:256},
{id:'grade-1-down',x1:1280,y1:256,x2:1792,y2:352},
{id:'hill-district-climb',x1:2112,y1:352,x2:2688,y2:224},
{id:'hill-district-descent',x1:3008,y1:224,x2:3552,y2:352},
{id:'switchback-rise',x1:3968,y1:352,x2:4384,y2:288},
{id:'switchback-fall',x1:4672,y1:288,x2:5056,y2:352},
{id:'final-climb',x1:5248,y1:352,x2:5696,y2:224},
{id:'final-descent',x1:5952,y1:224,x2:6272,y2:352}
],
zones:[
{id:'warmup-grade',from:0,to:960,label:'Warm-Up Grade',role:'tutorial-flow',mechanics:['slopes'],setPiece:'first sustained climb'},
{id:'rise-and-fall',from:960,to:2112,label:'Rise & Fall Avenue',role:'momentum-reversal',mechanics:['slopes','hazardEnemies'],setPiece:'crest into long descent'},
{id:'hill-district',from:2112,to:3200,label:'Hill District',role:'sustained-climb',mechanics:['slopes','stompableEnemies'],setPiece:'highest road elevation'},
{id:'construction-cut',from:3200,to:3968,label:'Construction Cut',role:'precision-break',mechanics:['terrainGaps','hazardEnemies'],setPiece:'road-out pit crossing'},
{id:'switchback-park',from:3968,to:5056,label:'Switchback Park',role:'rhythm-change',mechanics:['slopes','stompableEnemies'],setPiece:'short rise and fall sequence'},
{id:'final-grade',from:5056,to:6400,label:'Final Grade',role:'finale',mechanics:['slopes','hazardEnemies'],setPiece:'steep climb into sustained downhill finish'}
],
questionPoints:[
review(1,210,294,'boost','rise-run'),review(2,1080,198,'clearHazard','positive'),
review(3,1880,294,'checkpoint','negative'),review(4,2470,218,'disableMover','equation'),
review(5,2900,166,'boost','intercept'),review(6,3660,294,'checkpoint','undefined'),
review(7,4210,244,'clearHazard','rate'),review(8,4820,292,'disableMover','horizontal'),
review(9,5520,226,'boost','formula'),review(10,6080,230,'boost','final')
],
platforms:[
{id:'construction-bridge',x:3600,y:310,w:82,h:18},
{id:'finish-overlook',x:5730,y:176,w:112,h:18}
],
gates:[
{id:'grade-gate',questionId:'q3',x:2010,y:0,w:22,h:352},
{id:'construction-gate',questionId:'q6',x:3880,y:0,w:22,h:352},
{id:'final-gate',questionId:'q9',x:5840,y:0,w:22,h:224}
],
checkpointTiles:[{col:59,row:10},{col:139,row:8}],
collectibles:[
{x:520,y:276},{x:1500,y:278},{x:2390,y:240},{x:3370,y:296},{x:4160,y:246},{x:5480,y:232},{x:6110,y:246}
],
movers:[
{id:'tire-a',type:'rollingTire',x:1120,y:234,w:26,h:20,axis:'x',range:100,speed:88,movement:'groundPatrol',interaction:'hazard'},
{id:'roadbot-a',type:'roadBot',x:2760,y:202,w:30,h:22,axis:'x',range:82,speed:68,movement:'groundPatrol',interaction:'stompable',score:200},
{id:'tire-b',type:'rollingTire',x:3770,y:330,w:26,h:20,axis:'x',range:78,speed:92,movement:'groundPatrol',interaction:'hazard'},
{id:'roadbot-b',type:'roadBot',x:4460,y:266,w:30,h:22,axis:'x',range:74,speed:72,movement:'groundPatrol',interaction:'stompable',score:200},
{id:'tire-final',type:'rollingTire',x:6160,y:310,w:26,h:20,axis:'x',range:72,speed:102,movement:'groundPatrol',interaction:'hazard'}
]
});})();