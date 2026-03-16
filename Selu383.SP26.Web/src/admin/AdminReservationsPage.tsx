import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import type { Reservation } from "../types/location.types";

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void apiRequest<Reservation[]>("/api/reservations")
      .then(setReservations)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <section className="section-card">
        <h2>Reservations</h2>
        <p>{error}</p>
      </section>
    );
  }

  return (
    <section className="section-card">
      <div className="section-heading">
        <h2>All reservations ({reservations.length})</h2>
      </div>

      {reservations.length === 0 ? (
        <p>No reservations yet.</p>
      ) : (
        <div className="stack-list">
          {reservations.map((r) => (
            <article className="line-item" key={r.id}>
              <div>
                <h3>Reservation #{r.id}</h3>
                <p>Party of {r.partySize} - Location #{r.locationId}</p>
                <p>{new Date(r.reservationTime).toLocaleString()}</p>
              </div>
              <strong style={{ textTransform: "capitalize" }}>{r.status}</strong>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
