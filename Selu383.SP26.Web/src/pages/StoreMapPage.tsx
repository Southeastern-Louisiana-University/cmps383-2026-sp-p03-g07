import { useEffect, useState } from "react";
import { locationsApi } from "../api/locationsApi";
import type { Location } from "../types/location.types";
import type { PageProps } from "../types/router.types";
import {
  StoreLocationIcon,
  StorefrontTopRail,
  fallbackLocations,
  getDirectionsUrl,
  getProfile,
} from "./storefrontShared";

export default function StoreMapPage({ navigate }: PageProps) {
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

  return (
    <div className="store-directory-page">
      <section className="store-directory-hero">
        <StorefrontTopRail activeTab="locations" navigate={navigate} />

        <div className="store-directory-grid">
          {locations.map((location, index) => {
            const profile = getProfile(location, index);

            return (
              <a
                className="store-directory-card"
                href={getDirectionsUrl(location.address)}
                key={location.id}
                rel="noreferrer"
                target="_blank"
              >
                <span className="store-directory-art">
                  <StoreLocationIcon variant={profile.icon} />
                </span>

                <h2 className="store-directory-title">
                  {profile.directoryName.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </h2>

                <p className="store-directory-address">
                  {location.address}
                  <br />
                  {profile.phone}
                </p>

                <dl className="store-directory-hours">
                  {profile.weeklyHours.map((slot) => (
                    <div className="store-directory-hours-row" key={slot.day}>
                      <dt>{slot.day}</dt>
                      <dd>{slot.hours}</dd>
                    </div>
                  ))}
                </dl>
              </a>
            );
          })}
        </div>
      </section>
    </div>
  );
}
