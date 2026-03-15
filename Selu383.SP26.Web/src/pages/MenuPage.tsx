import { useEffect, useState } from "react";
import { useCart } from "../contexts/CartContext";
import { getMenuItems } from "../services/menuService";
import type { MenuItem } from "../services/menuService";

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const { addItem } = useCart();

  useEffect(() => {
    getMenuItems()
      .then(setItems)
      .catch(() => setError("Could not load menu."))
      .finally(() => setLoading(false));
  }, []);

  const categories = ["All", ...Array.from(new Set(items.map((i) => i.category)))];
  const filtered = activeCategory === "All" ? items : items.filter((i) => i.category === activeCategory);

  if (loading) return <div className="loading">Loading menu...</div>;
  if (error) return <div className="loading">{error}</div>;

  return (
    <div className="page">
      <h1 className="page-title">Our Menu</h1>

      <div className="category-tabs">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-tab ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="menu-grid">
        {filtered.filter((i) => i.isAvailable).map((item) => (
          <div key={item.id} className="menu-item-card">
            <div className="menu-item-name">{item.name}</div>
            {item.description && <div className="menu-item-desc">{item.description}</div>}
            <div className="menu-item-footer">
              <span className="menu-item-price">${item.price.toFixed(2)}</span>
              <button
                className="add-btn"
                onClick={() =>
                  addItem({ id: item.id, name: item.name, price: item.price, locationId: item.locationId })
                }
              >
                + Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
