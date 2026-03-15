import { apiRequest } from './api';
import type { UserSession } from '@/types/app';

export const authService = {
  me() {
    return apiRequest<UserSession>('/api/authentication/me');
  },
  login(userName: string, password: string) {
    return apiRequest<UserSession>('/api/authentication/login', {
      method: 'POST',
      body: JSON.stringify({ userName, password }),
    });
  },
  register(userName: string, password: string) {
    return apiRequest<UserSession>('/api/authentication/register', {
      method: 'POST',
      body: JSON.stringify({ userName, password }),
    });
  },
};
