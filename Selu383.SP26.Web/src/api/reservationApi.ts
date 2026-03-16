import { apiRequest } from "./client";
import type { Reservation } from "../types/location.types";

export const reservationApi = {
  getReservations() {
    return apiRequest<Reservation[]>("/api/reservations");
  },
  create(input: { locationId: number; reservationTime: string; partySize: number }) {
    return apiRequest<Reservation>("/api/reservations", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};
