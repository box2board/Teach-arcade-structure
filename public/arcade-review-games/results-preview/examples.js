export function exampleFor(game, mode) {
  const pairs = {
    platform:[['Score','5,500'],['Accuracy','9 / 10'],['Items collected','4 / 5'],['Time','4:32'],['Respawns','2'],['Completion bonus','+1,000']],
    territory:[['Team Orbit','12 territories · 15 points'],['Team Comet','12 territories · 12 points']],
    survey:[['Team Orbit','400 points'],['Team Comet','200 points']],
    'cold-war':[['Stability','85'],['Correct answers','8 / 10'],['Accuracy','80%'],['Time','248 sec']],
    adventure:[['Total points','650'],['First-try accuracy','83%'],['Questions completed',mode==='Easy'?'6 / 6':'12 / 12'],['Time','6m 42s'],['Treasure found','1 / 1'],['Moves','182']],
    cells:[['Score','1,250'],['Accuracy','80%'],['Correct answers','16 / 20']],
    maze:[['Score','850'],['Accuracy','80%'],['Questions answered','10 / 10'],['Time','184 sec']],
    racer:[['Score','1,600'],['Accuracy','80%'],['Correct answers','8 / 10'],['Best streak','5'],['Missed questions','2'],['Time','60 sec']],
    rush:[['Score','1,400'],['Accuracy','90%'],['Best streak','7'],['Time','2:14']],
    grammar:[['Score','1,800'],['Correct on first try','18 / 20'],['Accuracy','90%']],
    rifts:[['Score','1,250'],['Questions answered','13 / 15'],['Time','211 sec']]
  };
  const outcomes={territory:'Team Orbit wins!',survey:'Team Orbit wins!','cold-war':'Mission complete',adventure:'Adventure complete',cells:'Stack complete',maze:'Maze complete',racer:'Race complete',rush:'Run complete',grammar:'Gauntlet complete',rifts:'Hallway run complete',platform:'Level complete'};
  const details={territory:['Reached the territory target.'],survey:['Lightning team score: 250 of 200 — target reached!'],cells:['Cell structures: 8 / 10 (80%)','Cell processes: 8 / 10 (80%)','Prompt to revisit: Which organelle releases usable energy? → Mitochondrion'],adventure:['Review points: 600 · Treasure bonus: 50','Answer attempts: 14 · Puzzle hints revealed: 1'],rifts:['Rank: Rift Guardian']};
  const metrics=pairs[game.kind].map(([label,value])=>({label,value}));
  if(game.kind==='platform') {
    const names={trench:'Intel',pyramid:'Scarabs',volcano:'Mineral samples',moon:'Samples',algebra:'Tokens',slope:'Markers'};
    metrics[2].label=names[game.id];
    if(game.id==='slope') metrics[5]={label:'Enemies stomped',value:'3'};
  }
  if(game.kind==='territory') {
    if(mode.startsWith('Domination')){metrics[0].value='24 territories · 28 points';metrics[1].value='0 territories · 0 points';details.territory=['Controls every territory.'];}
    else if(mode.startsWith('Target')){metrics[0].value='15 territories · 18 points';metrics[1].value='9 territories · 9 points';details.territory=['Reached the target of 15 territories.'];}
    else details.territory=['Time expired. Final standings use territory points.'];
  }
  return {game:game.title,mode,outcome:outcomes[game.kind],metrics,details:details[game.kind]||[],sample:true};
}
