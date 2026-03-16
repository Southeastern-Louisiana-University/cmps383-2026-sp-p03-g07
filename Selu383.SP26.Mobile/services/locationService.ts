import { apiRequest } from './api';
import type { Location } from '@/types/app';

export const locationService = {
  getLocations() {
    return apiRequest<Location[]>('/api/locations');
  },
};
