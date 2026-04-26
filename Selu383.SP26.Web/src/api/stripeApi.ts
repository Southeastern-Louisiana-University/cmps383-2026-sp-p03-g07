import { apiRequest } from "./client";

export const stripeApi = {
  createIntent(input: { orderId: number; amount: number }) {
    return apiRequest<{ clientSecret: string; intentId: string }>("/api/payments/create-intent", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};
