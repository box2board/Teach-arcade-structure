// One answer contract for scoring, answer shuffling, feedback, and keyboard input.
export const answerIndices=q=>Array.isArray(q.answer)?q.answer:[q.answer];
export const selectedIndices=value=>Array.isArray(value)?value:[value];
export function validSelection(value,count=4){
 const indices=selectedIndices(value);
 return indices.length>0&&indices.length<=count&&indices.every(i=>Number.isInteger(i)&&i>=0&&i<count)&&new Set(indices).size===indices.length;
}
export function isCorrectAnswer(q,value){
 const selected=selectedIndices(value),correct=answerIndices(q);
 return validSelection(value,q.choices.length)&&selected.length===correct.length&&correct.every(i=>selected.includes(i));
}
export const answerText=(q,value=q.answer)=>selectedIndices(value).map(i=>q.choices[i]).join('; ');
export function remapAnswer(q,order){
 const indices=answerIndices(q).map(i=>order.indexOf(i)).sort((a,b)=>a-b);
 return Array.isArray(q.answer)?indices:indices[0];
}
