// Midway owns how each mini-game's result becomes a board-team reward.
// Other modes can define their own conversion without changing the game engines.
const rewardRules=Object.freeze({
  'red-light-green-light':{unitsPerPoint:200,maxPoints:10},
  'spotlight-sneak':{unitsPerPoint:15,maxPoints:10},
  'bumper-boats':{unitsPerPoint:12,maxPoints:10},
  'magnet-mayhem':{unitsPerPoint:25,maxPoints:10}
});

export function midwayMiniGameRewards(gameId,results){
  const rule=rewardRules[gameId];
  if(!rule)return new Map();
  return new Map(results.map(({playerId,score})=>[
    playerId,Math.min(rule.maxPoints,Math.floor(Math.max(0,score)/rule.unitsPerPoint))
  ]));
}
