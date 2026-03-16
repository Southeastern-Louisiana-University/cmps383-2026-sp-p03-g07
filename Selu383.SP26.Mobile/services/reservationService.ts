import { apiRequest } from './api';
import type { Reservation } from '@/types/app';

export const reservationService = {
  getReservations() {
    return apiRequest<Reservation[]>('/api/reservations');
  },
  create(input: { locationId: number; reservationTime: string; partySize: number }) {
    return apiRequest<Reservation>('/api/reservations', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};
