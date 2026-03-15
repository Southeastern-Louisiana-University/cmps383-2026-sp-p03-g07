import { apiRequest } from './api';
import type { MenuItem } from '@/types/app';

export const menuService = {
  getMenu() {
    return apiRequest<MenuItem[]>('/api/menu');
  },
};
