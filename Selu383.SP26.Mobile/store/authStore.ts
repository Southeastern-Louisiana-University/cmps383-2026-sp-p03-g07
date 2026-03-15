import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { authService } from '@/services/authService';
import type { UserSession } from '@/types/app';

type AuthContextValue = {
  user: UserSession | null;
  loading: boolean;
  login: (userName: string, password: string) => Promise<void>;
  register: (userName: string, password: string) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const nextUser = await authService.me();
      setUser(nextUser);
    } catch {
      setUser(null);
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
      async login(userName, password) {
        const nextUser = await authService.login(userName, password);
        setUser(nextUser);
      },
      async register(userName, password) {
        const nextUser = await authService.register(userName, password);
        setUser(nextUser);
      },
      refresh,
      logout() {
        setUser(null);
      },
    }),
    [loading, user],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
