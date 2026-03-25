import { apiRequest } from "./client";
import type { AppNotification } from "../types/notification.types";
import { stripRewardsExclusiveItemNames, textMentionsRewardsExclusiveItem } from "../utils/rewardsExclusiveItems";

export const notificationsApi = {
  getNotifications() {
    return apiRequest<AppNotification[]>("/api/notifications")
      .then((notifications) =>
        notifications
          .filter((notification) =>
            !textMentionsRewardsExclusiveItem(`${notification.title} ${notification.message}`),
          )
          .map((notification) => ({
            ...notification,
            title: stripRewardsExclusiveItemNames(notification.title),
            message: stripRewardsExclusiveItemNames(notification.message),
          })));
  },
  markRead(id: number) {
    return apiRequest<void>(`/api/notifications/${id}/read`, {
      method: "PUT",
    });
  },
  clearAll() {
    return apiRequest<void>("/api/notifications", {
      method: "DELETE",
    });
  },
};
