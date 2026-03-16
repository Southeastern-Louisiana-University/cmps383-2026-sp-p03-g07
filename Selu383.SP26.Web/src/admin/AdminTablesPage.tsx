import { useEffect, useState } from "react";
import { locationsApi } from "../api/locationsApi";
import type { Location } from "../types/location.types";

export default function AdminTablesPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void locationsApi
      .getLocations()
      .then(setLocations)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <section className="section-card">
        <h2>Tables</h2>
        <p>{error}</p>
      </section>
    );
  }

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      {locations.map((location) => (
        <section className="section-card" key={location.id}>
          <div className="section-heading">
            <h2>{location.name}</h2>
            <span>{location.tableCount} tables</span>
          </div>
          <p style={{ opacity: 0.7, marginBottom: "1rem" }}>{location.address}</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "0.5rem" }}>
            {Array.from({ length: location.tableCount }, (_, i) => i + 1).map((table) => (
              <div
                key={table}
                style={{
                  padding: "0.75rem",
                  borderRadius: "10px",
                  textAlign: "center",
                  background: "rgba(103, 119, 31, 0.15)",
                  border: "1px solid rgba(103, 119, 31, 0.3)",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                }}
              >
                T{table}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
