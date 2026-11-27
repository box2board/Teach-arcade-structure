// Set a permanent catalog ID to 'coming-soon' to keep its listing visible during development.
// Omitted IDs are live.
export const availability = Object.freeze({});

export function isComingSoon(id) {
  return availability[id] === 'coming-soon';
}
