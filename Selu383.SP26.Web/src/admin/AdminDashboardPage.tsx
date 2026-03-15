import { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import type { AdminDashboard } from "../types/admin.types";

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void adminApi
      .getDashboard()
      .then(setDashboard)
      .catch((nextError: Error) => setError(nextError.message));
  }, []);

  if (error) {
    return (
      <section className="section-card">
        <h1>Admin dashboard</h1>
        <p>{error}</p>
      </section>
    );
  }

  if (!dashboard) {
    return (
      <section className="section-card">
        <h1>Admin dashboard</h1>
        <p>Loading analytics...</p>
      </section>
    );
  }

  return (
    <div className="page-grid">
      <section className="stats-grid">
        <article className="stat-card">
          <span>Total orders</span>
          <strong>{dashboard.totalOrders}</strong>
          <p>All channels combined.</p>
        </article>
        <article className="stat-card">
          <span>Revenue</span>
          <strong>${dashboard.totalRevenue.toFixed(2)}</strong>
          <p>Approved payments only.</p>
        </article>
        <article className="stat-card">
          <span>Pending orders</span>
          <strong>{dashboard.pendingOrders}</strong>
          <p>Orders still being prepared or handed off.</p>
        </article>
        <article className="stat-card">
          <span>Gift card float</span>
          <strong>${dashboard.outstandingGiftCardBalance.toFixed(2)}</strong>
          <p>Outstanding balance across active cards.</p>
        </article>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <h2>Top products</h2>
        </div>
        <div className="stack-list">
          {dashboard.topProducts.map((product) => (
            <article className="line-item" key={product.name}>
              <div>
                <h3>{product.name}</h3>
                <p>{product.quantitySold} sold</p>
              </div>
              <strong>${product.revenue.toFixed(2)}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <h2>Low inventory</h2>
        </div>
        <div className="stack-list">
          {dashboard.lowInventoryItems.map((item) => (
            <article className="line-item" key={item.id}>
              <div>
                <h3>{item.name}</h3>
                <p>{item.category}</p>
              </div>
              <strong>{item.inventoryCount} left</strong>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
