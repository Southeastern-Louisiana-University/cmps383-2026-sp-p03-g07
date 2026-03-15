import { useEffect, useMemo, useState } from "react";
import { orderApi } from "../api/orderApi";
import { useAuth } from "../store/authStore";
import type { Order } from "../types/order.types";
import type { PageProps } from "../types/router.types";
import { StorefrontTopRail } from "./storefrontShared";

const timelineSteps = ["Received", "Preparing", "Ready for pickup", "Completed"];

export default function OrderStatusPage({ navigate, query }: PageProps) {
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const orderId = Number(query.get("id") ?? 0);
  const currentStepIndex = useMemo(() => {
    if (!order) {
      return 0;
    }

    const foundIndex = timelineSteps.findIndex((step) => step === order.status);
    return foundIndex >= 0 ? foundIndex : 0;
  }, [order]);

  useEffect(() => {
    if (!orderId) {
      return;
    }

    void orderApi.getOrder(orderId).then(setOrder).catch(() => setOrder(null));
  }, [orderId]);

  if (!user) {
    return (
      <div className="commerce-page order-track-page">
        <header className="commerce-topbar">
          <StorefrontTopRail activeTab="order" navigate={navigate} />
        </header>

        <section className="commerce-canvas">
          <section className="commerce-hero orders-guest-hero">
            <div className="commerce-hero-copy">
              <p className="commerce-kicker">Track order</p>
              <h1>SIGN IN TO TRACK YOUR CURRENT ORDER.</h1>
              <p className="commerce-hero-description">
                Order tracking lives inside your signed-in storefront history so you can move between
                status updates, reorders, and rewards without losing context.
              </p>

              <div className="commerce-hero-actions">
                <button className="commerce-primary-button" onClick={() => navigate("/login")} type="button">
                  Sign in
                </button>
              </div>
            </div>
          </section>
        </section>
      </div>
    );
  }

  if (!orderId) {
    return (
      <div className="commerce-page order-track-page">
        <header className="commerce-topbar">
          <StorefrontTopRail activeTab="order" navigate={navigate} />
        </header>

        <section className="commerce-canvas">
          <section className="commerce-panel">
            <div className="commerce-empty-state">
              <h3>Select an order from history to track it.</h3>
              <button className="commerce-primary-button" onClick={() => navigate("/orders")} type="button">
                Go to orders
              </button>
            </div>
          </section>
        </section>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="commerce-page order-track-page">
        <header className="commerce-topbar">
          <StorefrontTopRail activeTab="order" navigate={navigate} />
        </header>

        <section className="commerce-canvas">
          <section className="commerce-panel">
            <div className="commerce-empty-state">
              <h3>Loading order details...</h3>
            </div>
          </section>
        </section>
      </div>
    );
  }

  return (
    <div className="commerce-page order-track-page">
      <header className="commerce-topbar">
        <StorefrontTopRail activeTab="order" navigate={navigate} />
      </header>

      <section className="commerce-canvas">
        <section className="commerce-hero orders-hero">
          <div className="commerce-hero-copy">
            <p className="commerce-kicker">Track order</p>
            <h1>ORDER #{order.id} IS {order.status.toUpperCase()}.</h1>
            <p className="commerce-hero-description">
              Follow the current stage of your order and jump back to history whenever you want to compare
              previous visits or place the same order again.
            </p>

            <div className="commerce-hero-pills">
              <span className="commerce-hero-pill">{order.orderType}</span>
              <span className="commerce-hero-pill">{order.paymentStatus}</span>
              <span className="commerce-hero-pill">{order.starsEarned} stars earned</span>
            </div>
          </div>

          <aside className="commerce-summary-card orders-summary-card">
            <p className="commerce-panel-kicker">Order details</p>
            <h2>Live summary</h2>

            <div className="commerce-summary-row">
              <span>Total</span>
              <strong>${order.total.toFixed(2)}</strong>
            </div>
            <div className="commerce-summary-row">
              <span>Pickup name</span>
              <strong>{order.pickupName || "Not set"}</strong>
            </div>
            <div className="commerce-summary-row">
              <span>Instructions</span>
              <strong>{order.specialInstructions || "None"}</strong>
            </div>
          </aside>
        </section>

        <section className="commerce-panel">
          <div className="commerce-panel-heading">
            <div>
              <p className="commerce-panel-kicker">Live status</p>
              <h2>Timeline</h2>
            </div>
            <button className="commerce-secondary-button" onClick={() => navigate("/orders")} type="button">
              Back to orders
            </button>
          </div>

          <div className="track-timeline">
            {timelineSteps.map((step, index) => (
              <article
                className={index <= currentStepIndex ? "track-step active" : "track-step"}
                key={step}
              >
                <span>{index + 1}</span>
                <div>
                  <strong>{step}</strong>
                  <p>{step === order.status ? "Current stage" : index < currentStepIndex ? "Completed" : "Coming up"}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}
