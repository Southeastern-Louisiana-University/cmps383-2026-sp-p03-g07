import { API_BASE_URL } from "@/constants/api";

export type CreateReservationDto = {
  locationId: number;
  reservationTime: string;
  partySize: number;
  status: string;
};

export async function createReservation(dto: CreateReservationDto) {
  const res = await fetch(`${API_BASE_URL}/api/reservations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error("Failed to create reservation.");
  return res.json();
}
