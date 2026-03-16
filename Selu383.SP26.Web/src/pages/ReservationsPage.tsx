import { useEffect, useState } from "react";
import { locationsApi } from "../api/locationsApi";
import { reservationApi } from "../api/reservationApi";
import { useAuth } from "../store/authStore";
import type { Location, Reservation } from "../types/location.types";
import type { PageProps } from "../types/router.types";

export default function ReservationsPage({ navigate }: PageProps) {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [locationId, setLocationId] = useState<number | null>(null);
  const [reservationDate, setReservationDate] = useState("");
  const [reservationTime, setReservationTime] = useState("");
  const [partySize, setPartySize] = useState("2");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    void locationsApi.getLocations().then((locs) => {
      setLocations(locs);
      if (locs.length > 0) setLocationId(locs[0].id);
    }).catch(() => {});

    if (user) {
      void reservationApi.getReservations().then(setReservations).catch(() => {});
    }
  }, [user]);

  if (!user) {
    return (
      <section className="section-card">
        <h1>Reservations</h1>
        <p>Sign in to book a table and view your reservations.</p>
        <button className="primary-button" onClick={() => navigate("/login")} type="button">
          Login
        </button>
      </section>
    );
  }

  async function submitReservation(e: React.FormEvent) {
    e.preventDefault();
    if (!locationId) {
      setErrorMessage("Please select a location.");
      return;
    }
    const size = parseInt(partySize, 10);
    if (!size || size < 1 || size > 20) {
      setErrorMessage("Party size must be between 1 and 20.");
      return;
    }
    if (!reservationDate || !reservationTime) {
      setErrorMessage("Please enter a date and time.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await reservationApi.create({
        locationId,
        reservationTime: `${reservationDate}T${reservationTime}:00`,
        partySize: size,
      });
      setSuccessMessage("Reservation booked successfully!");
      setReservationDate("");
      setReservationTime("");
      setPartySize("2");
      const updated = await reservationApi.getReservations().catch(() => reservations);
      setReservations(updated);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <section className="section-card">
        <p className="eyebrow">RESERVE A TABLE</p>
        <h1>Reservations</h1>
        <p>Book a table at your nearest Caffeinated Lions location.</p>
      </section>

      <section className="section-card">
        <h2>Book a table</h2>
        <form onSubmit={submitReservation} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label htmlFor="location-select" style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
              Location
            </label>
            <select
              id="location-select"
              value={locationId ?? ""}
              onChange={(e) => setLocationId(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 12,
                border: "1.5px solid #d0c5bc",
                backgroundColor: "#f6efe7",
                fontSize: 15,
              }}>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} - {loc.address}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label htmlFor="res-date" style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                Date
              </label>
              <input
                id="res-date"
                type="date"
                value={reservationDate}
                onChange={(e) => setReservationDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1.5px solid #d0c5bc",
                  backgroundColor: "#f6efe7",
                  fontSize: 15,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label htmlFor="res-time" style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                Time
              </label>
              <input
                id="res-time"
                type="time"
                value={reservationTime}
                onChange={(e) => setReservationTime(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1.5px solid #d0c5bc",
                  backgroundColor: "#f6efe7",
                  fontSize: 15,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label htmlFor="party-size" style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                Party size
              </label>
              <input
                id="party-size"
                type="number"
                value={partySize}
                onChange={(e) => setPartySize(e.target.value)}
                min={1}
                max={20}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1.5px solid #d0c5bc",
                  backgroundColor: "#f6efe7",
                  fontSize: 15,
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {errorMessage && <p style={{ color: "#b33030", margin: 0 }}>{errorMessage}</p>}
          {successMessage && <p style={{ color: "#1a6b2a", fontWeight: 600, margin: 0 }}>{successMessage}</p>}

          <button className="primary-button" type="submit" disabled={submitting} style={{ alignSelf: "flex-start" }}>
            {submitting ? "Booking..." : "Book table"}
          </button>
        </form>
      </section>

      {reservations.length > 0 && (
        <section className="section-card">
          <h2>Your reservations</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {reservations.map((res) => (
              <div
                key={res.id}
                style={{
                  padding: "14px 18px",
                  borderRadius: 14,
                  backgroundColor: "#f6efe7",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}>
                <div>
                  <strong>
                    {new Date(res.reservationTime).toLocaleString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </strong>
                  <p style={{ margin: "4px 0 0", color: "#6c5b4d", fontSize: 14 }}>
                    Party of {res.partySize}
                  </p>
                </div>
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 700,
                    backgroundColor:
                      res.status.toLowerCase() === "confirmed"
                        ? "#c8e6c9"
                        : res.status.toLowerCase() === "cancelled"
                          ? "#ffcdd2"
                          : "#e0d6cc",
                    color:
                      res.status.toLowerCase() === "confirmed"
                        ? "#1a6b2a"
                        : res.status.toLowerCase() === "cancelled"
                          ? "#b33030"
                          : "#6c5b4d",
                  }}>
                  {res.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
