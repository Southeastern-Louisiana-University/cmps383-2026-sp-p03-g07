import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { getOrders } from "../services/orderService";
import type { Order } from "../services/orderService";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reorderMsg, setReorderMsg] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    getOrders()
      .then((ords) => setOrders([...ords].reverse()))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleReorder = (order: Order) => {
    if (order.items && order.items.length > 0) {
      order.items.forEach((item) => {
        for (let i = 0; i < item.quantity; i++) {
          addItem({ id: item.menuItemId, name: item.name, price: item.price, locationId: order.locationId });
        }
      });
      setReorderMsg(`Added ${order.items.length} item(s) from Order #${order.id} to cart!`);
      setTimeout(() => setReorderMsg(""), 3000);
    } else {
      navigate("/menu");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: "0.25rem" }}>My Profile</h1>
          <p style={{ color: "var(--text-muted)" }}>@{user?.userName}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {user?.roles.includes("Admin") && (
            <button className="btn-secondary" onClick={() => navigate("/admin")}>Admin Dashboard</button>
          )}
          <button className="btn-secondary" onClick={() => navigate("/rewards")}>My Rewards</button>
          <button className="btn-secondary" style={{ color: "#e74c3c", borderColor: "#e74c3c" }} onClick={handleLogout}>Log Out</button>
        </div>
      </div>

      <h2 style={{ color: "var(--espresso)", marginBottom: "1rem" }}>Order History</h2>
      {reorderMsg && <p className="success-msg" style={{ marginBottom: "1rem" }}>{reorderMsg}</p>}

      {orders.length === 0 ? (
        <div className="empty-state">
          <p style={{ marginBottom: "1rem" }}>No orders yet.</p>
          <button className="btn-primary" onClick={() => navigate("/menu")}>Browse Menu</button>
        </div>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="card" style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <span style={{ fontWeight: 700, color: "var(--espresso)" }}>Order #{order.id}</span>
                <span style={{ marginLeft: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  {order.orderType} &bull; ${order.total.toFixed(2)}
                  {order.discountAmount > 0 && (
                    <span style={{ color: "#27ae60", marginLeft: "0.5rem" }}>(saved ${order.discountAmount.toFixed(2)})</span>
                  )}
                </span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span
                  onClick={() => navigate(`/order-status/${order.id}`)}
                  className={`order-status ${order.status.toLowerCase()}`}
                  style={{ cursor: "pointer" }}
                  title="Click to track order"
                >
                  {order.status}
                </span>
                {order.items && order.items.length > 0 && (
                  <button
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.85rem" }}
                    onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                  >
                    {expanded === order.id ? "Hide" : "Details"}
                  </button>
                )}
                <button className="btn-secondary" style={{ fontSize: "0.85rem", padding: "0.35rem 0.85rem" }} onClick={() => handleReorder(order)}>
                  Reorder
                </button>
              </div>
            </div>

            {expanded === order.id && order.items && (
              <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
                {order.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", marginBottom: "0.3rem" }}>
                    <span>{item.name} x{item.quantity}</span>
                    <span style={{ color: "var(--text-muted)" }}>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
