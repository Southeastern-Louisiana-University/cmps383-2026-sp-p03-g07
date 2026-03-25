import { apiRequest } from "./client";
import type { AdminDashboard } from "../types/admin.types";
import { filterRewardsExclusiveNamedItems } from "../utils/rewardsExclusiveItems";

export const adminApi = {
  getDashboard() {
    return apiRequest<AdminDashboard>("/api/admin/dashboard")
      .then((dashboard) => ({
        ...dashboard,
        topProducts: filterRewardsExclusiveNamedItems(dashboard.topProducts),
        lowInventoryItems: filterRewardsExclusiveNamedItems(dashboard.lowInventoryItems),
      }));
  },
};
