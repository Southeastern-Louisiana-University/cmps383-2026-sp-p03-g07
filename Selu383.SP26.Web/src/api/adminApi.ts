import { apiRequest } from "./client";
import type { AdminDashboard } from "../types/admin.types";

export const adminApi = {
  getDashboard() {
    return apiRequest<AdminDashboard>("/api/admin/dashboard");
  },
};
