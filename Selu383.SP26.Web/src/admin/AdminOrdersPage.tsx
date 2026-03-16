import { useEffect, useState } from "react";
import { orderApi } from "../api/orderApi";
import type { Order } from "../types/order.types";

const statusOptions = ["Received", "Preparing", "Ready for pickup", "Completed", "Cancelled"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  function loadOrders() {
    void orderApi
      .getOrders()
      .then(setOrders)
      .catch((e: Error) => setError(e.message));
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function updateStatus(id: number, status: string) {
    setUpdatingId(id);
    try {
      await orderApi.updateStatus(id, status);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  if (error) {
    return (
      <section className="section-card">
        <h2>Orders</h2>
        <p>{error}</p>
      </section>
    );
  }

  return (
    <section className="section-card">
      <div className="section-heading">
        <h2>All orders</h2>
        <button className="secondary-button" onClick={loadOrders} type="button">Refresh</button>
      </div>

      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <div className="stack-list">
          {orders.map((order) => (
            <article className="line-item" key={order.id} style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.6rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                <div>
                  <strong>Order #{order.id}</strong>
                  <p style={{ margin: "0.1rem 0", fontSize: "0.85rem", opacity: 0.7 }}>
                    {order.orderType} - {new Date(order.createdAt).toLocaleString()}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.85rem" }}>
                    {order.items.map((i) => `${i.quantity}x ${i.itemName}`).join(", ")}
                  </p>
                </div>
                <strong>${order.total.toFixed(2)}</strong>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>Status:</span>
                {statusOptions.map((s) => (
                  <button
                    className={s === order.status ? "primary-button" : "secondary-button"}
                    disabled={updatingId === order.id}
                    key={s}
                    onClick={() => void updateStatus(order.id, s)}
                    style={{ padding: "0.25rem 0.6rem", fontSize: "0.8rem" }}
                    type="button"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
