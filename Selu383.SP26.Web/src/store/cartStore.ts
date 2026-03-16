import {
  createContext,
  createElement,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { MenuItem } from "../types/menu.types";

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
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "selu383.cart.items";

function readStoredCart(): CartItem[] {
  const savedValue = window.localStorage.getItem(STORAGE_KEY);
  if (!savedValue) {
    return [];
  }

  try {
    return JSON.parse(savedValue) as CartItem[];
  } catch {
    return [];
  }
}

function writeStoredCart(items: CartItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<CartItem[]>(() => readStoredCart());

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return {
      items,
      subtotal,
      addItem(menuItem) {
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
  }, [items]);

  return createElement(CartContext.Provider, { value }, children);
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
