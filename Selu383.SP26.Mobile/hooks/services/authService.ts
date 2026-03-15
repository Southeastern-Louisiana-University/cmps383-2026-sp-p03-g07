import { API_BASE_URL } from "@/constants/api";

export type UserDto = {
  id: number;
  userName: string;
  roles: string[];
};

export async function login(userName: string, password: string): Promise<UserDto> {
  const res = await fetch(`${API_BASE_URL}/api/authentication/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ userName, password }),
  });
  if (!res.ok) throw new Error("Invalid username or password.");
  return res.json();
}

export async function register(userName: string, password: string): Promise<UserDto> {
  const res = await fetch(`${API_BASE_URL}/api/authentication/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ userName, password }),
  });
  if (!res.ok) throw new Error("Registration failed.");
  return res.json();
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE_URL}/api/authentication/logout`, {
    method: "POST",
    credentials: "include",
  });
}

export async function getMe(): Promise<UserDto | null> {
  const res = await fetch(`${API_BASE_URL}/api/authentication/me`, {
    credentials: "include",
  });
  if (!res.ok) return null;
  return res.json();
}
