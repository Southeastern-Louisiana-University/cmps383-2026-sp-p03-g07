import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getOrders } from "../services/orderService";
import type { Order } from "../services/orderService";

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reorderMsg, setReorderMsg] = useState("");

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    getOrders()
      .then((ords) => {
        setOrders(ords.filter((o) => o.userId === user.id).reverse());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleReorder = (order: Order) => {
    // We don't have order items in this simplified version, so just navigate to menu
    navigate("/menu");
    setReorderMsg(`Reordering from order #${order.id} - browse the menu to add items.`);
  };

  if (loading) return <div className="loading">Loading orders...</div>;

  return (
    <div className="page">
      <h1 className="page-title">My Orders</h1>
      {reorderMsg && <p className="success-msg" style={{ marginBottom: "1rem" }}>{reorderMsg}</p>}

      {orders.length === 0 ? (
        <div className="empty-state">
          <p style={{ marginBottom: "1rem" }}>No orders yet.</p>
          <button className="btn-primary" onClick={() => navigate("/menu")}>Browse Menu</button>
        </div>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="order-card">
            <div className="order-card-header">
              <div>
                <span style={{ fontWeight: 700, color: "var(--espresso)" }}>Order #{order.id}</span>
                <span style={{ marginLeft: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  {order.orderType} · ${order.total.toFixed(2)}
                </span>
              </div>
              <span className={`order-status ${order.status.toLowerCase()}`}>{order.status}</span>
            </div>
            <button className="btn-secondary" style={{ fontSize: "0.9rem", padding: "0.4rem 1rem" }} onClick={() => handleReorder(order)}>
              Reorder
            </button>
          </div>
        ))
      )}
    </div>
  );
}
