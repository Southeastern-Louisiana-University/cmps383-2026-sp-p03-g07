import { useEffect, useMemo, useState } from "react";
import { locationsApi } from "../api/locationsApi";
import { menuApi } from "../api/menuApi";
import { useCart } from "../store/cartStore";
import type { Location } from "../types/location.types";
import type { MenuItem } from "../types/menu.types";
import type { PageProps } from "../types/router.types";
import { StorefrontTopRail } from "./storefrontShared";

const menuDisplayCategories = [
  "Coffee",
  "Matcha",
  "Pastries",
  "Bread",
  "Breakfast",
  "Sandwiches & Bagels",
  "Salads & Quiches",
  "Cakes & Sweets",
  "Vegan",
] as const;

type MenuDisplayCategory = (typeof menuDisplayCategories)[number];
type MenuSort = "selected" | "price-low" | "price-high" | "name";

const sortOptions: Array<{ value: MenuSort; label: string }> = [
  { value: "selected", label: "Selected" },
  { value: "price-low", label: "Price low to high" },
  { value: "price-high", label: "Price high to low" },
  { value: "name", label: "Name A-Z" },
];

function getItemSearchText(item: MenuItem) {
  return `${item.name} ${item.category} ${item.description} ${item.preparationTag}`.toLowerCase();
}

function getDisplayCategory(item: MenuItem): MenuDisplayCategory {
  const text = getItemSearchText(item);
  const itemName = item.name.toLowerCase();

  if (text.includes("matcha")) {
    return "Matcha";
  }

  if (item.category === "Vegan" || text.includes("plant-based") || text.includes("vegan")) {
    return "Vegan";
  }

  if (/\bbread\b|\bloaf\b/.test(itemName)) {
    return "Bread";
  }

  if (item.preparationTag.toLowerCase() === "bakery" || /croissant|muffin|pastry|brioche|roll/.test(text)) {
    return "Pastries";
  }

  if (item.category === "Salad & Quiches") {
    return "Salads & Quiches";
  }

  if (/breakfast|brunch|toast|muesli/.test(text)) {
    return "Breakfast";
  }

  if (item.category === "Sweet and Pops") {
    return "Cakes & Sweets";
  }

  if (item.category === "Sandwiches & Bagels") {
    return "Sandwiches & Bagels";
  }

  return "Coffee";
}

function sortMenuItems(items: MenuItem[], sort: MenuSort) {
  const nextItems = [...items];

  switch (sort) {
    case "price-low":
      return nextItems.sort((left, right) => left.price - right.price || left.name.localeCompare(right.name));
    case "price-high":
      return nextItems.sort((left, right) => right.price - left.price || left.name.localeCompare(right.name));
    case "name":
      return nextItems.sort((left, right) => left.name.localeCompare(right.name));
    case "selected":
    default:
      return nextItems.sort((left, right) =>
        Number(right.isFeatured) - Number(left.isFeatured)
        || left.preparationTag.localeCompare(right.preparationTag)
        || left.name.localeCompare(right.name));
  }
}

export default function MenuPage({ navigate }: PageProps) {
  const { addItem, items: cartItems } = useCart();
  const cartLocationId = cartItems[0]?.locationId ?? 0;
  const [items, setItems] = useState<MenuItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MenuDisplayCategory>("Coffee");
  const [selectedLocationId, setSelectedLocationId] = useState<number>(cartLocationId);
  const [selectedSort, setSelectedSort] = useState<MenuSort>("selected");
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    void Promise.all([
      menuApi.getMenu(),
      locationsApi.getLocations(),
    ])
      .then(([nextItems, nextLocations]) => {
        if (!isMounted) {
          return;
        }

        setItems(nextItems);
        setLocations(nextLocations);
        setSelectedLocationId((currentLocationId) => currentLocationId || cartLocationId);
        setStatusMessage("");
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setStatusMessage(error instanceof Error ? error.message : "Unable to load the online ordering menu.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [cartLocationId]);

  const locationLookup = useMemo(
    () => new Map(locations.map((location) => [location.id, location])),
    [locations],
  );
  const lockedLocationId = cartLocationId;
  const locationFilteredItems = useMemo(
    () => items.filter((item) => item.isAvailable && (!selectedLocationId || item.locationId === selectedLocationId)),
    [items, selectedLocationId],
  );
  const categoryCounts = useMemo(
    () =>
      new Map(
        menuDisplayCategories.map((category) => [
          category,
          locationFilteredItems.filter((item) => getDisplayCategory(item) === category).length,
        ]),
      ),
    [locationFilteredItems],
  );
  const activeItems = useMemo(
    () => locationFilteredItems.filter((item) => getDisplayCategory(item) === selectedCategory),
    [locationFilteredItems, selectedCategory],
  );
  const sortedItems = useMemo(
    () => sortMenuItems(activeItems, selectedSort),
    [activeItems, selectedSort],
  );
  const activeLocationName = selectedLocationId
    ? locationLookup.get(selectedLocationId)?.name ?? "Selected store"
    : "All locations";
  const lockedLocationName = lockedLocationId
    ? locationLookup.get(lockedLocationId)?.name ?? "your current store"
    : null;

  return (
    <div className="commerce-page order-page order-bakery-page">
      <header className="order-bakery-topbar">
        <StorefrontTopRail activeTab="order" navigate={navigate} />
      </header>

      <section className="order-bakery-shell">
        <nav aria-label="Menu categories" className="order-bakery-category-rail">
          {menuDisplayCategories.map((category) => {
            const count = categoryCounts.get(category) ?? 0;

            return (
              <button
                className={category === selectedCategory ? "order-bakery-category active" : "order-bakery-category"}
                key={category}
                onClick={() => setSelectedCategory(category)}
                type="button"
              >
                <span>{category}</span>
                <small>{count}</small>
              </button>
            );
          })}
        </nav>

        <div className="order-bakery-toolbar">
          <label className="order-bakery-control">
            <span>Store</span>
            <select
              className="order-bakery-select"
              value={selectedLocationId}
              onChange={(event) => setSelectedLocationId(Number(event.target.value))}
            >
              <option value="0">All locations</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>

          <div className="order-bakery-toolbar-copy">
            <span>{activeLocationName}</span>
            {lockedLocationName ? <p>Cart currently holds items from {lockedLocationName}.</p> : <p>Browse the full counter and build your next pickup.</p>}
          </div>

          <label className="order-bakery-control order-bakery-control-sort">
            <span>Sort by</span>
            <select
              className="order-bakery-select"
              value={selectedSort}
              onChange={(event) => setSelectedSort(event.target.value as MenuSort)}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="order-bakery-summary">
            <strong>{sortedItems.length} products</strong>
            <span>{selectedCategory}</span>
          </div>
        </div>

        {statusMessage ? <p className="commerce-inline-status commerce-inline-status-error">{statusMessage}</p> : null}

        {isLoading ? (
          <div className="order-bakery-empty-state">
            <h2>Loading the counter...</h2>
            <p>Pulling the current menu so the category wall can populate.</p>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="order-bakery-empty-state">
            <h2>Nothing is plated in {selectedCategory} just yet.</h2>
            <p>Try another category or switch the store to see a different bakery lineup.</p>
          </div>
        ) : (
          <div className="order-bakery-grid">
            {sortedItems.map((item) => {
              const canAddItem = !lockedLocationId || lockedLocationId === item.locationId;

              return (
                <article className="order-bakery-card" key={item.id}>
                  <div className="order-bakery-media">
                    <div className="order-bakery-media-labels">
                      <span>{getDisplayCategory(item)}</span>
                      <span>{locationLookup.get(item.locationId)?.name ?? "House counter"}</span>
                    </div>
                    {item.imageUrl ? (
                      <img alt={item.name} src={item.imageUrl} />
                    ) : (
                      <div className="order-bakery-placeholder">{item.name.slice(0, 1)}</div>
                    )}
                  </div>

                  <div className="order-bakery-card-copy">
                    <div>
                      <h2>{item.name}</h2>
                      <p>{item.description}</p>
                    </div>
                    <div className="order-bakery-card-footer">
                      <div className="order-bakery-price">
                        <strong>${item.price.toFixed(2)}</strong>
                        <span>{item.preparationTag}</span>
                      </div>
                      <button
                        className="order-bakery-add-button"
                        disabled={!canAddItem}
                        onClick={() => addItem(item)}
                        type="button"
                      >
                        {canAddItem ? "Add" : "Store locked"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
