import { useEffect, useMemo, useState } from "react";
import { rewardsApi } from "../api/rewardsApi";
import { useAuth } from "../store/authStore";
import type { PageProps } from "../types/router.types";
import type { Reward } from "../types/reward.types";
import { getRewardProgress, POINTS_PER_DOLLAR, REWARD_THRESHOLD } from "../utils/rewardsProgram";
import { CommerceTopRail } from "./commerceShared";

export default function RewardsPage({ navigate }: PageProps) {
  const { user, refresh } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loadingRewards, setLoadingRewards] = useState(true);
  const [redeemingRewardId, setRedeemingRewardId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const points = user?.points ?? 0;
  const progress = useMemo(() => getRewardProgress(points), [points]);
  const progressPercent = useMemo(() => {
    if (REWARD_THRESHOLD <= 0) {
      return 0;
    }

    return Math.min(100, Math.max(0, (progress.progressPoints / REWARD_THRESHOLD) * 100));
  }, [progress.progressPoints]);
  const dollarsToReward = POINTS_PER_DOLLAR <= 0 ? 0 : Math.ceil(REWARD_THRESHOLD / POINTS_PER_DOLLAR);

  useEffect(() => {
    let isMounted = true;
    setLoadingRewards(true);

    void rewardsApi
      .getRewards()
      .then((nextRewards) => {
        if (isMounted) {
          setRewards(nextRewards);
          setErrorMessage("");
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load rewards.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingRewards(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function redeemReward(rewardId: number) {
    if (!user) {
      navigate("/login");
      return;
    }

    setRedeemingRewardId(rewardId);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const result = await rewardsApi.redeem(rewardId);
      setStatusMessage(result.message ?? "Reward redeemed successfully!");
      await refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to redeem reward.");
    } finally {
      setRedeemingRewardId(null);
    }
  }

  function scrollToOffers() {
    document.getElementById("rewards-offers")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const pointsWord = progress.pointsToNextReward === 1 ? "point" : "points";
  const headline = progress.availableRewards > 0
    ? `${progress.availableRewards} reward${progress.availableRewards === 1 ? "" : "s"} ready`
    : `${progress.pointsToNextReward} ${pointsWord} to go`;

  return (
    <div className="rewards-showcase">
      <header className="rewards-topbar">
        <CommerceTopRail activeTab="rewards" navigate={navigate} />
      </header>

      <section className="rewards-canvas">
        <section className="rewards-hero">
          <div className="rewards-hero-copy">
            <p className="rewards-kicker">Rewards</p>
            <h1>POINTS</h1>
            <p className="rewards-hero-description">
              Earn {POINTS_PER_DOLLAR} points for every $1 you spend. Redeem rewards starting at {REWARD_THRESHOLD} points.
            </p>

            <div className="rewards-hero-actions">
              <button className="rewards-pill-button rewards-pill-button-primary" onClick={() => navigate("/menu")} type="button">
                Order now
              </button>
              <button
                className="rewards-pill-button rewards-pill-button-secondary"
                onClick={scrollToOffers}
                type="button"
              >
                Redeem
              </button>
              {!user ? (
                <button
                  className="rewards-pill-button rewards-pill-button-secondary"
                  onClick={() => navigate("/login")}
                  type="button"
                >
                  Sign in
                </button>
              ) : null}
            </div>

            <div className="rewards-stat-strip">
              <article className="rewards-stat-card">
                <span>Your points</span>
                <strong>{points}</strong>
                <p>{user ? "Points sync after payment." : "Sign in to start earning points."}</p>
              </article>
              <article className="rewards-stat-card">
                <span>Earn rate</span>
                <strong>{POINTS_PER_DOLLAR} / $1</strong>
                <p>Spend about ${dollarsToReward} to earn {REWARD_THRESHOLD} points.</p>
              </article>
              <article className="rewards-stat-card">
                <span>Next reward</span>
                <strong>{headline}</strong>
                <p>Progress: {progress.progressPoints} / {REWARD_THRESHOLD}</p>
              </article>
            </div>

            {statusMessage ? <p className="rewards-inline-status rewards-inline-status-success">{statusMessage}</p> : null}
            {errorMessage ? <p className="rewards-inline-status rewards-inline-status-error">{errorMessage}</p> : null}
          </div>

          <aside className="rewards-hero-media">
            <div className="rewards-simple-card">
              <div className="rewards-simple-row">
                <span className="rewards-simple-chip">{POINTS_PER_DOLLAR} pts / $1</span>
                <span className="rewards-simple-chip">{REWARD_THRESHOLD} pts reward</span>
              </div>

              <div className="rewards-simple-balance">
                <span>Points balance</span>
                <strong>{points}</strong>
              </div>

              <div className="rewards-simple-progress" aria-label="Reward progress">
                <div className="rewards-simple-progress-bar" style={{ width: `${progressPercent}%` }} />
              </div>

              <div className="rewards-simple-row rewards-simple-row-meta">
                <span>{progress.progressPoints} / {REWARD_THRESHOLD}</span>
                <strong>{headline}</strong>
              </div>

              <button
                className="rewards-redeem-button rewards-redeem-button-simple"
                disabled={loadingRewards || rewards.length === 0}
                onClick={scrollToOffers}
                type="button"
              >
                {loadingRewards ? "Loading rewards..." : "View rewards"}
              </button>
            </div>
          </aside>
        </section>

        <section className="rewards-offers-section" id="rewards-offers">
          <div className="rewards-section-heading">
            <span />
            <h2>Rewards</h2>
            <span />
          </div>

          {loadingRewards ? (
            <p className="rewards-inline-status">Loading rewards...</p>
          ) : rewards.length === 0 ? (
            <p className="rewards-inline-status">No rewards available right now.</p>
          ) : (
            <div className="rewards-offer-grid">
              {rewards.map((reward) => {
                const isLocked = !!user && points < reward.pointsCost;

                return (
                  <article className="rewards-offer-card" key={reward.id}>
                    <div className="rewards-offer-copy">
                      <span className="rewards-points-chip">{reward.pointsCost} points</span>
                      <h3>{reward.name}</h3>
                      <p>{reward.description}</p>

                      <button
                        className="rewards-redeem-button"
                        disabled={redeemingRewardId === reward.id || isLocked}
                        onClick={() => void redeemReward(reward.id)}
                        type="button"
                      >
                        {!user
                          ? "Sign in to redeem"
                          : redeemingRewardId === reward.id
                            ? "Redeeming..."
                            : isLocked
                              ? `${reward.pointsCost - points} more points`
                              : "Redeem"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
