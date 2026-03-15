import { useEffect, useMemo, useState } from "react";
import { menuApi } from "../api/menuApi";
import { rewardsApi } from "../api/rewardsApi";
import { useAuth } from "../store/authStore";
import type { MenuItem } from "../types/menu.types";
import type { PageProps } from "../types/router.types";
import type { PointsBalance, Reward, RewardHistoryItem, RewardTier } from "../types/reward.types";
import { StorefrontTopRail } from "./storefrontShared";

const fallbackTiers: RewardTier[] = [
  {
    id: 1,
    name: "Bronze",
    minPoints: 0,
    benefits: "Birthday treat and basic earn rate",
    accentColor: "#9a6b3a",
  },
  {
    id: 2,
    name: "Silver",
    minPoints: 150,
    benefits: "1.5x stars, early seasonal access",
    accentColor: "#7c8a99",
  },
  {
    id: 3,
    name: "Gold",
    minPoints: 300,
    benefits: "2x stars, premium offers, surprise drops",
    accentColor: "#d7a526",
  },
];

const tierRows = [
  {
    title: "Welcome reward",
    description: "10% off your first Lions order after joining the program.",
    minTierIndex: 0,
  },
  {
    title: "Birthday treat",
    description: "A surprise pastry or drink during your birthday month.",
    minTierIndex: 0,
  },
  {
    title: "Faster star earning",
    description: "Boost your earn rate on every qualifying in-store or online order.",
    minTierIndex: 1,
  },
  {
    title: "Early seasonal access",
    description: "Unlock launch-week access to limited drinks and bakery drops.",
    minTierIndex: 1,
  },
  {
    title: "Surprise drops",
    description: "Premium members get exclusive flash offers and special weekend perks.",
    minTierIndex: 2,
  },
];

function RewardGiftIcon() {
  return (
    <svg aria-hidden="true" className="rewards-gift-icon" viewBox="0 0 48 48">
      <path
        d="M10 20h28v18H10zM24 20v18M10 27h28"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
      <path
        d="M24 20c-2.5-4.5-8.3-7-11-3.9-2.1 2.3-.5 5.9 3.6 5.9H24ZM24 20c2.5-4.5 8.3-7 11-3.9 2.1 2.3.5 5.9-3.6 5.9H24Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
    </svg>
  );
}

function CarouselChevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d={direction === "left" ? "M15 5 8 12l7 7" : "m9 5 7 7-7 7"}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function formatHistoryDate(redeemedAt: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(redeemedAt));
}

function getRewardMenuItem(reward: Reward, menuItems: MenuItem[], index: number) {
  const rewardText = `${reward.name} ${reward.description} ${reward.offerType}`.toLowerCase();

  const exactMatch = menuItems.find((item) => rewardText.includes(item.name.toLowerCase()));
  if (exactMatch?.imageUrl) {
    return exactMatch;
  }

  const keywordSets = [
    {
      test: /coffee|drink|latte|mocha|espresso|upgrade/.test(rewardText),
      keywords: ["coffee", "latte", "mocha", "espresso", "brew", "matcha"],
    },
    {
      test: /pastry|bread|bagel|food|sandwich|croissant|toast/.test(rewardText),
      keywords: ["croissant", "pastry", "bagel", "toast", "sandwich", "bread", "muffin"],
    },
    {
      test: /discount|stars/.test(rewardText),
      keywords: ["featured", "seasonal", "special", "house"],
    },
  ];

  const keywordMatch = keywordSets
    .filter((entry) => entry.test)
    .flatMap((entry) => entry.keywords)
    .find((keyword) =>
      menuItems.some((item) =>
        `${item.name} ${item.category} ${item.description}`.toLowerCase().includes(keyword),
      ),
    );

  if (keywordMatch) {
    const match = menuItems.find((item) =>
      `${item.name} ${item.category} ${item.description}`.toLowerCase().includes(keywordMatch),
    );

    if (match?.imageUrl) {
      return match;
    }
  }

  const featuredItems = menuItems
    .filter((item) => item.isAvailable && item.imageUrl)
    .sort((left, right) => Number(right.isFeatured) - Number(left.isFeatured));

  return featuredItems[index % featuredItems.length] ?? menuItems.find((item) => item.imageUrl);
}

export default function RewardsPage({ navigate }: PageProps) {
  const { user, refresh } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [tiers, setTiers] = useState<RewardTier[]>(fallbackTiers);
  const [balance, setBalance] = useState<PointsBalance | null>(null);
  const [history, setHistory] = useState<RewardHistoryItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);

  async function loadRewards() {
    const [nextRewards, nextTiers, nextMenuItems] = await Promise.all([
      rewardsApi.getRewards(),
      rewardsApi.getTiers(),
      menuApi.getMenu(),
    ]);

    setRewards(nextRewards);
    setTiers(nextTiers.length > 0 ? nextTiers : fallbackTiers);
    setMenuItems(nextMenuItems);

    if (user) {
      const [nextBalance, nextHistory] = await Promise.all([
        rewardsApi.getMyPoints(),
        rewardsApi.getHistory(),
      ]);

      setBalance(nextBalance);
      setHistory(nextHistory);
      return;
    }

    setBalance(null);
    setHistory([]);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadPage() {
      try {
        await loadRewards();
        if (isMounted) {
          setErrorMessage("");
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Unable to load rewards.");
      }
    }

    void loadPage();

    return () => {
      isMounted = false;
    };
  }, [user]);

  async function redeemReward(rewardId: number) {
    try {
      setErrorMessage("");
      const result = await rewardsApi.redeem(rewardId);
      setStatusMessage(result.message);
      await refresh();
      await loadRewards();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to redeem reward.");
    }
  }

  const featuredMenuItems = useMemo(() => {
    return menuItems
      .filter((item) => item.isAvailable && item.imageUrl)
      .sort((left, right) => Number(right.isFeatured) - Number(left.isFeatured))
      .slice(0, 5);
  }, [menuItems]);

  useEffect(() => {
    if (heroIndex > 0 && heroIndex >= featuredMenuItems.length) {
      setHeroIndex(0);
    }
  }, [heroIndex, featuredMenuItems.length]);

  const rewardCards = useMemo(() => {
    return rewards.map((reward, index) => ({
      reward,
      menuItem: getRewardMenuItem(reward, menuItems, index),
    }));
  }, [menuItems, rewards]);

  const activeHeroItem = featuredMenuItems[heroIndex] ?? rewardCards[0]?.menuItem;
  const resolvedTiers = tiers.length > 0 ? tiers : fallbackTiers;
  const availablePoints = balance?.points ?? user?.points ?? 0;
  const recentReward = history[0];

  function cycleHero(direction: -1 | 1) {
    if (featuredMenuItems.length <= 1) {
      return;
    }

    setHeroIndex((currentIndex) => {
      const nextIndex = currentIndex + direction;
      return (nextIndex + featuredMenuItems.length) % featuredMenuItems.length;
    });
  }

  function scrollToOffers() {
    document.getElementById("rewards-offers")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="rewards-showcase">
      <header className="rewards-topbar">
        <StorefrontTopRail activeTab="rewards" navigate={navigate} />
      </header>

      <section className="rewards-canvas">
        <section className="rewards-hero">
          <div className="rewards-hero-copy">
            <p className="rewards-kicker">Loyalty club</p>
            <h1>MORE LIONS. MORE FOR YOU.</h1>
            <p className="rewards-hero-description">
              Collect points with every coffee, pastry, and pickup order. The more you earn, the faster
              you unlock better perks, earlier drops, and redeemable house favorites.
            </p>

            <div className="rewards-hero-actions">
              {user ? (
                <>
                  <button className="rewards-pill-button rewards-pill-button-primary" onClick={scrollToOffers} type="button">
                    Redeem rewards
                  </button>
                  <button
                    className="rewards-pill-button rewards-pill-button-secondary"
                    onClick={() => navigate("/profile")}
                    type="button"
                  >
                    My account
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="rewards-pill-button rewards-pill-button-primary"
                    onClick={() => navigate("/login")}
                    type="button"
                  >
                    Sign in
                  </button>
                  <button
                    className="rewards-pill-button rewards-pill-button-secondary"
                    onClick={() => navigate("/login?mode=register")}
                    type="button"
                  >
                    Register
                  </button>
                </>
              )}
            </div>

            <div className="rewards-stat-strip">
              <article className="rewards-stat-card">
                <span>Points</span>
                <strong>{availablePoints}</strong>
                <p>{user ? "Ready to spend on your next treat." : "Sign in to start earning."}</p>
              </article>
              <article className="rewards-stat-card">
                <span>Current tier</span>
                <strong>{balance?.currentTier ?? resolvedTiers[0]?.name ?? "Bronze"}</strong>
                <p>
                  {balance
                    ? balance.pointsToNextTier > 0
                      ? `${balance.pointsToNextTier} points to ${balance.nextTier}.`
                      : "Top tier unlocked."
                    : "Each order moves you up the ladder."}
                </p>
              </article>
              <article className="rewards-stat-card">
                <span>Latest reward</span>
                <strong>{recentReward?.rewardName ?? "Keep collecting"}</strong>
                <p>
                  {recentReward
                    ? `Redeemed ${formatHistoryDate(recentReward.redeemedAt)}.`
                    : "Redeem points for drinks, pastries, and premium extras."}
                </p>
              </article>
            </div>

            {statusMessage ? <p className="rewards-inline-status rewards-inline-status-success">{statusMessage}</p> : null}
            {errorMessage ? <p className="rewards-inline-status rewards-inline-status-error">{errorMessage}</p> : null}
          </div>

          <div className="rewards-hero-media">
            <div className="rewards-hero-frame">
              {activeHeroItem?.imageUrl ? (
                <img
                  alt={activeHeroItem.name}
                  className="rewards-hero-image"
                  src={activeHeroItem.imageUrl}
                />
              ) : (
                <div className="rewards-hero-placeholder">
                  <RewardGiftIcon />
                  <span>House perks rotate here</span>
                </div>
              )}

              {featuredMenuItems.length > 1 ? (
                <>
                  <button
                    aria-label="Show previous feature"
                    className="rewards-carousel-arrow rewards-carousel-arrow-left"
                    onClick={() => cycleHero(-1)}
                    type="button"
                  >
                    <CarouselChevron direction="left" />
                  </button>
                  <button
                    aria-label="Show next feature"
                    className="rewards-carousel-arrow rewards-carousel-arrow-right"
                    onClick={() => cycleHero(1)}
                    type="button"
                  >
                    <CarouselChevron direction="right" />
                  </button>
                </>
              ) : null}

              <div className="rewards-hero-caption">
                <span className="rewards-offer-pill">Featured favorite</span>
                <strong>{activeHeroItem?.name ?? "Bakery case perks"}</strong>
                <p>{activeHeroItem?.description ?? "New drops and rotating rewards land here first."}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rewards-tier-section">
          <div className="rewards-section-heading">
            <span />
            <h2>Tiers</h2>
            <span />
          </div>

          <div className="rewards-tier-table-shell">
            <div className="rewards-tier-table">
              <div
                className="rewards-tier-row rewards-tier-row-header"
                style={{ gridTemplateColumns: `minmax(18rem, 1.8fr) repeat(${resolvedTiers.length}, minmax(9rem, 1fr))` }}
              >
                <div className="rewards-tier-cell rewards-tier-cell-heading">Tier rewards</div>
                {resolvedTiers.map((tier) => (
                  <div className="rewards-tier-cell rewards-tier-cell-header" key={tier.id}>
                    <strong>{tier.name}</strong>
                    <span>from {tier.minPoints} points</span>
                  </div>
                ))}
              </div>

              {tierRows.map((row) => (
                <div
                  className="rewards-tier-row"
                  key={row.title}
                  style={{ gridTemplateColumns: `minmax(18rem, 1.8fr) repeat(${resolvedTiers.length}, minmax(9rem, 1fr))` }}
                >
                  <div className="rewards-tier-cell rewards-tier-benefit-cell">
                    <strong>{row.title}</strong>
                    <p>{row.description}</p>
                  </div>
                  {resolvedTiers.map((tier, index) => (
                    <div className="rewards-tier-cell rewards-tier-check-cell" key={`${row.title}-${tier.id}`}>
                      {index >= row.minTierIndex ? <RewardGiftIcon /> : <span className="rewards-tier-empty">-</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <p className="rewards-tier-footnote">
            Join the Lions loyalty program and turn everyday orders into faster upgrades, seasonal access,
            and premium rewards.
          </p>
        </section>

        <section className="rewards-offers-section" id="rewards-offers">
          <div className="rewards-section-heading">
            <span />
            <h2>Rewards</h2>
            <span />
          </div>

          <div className="rewards-offer-grid">
            {rewardCards.map(({ reward, menuItem }) => {
              const isLocked = !!user && availablePoints < reward.pointsCost;

              return (
                <article className="rewards-offer-card" key={reward.id}>
                  <div className="rewards-offer-media-shell">
                    {menuItem?.imageUrl ? (
                      <img alt={reward.name} className="rewards-offer-image" src={menuItem.imageUrl} />
                    ) : (
                      <div className="rewards-offer-image-fallback">
                        <RewardGiftIcon />
                      </div>
                    )}
                  </div>

                  <div className="rewards-offer-copy">
                    <span className="rewards-points-chip">{reward.pointsCost} points</span>
                    <h3>{reward.name}</h3>
                    <p>{reward.description}</p>

                    <div className="rewards-offer-meta">
                      <span>{reward.tierName || "Any tier"}</span>
                      <span>{reward.offerType}</span>
                    </div>

                    <button
                      className="rewards-redeem-button"
                      disabled={isLocked}
                      onClick={() => {
                        if (!user) {
                          navigate("/login");
                          return;
                        }

                        void redeemReward(reward.id);
                      }}
                      type="button"
                    >
                      {!user
                        ? "Sign in to redeem"
                        : isLocked
                          ? `${reward.pointsCost - availablePoints} more points`
                          : "Redeem"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </div>
  );
}
