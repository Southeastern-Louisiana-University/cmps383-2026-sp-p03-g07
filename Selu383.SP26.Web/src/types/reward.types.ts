export type Reward = {
  id: number;
  name: string;
  description: string;
  pointsCost: number;
  isActive: boolean;
  tierName: string;
  offerType: string;
  discountAmount?: number | null;
  bonusStars: number;
};

export type RewardTier = {
  id: number;
  name: string;
  minPoints: number;
  benefits: string;
  accentColor: string;
};

export type PointsBalance = {
  points: number;
  currentTier: string;
  nextTier: string;
  pointsToNextTier: number;
};

export type RewardHistoryItem = {
  rewardName: string;
  pointsCost: number;
  redeemedAt: string;
};
