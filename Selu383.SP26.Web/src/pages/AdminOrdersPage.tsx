import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getAllOrders, updateOrderStatus } from "../services/orderService";
import type { Order } from "../services/orderService";

const STATUS_OPTIONS = ["Received", "Preparing", "Ready", "Completed", "Cancelled"];

const STATUS_COLORS: Record<string, string> = {
  Received: "#3498db",
  Preparing: "#f39c12",
  Ready: "#27ae60",
  Completed: "#95a5a6",
  Cancelled: "#e74c3c",
};

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active");
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (!user.roles.includes("Admin")) { navigate("/"); return; }
    loadOrders();
  }, [user]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = () => {
    getAllOrders()
      .then((all) => setOrders(all.reverse()))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleStatusChange = async (orderId: number, status: string) => {
    setUpdating(orderId);
    try {
      await updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
    } catch {
      // ignore
    } finally {
      setUpdating(null);
    }
  };

  const filteredOrders = filter === "active"
    ? orders.filter((o) => !["Completed", "Cancelled"].includes(o.status))
    : filter === "completed"
    ? orders.filter((o) => o.status === "Completed")
    : orders;

  if (loading) return <div className="loading">Loading orders...</div>;

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Manage Orders</h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn-secondary" onClick={() => navigate("/admin")}>Dashboard</button>
          <button className="btn-secondary" onClick={loadOrders}>Refresh</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {["active", "completed", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "0.4rem 1rem", borderRadius: 6, border: "none", cursor: "pointer",
              background: filter === f ? "var(--espresso)" : "var(--border)",
              color: filter === f ? "#fff" : "var(--text)",
              fontWeight: filter === f ? 700 : 400,
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: "0.85rem", alignSelf: "center" }}>
          Auto-refreshes every 10s
        </span>
      </div>

      {filteredOrders.length === 0 ? (
        <p className="empty-state">No orders to show.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filteredOrders.map((order) => (
            <div key={order.id} className="card" style={{ borderLeft: `4px solid ${STATUS_COLORS[order.status] ?? "#999"}` }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--espresso)", fontSize: "1.05rem" }}>Order #{order.id}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                    {order.orderType}
                    {order.tableNumber ? ` - Table ${order.tableNumber}` : ""}
                    {" "}&bull;{" "}User #{order.userId}
                  </div>
                  {order.items && order.items.length > 0 && (
                    <div style={{ marginTop: "0.5rem" }}>
                      {order.items.map((item, i) => (
                        <span key={i} style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginRight: "0.75rem" }}>
                          {item.name} x{item.quantity}
                        </span>
                      ))}
                    </div>
                  )}
                  {order.note && (
                    <div style={{ marginTop: "0.4rem", fontSize: "0.85rem", color: "#7b4f24", background: "#fef9f0", padding: "0.3rem 0.6rem", borderRadius: 6, display: "inline-block" }}>
                      Note: {order.note}
                    </div>
                  )}
                  <div style={{ marginTop: "0.5rem", fontWeight: 600 }}>
                    ${order.total.toFixed(2)}
                    {order.discountAmount > 0 && (
                      <span style={{ color: "#27ae60", fontSize: "0.85rem", marginLeft: "0.5rem" }}>
                        (-${order.discountAmount.toFixed(2)} discount)
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
                  <span style={{
                    padding: "0.25rem 0.75rem", borderRadius: 20, fontSize: "0.8rem", fontWeight: 700,
                    background: STATUS_COLORS[order.status] ?? "#999", color: "#fff",
                  }}>
                    {order.status}
                  </span>
                  <select
                    value={order.status}
                    disabled={updating === order.id}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    style={{ padding: "0.35rem 0.75rem", borderRadius: 6, border: "1px solid var(--border)", cursor: "pointer" }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
