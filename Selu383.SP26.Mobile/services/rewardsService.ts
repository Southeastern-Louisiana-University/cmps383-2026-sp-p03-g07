import { apiRequest } from './api';
import type { PointsBalance, Reward, RewardHistoryItem, RewardTier } from '@/types/app';

export const rewardsService = {
  getRewards() {
    return apiRequest<Reward[]>('/api/rewards');
  },
  getTiers() {
    return apiRequest<RewardTier[]>('/api/rewards/tiers');
  },
  getBalance() {
    return apiRequest<PointsBalance>('/api/rewards/my-points');
  },
  getHistory() {
    return apiRequest<RewardHistoryItem[]>('/api/rewards/my-history');
  },
  redeem(rewardId: number) {
    return apiRequest<{ message: string; remainingPoints: number }>(`/api/rewards/redeem/${rewardId}`, { method: 'POST' });
  },
};
