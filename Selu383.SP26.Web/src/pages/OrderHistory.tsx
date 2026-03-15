import { useEffect, useState } from "react";
import { orderApi } from "../api/orderApi";
import { useAuth } from "../store/authStore";
import type { Order } from "../types/order.types";
import type { PageProps } from "../types/router.types";
import { StorefrontTopRail } from "./storefrontShared";

export default function OrderHistory({ navigate, query }: PageProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setStatusMessage("");
      return;
    }

    let isMounted = true;

    void orderApi
      .getOrders()
      .then((nextOrders) => {
        if (isMounted) {
          setOrders(nextOrders);
          setStatusMessage("");
        }
      })
      .catch((error) => {
        if (isMounted) {
          setStatusMessage(error instanceof Error ? error.message : "Unable to load order history.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  if (!user) {
    return (
      <div className="commerce-page orders-page">
        <header className="commerce-topbar">
          <StorefrontTopRail activeTab="order" navigate={navigate} />
        </header>

        <section className="commerce-canvas">
          <section className="commerce-hero orders-guest-hero">
            <div className="commerce-hero-copy">
              <p className="commerce-kicker">Orders</p>
              <h1>SEE EVERY ORDER, REORDER, AND TRACK IT LIVE.</h1>
              <p className="commerce-hero-description">
                Sign in to view your order timeline, reopen favorites, and jump straight into live order
                tracking from the same storefront flow.
              </p>

              <div className="commerce-hero-pills">
                <span className="commerce-hero-pill">Past orders saved</span>
                <span className="commerce-hero-pill">One-click reorder</span>
                <span className="commerce-hero-pill">Live tracking</span>
              </div>

              <div className="commerce-hero-actions">
                <button className="commerce-primary-button" onClick={() => navigate("/login")} type="button">
                  Sign in
                </button>
                <button
                  className="commerce-secondary-button"
                  onClick={() => navigate("/login?mode=register")}
                  type="button"
                >
                  Register
                </button>
              </div>
            </div>

            <div className="orders-feature-grid">
              <article className="orders-feature-card">
                <strong>Track status</strong>
                <p>Move from received to preparing to pickup without leaving the storefront layout.</p>
              </article>
              <article className="orders-feature-card">
                <strong>Reorder favorites</strong>
                <p>Bring back a previous coffee run and jump into the new order in one action.</p>
              </article>
              <article className="orders-feature-card">
                <strong>Keep receipts together</strong>
                <p>Orders, rewards, and gift cards stay connected to the same account session.</p>
              </article>
            </div>
          </section>
        </section>
      </div>
    );
  }

  const selectedOrderId = Number(query.get("id") ?? 0);

  return (
    <div className="commerce-page orders-page">
      <header className="commerce-topbar">
        <StorefrontTopRail activeTab="order" navigate={navigate} />
      </header>

      <section className="commerce-canvas">
        <section className="commerce-hero orders-hero">
          <div className="commerce-hero-copy">
            <p className="commerce-kicker">Orders</p>
            <h1>YOUR STOREFRONT HISTORY, ALL IN ONE TIMELINE.</h1>
            <p className="commerce-hero-description">
              Review previous visits, track the current order, and reopen a favorite run without leaving
              the Lions visual system.
            </p>

            <div className="commerce-hero-pills">
              <span className="commerce-hero-pill">{orders.length} orders</span>
              <span className="commerce-hero-pill">{selectedOrderId ? `Selected #${selectedOrderId}` : "History view"}</span>
              <span className="commerce-hero-pill">{user.points} stars on account</span>
            </div>

            {statusMessage ? <p className="commerce-inline-status commerce-inline-status-error">{statusMessage}</p> : null}
          </div>

          <aside className="commerce-summary-card orders-summary-card">
            <p className="commerce-panel-kicker">Snapshot</p>
            <h2>Order overview</h2>

            <div className="commerce-summary-row">
              <span>Total orders</span>
              <strong>{orders.length}</strong>
            </div>
            <div className="commerce-summary-row">
              <span>Latest status</span>
              <strong>{orders[0]?.status ?? "No orders yet"}</strong>
            </div>
            <div className="commerce-summary-row">
              <span>Latest total</span>
              <strong>{orders[0] ? `$${orders[0].total.toFixed(2)}` : "--"}</strong>
            </div>
          </aside>
        </section>

        <section className="commerce-panel">
          <div className="commerce-panel-heading">
            <div>
              <p className="commerce-panel-kicker">Past orders and reorder</p>
              <h2>Order history</h2>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="commerce-empty-state">
              <h3>No orders yet.</h3>
              <p>Start with the menu, place your first order, and your history will show up here.</p>
              <button className="commerce-primary-button" onClick={() => navigate("/menu")} type="button">
                Browse menu
              </button>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <article
                  className={selectedOrderId === order.id ? "orders-card orders-card-selected" : "orders-card"}
                  key={order.id}
                >
                  <div className="orders-card-copy">
                    <div className="orders-card-meta">
                      <span>Order #{order.id}</span>
                      <span>{new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                    <h3>{order.status}</h3>
                    <p>{order.orderType} order</p>
                    <p>{order.items.map((item) => `${item.quantity}x ${item.itemName}`).join(", ")}</p>
                  </div>

                  <div className="orders-card-actions">
                    <strong>${order.total.toFixed(2)}</strong>
                    <button
                      className="commerce-secondary-button"
                      onClick={() => navigate(`/order-status?id=${order.id}`)}
                      type="button"
                    >
                      Track
                    </button>
                    <button
                      className="commerce-primary-button"
                      onClick={async () => {
                        const newOrder = await orderApi.reorder(order.id);
                        navigate(`/order-status?id=${newOrder.id}`);
                      }}
                      type="button"
                    >
                      Reorder
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
