// Gameplay upgrades are independent of question content. A future review adapter
// can call grantTokens with the amount earned from correct answers.
export const UPGRADE_RULES = Object.freeze({
  double: {label:'Double Toss', cost:2, description:'Toss two snowballs at once. Stays for this run.'},
  sticky: {label:'Sticky Snow', cost:2, description:'Hits slow creatures by 45% for 2.4 seconds. Stays for this run.'},
  powder: {label:'Powder Burst', cost:2, description:'Every fourth toss splashes nearby creatures for one hit and pushes them back. Stays for this run.'},
  repair: {label:'Fort Repair', cost:1, description:'Restore up to 25% fort strength. Use again if needed.'}
});
export function freshUpgrades(){return {tokens:0,double:false,sticky:false,powder:false};}
export function grantTokens(state,amount){if(!Number.isSafeInteger(amount)||amount<0)throw new Error('Tokens must be a nonnegative whole number');state.tokens+=amount;}
export function canBuy(state,id,fort){const rule=UPGRADE_RULES[id];return !!rule&&state.tokens>=rule.cost&&(id==='repair'?fort<100:!state[id]);}
export function buyUpgrade(state,id,fort){if(!canBuy(state,id,fort))return {purchased:false,fort};state.tokens-=UPGRADE_RULES[id].cost;if(id==='repair')fort=Math.min(100,fort+25);else state[id]=true;return {purchased:true,fort};}
