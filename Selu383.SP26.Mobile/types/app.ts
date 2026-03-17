export type UserSession = {
  id: number;
  userName: string;
  roles: string[];
  points: number;
  displayName: string;
  birthday?: string | null;
  profilePictureUrl: string;
};

export type Reservation = {
  id: number;
  userId: number;
  locationId: number;
  reservationTime: string;
  partySize: number;
  status: string;
};

export type MenuCustomization = {
  id: number;
  groupName: string;
  optionName: string;
  additionalPrice: number;
  isDefault: boolean;
  sortOrder: number;
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
  customizations: MenuCustomization[];
};

export type Location = {
  id: number;
  name: string;
  address: string;
  tableCount: number;
};

export type OrderItem = {
  id: number;
  menuItemId: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  customizations: string;
  specialInstructions: string;
};

export type Order = {
  id: number;
  userId: number | null;
  guestName: string;
  locationId: number;
  orderType: string;
  status: string;
  tableNumber?: number | null;
  total: number;
  createdAt: string;
  pickupName: string;
  specialInstructions: string;
  paymentStatus: string;
  starsEarned: number;
  items: OrderItem[];
};

export type Reward = {
  id: number;
  name: string;
  description: string;
  pointsCost: number;
  isActive: boolean;
  tierName: string;
  offerType: string;
  discountAmount?: number | null;
  bonusStars: number;
};

export type RewardTier = {
  id: number;
  name: string;
  minPoints: number;
  color: string;
};

export type PointsBalance = {
  points: number;
  currentTier: string;
  nextTier: string;
  pointsToNextTier: number;
};

export type RewardHistoryItem = {
  id: number;
  rewardName: string;
  pointsSpent: number;
  redeemedAt: string;
};
