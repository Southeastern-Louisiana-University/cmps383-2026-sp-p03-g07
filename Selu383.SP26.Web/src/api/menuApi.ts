import { apiRequest } from "./client";
import type { MenuItem } from "../types/menu.types";

export const menuApi = {
  getMenu(params?: { category?: string; locationId?: number; search?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set("category", params.category);
    if (params?.locationId) searchParams.set("locationId", String(params.locationId));
    if (params?.search) searchParams.set("search", params.search);
    const query = searchParams.toString();
    return apiRequest<MenuItem[]>(`/api/menu${query ? `?${query}` : ""}`);
  },
  getCategories() {
    return apiRequest<string[]>("/api/menu/categories");
  },
};
