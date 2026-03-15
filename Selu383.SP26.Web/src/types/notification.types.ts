export type AppNotification = {
  id: number;
  userId?: number | null;
  channel: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};
