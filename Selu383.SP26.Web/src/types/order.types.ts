export type OrderItem = {
  id: number;
  menuItemId: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  customizations: string;
  specialInstructions: string;
};

export type Order = {
  id: number;
  userId: number;
  locationId: number;
  orderType: string;
  status: string;
  tableNumber?: number | null;
  total: number;
  createdAt: string;
  pickupName: string;
  specialInstructions: string;
  paymentStatus: string;
  starsEarned: number;
  items: OrderItem[];
};

export type CreateOrderInput = {
  locationId: number;
  orderType: string;
  tableNumber?: number | null;
  total?: number;
  pickupName: string;
  specialInstructions: string;
  items: Array<{
    menuItemId: number;
    itemName: string;
    quantity: number;
    unitPrice: number;
    total: number;
    customizations: string;
    specialInstructions: string;
  }>;
};
