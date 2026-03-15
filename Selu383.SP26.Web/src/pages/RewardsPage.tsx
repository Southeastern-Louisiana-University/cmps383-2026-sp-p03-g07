import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getPoints,
  getRewards,
  getRedemptions,
  redeemReward,
} from "../services/rewardsService";
import type { Reward, UserPointsDto, RewardRedemptionDto } from "../services/rewardsService";

export default function RewardsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [pointsData, setPointsData] = useState<UserPointsDto | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemptionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemError, setRedeemError] = useState("");
  const [redeemSuccess, setRedeemSuccess] = useState("");

  useEffect(() => {
    if (!user) { navigate("/login"); return; }

    Promise.all([getPoints(), getRewards(), getRedemptions()])
      .then(([pts, rwds, redemps]) => {
        setPointsData(pts);
        setRewards(rwds);
        setRedemptions(redemps);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleRedeem = async (rewardId: number) => {
    setRedeemError("");
    setRedeemSuccess("");
    try {
      await redeemReward(rewardId);
      const [pts, redemps] = await Promise.all([getPoints(), getRedemptions()]);
      setPointsData(pts);
      setRedemptions(redemps);
      setRedeemSuccess("Reward redeemed!");
    } catch (err: unknown) {
      setRedeemError(err instanceof Error ? err.message : "Could not redeem.");
    }
  };

  if (loading) return <div className="loading">Loading rewards...</div>;

  return (
    <div className="page">
      <h1 className="page-title">Rewards & Points</h1>

      <div className="rewards-balance">
        <p style={{ opacity: 0.8, marginBottom: "0.5rem" }}>Your Balance</p>
        <div className="points-num">{pointsData?.balance ?? 0}</div>
        <p style={{ opacity: 0.7, fontSize: "0.9rem" }}>points</p>
      </div>

      <h2 style={{ color: "var(--espresso)", marginBottom: "1rem" }}>Available Rewards</h2>
      {redeemError && <p className="error-msg" style={{ marginBottom: "1rem" }}>{redeemError}</p>}
      {redeemSuccess && <p className="success-msg" style={{ marginBottom: "1rem" }}>{redeemSuccess}</p>}
      <div className="rewards-grid">
        {rewards.map((reward) => (
          <div key={reward.id} className="reward-card">
            <h3>{reward.name}</h3>
            <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", flex: 1 }}>{reward.description}</p>
            <div className="reward-points">{reward.pointCost} pts</div>
            <button
              className="btn-primary"
              style={{ marginTop: "0.75rem" }}
              onClick={() => handleRedeem(reward.id)}
              disabled={(pointsData?.balance ?? 0) < reward.pointCost}
            >
              {(pointsData?.balance ?? 0) >= reward.pointCost ? "Redeem" : "Not enough points"}
            </button>
          </div>
        ))}
      </div>

      {pointsData && pointsData.transactions.length > 0 && (
        <>
          <h2 style={{ color: "var(--espresso)", marginBottom: "1rem" }}>Transaction History</h2>
          <div className="card" style={{ marginBottom: "2rem" }}>
            {pointsData.transactions.map((t) => (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{t.reason}</span>
                <span style={{ fontWeight: 700, color: t.amount > 0 ? "#27ae60" : "#c0392b" }}>
                  {t.amount > 0 ? `+${t.amount}` : t.amount} pts
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {redemptions.length > 0 && (
        <>
          <h2 style={{ color: "var(--espresso)", marginBottom: "1rem" }}>Redemption History</h2>
          <div className="card">
            {redemptions.map((r) => (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontWeight: 600 }}>{r.rewardName}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  {new Date(r.redeemedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
