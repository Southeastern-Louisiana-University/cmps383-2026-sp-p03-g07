import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";

export default function CartPage() {
  const { items, removeItem, updateQty, total, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="page">
        <h1 className="page-title">Your Cart</h1>
        <div className="empty-state">
          <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Your cart is empty.</p>
          <Link to="/menu">
            <button className="btn-primary">Browse Menu</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">Your Cart</h1>

      <div className="cart-list">
        {items.map((item) => (
          <div key={item.id} className="cart-item">
            <div className="cart-item-info">
              <div className="cart-item-name">{item.name}</div>
              <div className="cart-item-price">${(item.price * item.quantity).toFixed(2)}</div>
            </div>
            <div className="cart-qty">
              <button className="qty-btn" onClick={() => updateQty(item.id, item.quantity - 1)}>−</button>
              <span style={{ fontWeight: 600, minWidth: "24px", textAlign: "center" }}>{item.quantity}</span>
              <button className="qty-btn" onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
              <button
                onClick={() => removeItem(item.id)}
                style={{ background: "none", color: "var(--text-muted)", fontSize: "1rem", padding: "0.2rem 0.4rem", marginLeft: "0.5rem" }}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", fontSize: "1.1rem" }}>
          <span style={{ fontWeight: 600 }}>Subtotal</span>
          <span style={{ fontWeight: 700, color: "var(--espresso)" }}>${total.toFixed(2)}</span>
        </div>
        <Link to="/checkout" style={{ display: "block", marginBottom: "0.75rem" }}>
          <button className="btn-primary" style={{ width: "100%" }}>Proceed to Checkout</button>
        </Link>
        <button className="btn-secondary" style={{ width: "100%" }} onClick={clearCart}>
          Clear Cart
        </button>
      </div>
    </div>
  );
}
