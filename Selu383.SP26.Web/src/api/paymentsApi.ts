import { apiRequest } from "./client";
import type { GiftCard, Payment } from "../types/payment.types";

export const paymentsApi = {
  getPayments() {
    return apiRequest<Payment[]>("/api/payments/mine");
  },
  checkout(input: {
    orderId: number;
    paymentMethod: string;
    amount?: number;
    giftCardCode?: string;
    cardLastFour?: string;
  }) {
    return apiRequest<Payment[]>("/api/payments/checkout", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  getGiftCard(code: string) {
    return apiRequest<GiftCard>(`/api/payments/gift-cards/${encodeURIComponent(code)}`);
  },
  purchaseGiftCard(amount: number, recipientName: string, recipientEmail: string, message: string) {
    return apiRequest<GiftCard>("/api/payments/gift-cards/purchase", {
      method: "POST",
      body: JSON.stringify({ amount, recipientName, recipientEmail, message }),
    });
  },
  redeemGiftCard(code: string, amount: number, orderId?: number) {
    return apiRequest<GiftCard>("/api/payments/gift-cards/redeem", {
      method: "POST",
      body: JSON.stringify({ code, amount, orderId }),
    });
  },
};
