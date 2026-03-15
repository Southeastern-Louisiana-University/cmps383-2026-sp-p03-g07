export type Payment = {
  id: number;
  userId: number;
  orderId?: number | null;
  amount: number;
  method: string;
  status: string;
  providerReference: string;
  cardLastFour: string;
  createdAt: string;
};

export type GiftCard = {
  id: number;
  code: string;
  initialBalance: number;
  balance: number;
  isActive: boolean;
  purchasedAt: string;
};
