import {
  createContext,
  createElement,
  useEffect,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { MenuItem } from "../types/menu.types";
import {
  filterRewardsExclusiveNamedItems,
  isRewardsExclusiveItemName,
} from "../utils/rewardsExclusiveItems";

export type CartItem = {
  id: string;
  menuItemId: number;
  locationId: number;
  name: string;
  price: number;
  quantity: number;
  customizations: string;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (menuItem: MenuItem) => void;
  addItemWithCustomizations: (menuItem: MenuItem, customizations: string, unitPrice: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  subtotal: number;
  cartNotice: { id: number; message: string } | null;
  clearCartNotice: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "selu383.cart.items";

function roundToCents(value: number) {
  return Math.round(value * 100) / 100;
}

function readStoredCart(): CartItem[] {
  const savedValue = window.localStorage.getItem(STORAGE_KEY);
  if (!savedValue) {
    return [];
  }

  try {
    const parsedItems = JSON.parse(savedValue) as CartItem[];
    const filteredItems = filterRewardsExclusiveNamedItems(parsedItems);

    if (filteredItems.length !== parsedItems.length) {
      writeStoredCart(filteredItems);
    }

    return filteredItems;
  } catch {
    return [];
  }
}

function writeStoredCart(items: CartItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<CartItem[]>(() => readStoredCart());
  const [cartNotice, setCartNotice] = useState<{ id: number; message: string } | null>(null);

  useEffect(() => {
    if (!cartNotice) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCartNotice(null);
    }, 2400);

    return () => window.clearTimeout(timeoutId);
  }, [cartNotice]);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return {
      items,
      subtotal,
      cartNotice,
      clearCartNotice() {
        setCartNotice(null);
      },
      addItem(menuItem) {
        if (isRewardsExclusiveItemName(menuItem.name)) {
          return;
        }

        const defaultCustomizations = menuItem.customizations
          .filter((customization) => customization.isDefault)
          .map((customization) => customization.optionName)
          .join(", ");

        setItems((currentItems) => {
          const existingItem = currentItems.find(
            (item) =>
              item.menuItemId === menuItem.id &&
              item.customizations === defaultCustomizations,
          );

          const nextItems = existingItem
            ? currentItems.map((item) =>
                item.id === existingItem.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item,
              )
            : [
                ...currentItems,
                {
                  id: `${menuItem.id}-${Date.now()}`,
                  menuItemId: menuItem.id,
                  locationId: menuItem.locationId,
                  name: menuItem.name,
                  price: menuItem.price,
                  quantity: 1,
                  customizations: defaultCustomizations,
                },
              ];

          writeStoredCart(nextItems);
          return nextItems;
        });
        setCartNotice({
          id: Date.now(),
          message: "Item has been added to the cart",
        });
      },
      addItemWithCustomizations(menuItem, customizations, unitPrice) {
        if (isRewardsExclusiveItemName(menuItem.name)) {
          return;
        }

        const normalizedCustomizations = customizations.trim();
        const normalizedUnitPrice = roundToCents(unitPrice);

        setItems((currentItems) => {
          const existingItem = currentItems.find(
            (item) =>
              item.menuItemId === menuItem.id &&
              item.customizations === normalizedCustomizations &&
              roundToCents(item.price) === normalizedUnitPrice,
          );

          const nextItems = existingItem
            ? currentItems.map((item) =>
                item.id === existingItem.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item,
              )
            : [
                ...currentItems,
                {
                  id: `${menuItem.id}-${Date.now()}`,
                  menuItemId: menuItem.id,
                  locationId: menuItem.locationId,
                  name: menuItem.name,
                  price: normalizedUnitPrice,
                  quantity: 1,
                  customizations: normalizedCustomizations,
                },
              ];

          writeStoredCart(nextItems);
          return nextItems;
        });
        setCartNotice({
          id: Date.now(),
          message: "Item has been added to the cart",
        });
      },
      removeItem(id) {
        setItems((currentItems) => {
          const nextItems = currentItems.filter((item) => item.id !== id);
          writeStoredCart(nextItems);
          return nextItems;
        });
      },
      updateQuantity(id, quantity) {
        setItems((currentItems) => {
          const nextItems = currentItems
            .map((item) => (item.id === id ? { ...item, quantity } : item))
            .filter((item) => item.quantity > 0);

          writeStoredCart(nextItems);
          return nextItems;
        });
      },
      clear() {
        writeStoredCart([]);
        setItems([]);
      },
    };
  }, [cartNotice, items]);

  return createElement(CartContext.Provider, { value }, children);
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
