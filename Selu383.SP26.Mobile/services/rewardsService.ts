import { apiRequest } from './api';
import type { PointsBalance, Reward } from '@/types/app';

export const rewardsService = {
  getRewards() {
    return apiRequest<Reward[]>('/api/rewards');
  },
  getBalance() {
    return apiRequest<PointsBalance>('/api/rewards/my-points');
  },
};
