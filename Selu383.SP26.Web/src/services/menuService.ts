import { API_BASE_URL } from "./api";

export type MenuItem = {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  isAvailable: boolean;
  locationId: number;
};

export async function getMenuItems(): Promise<MenuItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/menu`);
  if (!res.ok) throw new Error("Failed to load menu.");
  return res.json();
}
