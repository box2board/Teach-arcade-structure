export const TABLE = {
 width:520,height:820,
 launchGate:{x1:438,y:230,x2:482},
 rails:[[42,730,42,165],[42,165,62,90],[62,90,130,42],[130,42,390,42],[390,42,465,100],[465,100,482,175],[482,175,482,780],[438,230,438,780],[42,600,105,695],[105,695,166,723],[438,600,380,695],[380,695,344,723]],
 bumpers:[{x:188,y:265,r:30},{x:320,y:265,r:30},{x:254,y:355,r:32}],
 targets:[{x:94,y:410},{x:98,y:456},{x:411,y:410},{x:407,y:456}],
 spinner:{x:254,y:420,width:48,value:150},
 // Shorter lower tips leave an open downhill feed above each flipper pivot.
 slings:[{edge:[[93,620],[137,662]],back:[88,652]},{edge:[[418,620],[374,662]],back:[423,652]}],
 // Raised crossover: a real shot enters at the mouth, climbs, then returns over the table.
 ramps:[{id:'ramp',name:'SKYLINE RAMP',value:750,mouth:{x:147,y:475,width:38},path:[[147,475],[140,410],[130,340],[114,270],[108,220],[123,180],[158,163],[207,176],[250,195],[299,228],[338,280],[365,350],[378,425],[380,500],[366,575],[350,640]]}],
 orbit:{left:{x:85,y:230},right:{x:412,y:230},top:140,window:3,value:500},
 flippers:[{x:148,y:723,length:82,side:1},{x:362,y:723,length:82,side:-1}]
};
