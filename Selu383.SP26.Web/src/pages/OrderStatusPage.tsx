import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../services/api";
import type { Order } from "../services/orderService";

const STATUS_STEPS = ["Received", "Preparing", "Ready", "Completed"];

function StatusBar({ status }: { status: string }) {
  const idx = STATUS_STEPS.indexOf(status);
  return (
    <div style={{ display: "flex", alignItems: "center", margin: "2rem 0" }}>
      {STATUS_STEPS.map((step, i) => (
        <div key={step} style={{ display: "flex", alignItems: "center", flex: i < STATUS_STEPS.length - 1 ? 1 : undefined }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: i <= idx ? "var(--espresso)" : "var(--border)",
            color: i <= idx ? "#fff" : "var(--text-muted)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: "0.85rem", flexShrink: 0,
            transition: "background 0.3s",
          }}>
            {i < idx ? "✓" : i + 1}
          </div>
          <div style={{ fontSize: "0.75rem", textAlign: "center", color: i <= idx ? "var(--espresso)" : "var(--text-muted)", position: "absolute", top: 44, marginLeft: -18, whiteSpace: "nowrap" }}>
            {step}
          </div>
          {i < STATUS_STEPS.length - 1 && (
            <div style={{ flex: 1, height: 3, background: i < idx ? "var(--espresso)" : "var(--border)", transition: "background 0.3s" }} />
          )}
        </div>
      ))}
    </div>
  );
}

const STATUS_MESSAGES: Record<string, { icon: string; msg: string }> = {
  Received: { icon: "📋", msg: "Your order has been received and is in the queue." },
  Preparing: { icon: "☕", msg: "Your order is being prepared by our baristas!" },
  Ready: { icon: "🎉", msg: "Your order is ready! Come pick it up." },
  Completed: { icon: "✅", msg: "Order completed. Thank you for choosing Caffeinated Lions!" },
};

export default function OrderStatusPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const prevStatusRef = useRef("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 5000);
  };

  const fetchOrder = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${id}`);
      if (!res.ok) { setError("Order not found."); return; }
      const data: Order = await res.json();
      if (prevStatusRef.current && data.status !== prevStatusRef.current) {
        if (data.status === "Ready") showToast("Your order is ready for pickup!");
        else if (data.status === "Preparing") showToast("Your order is now being prepared!");
        else if (data.status === "Completed") showToast("Order completed. Thank you!");
      }
      prevStatusRef.current = data.status;
      setOrder(data);
    } catch {
      setError("Could not load order.");
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [id]);

  if (error) {
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: "3rem" }}>
        <p className="error-msg">{error}</p>
        <button className="btn-primary" style={{ marginTop: "1rem" }} onClick={() => navigate("/")}>Go Home</button>
      </div>
    );
  }

  if (!order) {
    return <div className="loading">Loading order status...</div>;
  }

  const statusInfo = STATUS_MESSAGES[order.status] ?? { icon: "📦", msg: order.status };

  return (
    <div className="page" style={{ maxWidth: 600, margin: "0 auto" }}>
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 1000,
          background: "var(--espresso)", color: "#fff",
          padding: "1rem 1.5rem", borderRadius: 10,
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          fontWeight: 600, fontSize: "0.95rem",
          animation: "fadeIn 0.3s ease",
        }}>
          {toast}
        </div>
      )}
      <h1 className="page-title">Order #{order.id}</h1>

      <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>{statusInfo.icon}</div>
        <h2 style={{ color: "var(--espresso)", marginBottom: "0.5rem" }}>{order.status}</h2>
        <p style={{ color: "var(--text-muted)" }}>{statusInfo.msg}</p>

        <StatusBar status={order.status} />

        {order.status === "Ready" && (
          <div style={{ background: "#e8f5e9", border: "1px solid #27ae60", borderRadius: 8, padding: "1rem", marginTop: "1rem" }}>
            <p style={{ color: "#27ae60", fontWeight: 700 }}>Your order is ready for pickup!</p>
          </div>
        )}

        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "1.5rem" }}>
          Auto-refreshes every 5 seconds
        </p>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h3 style={{ color: "var(--espresso)", marginBottom: "1rem" }}>Order Details</h3>
        <div style={{ marginBottom: "0.5rem" }}>
          <span style={{ color: "var(--text-muted)" }}>Type:</span>{" "}
          <span style={{ fontWeight: 600 }}>{order.orderType}</span>
        </div>
        {order.items && order.items.length > 0 && (
          <>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", marginTop: "0.75rem" }}>
              {order.items.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span>{item.name} x {item.quantity}</span>
                  <span style={{ fontWeight: 600 }}>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </>
        )}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", marginTop: "0.5rem", display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
          <span>Total</span>
          <span style={{ color: "var(--espresso)" }}>${order.total.toFixed(2)}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
        <button className="btn-secondary" style={{ flex: 1 }} onClick={() => navigate("/menu")}>
          Order Again
        </button>
        <button className="btn-primary" style={{ flex: 1 }} onClick={() => navigate("/")}>
          Go Home
        </button>
      </div>
    </div>
  );
}
