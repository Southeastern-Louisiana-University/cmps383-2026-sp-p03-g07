import { apiRequest } from "./client";
import type { AppNotification } from "../types/notification.types";

export const notificationsApi = {
  getNotifications() {
    return apiRequest<AppNotification[]>("/api/notifications");
  },
  markRead(id: number) {
    return apiRequest<void>(`/api/notifications/${id}/read`, {
      method: "PUT",
    });
  },
};
