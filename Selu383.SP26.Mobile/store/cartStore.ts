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

type CartContextValue = {
  items: CartItem[];
  subtotal: number;
  addItem: (item: MenuItem, customizations?: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<CartItem[]>([]);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return {
      items,
      subtotal,
      addItem(item, customizations = '') {
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
              price: item.price,
              quantity: 1,
              customizations,
            },
          ];
        });
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
      },
    };
  }, [items]);

  return createElement(CartContext.Provider, { value }, children);
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }

  return context;
}
