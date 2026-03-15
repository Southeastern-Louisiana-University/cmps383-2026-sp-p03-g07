import { useEffect, useState } from "react";
import { API_BASE_URL } from "../services/api";

type Location = {
  id: number;
  name: string;
  address: string;
  isOpen: boolean;
};

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/locations`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setLocations(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load locations:", err);
        setError("Could not load locations.");
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading locations...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Locations</h1>

      {locations.length === 0 ? (
        <p>No locations found.</p>
      ) : (
        locations.map((location) => (
          <div
            key={location.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "12px",
            }}
          >
            <h3>{location.name}</h3>
            <p>{location.address}</p>
            <p>{location.isOpen ? "Open" : "Closed"}</p>
          </div>
        ))
      )}
    </div>
  );
}
