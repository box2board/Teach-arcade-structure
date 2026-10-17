// Shared puzzle rules keep guidance independent of adventure-specific wording.
export function relayStep(order, progress, chosen, preserveOnMistake = false) {
  if (progress >= order.length) return { progress, accepted: false, complete: true };
  if (chosen !== order[progress]) return { progress: preserveOnMistake ? progress : 0, accepted: false, complete: false };
  const next = progress + 1;
  return { progress: next, accepted: true, complete: next === order.length };
}

export function relayObjective(config, progress, showNextRelay = true) {
  const mission = config.mission || {};
  const puzzle = config.relayPuzzle || {};
  if (progress === 0) return mission.objectives?.start;
  if (progress >= (puzzle.order || []).length) return mission.objectives?.archive;
  const definition = mission.objectives?.relayProgress;
  if (!showNextRelay) return {
    title: definition?.title || 'Restore the relay sequence.',
    detail: mission.objectives?.relayProgressUnguided?.detail || 'Use the wall sequence to find the next relay.',
  };
  const next = puzzle.order[progress];
  const label = puzzle.stations?.[next]?.label || next;
  return { ...definition, detail: String(definition?.detail || 'Find the {next} relay next.').replaceAll('{next}', label) };
}

export function sequenceClue(puzzle) {
  return (puzzle.order || []).map((id, index) => `${index + 1}. ${puzzle.stations?.[id]?.label || id}`).join(' → ');
}
