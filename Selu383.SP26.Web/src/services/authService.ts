import { API_BASE_URL } from "./api";

export async function registerUser(userName: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ userName, password }),
  });
  if (!res.ok) throw new Error("Registration failed.");
  return res.json();
}
