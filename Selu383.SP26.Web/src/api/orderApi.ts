import { apiRequest } from "./client";
import type { CreateOrderInput, Order } from "../types/order.types";

export const orderApi = {
  getOrders() {
    return apiRequest<Order[]>("/api/orders/history");
  },
  getOrder(id: number) {
    return apiRequest<Order>(`/api/orders/${id}`);
  },
  createOrder(input: CreateOrderInput) {
    return apiRequest<Order>("/api/orders", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  reorder(id: number) {
    return apiRequest<Order>(`/api/orders/${id}/reorder`, {
      method: "POST",
    });
  },
};
