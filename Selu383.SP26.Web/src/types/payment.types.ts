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
