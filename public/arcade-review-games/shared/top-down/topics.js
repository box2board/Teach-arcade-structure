import {content as science} from './scientific-method.js';
import {content as constitution} from './constitution.js';

// Explicit local curriculum catalog; map geometry and reward logic are independent.
export const topics=[
  {id:'scientific-method',label:'Scientific Method',description:'Experiments, variables, observations, and evidence.',questionSet:'/arcade-review-games/shared/top-down/scientific-method.js',content:science},
  {id:'constitution',label:'U.S. Constitution',description:'Branches of government, rights, and checks and balances.',questionSet:'/arcade-review-games/shared/top-down/constitution.js',content:{...constitution,title:'U.S. Constitution'}}
];
