// Keep at most 100 ms of commands. Never simulate extra steps to drain a burst:
// clients must not gain movement speed by sending more messages.
export function enqueueInput(queue, input) {
  queue.push(input);
  while (queue.length > 3) {
    const stale = queue.shift();
    // Preserve one buffered jump edge when discarding stale movement.
    if (stale.jump) queue[0].jump = true;
  }
}
