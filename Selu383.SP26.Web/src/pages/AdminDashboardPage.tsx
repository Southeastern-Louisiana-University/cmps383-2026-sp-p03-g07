import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getAllOrders } from "../services/orderService";
import type { Order } from "../services/orderService";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (!user.roles.includes("Admin")) { navigate("/"); return; }
    getAllOrders()
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const active = orders.filter((o) => !["Completed", "Cancelled"].includes(o.status));
  const today = orders.filter((o) => o.status === "Completed");
  const revenue = today.reduce((sum, o) => sum + o.total, 0);

  const stats = [
    { label: "Active Orders", value: active.length, color: "#3498db", link: "/admin/orders" },
    { label: "Total Orders", value: orders.length, color: "var(--espresso)", link: "/admin/orders" },
    { label: "Completed", value: today.length, color: "#27ae60", link: "/admin/orders" },
    { label: "Total Revenue", value: `$${revenue.toFixed(2)}`, color: "#f39c12", link: "/admin/orders" },
  ];

  const quickLinks = [
    { label: "Manage Orders", desc: "View and update live order statuses", path: "/admin/orders", icon: "📦" },
    { label: "Manage Menu", desc: "Add, edit, or remove menu items", path: "/admin/menu", icon: "🍵" },
    { label: "Reservations", desc: "View and manage table reservations", path: "/admin/reservations", icon: "📅" },
    { label: "Customer Feedback", desc: "Read reviews and ratings from customers", path: "/admin/feedback", icon: "⭐" },
    { label: "Award Points", desc: "Give bonus points for refunds or rewards", path: "/admin/points", icon: "🎁" },
  ];

  return (
    <div className="page">
      <h1 className="page-title">Admin Dashboard</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>Welcome back, {user?.userName}!</p>

      {loading ? (
        <div className="loading">Loading stats...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
          {stats.map((s) => (
            <div
              key={s.label}
              className="card"
              style={{ textAlign: "center", cursor: "pointer", borderTop: `3px solid ${s.color}` }}
              onClick={() => navigate(s.link)}
            >
              <div style={{ fontSize: "2rem", fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ color: "var(--espresso)", marginBottom: "1rem" }}>Quick Actions</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
        {quickLinks.map((q) => (
          <div
            key={q.label}
            className="card"
            style={{ cursor: "pointer" }}
            onClick={() => navigate(q.path)}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{q.icon}</div>
            <h3 style={{ color: "var(--espresso)", marginBottom: "0.5rem" }}>{q.label}</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>{q.desc}</p>
          </div>
        ))}
      </div>

      {active.length > 0 && (
        <div style={{ marginTop: "2.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ color: "var(--espresso)" }}>Active Orders</h2>
            <button className="btn-secondary" onClick={() => navigate("/admin/orders")}>View All</button>
          </div>
          {active.slice(0, 5).map((o) => (
            <div key={o.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div>
                <span style={{ fontWeight: 700 }}>Order #{o.id}</span>
                <span style={{ marginLeft: "1rem", color: "var(--text-muted)", fontSize: "0.88rem" }}>
                  {o.orderType} - ${o.total.toFixed(2)}
                </span>
              </div>
              <span className={`order-status ${o.status.toLowerCase()}`}>{o.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
