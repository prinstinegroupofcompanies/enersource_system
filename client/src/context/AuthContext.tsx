import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../lib/api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<{ requiresMfa?: boolean; mfaToken?: string }>;
  verifyMfa: (mfaToken: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (module: string, action?: string) => boolean;
  setSession: (accessToken: string, refreshToken: string, user: User) => void;
}

const STORAGE_KEY = 'enersource_auth';

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStored(): Pick<AuthState, 'accessToken' | 'refreshToken' | 'user'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { accessToken: null, refreshToken: null, user: null };
    return JSON.parse(raw);
  } catch {
    return { accessToken: null, refreshToken: null, user: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = loadStored();
  const [user, setUser] = useState<User | null>(stored.user);
  const [accessToken, setAccessToken] = useState<string | null>(stored.accessToken);
  const [refreshToken, setRefreshToken] = useState<string | null>(stored.refreshToken);
  const [isLoading, setIsLoading] = useState(!!stored.refreshToken);

  const persist = useCallback(
    (next: { accessToken: string | null; refreshToken: string | null; user: User | null }) => {
      if (next.accessToken && next.refreshToken && next.user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    },
    []
  );

  const setSession = useCallback(
    (at: string, rt: string, u: User) => {
      setAccessToken(at);
      setRefreshToken(rt);
      setUser(u);
      persist({ accessToken: at, refreshToken: rt, user: u });
    },
    [persist]
  );

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    persist({ accessToken: null, refreshToken: null, user: null });
  }, [persist]);

  useEffect(() => {
    if (!refreshToken || user) {
      setIsLoading(false);
      return;
    }

    api
      .post<{ accessToken: string; user: User }>('/auth/refresh', { refreshToken })
      .then((data) => setSession(data.accessToken, refreshToken, data.user))
      .catch(() => clearSession())
      .finally(() => setIsLoading(false));
  }, [refreshToken, user, setSession, clearSession]);

  const login = async (email: string, password: string) => {
    const result = await api.post<{
      requiresMfa?: boolean;
      mfaToken?: string;
      accessToken?: string;
      refreshToken?: string;
      user?: User;
    }>('/auth/login', { email, password });

    if (result.requiresMfa && result.mfaToken) {
      return { requiresMfa: true, mfaToken: result.mfaToken };
    }

    if (result.accessToken && result.refreshToken && result.user) {
      setSession(result.accessToken, result.refreshToken, result.user);
    }
    return {};
  };

  const verifyMfa = async (mfaToken: string, code: string) => {
    const result = await api.post<{
      accessToken: string;
      refreshToken: string;
      user: User;
    }>('/auth/mfa/verify', { mfaToken, code });
    setSession(result.accessToken, result.refreshToken, result.user);
  };

  const logout = async () => {
    try {
      if (accessToken) {
        await api.post('/auth/logout', { refreshToken }, accessToken);
      }
    } finally {
      clearSession();
    }
  };

  const hasPermission = useCallback(
    (module: string, action = 'view') => {
      if (!user) return false;
      if (user.role.slug === 'super-administrator') return true;
      return user.permissions.some((p) => p.module === module && p.action === action);
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      accessToken,
      refreshToken,
      isLoading,
      login,
      verifyMfa,
      logout,
      hasPermission,
      setSession,
    }),
    [user, accessToken, refreshToken, isLoading, hasPermission, setSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
