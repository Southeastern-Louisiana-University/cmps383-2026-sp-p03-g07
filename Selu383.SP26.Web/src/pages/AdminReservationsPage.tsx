import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL } from "../services/api";

type Reservation = {
  id: number;
  userId: number;
  locationId: number;
  reservationTime: string;
  partySize: number;
  status: string;
};

const STATUS_OPTIONS = ["Confirmed", "Seated", "Completed", "Cancelled", "No-Show"];

const STATUS_COLORS: Record<string, string> = {
  Confirmed: "#3498db",
  Seated: "#f39c12",
  Completed: "#27ae60",
  Cancelled: "#e74c3c",
  "No-Show": "#95a5a6",
};

export default function AdminReservationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("upcoming");
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (!user.roles.includes("Admin")) { navigate("/"); return; }
    loadReservations();
  }, [user]);

  const loadReservations = () => {
    fetch(`${API_BASE_URL}/api/reservations`, { credentials: "include" })
      .then((r) => r.json())
      .then((data: Reservation[]) => setReservations(data.sort((a, b) => new Date(a.reservationTime).getTime() - new Date(b.reservationTime).getTime())))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleStatusChange = async (id: number, status: string) => {
    setUpdating(id);
    try {
      await fetch(`${API_BASE_URL}/api/reservations/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(status),
      });
      setReservations((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    } catch { /* ignore */ } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Cancel and delete this reservation?")) return;
    try {
      await fetch(`${API_BASE_URL}/api/reservations/${id}`, { method: "DELETE", credentials: "include" });
      setReservations((prev) => prev.filter((r) => r.id !== id));
    } catch { /* ignore */ }
  };

  const now = new Date();
  const displayed = filter === "upcoming"
    ? reservations.filter((r) => new Date(r.reservationTime) >= now && !["Cancelled", "No-Show", "Completed"].includes(r.status))
    : filter === "today"
    ? reservations.filter((r) => {
        const d = new Date(r.reservationTime);
        return d.toDateString() === now.toDateString();
      })
    : reservations;

  if (loading) return <div className="loading">Loading reservations...</div>;

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Reservations</h1>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn-secondary" onClick={() => navigate("/admin")}>Dashboard</button>
          <button className="btn-secondary" onClick={loadReservations}>Refresh</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {["upcoming", "today", "all"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "0.4rem 1rem", borderRadius: 6, border: "none", cursor: "pointer",
            background: filter === f ? "var(--espresso)" : "var(--border)",
            color: filter === f ? "#fff" : "var(--text)",
            fontWeight: filter === f ? 700 : 400,
          }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: "0.85rem", alignSelf: "center" }}>
          {displayed.length} reservation{displayed.length !== 1 ? "s" : ""}
        </span>
      </div>

      {displayed.length === 0 ? (
        <p className="empty-state">No reservations to show.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1rem" }}>
          {displayed.map((r) => {
            const dt = new Date(r.reservationTime);
            const isToday = dt.toDateString() === now.toDateString();
            const isPast = dt < now;
            return (
              <div key={r.id} className="card" style={{ borderLeft: `4px solid ${STATUS_COLORS[r.status] ?? "#999"}`, opacity: isPast && !["Seated", "Completed"].includes(r.status) ? 0.7 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--espresso)" }}>
                      Reservation #{r.id}
                      {isToday && <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", background: "var(--amber)", color: "#fff", padding: "0.1rem 0.5rem", borderRadius: 10 }}>Today</span>}
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                      User #{r.userId} - Location #{r.locationId}
                    </div>
                  </div>
                  <span style={{
                    padding: "0.25rem 0.75rem", borderRadius: 20, fontSize: "0.8rem", fontWeight: 700,
                    background: STATUS_COLORS[r.status] ?? "#999", color: "#fff", whiteSpace: "nowrap",
                  }}>
                    {r.status}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem", fontSize: "0.9rem" }}>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Date: </span>
                    <span style={{ fontWeight: 600 }}>{dt.toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Time: </span>
                    <span style={{ fontWeight: 600 }}>{dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Party: </span>
                    <span style={{ fontWeight: 600 }}>{r.partySize} guests</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                  <select
                    value={r.status}
                    disabled={updating === r.id}
                    onChange={(e) => handleStatusChange(r.id, e.target.value)}
                    style={{ flex: 1, padding: "0.35rem 0.5rem", borderRadius: 6, border: "1px solid var(--border)", cursor: "pointer", minWidth: 120 }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    style={{ padding: "0.35rem 0.75rem", borderRadius: 6, border: "none", cursor: "pointer", background: "#fdecea", color: "#e74c3c", fontSize: "0.85rem" }}
                    onClick={() => handleDelete(r.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
