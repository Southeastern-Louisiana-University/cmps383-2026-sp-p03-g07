import { apiRequest } from './api';

export type CreateFeedbackInput = {
  category: string;
  rating: number;
  name: string;
  comment: string;
};

export const feedbackService = {
  submit(input: CreateFeedbackInput) {
    return apiRequest('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};
