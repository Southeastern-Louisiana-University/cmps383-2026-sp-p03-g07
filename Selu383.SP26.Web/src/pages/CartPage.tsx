import { useEffect, useMemo, useState } from "react";
import { menuApi } from "../api/menuApi";
import { useAuth } from "../store/authStore";
import { useCart } from "../store/cartStore";
import type { MenuItem } from "../types/menu.types";
import type { PageProps } from "../types/router.types";
import { StorefrontTopRail } from "./storefrontShared";

export default function CartPage({ navigate }: PageProps) {
  const { user } = useAuth();
  const { addItem, items, removeItem, subtotal, updateQuantity } = useCart();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    void menuApi
      .getMenu()
      .then((nextItems) => {
        if (isMounted) {
          setMenuItems(nextItems);
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const itemLookup = useMemo(() => new Map(menuItems.map((item) => [item.id, item])), [menuItems]);
  const recommendationItems = useMemo(() => {
    const cartMenuItemIds = new Set(items.map((item) => item.menuItemId));
    return menuItems
      .filter((item) => item.isAvailable && !cartMenuItemIds.has(item.id))
      .sort((left, right) => Number(right.isFeatured) - Number(left.isFeatured))
      .slice(0, 4);
  }, [items, menuItems]);

  return (
    <div className="cart-showcase">
      <header className="cart-topbar">
        <StorefrontTopRail navigate={navigate} />
      </header>

      <section className="cart-canvas">
        {items.length === 0 ? (
          <div className="cart-empty-layout">
            <div className="cart-empty-copy">
              <h1>Your shopping cart is empty!</h1>
              <button className="cart-primary-pill" onClick={() => navigate("/menu")} type="button">
                Shop more
              </button>
            </div>

            <div className="cart-account-copy">
              <h2>Do you have an account?</h2>
              {user ? (
                <p>
                  You're logged in as <strong>{user.userName}</strong>
                </p>
              ) : (
                <p>
                  <button className="cart-inline-link" onClick={() => navigate("/login")} type="button">
                    Sign in
                  </button>
                  {" "}to access your saved items and rewards.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="cart-filled-layout">
            <section className="cart-filled-panel">
              <div className="cart-filled-heading">
                <div>
                  <p className="eyebrow cart-eyebrow">Cart</p>
                  <h1>YOUR SELECTION</h1>
                </div>
                <button className="cart-primary-pill" onClick={() => navigate("/checkout")} type="button">
                  CHECKOUT
                </button>
              </div>

              <div className="cart-item-list">
                {items.map((item) => {
                  const menuItem = itemLookup.get(item.menuItemId);

                  return (
                    <article className="cart-line-card" key={item.id}>
                      <div
                        aria-hidden="true"
                        className="cart-line-image"
                        style={menuItem?.imageUrl ? { backgroundImage: `url(${menuItem.imageUrl})` } : undefined}
                      />
                      <div className="cart-line-copy">
                        <h3>{item.name}</h3>
                        <p>{item.customizations || "Standard build"}</p>
                        <span>${item.price.toFixed(2)} each</span>
                      </div>
                      <div className="cart-line-controls">
                        <input
                          className="quantity-input cart-quantity-input"
                          min={1}
                          type="number"
                          value={item.quantity}
                          onChange={(event) => updateQuantity(item.id, Number(event.target.value))}
                        />
                        <strong>${(item.quantity * item.price).toFixed(2)}</strong>
                        <button className="cart-inline-link" onClick={() => removeItem(item.id)} type="button">
                          Remove
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <aside className="cart-summary-panel">
              <p className="eyebrow cart-eyebrow">Summary</p>
              <h2>YOUR ORDER</h2>
              <div className="cart-summary-row">
                <span>Items</span>
                <strong>{items.length}</strong>
              </div>
              <div className="cart-summary-row">
                <span>Subtotal</span>
                <strong>${subtotal.toFixed(2)}</strong>
              </div>
              <div className="cart-summary-row">
                <span>Stars earned</span>
                <strong>{Math.max(Math.floor(subtotal), 1)}</strong>
              </div>
              <button className="cart-primary-pill" onClick={() => navigate("/checkout")} type="button">
                CHECKOUT
              </button>
            </aside>
          </div>
        )}

        <section className="cart-recommendations">
          <div className="cart-recommendations-heading">
            <h2>YOU MIGHT ALSO LIKE</h2>
          </div>

          <div className="cart-product-grid">
            {recommendationItems.map((item, index) => (
              <article className="cart-product-card" key={item.id}>
                <div className="cart-product-media">
                  {index === 0 ? <span className="cart-product-badge">Pick up only</span> : null}
                  <div
                    aria-hidden="true"
                    className="cart-product-image"
                    style={{ backgroundImage: `url(${item.imageUrl})` }}
                  />
                </div>
                <div className="cart-product-copy">
                  <h3>{item.name.toUpperCase()}</h3>
                  <p>From ${item.price.toFixed(2)}</p>
                </div>
                <button className="cart-ghost-pill" onClick={() => addItem(item)} type="button">
                  Add to cart
                </button>
              </article>
            ))}
          </div>

          <button className="cart-primary-pill cart-show-all" onClick={() => navigate("/menu")} type="button">
            VIEW ALL
          </button>
        </section>
      </section>
    </div>
  );
}