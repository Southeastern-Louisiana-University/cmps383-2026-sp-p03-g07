import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL } from "../services/api";

type Feedback = {
  id: number;
  userId?: number;
  orderId?: number;
  rating: number;
  comment: string;
  createdAt: string;
};

const STARS = [1, 2, 3, 4, 5];

export default function AdminFeedbackPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState(0);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (!user.roles.includes("Admin")) { navigate("/"); return; }
    fetch(`${API_BASE_URL}/api/feedback`, { credentials: "include" })
      .then((r) => r.json())
      .then((data: Feedback[]) => setFeedbacks(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const displayed = filterRating === 0 ? feedbacks : feedbacks.filter((f) => f.rating === filterRating);
  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1)
    : "N/A";

  const ratingCounts = STARS.map((s) => feedbacks.filter((f) => f.rating === s).length);

  if (loading) return <div className="loading">Loading feedback...</div>;

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Customer Feedback</h1>
        <button className="btn-secondary" onClick={() => navigate("/admin")}>Dashboard</button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "1.5rem", marginBottom: "2rem", alignItems: "center" }}>
        <div className="card" style={{ textAlign: "center", minWidth: 140 }}>
          <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--espresso)" }}>{avgRating}</div>
          <div style={{ color: "var(--amber)", fontSize: "1.2rem" }}>{"★".repeat(Math.round(Number(avgRating)))}</div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{feedbacks.length} reviews</div>
        </div>
        <div className="card">
          {STARS.slice().reverse().map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
              <span style={{ width: 20, textAlign: "right", color: "var(--text-muted)", fontSize: "0.85rem" }}>{s}★</span>
              <div style={{ flex: 1, height: 10, background: "var(--border)", borderRadius: 5, overflow: "hidden" }}>
                <div style={{ height: "100%", width: feedbacks.length > 0 ? `${(ratingCounts[s - 1] / feedbacks.length) * 100}%` : "0%", background: s >= 4 ? "#27ae60" : s === 3 ? "#f39c12" : "#e74c3c", transition: "width 0.5s" }} />
              </div>
              <span style={{ width: 24, color: "var(--text-muted)", fontSize: "0.85rem" }}>{ratingCounts[s - 1]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[0, 5, 4, 3, 2, 1].map((r) => (
          <button key={r} onClick={() => setFilterRating(r)} style={{
            padding: "0.35rem 0.9rem", borderRadius: 6, border: "none", cursor: "pointer",
            background: filterRating === r ? "var(--espresso)" : "var(--border)",
            color: filterRating === r ? "#fff" : "var(--text)",
            fontWeight: filterRating === r ? 700 : 400,
          }}>
            {r === 0 ? "All" : `${r} Stars`}
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <p className="empty-state">No feedback yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {displayed.map((f) => (
            <div key={f.id} className="card" style={{ borderLeft: `4px solid ${f.rating >= 4 ? "#27ae60" : f.rating === 3 ? "#f39c12" : "#e74c3c"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <span style={{ color: "var(--amber)", fontSize: "1.1rem" }}>{"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}</span>
                  <span style={{ marginLeft: "0.75rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    {f.userId ? `User #${f.userId}` : "Guest"}
                    {f.orderId ? ` - Order #${f.orderId}` : ""}
                  </span>
                </div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                  {new Date(f.createdAt).toLocaleDateString()}
                </span>
              </div>
              {f.comment && (
                <p style={{ margin: "0.75rem 0 0", color: "var(--text)", lineHeight: 1.5 }}>{f.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
