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
  resetPassword(userName: string, email: string, phone: string, newPassword: string) {
    return apiRequest<void>('/api/authentication/reset-password', {
      method: 'POST',
      body: JSON.stringify({ userName, email, phone, newPassword }),
    });
  },
  register(userName: string, password: string, email: string, phone: string) {
    return apiRequest<UserSession>('/api/authentication/register', {
      method: 'POST',
      body: JSON.stringify({ userName, password, email, phone }),
    });
  },
  logout() {
    return apiRequest<void>('/api/authentication/logout', { method: 'POST' });
  },
  updateProfile(data: { displayName?: string; birthday?: string | null; profilePictureUrl?: string }) {
    return apiRequest<UserSession>('/api/authentication/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
