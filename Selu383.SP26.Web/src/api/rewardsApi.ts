import { apiRequest } from "./client";
import type { PointsBalance, Reward, RewardHistoryItem, RewardTier } from "../types/reward.types";

export const rewardsApi = {
  getRewards() {
    return apiRequest<Reward[]>("/api/rewards");
  },
  getTiers() {
    return apiRequest<RewardTier[]>("/api/rewards/tiers");
  },
  getMyPoints() {
    return apiRequest<PointsBalance>("/api/rewards/my-points");
  },
  getHistory() {
    return apiRequest<RewardHistoryItem[]>("/api/rewards/my-history");
  },
  redeem(id: number) {
    return apiRequest<{ message: string; remainingPoints: number }>(`/api/rewards/redeem/${id}`, {
      method: "POST",
    });
  },
};
