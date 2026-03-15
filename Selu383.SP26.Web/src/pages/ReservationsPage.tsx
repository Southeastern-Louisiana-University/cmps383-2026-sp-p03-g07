import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { createReservation } from "../services/reservationService";
import { getLocations } from "../services/locationService";
import type { Location } from "../services/locationService";

export default function ReservationsPage() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState("2");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getLocations().then(setLocations).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setError("You must be logged in to make a reservation."); return; }
    if (!locationId) { setError("Please select a location."); return; }
    setError("");
    setSubmitting(true);

    try {
      const reservationTime = new Date(`${date}T${time}`).toISOString();
      await createReservation({
        userId: user.id,
        locationId: parseInt(locationId),
        reservationTime,
        partySize: parseInt(partySize),
        status: "Confirmed",
      });
      setSuccess(true);
    } catch {
      setError("Failed to create reservation. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: "4rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
        <h2 style={{ color: "var(--espresso)", marginBottom: "0.75rem" }}>Reservation Confirmed!</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>We'll see you then. Check your account for details.</p>
        <button className="btn-primary" onClick={() => { setSuccess(false); setDate(""); setTime(""); }}>
          Make Another
        </button>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="page">
      <h1 className="page-title">Reserve a Table</h1>
      <div style={{ maxWidth: "480px" }}>
        <form onSubmit={handleSubmit} className="card">
          <div className="form-group">
            <label>Location</label>
            <select value={locationId} onChange={(e) => setLocationId(e.target.value)} required>
              <option value="">Select a location...</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Date</label>
            <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Time</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Party Size</label>
            <select value={partySize} onChange={(e) => setPartySize(e.target.value)}>
              {[1,2,3,4,5,6,7,8].map((n) => (
                <option key={n} value={n}>{n} {n === 1 ? "person" : "people"}</option>
              ))}
            </select>
          </div>
          {!user && (
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
              <a href="/login">Log in</a> to reserve a table.
            </p>
          )}
          {error && <p className="error-msg">{error}</p>}
          <button className="btn-primary" type="submit" disabled={submitting || !user} style={{ width: "100%" }}>
            {submitting ? "Reserving..." : "Reserve Table"}
          </button>
        </form>
      </div>
    </div>
  );
}
