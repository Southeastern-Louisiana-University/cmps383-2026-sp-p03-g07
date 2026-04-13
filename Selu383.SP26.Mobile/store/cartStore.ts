import {
  createContext,
  createElement,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import type { MenuItem } from '@/types/app';

type CartItem = {
  id: string;
  menuItemId: number;
  locationId: number;
  name: string;
  price: number;
  quantity: number;
  customizations: string;
};

type CartNotice = { id: string; message: string } | null;

type CartContextValue = {
  items: CartItem[];
  subtotal: number;
  notice: CartNotice;
  dismissNotice: () => void;
  addItem: (item: MenuItem, customizations?: string, unitPriceOverride?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [notice, setNotice] = useState<CartNotice>(null);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return {
      items,
      subtotal,
      notice,
      dismissNotice() {
        setNotice(null);
      },
      addItem(item, customizations = '', unitPriceOverride) {
        const unitPrice = unitPriceOverride ?? item.price;

        setItems((currentItems) => {
          const existingItem = currentItems.find(
            (entry) => entry.menuItemId === item.id && entry.customizations === customizations,
          );
          if (existingItem) {
            return currentItems.map((entry) =>
              entry.id === existingItem.id
                ? { ...entry, quantity: entry.quantity + 1 }
                : entry,
            );
          }

          return [
            ...currentItems,
            {
              id: `${item.id}-${Date.now()}`,
              menuItemId: item.id,
              locationId: item.locationId,
              name: item.name,
              price: unitPrice,
              quantity: 1,
              customizations,
            },
          ];
        });
        setNotice({ id: `${Date.now()}`, message: `${item.name} added to cart.` });
      },
      updateQuantity(id, quantity) {
        setItems((currentItems) =>
          currentItems
            .map((item) => (item.id === id ? { ...item, quantity } : item))
            .filter((item) => item.quantity > 0),
        );
      },
      removeItem(id) {
        setItems((currentItems) => currentItems.filter((item) => item.id !== id));
      },
      clear() {
        setItems([]);
        setNotice(null);
      },
    };
  }, [items, notice]);

  return createElement(CartContext.Provider, { value }, children);
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }

  return context;
}
