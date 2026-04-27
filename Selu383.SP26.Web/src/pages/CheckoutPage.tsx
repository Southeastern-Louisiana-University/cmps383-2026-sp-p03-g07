import { useEffect, useMemo, useState } from "react";
import { loadStripe, type Stripe, type StripeElements } from "@stripe/stripe-js";
import { Elements, CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { locationsApi } from "../api/locationsApi";
import { orderApi } from "../api/orderApi";
import { paymentsApi } from "../api/paymentsApi";
import { stripeApi } from "../api/stripeApi";
import { useAuth } from "../store/authStore";
import { useCart } from "../store/cartStore";
import type { Location } from "../types/location.types";
import type { PageProps } from "../types/router.types";
import { filterRewardsExclusiveNamedItems } from "../utils/rewardsExclusiveItems";
import { calculatePointsEarned } from "../utils/rewardsProgram";
import { CommerceTopRail } from "./commerceShared";

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

const orderTypes = [
  { value: "pickup", label: "Pickup" },
  { value: "drive-thru", label: "Drive-thru" },
];

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#e1e4ad",
      fontFamily: "'Inter', sans-serif",
      fontSize: "16px",
      "::placeholder": { color: "rgba(215,217,161,0.4)" },
    },
    invalid: { color: "#f87171" },
  },
};

type CheckoutFormCommonProps = PageProps & {
  stripeConfigured: boolean;
  stripe: Stripe | null;
  elements: StripeElements | null;
};

function CheckoutFormCommon({ navigate, stripeConfigured, stripe, elements }: CheckoutFormCommonProps) {
  const { user } = useAuth();
  const { clear, items } = useCart();
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState(1);
  const [orderType, setOrderType] = useState("pickup");
  const [pickupName, setPickupName] = useState(user?.userName ?? "");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [cardError, setCardError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const visibleItems = useMemo(() => filterRewardsExclusiveNamedItems(items), [items]);
  const visibleSubtotal = useMemo(
    () => visibleItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [visibleItems],
  );

  useEffect(() => {
    let isMounted = true;

    void locationsApi
      .getLocations()
      .then((nextLocations) => {
        if (!isMounted) return;
        setLocations(nextLocations);
        if (nextLocations[0]) setLocationId(nextLocations[0].id);
      })
      .catch(() => undefined);

    return () => { isMounted = false; };
  }, []);

  const isReady = useMemo(() => visibleItems.length > 0, [visibleItems.length]);
  const selectedLocation = locations.find((location) => location.id === locationId);
  const selectedOrderType = orderTypes.find((option) => option.value === orderType)?.label ?? "Pickup";
  const pointsEarned = calculatePointsEarned(visibleSubtotal);

  async function submitCheckout() {
    if (!isReady) return;

    setSubmitting(true);
    setStatusMessage("");
    setCardError("");

    try {
      const order = await orderApi.createOrder({
        locationId,
        orderType,
        pickupName,
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

      if (stripeConfigured && stripe && elements) {
        try {
          const cardElement = elements.getElement(CardElement);
          if (!cardElement) {
            setStatusMessage("Card element not ready. Please refresh and try again.");
            setSubmitting(false);
            return;
          }

          const { clientSecret, intentId } = await stripeApi.createIntent({
            orderId: order.id,
            amount: visibleSubtotal,
          });

          const { error } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: { card: cardElement },
          });

          if (error) {
            setCardError(error.message ?? "Payment failed. Please try again.");
            setSubmitting(false);
            return;
          }

          await paymentsApi.checkout({
            orderId: order.id,
            paymentMethod: "Stripe",
            amount: visibleSubtotal,
            cardLastFour: "0000",
            stripeIntentId: intentId,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "";
          if (!message.toLowerCase().includes("stripe is not configured")) {
            throw error;
          }

          await paymentsApi.checkout({
            orderId: order.id,
            paymentMethod: "Demo",
            amount: visibleSubtotal,
            cardLastFour: "0000",
          });
        }
      } else {
        await paymentsApi.checkout({
          orderId: order.id,
          paymentMethod: "Demo",
          amount: visibleSubtotal,
          cardLastFour: "0000",
        });
      }

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
        <CommerceTopRail activeTab="order" navigate={navigate} />
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
                disabled={submitting || !isReady || (stripeConfigured && (!stripe || !elements))}
                onClick={submitCheckout}
                type="button"
              >
                {submitting ? "Processing..." : stripeConfigured ? "Place order" : "Place order (demo)"}
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
                <strong>Checking out as guest.</strong> <button className="commerce-secondary-button" style={{ marginLeft: 8, padding: "4px 12px" }} onClick={() => navigate("/login")} type="button">Sign in</button> to earn points and save order history.
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

              <label className="commerce-field commerce-field-full">
                <span>Payment details</span>
                {stripeConfigured ? (
                  <>
                    <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", margin: "0 0 10px" }}>
                      Test checkout (no real charges). Use any Stripe test card.
                    </p>
                    <div className="stripe-card-wrapper">
                      <CardElement options={CARD_ELEMENT_OPTIONS} onChange={() => setCardError("")} />
                    </div>
                    {cardError ? <p className="stripe-card-error">{cardError}</p> : null}
                  </>
                ) : (
                  <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", margin: "0.25rem 0 0" }}>
                    Demo payment mode (no real charge). To enable Stripe test payments, set{" "}
                    <code>STRIPE_PUBLISHABLE_KEY</code> and <code>STRIPE_SECRET_KEY</code> in <code>.env</code> (see{" "}
                    <code>.env.example</code>).
                  </p>
                )}
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

function CheckoutFormStripe(props: PageProps) {
  const stripe = useStripe();
  const elements = useElements();
  return <CheckoutFormCommon {...props} stripeConfigured stripe={stripe} elements={elements} />;
}

function CheckoutFormNoStripe(props: PageProps) {
  return <CheckoutFormCommon {...props} stripeConfigured={false} stripe={null} elements={null} />;
}

export default function CheckoutPage({ navigate }: PageProps) {
  if (stripePromise) {
    return (
      <Elements stripe={stripePromise}>
        <CheckoutFormStripe navigate={navigate} query={new URLSearchParams()} />
      </Elements>
    );
  }
  return <CheckoutFormNoStripe navigate={navigate} query={new URLSearchParams()} />;
}
