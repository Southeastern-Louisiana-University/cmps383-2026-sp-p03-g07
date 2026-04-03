export const POINTS_PER_DOLLAR = 10;
export const FIRST_TIER_THRESHOLD = 1000;

export function calculateLions(total: number) {
  return Math.max(Math.floor(total * POINTS_PER_DOLLAR), 0);
}
