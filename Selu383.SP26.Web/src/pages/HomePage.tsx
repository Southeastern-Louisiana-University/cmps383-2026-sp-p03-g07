import { useEffect, useState } from "react";
import { locationsApi } from "../api/locationsApi";
import type { Location } from "../types/location.types";
import type { PageProps } from "../types/router.types";
import {
  StoreOrderIcon,
  StorefrontTopRail,
  fallbackLocations,
} from "./storefrontShared";

export default function HomePage({ navigate }: PageProps) {
  const [locations, setLocations] = useState<Location[]>(fallbackLocations);

  useEffect(() => {
    let isMounted = true;

    void locationsApi
      .getLocations()
      .then((nextLocations) => {
        if (isMounted && nextLocations.length > 0) {
          setLocations(nextLocations);
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredLocation = locations[0] ?? fallbackLocations[0];

  return (
    <div className="store-showcase">
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
    </div>
  );
}
