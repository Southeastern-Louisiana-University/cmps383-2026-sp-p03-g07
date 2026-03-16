import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { authApi } from "../api/authApi";
import type { UserSession } from "../types/user.types";

type AuthContextValue = {
  user: UserSession | null;
  loading: boolean;
  error: string;
  login: (userName: string, password: string) => Promise<void>;
  register: (userName: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (data: { displayName?: string; birthday?: string | null; profilePictureUrl?: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "selu383.auth.user";

function readStoredUser(): UserSession | null {
  const savedValue = window.localStorage.getItem(STORAGE_KEY);
  if (!savedValue) {
    return null;
  }

  try {
    return JSON.parse(savedValue) as UserSession;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<UserSession | null>(() => readStoredUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      const currentUser = await authApi.me();
      setUser(currentUser);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
      setError("");
    } catch {
      setUser(null);
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      async login(userName, password) {
        const nextUser = await authApi.login(userName, password);
        setUser(nextUser);
        setError("");
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      },
      async register(userName, password) {
        const nextUser = await authApi.register(userName, password);
        setUser(nextUser);
        setError("");
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      },
      logout() {
        // Clear local state immediately - never block on the server
        setUser(null);
        setError("");
        window.localStorage.removeItem(STORAGE_KEY);
        // Best-effort server session invalidation in background
        void authApi.logout().catch(() => undefined);
        return Promise.resolve();
      },
      async updateProfile(data) {
        const nextUser = await authApi.updateProfile(data);
        setUser(nextUser);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      },
      refresh,
    }),
    [error, loading, user],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
