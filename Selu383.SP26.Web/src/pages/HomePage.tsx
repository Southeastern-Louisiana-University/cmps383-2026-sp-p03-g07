import { useEffect, useState } from "react";
import { locationsApi } from "../api/locationsApi";
import { menuApi } from "../api/menuApi";
import { resolveApiAssetUrl } from "../services/api";
import type { Location } from "../types/location.types";
import type { MenuItem } from "../types/menu.types";
import type { PageProps } from "../types/router.types";
import {
  StoreOrderIcon,
  CommerceTopRail,
  fallbackLocations,
  getProfile,
} from "./commerceShared";

type HomeHeroProduct = Pick<MenuItem, "id" | "name" | "description" | "price" | "imageUrl" | "category" | "preparationTag">;

const homeHeroCategoryPriority = ["Coffee", "Lemonade", "Crepes", "Sandwiches & Bagels"] as const;

const fallbackHeroProducts: HomeHeroProduct[] = [
  {
    id: -1,
    name: "Iced Latte",
    description: "Espresso and milk served over ice for a refreshing coffee drink.",
    price: 5.5,
    imageUrl: "/menu/coffee/iced-caramel-macchiato.jpg",
    category: "Coffee",
    preparationTag: "Cold Drinks",
  },
  {
    id: -2,
    name: "Strawberry Limeade",
    description: "Fresh lime juice blended with strawberry purée for a refreshing, tangy drink.",
    price: 5.0,
    imageUrl: "/menu/matcha/strawberry-matcha.webp",
    category: "Lemonade",
    preparationTag: "Limeade",
  },
  {
    id: -3,
    name: "Mannino Honey Crepe",
    description: "A sweet crepe drizzled with Mannino honey and topped with mixed berries.",
    price: 10.0,
    imageUrl: "/menu/cakes-sweets/raspberry-slice.webp",
    category: "Crepes",
    preparationTag: "Sweet Crepe",
  },
  {
    id: -4,
    name: "Travis Special",
    description: "Cream cheese, salmon, spinach, and a fried egg served on a freshly toasted bagel.",
    price: 14.0,
    imageUrl: "/menu/sandwiches-bagels/avocado-bagel.webp",
    category: "Sandwiches & Bagels",
    preparationTag: "Bagel",
  },
];

function mapHeroProduct(item: MenuItem): HomeHeroProduct {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    imageUrl: item.imageUrl,
    category: item.category,
    preparationTag: item.preparationTag,
  };
}

function getHeroCategoryRank(category: string) {
  const rank = homeHeroCategoryPriority.indexOf(category as (typeof homeHeroCategoryPriority)[number]);
  return rank === -1 ? homeHeroCategoryPriority.length : rank;
}

function selectHeroProducts(menuItems: MenuItem[]) {
  const availableItems = menuItems
    .filter((item) => item.isAvailable && item.imageUrl && item.category !== "Gifts")
    .sort((left, right) =>
      Number(right.isFeatured) - Number(left.isFeatured)
      || getHeroCategoryRank(left.category) - getHeroCategoryRank(right.category)
      || left.name.localeCompare(right.name));

  const byCategory = homeHeroCategoryPriority
    .map((category) => availableItems.find((item) => item.category === category))
    .filter((item): item is MenuItem => !!item);

  const selectedItems = [...byCategory];
  availableItems.forEach((item) => {
    if (selectedItems.some((selectedItem) => selectedItem.id === item.id)) {
      return;
    }

    selectedItems.push(item);
  });

  return selectedItems.slice(0, 4).map(mapHeroProduct);
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

function HomeHeroProductCard({
  product,
  className,
  compact = false,
}: {
  product: HomeHeroProduct;
  className: string;
  compact?: boolean;
}) {
  return (
    <article className={`home-hero-product-card ${className}`}>
      <div className="home-hero-product-media">
        <img
          alt={product.name}
          className="home-hero-product-image"
          src={resolveApiAssetUrl(product.imageUrl)}
        />
      </div>
      <div className="home-hero-product-copy">
        <span className="home-hero-product-tag">{product.preparationTag}</span>
        <strong>{product.name}</strong>
        {compact ? null : <p>{product.description}</p>}
        <span className="home-hero-product-price">{formatPrice(product.price)}</span>
      </div>
    </article>
  );
}

export default function HomePage({ navigate }: PageProps) {
  const [locations, setLocations] = useState<Location[]>(fallbackLocations);
  const [heroProducts, setHeroProducts] = useState<HomeHeroProduct[]>(fallbackHeroProducts);

  useEffect(() => {
    let isMounted = true;

    void Promise.allSettled([
      locationsApi.getLocations(),
      menuApi.getMenu(),
    ])
      .then(([locationsResult, menuResult]) => {
        if (!isMounted) {
          return;
        }

        if (locationsResult.status === "fulfilled" && locationsResult.value.length > 0) {
          setLocations(locationsResult.value);
        }

        if (menuResult.status === "fulfilled" && menuResult.value.length > 0) {
          const curatedProducts = selectHeroProducts(menuResult.value);
          if (curatedProducts.length > 0) {
            setHeroProducts(curatedProducts);
          }
        }
      })
      .catch(() => undefined);

    return () => { isMounted = false; };
  }, []);

  const featuredLocation = locations[0] ?? fallbackLocations[0];
  const featuredProfile = getProfile(featuredLocation, 0);
  const [primaryProduct, leftProduct, rightProduct, ribbonProduct] = heroProducts;

  return (
    <div className="store-showcase">
      {/* Hero */}
      <section className="store-hero home-store-hero">
        <CommerceTopRail navigate={navigate} />

        <button
          aria-label={`Order now from ${featuredLocation.name}`}
          className="store-order-orbit home-order-orbit"
          onClick={() => navigate("/menu")}
          type="button"
        >
          <svg aria-hidden="true" className="store-order-orbit-ring" viewBox="0 0 280 280">
            <defs>
              <path
                id="store-order-arc-home"
                d="M140 30 a110 110 0 1 1 0 220 a110 110 0 1 1 0 -220"
              />
            </defs>
            <text>
              <textPath href="#store-order-arc-home" startOffset="50%" textAnchor="middle">
                ORDER NOW • ORDER NOW • ORDER NOW • ORDER NOW
              </textPath>
            </text>
          </svg>
          <span className="store-order-orbit-core">
            <StoreOrderIcon />
          </span>
        </button>

        <div className="store-hero-grid home-store-hero-grid">
          <div className="home-hero-copy-block">
            <p className="home-hero-kicker">{featuredLocation.name} spotlight</p>

            <div className="home-store-copy">
              <span aria-hidden="true" className="store-wordmark-splash" />
              <h1 className="store-display">
                <span className="store-display-top">CAFFEINATED</span>
                <span className="store-display-bottom">LIONS</span>
              </h1>
            </div>
            <div className="home-hero-actions">
              <button className="commerce-primary-button" onClick={() => navigate("/menu")} type="button">
                Shop the menu
              </button>
              <button className="commerce-secondary-button" onClick={() => navigate("/stores")} type="button">
                Visit {featuredLocation.name}
              </button>
            </div>

            <div className="home-hero-highlights">
              <article className="home-hero-highlight">
                <span>Open today</span>
                <strong>{featuredProfile.hours}</strong>
              </article>
              <article className="home-hero-highlight">
                <span>Reserve flow</span>
                <strong>{featuredProfile.pickup}</strong>
              </article>
            </div>
          </div>

          <div className="home-hero-stage">
            {leftProduct ? (
              <HomeHeroProductCard
                className="home-hero-product-card-left home-hero-product-card-compact"
                compact
                product={leftProduct}
              />
            ) : null}

            {primaryProduct ? (
              <HomeHeroProductCard
                className="home-hero-product-card-main"
                product={primaryProduct}
              />
            ) : null}

            {rightProduct ? (
              <HomeHeroProductCard
                className="home-hero-product-card-right home-hero-product-card-compact"
                compact
                product={rightProduct}
              />
            ) : null}

            {ribbonProduct ? (
              <article className="home-hero-ribbon">
                <img
                  alt={ribbonProduct.name}
                  className="home-hero-ribbon-image"
                  src={resolveApiAssetUrl(ribbonProduct.imageUrl)}
                />
                <div className="home-hero-ribbon-copy">
                  <span>Next up</span>
                  <strong>{ribbonProduct.name}</strong>
                </div>
                <span className="home-hero-ribbon-price">{formatPrice(ribbonProduct.price)}</span>
              </article>
            ) : null}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="home-quote-section">
        <blockquote className="home-quote">
          <span className="home-quote-mark">&ldquo;</span>
          <p>Coffee is a language in itself. Every cup tells a story of care, craft, and community.</p>
          <cite>- The Lions Roastery</cite>
        </blockquote>
      </section>

      {/* Features */}
      <section className="home-features-section">
        <div className="home-section-header">
          <p className="commerce-kicker">Why Caffeinated Lions</p>
          <h2>More than just coffee</h2>
        </div>
        <div className="home-features-grid">
          <div className="home-feature-card">
            <img
              src="https://images.unsplash.com/photo-1587384178911-b70b8df870a4?q=80&w=687&auto=format&fit=crop"
              alt="Coffee beans"
              className="home-feature-img"
            />
            <h3>Craft Roasts</h3>
            <p>Single-origin beans sourced from family farms. Roasted fresh every week at our Hammond facility.</p>
          </div>
          <div className="home-feature-card">
            <img
              src="/table-reservation.png"
              alt="Table reservation"
              className="home-feature-img"
            />
            <h3>Table Reservation</h3>
            <p>Reserve your spot at any of our three Louisiana locations. Book a table in seconds from your phone.</p>
          </div>
          <div className="home-feature-card">
            <img
              src="/lion-rewards.jpg"
              alt="Lions Rewards"
              className="home-feature-img"
            />
            <h3>Lions Rewards</h3>
            <p>Earn 10 points per $1 spent. Redeem rewards starting at 1000 points.</p>
          </div>
          <div className="home-feature-card">
            <img
              src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=240&fit=crop"
              alt="Cozy cafe interior"
              className="home-feature-img"
            />
            <h3>Dine-In Comfort</h3>
            <p>Three cozy locations with free Wi-Fi, ample seating, and the perfect atmosphere to work or unwind.</p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="home-how-section">
        <div className="home-section-header">
          <p className="commerce-kicker">Simple as a pour-over</p>
          <h2>How it works</h2>
        </div>
        <div className="home-steps-grid">
          <div className="home-step">
            <div className="home-step-number">01</div>
            <h3>Browse the menu</h3>
            <p>Explore our full menu of espresso drinks, cold brews, pastries, and seasonal specials. Then reserve your spot.</p>
          </div>
          <div className="home-step-divider" aria-hidden="true" />
          <div className="home-step">
            <div className="home-step-number">02</div>
            <h3>Choose your table</h3>
            <p>Pick a location, select your party size, and add any special notes. We'll have everything ready for you.</p>
          </div>
          <div className="home-step-divider" aria-hidden="true" />
          <div className="home-step">
            <div className="home-step-number">03</div>
            <h3>Reserve or dine in</h3>
            <p>Book a table at any of our three Louisiana locations, or walk in and enjoy our dine-in experience.</p>
          </div>
        </div>
        <div className="home-how-cta">
          <button className="commerce-primary-button" onClick={() => navigate("/checkout")} type="button">
            Reserve a table
          </button>
          <button className="commerce-secondary-button" onClick={() => navigate("/stores")} type="button">
            Find a location
          </button>
        </div>
      </section>

      {/* Locations Preview */}
      <section className="home-locations-section">
        <div className="home-section-header">
          <p className="commerce-kicker">Three locations across Louisiana</p>
          <h2>Find your Lions</h2>
        </div>
        <div className="home-locations-grid">
          {locations.slice(0, 3).map((loc, i) => {
            const profile = getProfile(loc, i);
            return (
              <button
                key={loc.id}
                className="home-location-card"
                onClick={() => navigate("/stores")}
                type="button"
              >
                <p className="home-location-name">{loc.name}</p>
                <p className="home-location-address">{loc.address}</p>
                <p className="home-location-hours">{profile.hours}</p>
                <p className="home-location-pickup">{profile.pickup}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="home-footer-cta">
        <div className="home-footer-cta-inner">
          <h2>Ready for your next cup?</h2>
          <p>Join thousands of Lions fans enjoying fresh coffee, fast service, and great rewards.</p>
          <div className="home-footer-cta-buttons">
            <button className="commerce-primary-button" onClick={() => navigate("/menu")} type="button">
              Order now
            </button>
            <button className="commerce-secondary-button" onClick={() => navigate("/signup")} type="button">
              Create account
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
