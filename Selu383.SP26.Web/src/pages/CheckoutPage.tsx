import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { createOrder, earnPoints } from "../services/orderService";
import { getLocations } from "../services/locationService";
import { getActiveRedemptions } from "../services/rewardsService";
import type { Location } from "../services/locationService";
import type { RewardRedemptionDto } from "../services/rewardsService";

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState("");
  const [orderType, setOrderType] = useState("dine-in");
  const [tableNumber, setTableNumber] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<number | null>(null);

  const [activeRedemptions, setActiveRedemptions] = useState<RewardRedemptionDto[]>([]);
  const [selectedRedemptionId, setSelectedRedemptionId] = useState<number | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    getLocations().then(setLocations).catch(() => {});
    if (user) {
      getActiveRedemptions().then(setActiveRedemptions).catch(() => {});
    }
  }, [user]);

  const selectedRedemption = activeRedemptions.find((r) => r.id === selectedRedemptionId) ?? null;
  const discountAmount = selectedRedemption?.rewardType === "discount"
    ? Math.round((total * (selectedRedemption.discountValue / 100)) * 100) / 100
    : 0;
  const finalTotal = total - discountAmount;

  // Free item from redemption
  const freeItem = selectedRedemption?.rewardType === "free_item"
    ? items.find((i) => i.id === selectedRedemption.freeMenuItemId)
    : null;

  if (items.length === 0 && !done) {
    return (
      <div className="page">
        <p className="empty-state">No items in cart.</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: "4rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
        <h2 style={{ color: "var(--espresso)", marginBottom: "0.75rem" }}>Order Placed!</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
          Your order has been received. We'll have it ready shortly.
        </p>
        {placedOrderId && (
          <button className="btn-secondary" style={{ marginRight: "1rem" }} onClick={() => navigate(`/order-status/${placedOrderId}`)}>
            Track Order
          </button>
        )}
        <button className="btn-primary" onClick={() => navigate("/menu")}>Order Again</button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId) { setError("Please select a location."); return; }
    setSubmitting(true);
    setError("");

    try {
      const orderItems = items.map((i) => ({
        menuItemId: i.id,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      }));

      const order = await createOrder({
        userId: user?.id ?? 0,
        locationId: parseInt(locationId),
        orderType,
        status: "Received",
        tableNumber: tableNumber ? parseInt(tableNumber) : undefined,
        total,
        discountAmount,
        redemptionId: selectedRedemptionId ?? undefined,
        note: note.trim() || undefined,
        items: orderItems,
      });

      if (user) {
        await earnPoints(finalTotal).catch(() => {});
      }

      clearCart();
      setPlacedOrderId(order.id);
      setDone(true);
    } catch {
      setError("Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Checkout</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", alignItems: "start" }}>
        <form onSubmit={handleSubmit}>
          <div className="card">
            <h3 style={{ marginBottom: "1.25rem", color: "var(--espresso)" }}>Order Details</h3>

            <div className="form-group">
              <label>Location</label>
              <select value={locationId} onChange={(e) => setLocationId(e.target.value)} required>
                <option value="">Select a location...</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Order Type</label>
              <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                <option value="dine-in">Dine In</option>
                <option value="pickup">Pickup</option>
                <option value="drive-thru">Drive-Thru</option>
              </select>
            </div>

            {orderType === "dine-in" && (
              <div className="form-group">
                <label>Table Number (optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                />
              </div>
            )}

            {user && activeRedemptions.length > 0 && (
              <div className="form-group">
                <label>Apply Reward</label>
                <select
                  value={selectedRedemptionId ?? ""}
                  onChange={(e) => setSelectedRedemptionId(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">No reward</option>
                  {activeRedemptions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.rewardName} {r.rewardType === "discount" ? `(-${r.discountValue}%)` : "(free item)"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Order Note (optional)</label>
              <textarea
                placeholder="e.g. Extra hot, oat milk, no sugar..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                style={{ resize: "vertical" }}
              />
            </div>

            {!user && (
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                Checking out as guest. <a href="/login">Log in</a> to earn points and use rewards.
              </p>
            )}

            {error && <p className="error-msg">{error}</p>}

            <button className="btn-primary" type="submit" disabled={submitting} style={{ width: "100%", marginTop: "0.5rem" }}>
              {submitting ? "Placing Order..." : `Place Order - $${finalTotal.toFixed(2)}`}
            </button>
          </div>
        </form>

        <div className="card">
          <h3 style={{ marginBottom: "1.25rem", color: "var(--espresso)" }}>Order Summary</h3>
          {items.map((item) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span>
                {item.name} x {item.quantity}
                {freeItem?.id === item.id && (
                  <span style={{ marginLeft: "0.5rem", color: "#27ae60", fontSize: "0.8rem" }}>(FREE)</span>
                )}
              </span>
              <span style={{ fontWeight: 600 }}>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", marginTop: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", color: "#27ae60" }}>
                <span>Discount ({selectedRedemption?.discountValue}% off)</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1.1rem" }}>
              <span>Total</span>
              <span style={{ color: "var(--espresso)" }}>${finalTotal.toFixed(2)}</span>
            </div>
          </div>
          {user && (
            <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--amber)" }}>
              You'll earn {Math.floor(finalTotal)} points on this order!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
