import {validateQuestionBank} from '../question-banks.js';

function shuffle(items,random){
  const result=[...items];
  for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}

export function prepareSnowQuestions(bank,random=Math.random){
  validateQuestionBank(bank);
  return {title:bank.title,questions:shuffle(bank.questions,random).map(q=>{
    const order=shuffle([0,1,2,3],random);
    return {id:q.id,prompt:q.question,choices:order.map(i=>q.choices[i]),answer:order.indexOf(q.answer),explanation:q.explanation};
  })};
}
