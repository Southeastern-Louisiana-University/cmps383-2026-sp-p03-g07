import { API_BASE_URL } from "./api";

export type Reward = {
  id: number;
  name: string;
  description: string;
  pointCost: number;
  isActive: boolean;
};

export type UserPointsDto = {
  balance: number;
  transactions: { id: number; amount: number; reason: string; createdAt: string }[];
};

export type RewardRedemptionDto = {
  id: number;
  rewardId: number;
  rewardName: string;
  pointCost: number;
  redeemedAt: string;
};

export async function getPoints(): Promise<UserPointsDto> {
  const res = await fetch(`${API_BASE_URL}/api/points`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load points.");
  return res.json();
}

export async function getRewards(): Promise<Reward[]> {
  const res = await fetch(`${API_BASE_URL}/api/rewards`);
  if (!res.ok) throw new Error("Failed to load rewards.");
  return res.json();
}

export async function redeemReward(rewardId: number): Promise<RewardRedemptionDto> {
  const res = await fetch(`${API_BASE_URL}/api/rewards/redeem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(rewardId),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Failed to redeem reward.");
  }
  return res.json();
}

export async function getRedemptions(): Promise<RewardRedemptionDto[]> {
  const res = await fetch(`${API_BASE_URL}/api/rewards/redemptions`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load redemptions.");
  return res.json();
}
