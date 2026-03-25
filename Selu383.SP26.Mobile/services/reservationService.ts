import { apiRequest } from './api';
import type { Reservation } from '@/types/app';

export const reservationService = {
  // Returns own reservations for users, all reservations for admin/manager
  getReservations() {
    return apiRequest<Reservation[]>('/api/reservations');
  },
  create(input: { locationId: number; reservationTime: string; partySize: number }) {
    return apiRequest<Reservation>('/api/reservations', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  cancel(id: number) {
    return apiRequest<Reservation>(`/api/reservations/${id}/cancel`, {
      method: 'PUT',
    });
  },
};
