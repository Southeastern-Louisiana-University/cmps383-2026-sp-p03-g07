import { apiRequest } from "./client";
import type { UserSession } from "../types/user.types";

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
  register(userName: string, password: string) {
    return apiRequest<UserSession>("/api/authentication/register", {
      method: "POST",
      body: JSON.stringify({ userName, password }),
    });
  },
  updateProfile(data: { displayName?: string; birthday?: string | null; profilePictureUrl?: string }) {
    return apiRequest<UserSession>("/api/authentication/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};
