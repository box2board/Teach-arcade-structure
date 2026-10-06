export const TABLE = {
 id:'neon',name:'Neon Circuit',theme:'neon',title:['NEON','C I R C U I T'],rampLabel:'Skyline ramp',spinnerLabel:'Turbine',rushLabel:'Circuit Rush',jackpotLabel:'Reactor',description:'Connect the ramp, loop and turbine to power the reactor.',
 width:520,height:820,
 launchGate:{x1:438,y:230,x2:482},
 rails:[[42,730,42,165],[42,165,62,90],[62,90,130,42],[130,42,390,42],[390,42,465,100],[465,100,482,175],[482,175,482,780],[438,230,438,780],[42,600,105,695],[105,695,166,723],[438,600,380,695],[380,695,344,723]],
 bumpers:[{x:188,y:265,r:30},{x:320,y:265,r:30},{x:254,y:355,r:32}],
 // Leave a full ball-width passage outside every target, including its rubber edge.
 targets:[{x:94,y:410},{x:98,y:456},{x:388,y:410},{x:384,y:456}],
 spinner:{x:254,y:420,width:48,value:150},
 // Shorter lower tips leave an open downhill feed above each flipper pivot.
 slings:[{edge:[[93,620],[137,662]],back:[88,652]},{edge:[[418,620],[374,662]],back:[423,652]}],
 // Raised crossover: a real shot enters at the mouth, climbs, then returns over the table.
 ramps:[{id:'ramp',name:'SKYLINE RAMP',value:750,mouth:{x:147,y:475,width:38},path:[[147,475],[140,410],[130,340],[114,270],[108,220],[123,180],[158,163],[207,176],[250,195],[299,228],[338,280],[365,350],[378,425],[380,500],[366,575],[350,640]]}],
 orbit:{left:{x:85,y:230},right:{x:412,y:230},top:140,window:3,value:500},
 flippers:[{x:148,y:723,length:82,side:1},{x:362,y:723,length:82,side:-1}]
};

// Each table owns its shot geometry and presentation; all share the same physics.
export const PIRATE_TABLE = {
 ...TABLE,id:'pirate',name:"Pirate’s Cove",theme:'pirate',title:['PIRATE’S','C O V E'],rampLabel:'Cannon ramp',spinnerLabel:'Ship’s wheel',rushLabel:'Treasure Rush',jackpotLabel:'Treasure chest',description:'Aim for the cannon ramp, sail the outer loop and unlock the treasure.',
 bumpers:[{x:188,y:285,r:27},{x:282,y:240,r:30},{x:318,y:340,r:28}],
 targets:[{x:100,y:365},{x:104,y:424},{x:380,y:444},{x:376,y:502}],
 spinner:{x:205,y:400,width:48,value:150},
 ramps:[{id:'ramp',name:'CANNON RAMP',value:750,mouth:{x:353,y:490,width:38},path:[[353,490],[367,430],[380,360],[385,285],[376,218],[353,177],[310,157],[258,160],[207,184],[164,228],[136,282],[123,350],[124,422],[135,493],[151,563],[166,629]]}]
};
export const TABLES=[TABLE,PIRATE_TABLE];
