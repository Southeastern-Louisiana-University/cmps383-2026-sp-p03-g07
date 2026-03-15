export type UserSession = {
  id: number;
  userName: string;
  roles: string[];
  points: number;
};

export type MenuItem = {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  isAvailable: boolean;
  locationId: number;
  imageUrl: string;
  calories: number;
  isFeatured: boolean;
  inventoryCount: number;
  preparationTag: string;
  customizations: Array<{
    id: number;
    optionName: string;
    additionalPrice: number;
    isDefault: boolean;
  }>;
};

export type Location = {
  id: number;
  name: string;
  address: string;
  tableCount: number;
};

export type Order = {
  id: number;
  status: string;
  orderType: string;
  total: number;
  paymentStatus: string;
  createdAt: string;
  starsEarned: number;
  items: Array<{
    id: number;
    itemName: string;
    quantity: number;
  }>;
};

export type Reward = {
  id: number;
  name: string;
  description: string;
  pointsCost: number;
  tierName: string;
  offerType: string;
};

export type PointsBalance = {
  points: number;
  currentTier: string;
  nextTier: string;
  pointsToNextTier: number;
};
