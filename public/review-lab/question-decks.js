import {remapAnswer,answerIndices,answerText} from './answers.js';
import {validateQuestionBank} from './question-banks.js';
export function prepareQuestionDeck(bank,random=Math.random){
 validateQuestionBank(bank);
 const shuffle=items=>{const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;};
 return shuffle(bank.questions).map(q=>{const order=shuffle([0,1,2,3]);return {...q,choices:order.map(i=>q.choices[i]),answer:remapAnswer(q,order)};});
}
export function categoryClashBoard(bank,random=Math.random){
 const deck=prepareQuestionDeck(bank,random),categories=[];
 for(let i=0;i<deck.length;i+=5)categories.push({name:`Review ${categories.length+1}`,questions:deck.slice(i,i+5).map((q,j)=>({question:q.question,answer:answerText(q),answerIndex:Array.isArray(q.answer)?undefined:q.answer,answerIndices:answerIndices(q),choices:q.choices,sourceId:q.id,explanation:q.explanation||'',points:(j+1)*100}))});
 return {id:bank.id,title:bank.title,timerEnabled:false,finalEnabled:false,categories};
}
