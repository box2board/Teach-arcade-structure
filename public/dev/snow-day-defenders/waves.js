// Wave design is separate from the renderer and from future academic question sets.
export const DIFFICULTIES=Object.freeze({
 easy:{label:'Easy',hint:'Gentle pacing, small groups, and forgiving fort damage.',counts:[16,23,30],cadence:.95,speed:1,hp:[2,1,5],damage:[8,5,16]},
 medium:{label:'Medium',hint:'Bigger groups, quicker creatures, and sturdier snow giants.',counts:[22,30,40],cadence:.78,speed:1.18,hp:[3,1,6],damage:[9,6,18]},
 hard:{label:'Hard',hint:'Dense crowds and tough runners. Plan your upgrades carefully.',counts:[28,40,52],cadence:.62,speed:1.35,hp:[3,2,7],damage:[10,7,20]}
});
export const WAVE_PATTERNS=[
 {name:'Snowbank Shuffle',hint:'Small groups alternate left and right. Slide to meet them.'},
 {name:'Split Rush',hint:'Both sides approach together while snow giants fill the middle.'},
 {name:'Snowstorm',hint:'Wide crowds mix fast runners with sturdy snow giants.'}
];
export function buildWave(difficulty,index,random=Math.random){
 const settings=DIFFICULTIES[difficulty];if(!settings||!Number.isInteger(index)||index<0||index>2)throw new Error('Unknown wave configuration');
 const events=[],count=settings.counts[index];let time=1,group=0;
 while(events.length<count){
  const members=Math.min(index===0?3:index===1?4:5,count-events.length);
  for(let j=0;j<members;j++){
   const sequence=events.length;
   let x,type,at;
   if(index===0){x=(group%2===0?-3.3:3.3)+(j-1)*.7;type=sequence%6===5?1:0;at=time+j*.22;}
   else if(index===1){x=[-3.6,3.6,-2.8,2.8][j];type=j===3&&group%2===1?2:j<2?1:0;if(type===2)x=0;at=time+Math.floor(j/2)*.28;}
   else{x=[-4.3,-2.1,0,2.1,4.3][j];type=j===2?2:(j+group)%2===0?1:0;at=time+j*.15;}
   events.push({at,type,x:Math.max(-5.1,Math.min(5.1,x+(random()-.5)*.35)),z:-30-random()*2});
  }
  time+=members*settings.cadence;group++;
 }
 return {...WAVE_PATTERNS[index],events};
}
