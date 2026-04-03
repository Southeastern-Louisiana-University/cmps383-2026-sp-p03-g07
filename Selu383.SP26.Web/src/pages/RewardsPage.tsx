import { useCallback, useEffect, useMemo, useState } from "react";
import { menuApi } from "../api/menuApi";
import { rewardsApi } from "../api/rewardsApi";
import { resolveApiAssetUrl } from "../services/api";
import { useAuth } from "../store/authStore";
import type { MenuItem } from "../types/menu.types";
import type { PageProps } from "../types/router.types";
import type { PointsBalance, Reward } from "../types/reward.types";
import { FIRST_TIER_THRESHOLD, POINTS_PER_DOLLAR } from "../utils/rewardsProgram";
import { CommerceTopRail } from "./commerceShared";

const simpleProgramSteps = [
  {
    label: "Join",
    title: "10% off your first order",
    description: "Create your Lions account and start with a clear welcome perk.",
  },
  {
    label: "Earn",
    title: "10 points for every $1 spent",
    description: "Every qualifying coffee, pastry, and cafe order adds Lions fast.",
  },
  {
    label: "Redeem",
    title: "1000 points = choose a reward",
    description: "Once you hit 1000 Lions, pick from drinks, pastries, breakfast, or cake and sweets.",
  },
  {
    label: "Celebrate",
    title: "Birthday month treat",
    description: "Add your birthday to your profile so we can celebrate with you during your birthday month.",
  },
] as const;

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

function isRewardsHeroItem(item?: MenuItem | null): item is MenuItem {
  return !!item?.isAvailable && !!item.imageUrl;
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
      test: /breakfast/.test(rewardText),
      keywords: ["breakfast sandwich", "breakfast", "toast", "bagel", "sandwich"],
    },
    {
      test: /cake|sweet|sweets|dessert|brownie|cheesecake|slice/.test(rewardText),
      keywords: ["brownie", "cake", "cheesecake", "slice", "sweet"],
    },
    {
      test: /discount|stars|lions|reward/.test(rewardText),
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
  const [balance, setBalance] = useState<PointsBalance | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);

  const loadRewards = useCallback(async () => {
    const [nextRewards, nextMenuItems] = await Promise.all([
      rewardsApi.getRewards(),
      menuApi.getMenu({ includeRewardsExclusive: true }),
    ]);

    setRewards(nextRewards);
    setMenuItems(nextMenuItems);

    if (user) {
      setBalance(await rewardsApi.getMyPoints());
      return;
    }

    setBalance(null);
  }, [user]);

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
  }, [loadRewards]);

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
      .filter(isRewardsHeroItem)
      .sort((left, right) => Number(right.isFeatured) - Number(left.isFeatured))
      .slice(0, 5);
  }, [menuItems]);

  const rewardCards = useMemo(() => {
    return rewards.map((reward, index) => ({
      reward,
      menuItem: getRewardMenuItem(reward, menuItems, index),
    }));
  }, [menuItems, rewards]);

  const safeHeroIndex = heroIndex >= featuredMenuItems.length ? 0 : heroIndex;
  const fallbackHeroItem = rewardCards
    .map(({ menuItem }) => menuItem)
    .find(isRewardsHeroItem);
  const activeHeroItem = featuredMenuItems[safeHeroIndex] ?? fallbackHeroItem;
  const availablePoints = balance?.points ?? user?.points ?? 0;
  const rewardsReady = Math.floor(availablePoints / FIRST_TIER_THRESHOLD);
  const pointsToReward = Math.max(FIRST_TIER_THRESHOLD - availablePoints, 0);

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
        <CommerceTopRail activeTab="rewards" navigate={navigate} />
      </header>

      <section className="rewards-canvas">
        <section className="rewards-hero">
          <div className="rewards-hero-copy">
            <p className="rewards-kicker">Lions Rewards</p>
            <h1>SIMPLE REWARDS THAT FEEL WORTH IT.</h1>
            <p className="rewards-hero-description">
              Earn Lions on every visit and redeem them for simple cafe perks.
            </p>

            <div className="rewards-hero-actions">
              {user ? (
                <>
                  <button className="rewards-pill-button rewards-pill-button-primary" onClick={scrollToOffers} type="button">
                    Redeem reward
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
                    Join now
                  </button>
                </>
              )}
            </div>

            <div className="rewards-stat-strip">
              <article className="rewards-stat-card rewards-stat-card-balance">
                <span>Lions balance</span>
                <strong>{availablePoints}</strong>
                <p>{user ? "Your current balance is ready whenever you want to redeem." : "Sign in to start earning and tracking Lions."}</p>
              </article>
              <article className="rewards-stat-card">
                <span>Earn rate</span>
                <strong>{POINTS_PER_DOLLAR} per $1</strong>
                <p>Every qualifying dollar spent earns {POINTS_PER_DOLLAR} Lions.</p>
              </article>
              <article className="rewards-stat-card">
                <span>Next reward</span>
                <strong>{rewardsReady > 0 ? `${rewardsReady} ready` : `${pointsToReward} Lions`}</strong>
                <p>
                  {rewardsReady > 0
                    ? "Redeem a reward now."
                    : `Reach ${FIRST_TIER_THRESHOLD.toLocaleString()} Lions to unlock your next reward.`}
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
                  src={resolveApiAssetUrl(activeHeroItem.imageUrl)}
                />
              ) : (
                <div className="rewards-hero-placeholder">
                  <RewardGiftIcon />
                  <span>Simple Lions perks</span>
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
                <p>{activeHeroItem?.description ?? "Coffee and pastry favorites land here first."}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rewards-program-section">
          <div className="rewards-section-heading">
            <span />
            <h2>How It Works</h2>
            <span />
          </div>

          <div className="rewards-program-grid">
            {simpleProgramSteps.map((step) => (
              <article className="rewards-program-card" key={step.title}>
                <span className="rewards-program-step">{step.label}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rewards-offers-section" id="rewards-offers">
          <div className="rewards-section-heading">
            <span />
            <h2>Reward</h2>
            <span />
          </div>

          {rewardCards.length === 0 ? (
            <div className="rewards-empty-state">
              <h3>No reward loaded yet.</h3>
              <p>Check back soon for the current Lions redemption.</p>
            </div>
          ) : (
            <div className="rewards-offer-grid">
              {rewardCards.map(({ reward, menuItem }) => {
                const isLocked = !!user && availablePoints < reward.pointsCost;

                return (
                  <article className="rewards-offer-card" key={reward.id}>
                    <div className="rewards-offer-media-shell">
                      {menuItem?.imageUrl ? (
                        <img alt={reward.name} className="rewards-offer-image" src={resolveApiAssetUrl(menuItem.imageUrl)} />
                      ) : (
                        <div className="rewards-offer-image-fallback">
                          <RewardGiftIcon />
                        </div>
                      )}
                    </div>

                    <div className="rewards-offer-copy">
                      <span className="rewards-points-chip">{reward.pointsCost} Lions</span>
                      <h3>{reward.name}</h3>
                      <p>{reward.description}</p>

                      <div className="rewards-offer-meta">
                        <span>1000-point reward</span>
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
                            ? `${reward.pointsCost - availablePoints} more Lions`
                            : "Redeem now"}
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
