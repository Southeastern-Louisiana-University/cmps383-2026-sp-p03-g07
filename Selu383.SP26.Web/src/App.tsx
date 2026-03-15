import { useEffect, useState } from "react";
import "./App.css";
import { API_BASE_URL } from "./services/api";

type Location = {
  id: number;
  name: string;
  address: string;
  tableCount: number;
};

function App() {
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

  return (
    <div style={{ padding: "20px" }}>
      <h1>Caffeinated Lions</h1>
      <h2>Locations</h2>

      {loading && <p>Loading locations...</p>}
      {error && <p>{error}</p>}

      {!loading && !error && locations.length === 0 && (
        <p>No locations found.</p>
      )}

      {!loading &&
        !error &&
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
            <p>{location.tableCount} tables available for seating</p>
          </div>
        ))}
    </div>
  );
}

export default App;
