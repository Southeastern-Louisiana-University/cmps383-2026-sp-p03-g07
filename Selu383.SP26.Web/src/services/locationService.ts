import { API_BASE_URL } from "./api";

export type Location = {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  hoursOfOperation: string;
  latitude: number;
  longitude: number;
  tableCount: number;
};

export async function getLocations(): Promise<Location[]> {
  const res = await fetch(`${API_BASE_URL}/api/locations`);
  if (!res.ok) throw new Error("Failed to load locations.");
  return res.json();
}
