import { useEffect, useMemo, useState } from "react";
import { locationsApi } from "../api/locationsApi";
import { orderApi } from "../api/orderApi";
import { paymentsApi } from "../api/paymentsApi";
import { useAuth } from "../store/authStore";
import { useCart } from "../store/cartStore";
import type { Location } from "../types/location.types";
import type { PageProps } from "../types/router.types";
import { StorefrontTopRail } from "./storefrontShared";

const orderTypes = [
  { value: "pickup", label: "Pickup" },
  { value: "drive-thru", label: "Drive-thru" },
  { value: "dine-in", label: "Dine-in" },
];

export default function CheckoutPage({ navigate }: PageProps) {
  const { user } = useAuth();
  const { clear, items, subtotal } = useCart();
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState(1);
  const [orderType, setOrderType] = useState("pickup");
  const [pickupName, setPickupName] = useState(user?.userName ?? "");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [giftCardCode, setGiftCardCode] = useState("");
  const [cardLastFour, setCardLastFour] = useState("4242");
  const [statusMessage, setStatusMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void locationsApi
      .getLocations()
      .then((nextLocations) => {
        if (!isMounted) {
          return;
        }

        setLocations(nextLocations);
        if (nextLocations[0]) {
          setLocationId(nextLocations[0].id);
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const isReady = useMemo(() => items.length > 0, [items.length]);
  const selectedLocation = locations.find((location) => location.id === locationId);
  const selectedOrderType = orderTypes.find((option) => option.value === orderType)?.label ?? "Pickup";
  const starsEarned = Math.max(Math.floor(subtotal), 1);

  async function submitCheckout() {
    if (!isReady) {
      return;
    }

    setSubmitting(true);
    setStatusMessage("");

    try {
      const order = await orderApi.createOrder({
        locationId,
        orderType,
        pickupName,
        specialInstructions,
        total: subtotal,
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          itemName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          total: item.price * item.quantity,
          customizations: item.customizations,
          specialInstructions: "",
        })),
      });

      await paymentsApi.checkout({
        orderId: order.id,
        paymentMethod: "Card",
        amount: subtotal,
        giftCardCode,
        cardLastFour,
      });

      clear();
      navigate(`/orders?id=${order.id}`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Checkout failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="commerce-page reserve-page">
      <header className="commerce-topbar">
        <StorefrontTopRail activeTab="reserve" navigate={navigate} />
      </header>

      <section className="commerce-canvas">
        <section className="commerce-hero reserve-hero">
          <div className="commerce-hero-copy">
            <p className="commerce-kicker">Reservation</p>
            <h1>LOCK IN YOUR NEXT PICKUP.</h1>
            <p className="commerce-hero-description">
              Set the store, choose how you want the order handled, and keep payment details ready so the
              checkout feels as smooth as the storefront.
            </p>

            <div className="commerce-hero-pills">
              <span className="commerce-hero-pill">{selectedLocation?.name ?? "Choose a store"}</span>
              <span className="commerce-hero-pill">{selectedOrderType}</span>
              <span className="commerce-hero-pill">{items.length} items reserved</span>
            </div>
          </div>

          <aside className="commerce-summary-card reserve-summary-card">
            <p className="commerce-panel-kicker">Payment summary</p>
            <h2>Reservation overview</h2>

            <div className="commerce-summary-row">
              <span>Items</span>
              <strong>{items.length}</strong>
            </div>
            <div className="commerce-summary-row">
              <span>Total</span>
              <strong>${subtotal.toFixed(2)}</strong>
            </div>
            <div className="commerce-summary-row">
              <span>Stars after payment</span>
              <strong>{starsEarned}</strong>
            </div>

            <button
              className="commerce-primary-button commerce-primary-button-block"
              disabled={submitting || !isReady}
              onClick={submitCheckout}
              type="button"
            >
              {submitting ? "Processing..." : "Place order"}
            </button>
          </aside>
        </section>

        <section className="reserve-content-grid">
          <section className="commerce-panel reserve-form-panel">
            <div className="commerce-panel-heading">
              <div>
                <p className="commerce-panel-kicker">Cart to payment</p>
                <h2>Reservation details</h2>
              </div>
            </div>

            <div className="reserve-order-type-row">
              {orderTypes.map((option) => (
                <button
                  className={option.value === orderType ? "reserve-type-pill active" : "reserve-type-pill"}
                  key={option.value}
                  onClick={() => setOrderType(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>

            {!user && (
              <div style={{ padding: "12px 16px", borderRadius: 10, backgroundColor: "#fff3cd", marginBottom: 8 }}>
                <strong>Checking out as guest.</strong> <button className="commerce-secondary-button" style={{ marginLeft: 8, padding: "4px 12px" }} onClick={() => navigate("/login")} type="button">Sign in</button> to earn stars and save order history.
              </div>
            )}

            <div className="reserve-form-grid">
              <label className="commerce-field">
                <span>Store</span>
                <select
                  className="commerce-select"
                  value={locationId}
                  onChange={(event) => setLocationId(Number(event.target.value))}
                >
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="commerce-field">
                <span>Pickup name</span>
                <input
                  className="commerce-input"
                  value={pickupName}
                  onChange={(event) => setPickupName(event.target.value)}
                />
              </label>

              <label className="commerce-field">
                <span>Gift card code</span>
                <input
                  className="commerce-input"
                  placeholder="Optional"
                  value={giftCardCode}
                  onChange={(event) => setGiftCardCode(event.target.value)}
                />
              </label>

              <label className="commerce-field">
                <span>Card last four</span>
                <input
                  className="commerce-input"
                  maxLength={4}
                  value={cardLastFour}
                  onChange={(event) => setCardLastFour(event.target.value)}
                />
              </label>

              <label className="commerce-field commerce-field-full">
                <span>Special instructions</span>
                <textarea
                  className="commerce-textarea"
                  rows={4}
                  value={specialInstructions}
                  onChange={(event) => setSpecialInstructions(event.target.value)}
                />
              </label>
            </div>

            {statusMessage ? <p className="commerce-inline-status commerce-inline-status-error">{statusMessage}</p> : null}
          </section>

          <section className="commerce-panel reserve-order-panel">
            <div className="commerce-panel-heading">
              <div>
                <p className="commerce-panel-kicker">Current cart</p>
                <h2>Your order</h2>
              </div>
              <button className="commerce-secondary-button" onClick={() => navigate("/cart")} type="button">
                Edit cart
              </button>
            </div>

            {items.length === 0 ? (
              <div className="commerce-empty-state">
                <h3>Your cart is still empty.</h3>
                <p>Add menu items first, then come back here to finalize the reservation.</p>
                <button className="commerce-primary-button" onClick={() => navigate("/menu")} type="button">
                  Browse menu
                </button>
              </div>
            ) : (
              <div className="reserve-lineup">
                {items.map((item) => (
                  <article className="reserve-line-card" key={item.id}>
                    <div className="reserve-line-copy">
                      <span>{item.quantity}x</span>
                      <div>
                        <strong>{item.name}</strong>
                        <p>{item.customizations || "Standard build"}</p>
                      </div>
                    </div>
                    <strong>${(item.price * item.quantity).toFixed(2)}</strong>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </section>
    </div>
  );
}
