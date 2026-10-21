/* Resolve a saved bank reference without embedding a second copy of questions. */
window.TALoadCreatorQuestions=async function(ref,fallback=[]){
 if(!ref)return fallback;
 if(typeof ref.file!=='string'||!/^[a-z0-9-]+(?:\/[a-z0-9-]+)+\.json$/.test(ref.file))throw Error('Invalid question-set reference.');
 const r=await fetch('/review-lab/question-sets/library/'+ref.file,{credentials:'same-origin'});if(!r.ok)throw Error('Question set could not be loaded.');
 const bank=await r.json();if(!Array.isArray(bank.questions)||!bank.questions.length)throw Error('Question set is empty.');
 return bank.questions.map(q=>{if(typeof q.question!=='string'||!Array.isArray(q.choices)||q.choices.length!==4||!Number.isInteger(q.correctAnswer)||q.correctAnswer<0||q.correctAnswer>3)throw Error('Unsupported question in bank.');return{text:q.question,choices:q.choices,correctIndex:q.correctAnswer,explanation:q.explanation||''};});
};
