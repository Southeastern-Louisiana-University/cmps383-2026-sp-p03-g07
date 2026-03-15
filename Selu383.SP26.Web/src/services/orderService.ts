import { API_BASE_URL } from "./api";

export type Order = {
  id: number;
  userId: number;
  locationId: number;
  orderType: string;
  status: string;
  tableNumber?: number;
  total: number;
};

export async function createOrder(order: Omit<Order, "id">): Promise<Order> {
  const res = await fetch(`${API_BASE_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(order),
  });
  if (!res.ok) throw new Error("Failed to place order.");
  return res.json();
}

export async function getOrders(): Promise<Order[]> {
  const res = await fetch(`${API_BASE_URL}/api/orders`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load orders.");
  return res.json();
}

export async function earnPoints(orderTotal: number): Promise<void> {
  await fetch(`${API_BASE_URL}/api/points/earn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(orderTotal),
  });
}
