import { useEffect, useState } from "react";
import { getLocations } from "../services/locationService";
import type { Location } from "../services/locationService";

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getLocations()
      .then(setLocations)
      .catch(() => setError("Could not load locations."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading locations...</div>;
  if (error) return <div className="loading">{error}</div>;

  return (
    <div className="page">
      <h1 className="page-title">Our Locations</h1>
      <div className="locations-grid">
        {locations.map((loc) => (
          <div key={loc.id} className="location-card">
            <h3>{loc.name}</h3>
            <div className="location-detail">
              <span>📍</span>
              <span>{loc.address}, {loc.city}, {loc.state} {loc.zip}</span>
            </div>
            {loc.phone && (
              <div className="location-detail">
                <span>📞</span>
                <span>{loc.phone}</span>
              </div>
            )}
            {loc.hoursOfOperation && (
              <div className="location-detail">
                <span>🕐</span>
                <span>{loc.hoursOfOperation}</span>
              </div>
            )}
            <div className="location-detail">
              <span>🪑</span>
              <span>{loc.tableCount} tables</span>
            </div>
            {loc.latitude !== 0 && (
              <a
                href={`https://maps.google.com/?q=${loc.latitude},${loc.longitude}`}
                target="_blank"
                rel="noreferrer"
                style={{ display: "inline-block", marginTop: "0.75rem", fontSize: "0.85rem" }}
              >
                View on Google Maps →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
