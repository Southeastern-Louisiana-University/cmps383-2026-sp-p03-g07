import { apiRequest } from './api';
import type { MenuItem } from '@/types/app';

export const menuService = {
  getMenu(params?: { category?: string; locationId?: number; search?: string }) {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.locationId) query.set('locationId', String(params.locationId));
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return apiRequest<MenuItem[]>(`/api/menu${qs ? `?${qs}` : ''}`);
  },

  getCategories() {
    return apiRequest<string[]>('/api/menu/categories');
  },
};
