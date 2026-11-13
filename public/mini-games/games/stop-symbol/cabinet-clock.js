// Replay the same steps regardless of display refresh rate or reconnects.
export const SYMBOL_STEP_MS = 5;

export function advanceSymbol(game, from, to) {
  for (let at = from; at < to && game.state.phase !== 'finished'; at += SYMBOL_STEP_MS) {
    game.tick(SYMBOL_STEP_MS / 1000);
  }
}
