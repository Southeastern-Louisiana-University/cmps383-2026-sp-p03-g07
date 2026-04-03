import { useEffect, useMemo, useState } from "react";
import { locationsApi } from "../api/locationsApi";
import { menuApi } from "../api/menuApi";
import { resolveApiAssetUrl } from "../services/api";
import { useCart } from "../store/cartStore";
import type { Location } from "../types/location.types";
import type { MenuItem } from "../types/menu.types";
import type { PageProps } from "../types/router.types";
import {
  calculateMenuItemPrice,
  getDefaultCustomizationSelection,
  groupMenuCustomizations,
  type MenuCustomizationSelection,
} from "../utils/menuCustomization";
import { CommerceTopRail } from "./commerceShared";

const menuDisplayCategories = [
  "Coffee",
  "Matcha",
  "Pastries",
  "Breakfast",
  "Sandwiches & Bagels",
  "Salads & Quiches",
  "Cakes & Sweets",
  "Vegan",
] as const;

type MenuDisplayCategory = (typeof menuDisplayCategories)[number];
type MenuSort = "selected" | "price-low" | "price-high" | "name";
type MenuDisplayMeta = {
  locationLabel: string;
};

const sortOptions: Array<{ value: MenuSort; label: string }> = [
  { value: "selected", label: "Selected" },
  { value: "price-low", label: "Price low to high" },
  { value: "price-high", label: "Price high to low" },
  { value: "name", label: "Name A-Z" },
];

function getItemSearchText(item: MenuItem) {
  return `${item.name} ${item.category} ${item.description} ${item.preparationTag}`.toLowerCase();
}

function getDisplayCategory(item: MenuItem): MenuDisplayCategory | null {
  const text = getItemSearchText(item);
  const itemName = item.name.toLowerCase();

  if (item.category === "Gifts") {
    return null;
  }

  if (text.includes("matcha")) {
    return "Matcha";
  }

  if (item.category === "Vegan" || text.includes("plant-based") || text.includes("vegan")) {
    return "Vegan";
  }

  if (/\bbread\b|\bloaf\b/.test(itemName)) {
    return "Pastries";
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

  if (item.category === "Coffee") {
    return "Coffee";
  }

  return null;
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

function getMenuItemGroupingKey(item: MenuItem) {
  return [
    item.name.trim().toLowerCase(),
    item.category.trim().toLowerCase(),
    item.preparationTag.trim().toLowerCase(),
    item.price.toFixed(2),
  ].join("::");
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
  const [activeCustomizerItemId, setActiveCustomizerItemId] = useState<number | null>(null);
  const [customizationSelection, setCustomizationSelection] = useState<MenuCustomizationSelection>({});

  function handleAddItem(menuItem: MenuItem) {
    addItem(menuItem);
    setActiveCustomizerItemId(null);
    setCustomizationSelection({});
  }

  function openCustomizer(menuItem: MenuItem) {
    setActiveCustomizerItemId(menuItem.id);
    setCustomizationSelection(getDefaultCustomizationSelection(menuItem));
  }

  function handleCustomizedAdd(menuItem: MenuItem) {
    addItem(menuItem, customizationSelection);
    setActiveCustomizerItemId(null);
    setCustomizationSelection({});
  }

  function closeCustomizer() {
    setActiveCustomizerItemId(null);
    setCustomizationSelection({});
  }

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
        setActiveCustomizerItemId(null);
        setCustomizationSelection({});
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
  const { locationFilteredItems, itemDisplayMeta } = useMemo(
    () => {
      const availableItems = items.filter((item) => item.isAvailable && (!selectedLocationId || item.locationId === selectedLocationId));

      if (selectedLocationId) {
        return {
          locationFilteredItems: availableItems,
          itemDisplayMeta: new Map<number, MenuDisplayMeta>(),
        };
      }

      const groupedItems = new Map<string, MenuItem[]>();

      availableItems.forEach((item) => {
        const key = getMenuItemGroupingKey(item);
        const currentGroup = groupedItems.get(key);

        if (currentGroup) {
          currentGroup.push(item);
          return;
        }

        groupedItems.set(key, [item]);
      });

      const dedupedItems: MenuItem[] = [];
      const nextItemDisplayMeta = new Map<number, MenuDisplayMeta>();

      groupedItems.forEach((group) => {
        const representativeItem = [...group].sort((left, right) => {
          const leftMatchesLockedStore = Number(left.locationId === lockedLocationId);
          const rightMatchesLockedStore = Number(right.locationId === lockedLocationId);

          return rightMatchesLockedStore - leftMatchesLockedStore || left.locationId - right.locationId;
        })[0];
        const availableLocationIds = new Set(group.map((item) => item.locationId));
        const locationLabel = availableLocationIds.size >= locations.length && locations.length > 0
          ? "All stores"
          : availableLocationIds.size > 1
            ? `${availableLocationIds.size} stores`
            : locationLookup.get(representativeItem.locationId)?.name ?? "House counter";

        dedupedItems.push(representativeItem);
        nextItemDisplayMeta.set(representativeItem.id, { locationLabel });
      });

      return {
        locationFilteredItems: dedupedItems,
        itemDisplayMeta: nextItemDisplayMeta,
      };
    },
    [items, selectedLocationId, lockedLocationId, locations.length, locationLookup],
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
        <CommerceTopRail activeTab="order" navigate={navigate} />
      </header>

      <section className="order-bakery-shell">
        <nav aria-label="Menu categories" className="order-bakery-category-rail">
          {menuDisplayCategories.map((category) => (
            <button
              className={category === selectedCategory ? "order-bakery-category active" : "order-bakery-category"}
              key={category}
              onClick={() => setSelectedCategory(category)}
              type="button"
            >
              <span>{category}</span>
            </button>
          ))}
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

        {statusMessage ? (
          <p className="commerce-inline-status commerce-inline-status-error">
            {statusMessage}
          </p>
        ) : null}

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
              const displayCategory = getDisplayCategory(item) ?? selectedCategory;
              const customizationGroups = groupMenuCustomizations(item.customizations);
              const isCustomizing = activeCustomizerItemId === item.id;
              const activeSelection = isCustomizing
                ? customizationSelection
                : getDefaultCustomizationSelection(item);
              const customizedPrice = calculateMenuItemPrice(item, activeSelection);

              return (
                <article className="order-bakery-card" key={item.id}>
                  <div className="order-bakery-media">
                    <div className="order-bakery-media-labels">
                      <span>{displayCategory}</span>
                      <span>{itemDisplayMeta.get(item.id)?.locationLabel ?? locationLookup.get(item.locationId)?.name ?? "House counter"}</span>
                    </div>
                    {item.imageUrl ? (
                      <img alt={item.name} src={resolveApiAssetUrl(item.imageUrl)} />
                    ) : (
                      <div className="order-bakery-placeholder">{item.name.slice(0, 1)}</div>
                    )}
                  </div>

                  <div className="order-bakery-card-copy">
                    <div>
                      <h2>{item.name}</h2>
                      <p>{item.description}</p>
                      {customizationGroups.length > 0 ? (
                        <div className="order-bakery-customization-meta">
                          <span>{customizationGroups.length} quick customizations</span>
                          <span>Simple preset options only</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="order-bakery-card-footer">
                      <div className="order-bakery-price">
                        <strong>${customizedPrice.toFixed(2)}</strong>
                        <span>{item.preparationTag}</span>
                      </div>
                      {customizationGroups.length > 0 ? (
                        <button
                          className="order-bakery-add-button"
                          disabled={!canAddItem}
                          onClick={() => openCustomizer(item)}
                          type="button"
                        >
                          {canAddItem ? "Customize" : "Store locked"}
                        </button>
                      ) : (
                        <button
                          className="order-bakery-add-button"
                          disabled={!canAddItem}
                          onClick={() => handleAddItem(item)}
                          type="button"
                        >
                          {canAddItem ? "Add" : "Store locked"}
                        </button>
                      )}
                    </div>
                  </div>

                  {isCustomizing ? (
                    <div className="order-bakery-customizer">
                      {customizationGroups.map((group) => (
                        <section className="order-bakery-customizer-group" key={group.groupName}>
                          <div className="order-bakery-customizer-heading">
                            <strong>{group.groupName}</strong>
                            <span>Pick one</span>
                          </div>
                          <div className="order-bakery-option-row">
                            {group.options.map((option) => {
                              const isSelected = customizationSelection[group.groupName] === option.optionName;
                              return (
                                <button
                                  className={isSelected ? "order-bakery-option-chip active" : "order-bakery-option-chip"}
                                  key={`${group.groupName}-${option.id}`}
                                  onClick={() => setCustomizationSelection((currentSelection) => ({
                                    ...currentSelection,
                                    [group.groupName]: option.optionName,
                                  }))}
                                  type="button"
                                >
                                  <span>{option.optionName}</span>
                                  <span>{option.additionalPrice > 0 ? `+$${option.additionalPrice.toFixed(2)}` : "Included"}</span>
                                </button>
                              );
                            })}
                          </div>
                        </section>
                      ))}

                      <div className="order-bakery-customizer-actions">
                        <button className="order-bakery-add-button" onClick={() => handleCustomizedAdd(item)} type="button">
                          Add to cart
                        </button>
                        <button className="order-bakery-add-button order-bakery-add-button-secondary" onClick={closeCustomizer} type="button">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
