export const POINTS_PER_DOLLAR = 10;
export const REWARD_THRESHOLD = 1000;

export function calculatePointsEarned(subtotal: number) {
  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    return 0;
  }

  return Math.max(Math.floor(subtotal * POINTS_PER_DOLLAR), 0);
}

export function getRewardProgress(points: number) {
  const safePoints = Number.isFinite(points) ? Math.max(Math.floor(points), 0) : 0;
  const availableRewards = Math.floor(safePoints / REWARD_THRESHOLD);
  const progressPoints = safePoints % REWARD_THRESHOLD;
  const pointsToNextReward = progressPoints === 0 && safePoints >= REWARD_THRESHOLD
    ? 0
    : REWARD_THRESHOLD - progressPoints;

  return {
    availableRewards,
    progressPoints,
    pointsToNextReward,
  };
}

