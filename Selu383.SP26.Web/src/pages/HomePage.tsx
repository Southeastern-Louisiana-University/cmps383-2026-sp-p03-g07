import { useEffect, useState } from "react";
import { locationsApi } from "../api/locationsApi";
import { menuApi } from "../api/menuApi";
import type { MenuItem } from "../types/menu.types";
import type { Location } from "../types/location.types";
import type { PageProps } from "../types/router.types";
import {
  StoreOrderIcon,
  StorefrontTopRail,
  fallbackLocations,
  getProfile,
} from "./storefrontShared";

export default function HomePage({ navigate }: PageProps) {
    const [locations, setLocations] = useState<Location[]>(fallbackLocations);
    const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    void locationsApi
      .getLocations()
      .then((nextLocations) => {
        if (isMounted && nextLocations.length > 0) setLocations(nextLocations);
      })
      .catch(() => undefined);
    return () => { isMounted = false; };
  }, []);

    useEffect(() => {
        let isMounted = true;
        void menuApi
            .getMenu()
            .then((items) => {
                if (isMounted) {
                    // Get featured items, or fallback to first 3 items
                    const featured = items.filter(item => item.isFeatured).slice(0, 3);
                    setFeaturedItems(featured.length > 0 ? featured : items.slice(0, 3));
                }
            })
            .catch(() => undefined);
        return () => { isMounted = false; };
    }, []);

  const featuredLocation = locations[0] ?? fallbackLocations[0];

  return (
    <div className="store-showcase">
      {/* Hero */}
      <section className="store-hero">
        <StorefrontTopRail navigate={navigate} />

        <div className="store-hero-grid">
          <button
            aria-label={`Order now from ${featuredLocation.name}`}
            className="store-order-orbit"
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

          <div className="store-copy">
            <span aria-hidden="true" className="store-wordmark-splash" />
            <h1 className="store-display">
              <span className="store-display-top">CAFFEINATED</span>
              <span className="store-display-bottom">LIONS</span>
            </h1>
          </div>
        </div>
          </section>

          {/* Featured Products */}
          <section className="home-featured-products-section">
              <div className="home-section-header">
                  <p className="commerce-kicker">Signature Favorites</p>
                  <h2>Our most-loved drinks & treats</h2>
              </div>
              <div className="home-featured-products-grid">
                  {featuredItems.map((item) => (
                      <button
                          key={item.id}
                          className="home-featured-product-card"
                          onClick={() => navigate("/menu")}
                          type="button"
                      >
                          <div className="home-featured-product-image-wrapper">
                              <img
                                  src={item.imageUrl || "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=600&fit=crop"}
                                  alt={item.name}
                                  className="home-featured-product-image"
                              />
                          </div>
                          <div className="home-featured-product-info">
                              <h3 className="home-featured-product-name">{item.name}</h3>
                              <p className="home-featured-product-description">{item.description}</p>
                              <p className="home-featured-product-price">${item.price.toFixed(2)}</p>
                          </div>
                      </button>
                  ))}
              </div>
              <div className="home-featured-products-cta">
                  <button className="commerce-primary-button" onClick={() => navigate("/menu")} type="button">
                      View full menu
                  </button>
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
            <p>Earn points on every order. Redeem for free drinks, pastries, and exclusive member perks.</p>
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
            <button className="commerce-secondary-button" onClick={() => navigate("/login?mode=register")} type="button">
              Create account
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
