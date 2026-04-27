import { useEffect, useMemo, useState } from "react";
import { locationsApi } from "../api/locationsApi";
import { orderApi } from "../api/orderApi";
import { paymentsApi } from "../api/paymentsApi";
import { useAuth } from "../store/authStore";
import { useCart } from "../store/cartStore";
import type { Location } from "../types/location.types";
import type { PageProps } from "../types/router.types";
import { filterRewardsExclusiveNamedItems } from "../utils/rewardsExclusiveItems";
import { calculatePointsEarned } from "../utils/rewardsProgram";
import { CommerceTopRail } from "./commerceShared";

const orderTypes = [
  { value: "pickup", label: "Pickup" },
  { value: "drive-thru", label: "Drive-thru" },
];

function formatCardNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

export default function CheckoutPage({ navigate }: PageProps) {
  const { user } = useAuth();
  const { clear, items } = useCart();
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState(1);
  const [orderType, setOrderType] = useState("pickup");
  const [pickupName, setPickupName] = useState(user?.userName ?? "");
  const [pickupNameError, setPickupNameError] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const visibleItems = useMemo(() => filterRewardsExclusiveNamedItems(items), [items]);
  const visibleSubtotal = useMemo(
    () => visibleItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [visibleItems],
  );

  useEffect(() => {
    let isMounted = true;
    void locationsApi.getLocations().then((nextLocations) => {
      if (!isMounted) return;
      setLocations(nextLocations);
      if (nextLocations[0]) setLocationId(nextLocations[0].id);
    }).catch(() => undefined);
    return () => { isMounted = false; };
  }, []);

  const isReady = useMemo(() => visibleItems.length > 0, [visibleItems.length]);
  const selectedLocation = locations.find((location) => location.id === locationId);
  const selectedOrderType = orderTypes.find((option) => option.value === orderType)?.label ?? "Pickup";
  const pointsEarned = calculatePointsEarned(visibleSubtotal);

  async function submitCheckout() {
    if (!isReady) return;

    if (!pickupName.trim()) {
      setPickupNameError("Pickup name is required.");
      return;
    }

    setSubmitting(true);
    setStatusMessage("");
    setPickupNameError("");

    try {
      const order = await orderApi.createOrder({
        locationId,
        orderType,
        pickupName: pickupName.trim(),
        specialInstructions,
        total: visibleSubtotal,
        items: visibleItems.map((item) => ({
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
        amount: visibleSubtotal,
        cardLastFour: cardNumber.replace(/\s/g, "").slice(-4) || "0000",
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
        <CommerceTopRail activeTab="reserve" navigate={navigate} />
      </header>

      <section className="commerce-canvas">
        <section className="commerce-hero reserve-hero">
          <div className="commerce-hero-copy">
            <p className="commerce-kicker">Reservation</p>
            <h1>BOOK YOUR TABLE</h1>
            <p className="commerce-hero-description">
              Set the store, choose how you want the order handled, and keep payment details ready so the
              checkout feels as smooth as the rest of the experience.
            </p>
            <div className="commerce-hero-pills">
              <span className="commerce-hero-pill">{selectedLocation?.name ?? "Choose a store"}</span>
              <span className="commerce-hero-pill">{selectedOrderType}</span>
              <span className="commerce-hero-pill">{visibleItems.length} items reserved</span>
            </div>
          </div>

          <aside className="commerce-summary-card reserve-summary-card">
            <p className="commerce-panel-kicker">Payment summary</p>
            <h2>Reservation overview</h2>
            <div className="commerce-summary-row">
              <span>Items</span>
              <strong>{visibleItems.length}</strong>
            </div>
            <div className="commerce-summary-row">
              <span>Total</span>
              <strong>${visibleSubtotal.toFixed(2)}</strong>
            </div>
            <div className="commerce-summary-row">
              <span>Points after payment</span>
              <strong>{pointsEarned}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
              <button
                className="commerce-primary-button commerce-primary-button-block"
                disabled={submitting || !isReady}
                onClick={submitCheckout}
                type="button"
              >
                {submitting ? "Processing..." : "Place order"}
              </button>
            </div>
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
                <div style={{ display: "flex", justifyContent: "center", width: "100%" }} key={option.value}>
                  <button
                    className={option.value === orderType ? "reserve-type-pill active" : "reserve-type-pill"}
                    onClick={() => setOrderType(option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                </div>
              ))}
            </div>

            {!user && (
              <div style={{ padding: "12px 16px", borderRadius: 10, backgroundColor: "#fff3cd", marginBottom: 8 }}>
                <strong>Checking out as guest.</strong>{" "}
                <button className="commerce-secondary-button" style={{ marginLeft: 8, padding: "4px 12px" }} onClick={() => navigate("/login")} type="button">
                  Sign in
                </button>{" "}
                to earn points and save order history.
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
                    <option key={location.id} value={location.id}>{location.name}</option>
                  ))}
                </select>
              </label>

              <label className="commerce-field">
                <span>Pickup name <span style={{ color: "#f87171" }}>*</span></span>
                <input
                  className={`commerce-input${pickupNameError ? " commerce-input-error" : ""}`}
                  value={pickupName}
                  placeholder="Required"
                  onChange={(event) => {
                    setPickupName(event.target.value);
                    if (event.target.value.trim()) setPickupNameError("");
                  }}
                />
                {pickupNameError ? <span className="commerce-field-error">{pickupNameError}</span> : null}
              </label>

              <label className="commerce-field commerce-field-full">
                <span>Special instructions</span>
                <textarea
                  className="commerce-textarea"
                  rows={3}
                  value={specialInstructions}
                  onChange={(event) => setSpecialInstructions(event.target.value)}
                />
              </label>
            </div>

            <div className="demo-card-section">
              <div className="demo-card-header">
                <span className="demo-card-title">Card details</span>
              </div>

              <div className="demo-card-body">
                <div className="demo-card-chip">
                  <svg viewBox="0 0 36 28" fill="none" aria-hidden="true">
                    <rect x="1" y="1" width="34" height="26" rx="4" stroke="currentColor" strokeWidth="1.5" fill="rgba(200,168,75,0.12)"/>
                    <path d="M1 10h34M1 18h34M13 1v26M23 1v26" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                </div>

                <label className="commerce-field" style={{ marginTop: "0.25rem" }}>
                  <span>Card number</span>
                  <input
                    className="commerce-input demo-card-number"
                    value={cardNumber}
                    maxLength={19}
                    placeholder="0000 0000 0000 0000"
                    autoComplete="cc-number"
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    inputMode="numeric"
                  />
                </label>

                <label className="commerce-field">
                  <span>Cardholder name</span>
                  <input
                    className="commerce-input"
                    placeholder="Name on card"
                    autoComplete="cc-name"
                  />
                </label>

                <div className="demo-card-row">
                  <label className="commerce-field">
                    <span>Expiry date</span>
                    <input
                      className="commerce-input"
                      value={cardExpiry}
                      maxLength={5}
                      placeholder="MM / YY"
                      autoComplete="cc-exp"
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      inputMode="numeric"
                    />
                  </label>
                  <label className="commerce-field">
                    <span>Security code</span>
                    <input
                      className="commerce-input"
                      value={cardCvv}
                      maxLength={3}
                      placeholder="CVV"
                      autoComplete="cc-csc"
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      inputMode="numeric"
                    />
                  </label>
                </div>
              </div>
            </div>

            {statusMessage ? <p className="commerce-inline-status commerce-inline-status-error">{statusMessage}</p> : null}
          </section>

          <section className="commerce-panel reserve-order-panel">
            <div className="commerce-panel-heading">
              <div>
                <p className="commerce-panel-kicker">Current cart</p>
                <h2>Your order</h2>
              </div>
              <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
                <button className="commerce-secondary-button" onClick={() => navigate("/cart")} type="button">
                  Edit cart
                </button>
              </div>
            </div>

            {visibleItems.length === 0 ? (
              <div className="commerce-empty-state">
                <h3>Your cart is still empty.</h3>
                <p>Add menu items first, then come back here to finalize the reservation.</p>
                <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
                  <button className="commerce-primary-button" onClick={() => navigate("/menu")} type="button">
                    Browse menu
                  </button>
                </div>
              </div>
            ) : (
              <div className="reserve-lineup">
                {visibleItems.map((item) => (
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
