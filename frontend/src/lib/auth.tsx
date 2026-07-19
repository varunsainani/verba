"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, clearTokens, getAccessToken, getRefreshToken, setTokens } from "./api";

export interface User {
  id: string;
  email: string;
  name: string;
  locale: string;
  role: "USER" | "ADMIN";
}

interface SessionResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    locale?: string,
  ) => Promise<void>;
  demo: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; locale?: string }) => Promise<User>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { user } = await api.get<{ user: User }>("/auth/me");
      setUser(user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const login = useCallback(async (email: string, password: string) => {
    const s = await api.post<SessionResponse>("/auth/login", { email, password });
    setTokens(s.accessToken, s.refreshToken);
    setUser(s.user);
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string, locale?: string) => {
      const s = await api.post<SessionResponse>("/auth/register", {
        email,
        password,
        name,
        locale,
      });
      setTokens(s.accessToken, s.refreshToken);
      setUser(s.user);
    },
    [],
  );

  const demo = useCallback(async () => {
    const s = await api.post<SessionResponse>("/auth/demo");
    setTokens(s.accessToken, s.refreshToken);
    setUser(s.user);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    await api.post("/auth/logout", { refreshToken }).catch(() => {});
    clearTokens();
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (data: { name?: string; locale?: string }) => {
      const { user } = await api.patch<{ user: User }>("/auth/me", data);
      setUser(user);
      return user;
    },
    [],
  );

  const value = useMemo(
    () => ({ user, loading, login, register, demo, logout, updateProfile }),
    [user, loading, login, register, demo, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
