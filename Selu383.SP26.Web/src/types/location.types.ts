export type Location = {
  id: number;
  name: string;
  address: string;
  tableCount: number;
  managerId?: number | null;
};

export type Reservation = {
  id: number;
  userId: number;
  locationId: number;
  reservationTime: string;
  partySize: number;
  status: string;
};
