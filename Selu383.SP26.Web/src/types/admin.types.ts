export type DashboardProductStat = {
  name: string;
  quantitySold: number;
  revenue: number;
};

export type DashboardOrderSummary = {
  id: number;
  status: string;
  total: number;
  orderType: string;
  createdAt: string;
};

export type LowInventoryItem = {
  id: number;
  name: string;
  inventoryCount: number;
  category: string;
};

export type AdminDashboard = {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  activeMenuItems: number;
  rewardsRedeemed: number;
  outstandingGiftCardBalance: number;
  topProducts: DashboardProductStat[];
  recentOrders: DashboardOrderSummary[];
  lowInventoryItems: LowInventoryItem[];
};
