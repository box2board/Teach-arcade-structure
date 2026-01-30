export const SCORING = {
  STANDARD_COUNT: 15,
  SECRET_COUNT: 2,
  POINTS_FIRST_TRY: 120,
  POINTS_SECOND_TRY: 70,
  COMPLETION_BONUS: 500,
  SECRET_BONUS: 250,
  TIME_BONUS_HIGH: 300,
  TIME_BONUS_MEDIUM: 180,
  TIME_BONUS_LOW: 80,
  TIME_HIGH_THRESHOLD: 6 * 60,
  TIME_MEDIUM_THRESHOLD: 9 * 60
};

export function getTimeBonus(seconds) {
  if (seconds <= SCORING.TIME_HIGH_THRESHOLD) {
    return { points: SCORING.TIME_BONUS_HIGH, label: "High" };
  }
  if (seconds <= SCORING.TIME_MEDIUM_THRESHOLD) {
    return { points: SCORING.TIME_BONUS_MEDIUM, label: "Medium" };
  }
  return { points: SCORING.TIME_BONUS_LOW, label: "Low" };
}
