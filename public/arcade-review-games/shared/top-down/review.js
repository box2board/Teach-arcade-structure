import {shuffle} from './model.js';
export function createReview(map,questions,random=Math.random){
  const challenges=map.objects.filter(o=>o.type==='challenge');
  const needed=challenges.reduce((n,o)=>n+(o.questionCount||1),0);
  if(new Set(questions.map(q=>q.id)).size!==questions.length)throw Error('Question IDs must be unique.');
  if(questions.length<needed)throw Error('The question bank needs '+needed+' unique questions.');
  for(const q of questions)if(!q.choices.includes(q.answer)||new Set(q.choices).size!==q.choices.length)throw Error('Invalid choices for '+q.id);
  const deck=shuffle(questions,random);let cursor=0;
  const encounters={};
  for(const chest of challenges){
    const allocated=deck.slice(cursor,cursor+(chest.questionCount||1));cursor+=allocated.length;
    encounters[chest.id]={index:0,questions:allocated.map(q=>({question:{...q,choices:shuffle(q.choices,random)},attempts:0,tried:[],correct:false}))};
  }
  return {encounters};
}
export function answerReview(review,id,choice){
  const encounter=review.encounters[id], entry=encounter?.questions[encounter.index];
  if(!entry||entry.correct||!entry.question.choices.includes(choice)||entry.tried.includes(choice))return {type:'ignored'};
  entry.attempts++;entry.tried.push(choice);
  if(choice!==entry.question.answer)return {type:'wrong',explanation:entry.question.explanation};
  entry.correct=true;encounter.index++;
  return {type:'correct',explanation:entry.question.explanation,complete:encounter.index===encounter.questions.length};
}
export function reviewSummary(review){
  const entries=Object.values(review.encounters).flatMap(e=>e.questions);
  return {total:entries.length,completed:entries.filter(e=>e.correct).length,firstTry:entries.filter(e=>e.correct&&e.attempts===1).length,attempts:entries.reduce((n,e)=>n+e.attempts,0)};
}
