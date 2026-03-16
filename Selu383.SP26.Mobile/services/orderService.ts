import { apiRequest } from './api';
import type { Order } from '@/types/app';

export const orderService = {
  getOrders() {
    return apiRequest<Order[]>('/api/orders/history');
  },
  getOrder(id: number) {
    return apiRequest<Order>(`/api/orders/${id}`);
  },
  createOrder(input: object) {
    return apiRequest<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  checkout(input: object) {
    return apiRequest('/api/payments/checkout', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  reorder(id: number) {
    return apiRequest<Order>(`/api/orders/${id}/reorder`, { method: 'POST' });
  },
  updateStatus(id: number, status: string) {
    return apiRequest<void>(`/api/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(status),
    });
  },
};
