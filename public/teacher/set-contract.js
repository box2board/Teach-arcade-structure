// Shared editor/API limits are technical payload bounds, not pricing tiers.
export const SET_SUBJECTS=['Social Studies','Science','Math','ELA','Other'];
export const MIN_PLAY_QUESTIONS=12;
export const MAX_QUESTIONS=100;
export const teacherSetId=id=>typeof id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
export const correctAnswers=q=>Array.isArray(q?.answer)?q.answer:Number.isInteger(q?.answer)&&q.answer>=0?[q.answer]:[];
export function validAnswer(answer){
 return Array.isArray(answer)?answer.length<=4&&answer.every(n=>Number.isInteger(n)&&n>=0&&n<4)&&new Set(answer).size===answer.length:Number.isInteger(answer)&&answer>=-1&&answer<4;
}
export function completeQuestion(q){
 return !!q&&typeof q.question==='string'&&!!q.question.trim()&&Array.isArray(q.choices)&&q.choices.length===4&&q.choices.every(c=>typeof c==='string'&&!!c.trim())&&new Set(q.choices.map(c=>c.normalize('NFKC').trim().toLowerCase())).size===4&&validAnswer(q.answer)&&correctAnswers(q).length>0;
}
export function setInput(input){
 const fail=message=>{const error=new Error(message);error.status=400;throw error;};
 if(!input||typeof input!=='object')fail('Enter a question set.');
 const text=(value,max,label,required=false)=>{if(typeof value!=='string'||value.length>max||(required&&!value.trim()))fail(`${label}${required?' is required and':''} must be ${max} characters or fewer.`);return value.trim();};
 const title=text(input.title,120,'Title',true),description=text(input.description??'',1000,'Description'),subject=input.subject;
 if(!SET_SUBJECTS.includes(subject))fail('Choose a subject.');
 if(!Array.isArray(input.questions)||input.questions.length>MAX_QUESTIONS)fail('A set can contain up to 100 questions.');
 const questions=input.questions.map((q,i)=>{
  if(!q||!Array.isArray(q.choices)||q.choices.length!==4||!validAnswer(q.answer))fail(`Question ${i+1} needs four choices and a correct-answer selection.`);
  return {question:text(q.question,1000,`Question ${i+1}`),choices:q.choices.map(c=>text(c,500,`Question ${i+1} answer`)),answer:Array.isArray(q.answer)?[...q.answer].sort((a,b)=>a-b):q.answer,explanation:text(q.explanation??'',2000,`Question ${i+1} explanation`)};
 });
 const visibility=input.visibility??'private';
 if(!['private','public'].includes(visibility))fail('Choose private or public visibility.');
 if(visibility==='public'&&(questions.length<MIN_PLAY_QUESTIONS||!questions.every(completeQuestion)))fail('To publish, add at least 12 complete questions, each with four different answers and at least one correct answer.');
 return {title,description,subject,questions,visibility};
}
export function teacherBank(set){
 if(set.questions.length<MIN_PLAY_QUESTIONS||!set.questions.every(completeQuestion))throw Error('This draft needs at least 12 complete questions before playing.');
 return {id:`teacher:${set.id}`,title:set.title,subject:set.subject,category:'Teacher-created',questionCount:set.questions.length,questions:set.questions.map((q,i)=>({...q,answer:correctAnswers(q).length===1?correctAnswers(q)[0]:[...correctAnswers(q)],id:`${set.id}-${i+1}`}))};
}
