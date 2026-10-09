import {reviewSummary} from './review.js';
import {adventureResults} from './model.js';
import {hintSummary} from './hints.js';
export function buildReport(map,content,state,elapsed,{student='',created=new Date().toISOString()}={}){
  const review=reviewSummary(state.review),entries=Object.values(state.review.encounters).flatMap(e=>e.questions);
  const attempted=entries.filter(e=>e.attempts>0).length;
  return {
    student:student.trim().slice(0,80),created,adventure:map.title,topic:content.title||map.title,
    difficulty:map.modes?.find(m=>m.id===map.mode)?.label||map.mode,layout:map.layoutLabel||null,
    complete:state.won,seconds:Math.floor(elapsed),moves:state.moves,
    ...review,attempted,retries:review.attempts-attempted,
    firstTryAccuracy:attempted?Math.round(review.firstTry/attempted*100):null,
    points:adventureResults(map,state),hints:hintSummary(state),
    questions:map.objects.filter(o=>o.type==='challenge').flatMap(chest=>state.review.encounters[chest.id].questions.map(entry=>({
      chest:chest.label||chest.id,prompt:entry.question.text,attempts:entry.attempts,
      responses:[...entry.tried],correct:entry.correct
    })))
  };
}
export function reportSummary(r){return [
  `${r.adventure}${r.topic!==r.adventure?' · '+r.topic:''}`,
  `Adventure: ${r.complete?'Complete':'In progress'} · ${r.difficulty}`,
  ...(r.layout?[`Puzzle layout: ${r.layout}`]:[]),
  `Questions completed: ${r.completed} / ${r.total} · Questions attempted: ${r.attempted}`,
  `First-try accuracy: ${r.firstTryAccuracy===null?'Not yet available':r.firstTryAccuracy+'%'} (${r.firstTry} correct on the first try / ${r.attempted} attempted).`,
  `Answer attempts: ${r.attempts} · Retries: ${r.retries}`,
  `Puzzle hints revealed: ${r.hints?.revealed||0} · Puzzle tasks assisted: ${r.hints?.puzzles||0} (separate from question accuracy and points)`,
  `Active play time: ${Math.floor(r.seconds/60)}m ${r.seconds%60}s · Moves: ${r.moves}`,
  `Review points: ${r.points.reviewPoints} · Treasure bonus: ${r.points.bonusPoints} · Total points: ${r.points.totalPoints}`
];}
export function reportText(r){return [
  'TEACH ARCADE — QUEST ARCADE RESULTS',
  `Student: ${r.student||'____________________'}`,`Created: ${r.created}`,
  `Adventure: ${r.adventure}`,`Review topic: ${r.topic}`,'',...reportSummary(r),'',
  'QUESTION RECORD',
  ...r.questions.flatMap((q,i)=>[
    `${i+1}. ${q.chest}: ${q.prompt}`,
    `Status: ${q.correct?'Correct':q.attempts?'Needs another attempt':'Not attempted'} · Attempts: ${q.attempts}`,
    ...(q.responses.length?[`Responses, in order: ${q.responses.join(' → ')}`]:[]),''
  ])
].join('\n');}
export function downloadReport(r){
  const blob=new Blob([reportText(r)],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;link.download='quest-arcade-'+r.adventure.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-results.txt';
  try{document.body.append(link);link.click();}finally{link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
}
