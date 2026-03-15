import { useEffect, useMemo, useState } from "react";
import { locationsApi } from "../api/locationsApi";
import { menuApi } from "../api/menuApi";
import { useCart } from "../store/cartStore";
import type { Location } from "../types/location.types";
import type { MenuItem } from "../types/menu.types";
import type { PageProps } from "../types/router.types";
import { StorefrontTopRail } from "./storefrontShared";

const preferredCategoryOrder = [
  "Coffee",
  "Sandwiches & Bagels",
  "Salad & Quiches",
  "Sweet and Pops",
  "Vegan",
  "Gifts",
];

const defaultCategory = "Coffee";
const defaultLocationName = "Hammond";

function getDefaultLocationId(locations: Location[]) {
  return (
    locations.find((location) => location.name.toLowerCase() === defaultLocationName.toLowerCase())?.id ??
    locations[0]?.id ??
    0
  );
}

export default function MenuPage({ navigate }: PageProps) {
  const { addItem } = useCart();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [selectedLocationId, setSelectedLocationId] = useState<number>(0);
  const [search, setSearch] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    void Promise.all([
      menuApi.getMenu(),
      menuApi.getCategories(),
      locationsApi.getLocations(),
    ])
      .then(([nextItems, nextCategories, nextLocations]) => {
        if (!isMounted) {
          return;
        }

        setItems(nextItems);
        setCategories(
          Array.from(new Set([...preferredCategoryOrder, ...nextCategories])).sort((left, right) => {
            const leftIndex = preferredCategoryOrder.indexOf(left);
            const rightIndex = preferredCategoryOrder.indexOf(right);

            if (leftIndex === -1 && rightIndex === -1) {
              return left.localeCompare(right);
            }

            if (leftIndex === -1) {
              return 1;
            }

            if (rightIndex === -1) {
              return -1;
            }

            return leftIndex - rightIndex;
          }),
        );
        setLocations(nextLocations);
        setSelectedLocationId((currentLocationId) => currentLocationId || getDefaultLocationId(nextLocations));
        setStatusMessage("");
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setStatusMessage(error instanceof Error ? error.message : "Unable to load the online ordering menu.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const categoryMatch = !selectedCategory || item.category === selectedCategory;
      const locationMatch = !selectedLocationId || item.locationId === selectedLocationId;
      const searchMatch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());

      return categoryMatch && locationMatch && searchMatch;
    });
  }, [items, search, selectedCategory, selectedLocationId]);

  const locationLookup = useMemo(
    () => new Map(locations.map((location) => [location.id, location])),
    [locations],
  );
  const featuredItems = useMemo(() => {
    const sourceItems = filteredItems.length > 0 ? filteredItems : items;

    return [...sourceItems]
      .filter((item) => item.isAvailable)
      .sort((left, right) => Number(right.isFeatured) - Number(left.isFeatured))
      .slice(0, 3);
  }, [filteredItems, items]);
  const activeLocation = locations.find((location) => location.id === selectedLocationId);
  const orderLabel = selectedCategory || "All categories";
  const storeLabel = activeLocation?.name ?? `${Math.max(locations.length, 1)} stores`;

  function resetFilters() {
    setSelectedCategory(defaultCategory);
    setSelectedLocationId(getDefaultLocationId(locations));
    setSearch("");
  }

  return (
    <div className="commerce-page order-page">
      <header className="commerce-topbar">
        <StorefrontTopRail activeTab="order" navigate={navigate} />
      </header>

      <section className="commerce-canvas">
        <section className="commerce-hero">
          <div className="commerce-hero-copy">
            <p className="commerce-kicker">Online order</p>
            <h1>HOUSE FAVORITES, READY TO GO.</h1>
            <p className="commerce-hero-description">
              Filter the menu by store, browse featured drinks and bakery picks, and send your next
              order straight to the cart in a couple of clicks.
            </p>

            <div className="commerce-hero-pills">
              <span className="commerce-hero-pill">{filteredItems.length} items ready</span>
              <span className="commerce-hero-pill">{storeLabel}</span>
              <span className="commerce-hero-pill">{orderLabel}</span>
            </div>

            <div className="commerce-hero-actions">
              <button className="commerce-primary-button" onClick={() => navigate("/cart")} type="button">
                View cart
              </button>
              <button className="commerce-secondary-button" onClick={resetFilters} type="button">
                Reset filters
              </button>
            </div>

            {statusMessage ? <p className="commerce-inline-status commerce-inline-status-error">{statusMessage}</p> : null}
          </div>

          <div className="order-hero-panel">
            {featuredItems.map((item) => (
              <article className="order-feature-card" key={item.id}>
                <div className="order-feature-media">
                  {item.imageUrl ? <img alt={item.name} src={item.imageUrl} /> : <span>{item.category}</span>}
                </div>
                <div className="order-feature-copy">
                  <span>{item.category}</span>
                  <strong>{item.name}</strong>
                  <p>{item.preparationTag || "Ready for pickup"}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="commerce-panel order-filter-panel">
          <div className="commerce-panel-heading">
            <div>
              <p className="commerce-panel-kicker">Browse and filter</p>
              <h2>Order online</h2>
            </div>
            <span>{filteredItems.length} products</span>
          </div>

          <div className="order-filter-grid">
            <label className="commerce-field">
              <span>Search</span>
              <input
                className="commerce-input"
                placeholder="Search drinks, pastries, and signatures"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <label className="commerce-field">
              <span>Category</span>
              <select
                className="commerce-select"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="commerce-field">
              <span>Store</span>
              <select
                className="commerce-select"
                value={selectedLocationId}
                onChange={(event) => setSelectedLocationId(Number(event.target.value))}
              >
                <option value="0">All stores</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="order-results-panel">
          <div className="commerce-panel-heading">
            <div>
              <p className="commerce-panel-kicker">Menu lineup</p>
              <h2>Available now</h2>
            </div>
            <button className="commerce-secondary-button" onClick={() => navigate("/cart")} type="button">
              Go to cart
            </button>
          </div>

          {filteredItems.length === 0 ? (
            <div className="commerce-empty-state">
              <h3>No items match those filters yet.</h3>
              <p>Clear a filter or switch stores to see more drinks, pastries, and ready-to-order items.</p>
              <button className="commerce-primary-button" onClick={resetFilters} type="button">
                Show everything
              </button>
            </div>
          ) : (
            <div className="order-grid">
              {filteredItems.map((item) => (
                <article className="order-item-card" key={item.id}>
                  <div className="order-item-media">
                    {item.imageUrl ? <img alt={item.name} src={item.imageUrl} /> : <span>{item.category}</span>}
                  </div>

                  <div className="order-item-copy">
                    <div className="order-item-meta">
                      <span>{item.category}</span>
                      <span>{locationLookup.get(item.locationId)?.name ?? "House blend"}</span>
                    </div>

                    <h3>{item.name}</h3>
                    <p>{item.description}</p>

                    <div className="order-option-list">
                      {item.customizations.slice(0, 3).map((customization) => (
                        <span className="order-option-chip" key={customization.id}>
                          {customization.optionName}
                          {customization.additionalPrice > 0
                            ? ` +$${customization.additionalPrice.toFixed(2)}`
                            : ""}
                        </span>
                      ))}
                    </div>

                    <div className="order-item-footer">
                      <div className="order-item-pricing">
                        <strong>${item.price.toFixed(2)}</strong>
                        <span>{item.calories} cal</span>
                      </div>
                      <button
                        className="commerce-primary-button commerce-primary-button-compact"
                        disabled={!item.isAvailable}
                        onClick={() => addItem(item)}
                        type="button"
                      >
                        {item.isAvailable ? "Add to cart" : "Unavailable"}
                      </button>
                    </div>
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
