(()=>{const B=TASideScroller.LevelBuilder,review=(id,x,y,reward)=>({id:'q'+id,questionIndex:id-1,x,y,w:36,h:54,visualY:y,reward});
window.TA_EGYPT_LEVEL=B.build({
id:'egypt-tomb-descent-production-v1',physicsPreset:'earth',tileSize:32,world:{width:2880,height:480},spawn:{x:64,y:290},finish:{x:2760,y:220,w:48,h:100},
design:{style:'tomb-exploration',target:'classroom',engine:'1.0.0'},
terrainSegments:[{from:0,to:18,top:11},{from:20,to:31,top:10},{from:31,to:46,top:12},{from:46,to:60,top:11},{from:60,to:72,top:12},{from:75,to:90,top:10}],
hazardTiles:[{col:25,row:9},{col:39,row:11},{col:55,row:10},{col:66,row:11}],
checkpointTiles:[{col:33,row:11},{col:61,row:11}],
zones:[{id:'desert-approach',from:0,to:640,label:'Desert Approach',kind:'outside'},{id:'tomb-entry',from:640,to:1120,label:'Tomb Entrance',kind:'interior'},{id:'burial-passages',from:1120,to:2000,label:'Burial Passages',kind:'interior-dark'},{id:'deep-chamber',from:2000,to:2880,label:'Deep Chamber',kind:'interior-deep'}],
questionPoints:[review(1,224,298,'boost'),review(2,486,230,'clearHazard'),review(3,704,216,'checkpoint'),review(4,884,234,'disableMover'),review(5,1090,276,'boost'),review(6,1280,236,'clearHazard'),review(7,1540,272,'checkpoint'),review(8,1760,222,'disableMover'),review(9,2070,286,'boost'),review(10,2510,176,'boost')],
platforms:[{id:'approach-step',x:438,y:280,w:112},{id:'entrance-lintel',x:665,y:266,w:118},{id:'descent-shelf',x:835,y:288,w:118},{id:'lower-bridge',x:1040,y:330,w:126},{id:'shaft-step-a',x:1238,y:290,w:105},{id:'shaft-step-b',x:1378,y:238,w:105},{id:'gallery',x:1510,y:322,w:132},{id:'altar',x:1720,y:276,w:128},{id:'pit-stone-a',x:1980,y:340,w:105},{id:'pit-stone-b',x:2140,y:282,w:108},{id:'lift-landing',x:2460,y:226,w:120},{id:'final-ledge',x:2630,y:205,w:190,h:18}],
gates:[{id:'seal-1',questionId:'q2',x:620,y:0,w:26,h:320},{id:'seal-2',questionId:'q4',x:990,y:0,w:26,h:384},{id:'seal-3',questionId:'q6',x:1465,y:0,w:26,h:352},{id:'seal-4',questionId:'q8',x:1930,y:0,w:26,h:384},{id:'seal-5',questionId:'q10',x:2600,y:0,w:26,h:320}],
collectibles:[{x:360,y:300},{x:1160,y:292},{x:1430,y:198},{x:2220,y:240},{x:2690,y:165}],
movers:[{type:'scarab',x:760,y:302,w:25,h:18,axis:'x',range:105,speed:95,movement:'groundPatrol',behavior:'hazard'},{type:'bat',x:1320,y:190,w:30,h:18,axis:'x',range:120,speed:78,movement:'flyPatrol',behavior:'hazard'},{type:'fallingStone',x:1810,y:88,w:30,h:30,movement:'falling',triggerDistance:145,gravity:1200,resetDelay:1.3,behavior:'hazard'}],
movingPlatforms:[{type:'stoneLift',x:2340,y:318,w:108,h:18,axis:'y',range:105,speed:42}]
});})();