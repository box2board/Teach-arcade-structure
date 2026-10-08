// Equipment and earnings are independent of the curriculum adapter.
export const GEAR=Object.freeze({
 scoop:{slot:'toss',name:'Snow Scoop',description:'A fan of snowballs covers nearby lanes.'},
 spinner:{slot:'toss',name:'Snowball Spinner',description:'Fast, focused snowballs clear a single lane.'},
 popper:{slot:'toss',name:'Powder Popper',description:'Snowballs splash nearby creatures.'},
 sprayer:{slot:'toss',name:'Slush Sprayer',description:'Short-range slush slows a crowd.'},
 roller:{slot:'toss',name:'Snowball Roller',description:'Large rolling snowballs pass through a lane.'},
 buddy:{slot:'support',name:'Snow Buddy',description:'A helper covers the opposite side. Level 2 adds a second buddy; level 3 adds slowing snowballs.'},
 bank:{slot:'support',name:'Snowbank Builder',description:'Automatically rebuilds barriers in three lanes.'},
 puddle:{slot:'support',name:'Slush Puddles',description:'Three slippery patches slow approaching creatures.'},
 magnet:{slot:'support',name:'Snow Magnet',description:'A decoy gathers nearby creatures into the center.'},
 patch:{slot:'support',name:'Fort Patch Kit',description:'Automatically repairs the fort during a wave.'},
 mittens:{slot:'support',name:'Mitten Helpers',description:'Automatically replenish special charges.'},
 burst:{slot:'special',name:'Snow Burst',description:'Two hits and a push to creatures near you.'},
 fan:{slot:'special',name:'Flurry Fan',description:'Push nearby creatures far back and slow them.'},
 bigball:{slot:'special',name:'Big Snowball',description:'A huge rolling snowball sweeps your lane.'},
 whiteout:{slot:'special',name:'Whiteout',description:'Briefly slow every creature on the field.'},
 dome:{slot:'special',name:'Snow Dome',description:'Temporarily shield the fort from arrivals.'},
 rally:{slot:'special',name:'Buddy Rally',description:'Temporary helpers cover both sides.'}
});
export const REWARD_RULES=Object.freeze({startingStars:2,firstCorrect:2,recoveryCorrect:1,unlockCost:2,upgradeCosts:[0,3,5],studyRepair:20});
export function answerReward(id,correct,earned,attempts){if(!correct||earned.has(id))return 0;return attempts.some(a=>a.id===id)?REWARD_RULES.recoveryCorrect:REWARD_RULES.firstCorrect;}
export function freshGear(){return {equipped:{toss:'scoop',support:'buddy',special:'burst'},levels:{scoop:1,buddy:1,burst:1}};}
export function gearPrice(state,id){return !GEAR[id]||state.levels[id]>=3?Infinity:state.levels[id]?REWARD_RULES.upgradeCosts[state.levels[id]]:REWARD_RULES.unlockCost;}
export function purchaseGear(state,wallet,id){const cost=gearPrice(state,id);if(wallet.tokens<cost||!Number.isFinite(cost))return false;wallet.tokens-=cost;state.levels[id]=(state.levels[id]||0)+1;state.equipped[GEAR[id].slot]=id;return true;}
export function equipGear(state,id){if(!GEAR[id]||!state.levels[id])return false;state.equipped[GEAR[id].slot]=id;return true;}
// Reject malformed sets before a student can earn rewards from them.
export function validateQuestions(set){
 if(!set||!Array.isArray(set.questions)||!set.questions.length||typeof set.title!=='string')throw new Error('A question set needs a title and questions.');
 const ids=new Set();for(const q of set.questions){if(typeof q.id!=='string'||ids.has(q.id)||typeof q.prompt!=='string'||!q.prompt.trim()||!Array.isArray(q.choices)||q.choices.length<2||q.choices.length>4||q.choices.some(c=>typeof c!=='string'||!c.trim())||!Number.isInteger(q.answer)||q.answer<0||q.answer>=q.choices.length||typeof q.explanation!=='string')throw new Error('Invalid or duplicate question.');ids.add(q.id);}
 return set;
}
