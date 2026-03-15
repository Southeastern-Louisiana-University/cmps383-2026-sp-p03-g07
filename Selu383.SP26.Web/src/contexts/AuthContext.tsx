import { createContext, useContext, useEffect, useState } from "react";
import { API_BASE_URL } from "../services/api";

type User = {
  id: number;
  userName: string;
  roles: string[];
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (userName: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userName: string, password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/authentication/me`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (userName: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/api/authentication/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userName, password }),
    });
    if (!res.ok) throw new Error("Invalid username or password.");
    const data = await res.json();
    setUser(data);
  };

  const logout = async () => {
    await fetch(`${API_BASE_URL}/api/authentication/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  };

  const register = async (userName: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/api/authentication/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userName, password }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || "Registration failed.");
    }
    const data = await res.json();
    setUser(data);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
