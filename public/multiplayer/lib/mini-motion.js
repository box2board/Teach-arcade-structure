export function createMiniMotion() {
  const poses = new Map();
  let lastFrame;
  let receivedAt = 0;

  return {
    receive(now) { receivedAt = now; },
    draw(players, now, playerId, direction, speed, stopped = () => false) {
      const elapsed = Math.min(0.08, Math.max(0, (now - (lastFrame ?? now)) / 1000));
      lastFrame = now;
      const age = Math.min(Math.max(0, now - receivedAt), 130) / 1000;
      const blend = 1 - Math.exp(-elapsed * 20);
      return players.map(player => {
        const local = player.id === playerId;
        const previous = poses.get(player.id) ?? player;
        let targetX = player.x;
        let targetY = player.y;
        if (!stopped(player)) {
          targetX += (player.vx ?? 0) * age;
          targetY += (player.vy ?? 0) * age;
          if (local && direction) {
            targetX += direction.x * speed * .075;
            targetY += direction.y * speed * .075;
          }
        }
        const x = previous.x + (targetX - previous.x) * blend;
        const y = previous.y + (targetY - previous.y) * blend;
        poses.set(player.id,{x,y});
        return {...player,x,y};
      });
    }
  };
}
