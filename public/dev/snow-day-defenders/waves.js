// Wave design is separate from the renderer and from future academic question sets.
export const DIFFICULTIES=Object.freeze({
 easy:{label:'Easy',hint:'Gentle pacing, small groups, and forgiving fort damage.',counts:[16,23,30],cadence:.95,speed:1,hp:[2,1,5,2,3],damage:[8,5,16,6,10]},
 medium:{label:'Medium',hint:'Bigger groups, quicker creatures, and sturdier snow giants.',counts:[22,30,40],cadence:.78,speed:1.18,hp:[3,1,6,2,4],damage:[9,6,18,7,12]},
 hard:{label:'Hard',hint:'Dense crowds and tough runners. Plan your upgrades carefully.',counts:[28,40,52],cadence:.62,speed:1.35,hp:[3,2,7,3,5],damage:[10,7,20,8,14]}
});
export const WAVE_PATTERNS=[
 {name:'Snowbank Shuffle',hint:'Meet snow pals and hoppers, then watch for weaving wigglers.'},
 {name:'Split Rush',hint:'Two-sided crowds bring bucket giants and accelerating rollers.'},
 {name:'Snowstorm',hint:'All five creatures join the snowstorm. Use the gaps to reposition.'}
];
export function buildWave(difficulty,index,random=Math.random){
 const settings=DIFFICULTIES[difficulty];if(!settings||!Number.isInteger(index)||index<0||index>2)throw new Error('Unknown wave configuration');
 const events=[],warnings=[],seen=new Set(),count=settings.counts[index];let time=1,group=0;
 while(events.length<count){
  const members=Math.min(index===0?3:index===1?4:5,count-events.length);
  const groupTypes=new Set();
  for(let j=0;j<members;j++){
   const sequence=events.length;
   let x,type,at;
   if(index===0){x=(group%2===0?-3.3:3.3)+(j-1)*.7;type=group>=2&&j===1?3:sequence%6===5?1:0;at=time+j*.22;}
   else if(index===1){x=[-3.6,3.6,-2.8,2.8][j];type=j===3&&group%2===1?2:j<2?1:0;if(group>=2&&j===2)type=4;if(type===2)x=0;at=time+Math.floor(j/2)*.28;}
   else{x=[-4.3,-2.1,0,2.1,4.3][j];type=[1,3,2,4,0][(j+group)%5];at=time+j*.15;}
   groupTypes.add(type);events.push({at,type,x:Math.max(-5.1,Math.min(5.1,x+(random()-.5)*.35)),z:-30-random()*2});
  }
  const newTypes=[...groupTypes].filter(type=>!seen.has(type));groupTypes.forEach(type=>seen.add(type));
  if(newTypes.some(type=>type>0)){
   const introductions=['','New: Snow Hoppers · quick runners','New: Bucket Giants · sturdy and slow','New: Snow Wigglers · weave between lanes','New: Snow Rollers · build speed'];
   const type=Math.max(...newTypes);
   warnings.push({at:Math.max(.25,time-.65),type,message:introductions[type]});
  }
  // A short breathing gap after every second group rewards repositioning.
  time+=members*settings.cadence+(group%2===1?settings.cadence*2.5:0);group++;
 }
 return {...WAVE_PATTERNS[index],events,warnings};
}
