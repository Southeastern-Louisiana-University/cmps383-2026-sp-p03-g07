import { apiRequest } from "./client";
import type { Payment } from "../types/payment.types";

export const paymentsApi = {
  getPayments() {
    return apiRequest<Payment[]>("/api/payments/mine");
  },
  checkout(input: {
    orderId: number;
    paymentMethod: string;
    amount?: number;
    cardLastFour?: string;
    stripeIntentId?: string;
  }) {
    return apiRequest<Payment[]>("/api/payments/checkout", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};
