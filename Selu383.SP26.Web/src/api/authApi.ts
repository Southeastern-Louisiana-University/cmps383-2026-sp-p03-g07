import { apiRequest } from "./client";
import type { UserSession } from "../types/user.types";

export type RegisterInput = {
  userName: string;
  password: string;
  email: string;
  phoneNumber: string;
};

export type UpdateProfileInput = {
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  birthday?: string | null;
  profilePictureUrl?: string;
};

export const authApi = {
  login(userName: string, password: string) {
    return apiRequest<UserSession>("/api/authentication/login", {
      method: "POST",
      body: JSON.stringify({ userName, password }),
    });
  },
  logout() {
    return apiRequest<void>("/api/authentication/logout", {
      method: "POST",
    });
  },
  me() {
    return apiRequest<UserSession>("/api/authentication/me");
  },
  register(input: RegisterInput) {
    return apiRequest<UserSession>("/api/authentication/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  updateProfile(data: UpdateProfileInput) {
    return apiRequest<UserSession>("/api/authentication/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};
