import { apiRequest } from "./client";
import type { MenuItem } from "../types/menu.types";
import { filterRewardsExclusiveNamedItems } from "../utils/rewardsExclusiveItems";

export const menuApi = {
  getMenu(params?: { category?: string; locationId?: number; search?: string; includeRewardsExclusive?: boolean; includeUnsupported?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set("category", params.category);
    if (params?.locationId) searchParams.set("locationId", String(params.locationId));
    if (params?.search) searchParams.set("search", params.search);
    if (params?.includeUnsupported) searchParams.set("includeUnsupported", "true");
    const query = searchParams.toString();
    return apiRequest<MenuItem[]>(`/api/menu${query ? `?${query}` : ""}`)
      .then((items) => (params?.includeRewardsExclusive ? items : filterRewardsExclusiveNamedItems(items)));
  },
  getCategories() {
    return apiRequest<string[]>("/api/menu/categories");
  },
};
