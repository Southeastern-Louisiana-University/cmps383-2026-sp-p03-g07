import { apiRequest } from "./client";

export type CreateFeedbackInput = {
  category: string;
  rating: number;
  name: string;
  comment: string;
};

export type FeedbackItem = {
  id: number;
  userId: number | null;
  name: string;
  category: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export const feedbackApi = {
  submit(input: CreateFeedbackInput) {
    return apiRequest<FeedbackItem>("/api/feedback", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  getAll() {
    return apiRequest<FeedbackItem[]>("/api/feedback");
  },
};
