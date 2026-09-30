(()=>{const B=TASideScroller.LevelBuilder;window.TA_TEMPLATE_LEVEL=B.build({
 id:'replace-with-topic-slug',physicsPreset:'earth',tileSize:32,world:{width:2880,height:480},spawn:{x:64,y:290},finish:{x:2780,y:272,w:48,h:80},
 terrainSegments:[{from:0,to:90,top:11}],hazardTiles:[],checkpointTiles:[{col:30,row:10},{col:60,row:10}],
 questionPoints:Array.from({length:10},(_,i)=>({id:'q'+(i+1),questionIndex:i,x:220+i*245,y:298,w:36,h:54,reward:i%4===0?'checkpoint':i%4===1?'boost':i%4===2?'clearHazard':'disableMover'})),
 platforms:[],gates:[],collectibles:[],movers:[],movingPlatforms:[]
});})();