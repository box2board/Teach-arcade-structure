import {SET_SUBJECTS,setInput} from './set-contract.js';
// Official banks stay in the shared website catalog. Only independent copies are persisted.
export function originalCopy(bank){
 return setInput({title:(bank.title+' (my copy)').slice(0,120),description:('Adapted from Teach Arcade Originals: '+bank.title+(bank.description?' — '+bank.description:'')).slice(0,1000),subject:SET_SUBJECTS.includes(bank.subject)?bank.subject:'Other',visibility:'private',questions:bank.questions.map(q=>({question:q.question,choices:[...q.choices],answer:Array.isArray(q.answer)?[...q.answer]:q.answer,explanation:q.explanation||''}))});
}
