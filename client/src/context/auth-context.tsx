import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { requestSessionRefresh, setAccessToken, setUnauthorizedHandler } from '@/lib/api';
import { authService } from '@/services/auth.service';
import type { AuthResponse, UserDTO } from '@/types';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: UserDTO | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (user: UserDTO) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      toast.warning('Your session has expired. Please sign in again.');
    });

    let cancelled = false;

    (async () => {
      try {
        const token = await requestSessionRefresh();
        if (!token) {
          if (!cancelled) setStatus('unauthenticated');
          return;
        }
        const me = await authService.me();
        if (!cancelled) {
          setUser(me);
          setStatus('authenticated');
        }
      } catch {
        if (!cancelled) {
          setAccessToken(null);
          setStatus('unauthenticated');
        }
      }
    })();

    return () => {
      cancelled = true;
      setUnauthorizedHandler(null);
    };
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authService.login({ email, password });
    setAccessToken(result.accessToken);
    setUser(result.user);
    setStatus('authenticated');
    return result;
  }, []);

  const register = useCallback<AuthContextValue['register']>(async (input) => {
    const result = await authService.register(input);
    setAccessToken(result.accessToken);
    setUser(result.user);
    setStatus('authenticated');
    return result;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore network errors on logout
    }
    clearSession();
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    const me = await authService.me();
    setUser(me);
    setStatus('authenticated');
  }, []);

  const updateUser = useCallback((next: UserDTO) => setUser(next), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated' && user !== null,
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      refreshUser,
      updateUser,
    }),
    [user, status, login, register, logout, refreshUser, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
