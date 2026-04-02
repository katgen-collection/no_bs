"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { User, LoginData } from "@/types";
import { authApi } from "@/lib/api";

// ─── Context shape ──────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  setAuth: (user: User, expiresAt: string) => void;
  updateUser: (user: User) => void;
  clearAuth: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Refresh timer ──────────────────────────────────────────────────────────

const REFRESH_BUFFER_MS = 2 * 60 * 1000; // refresh 2 minutes before expiry

// ─── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // Schedule a token refresh before the access token expires
  const scheduleRefresh = useCallback(
    (expiresAt: string) => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      const expiryMs = new Date(expiresAt).getTime();
      const now = Date.now();
      const delay = Math.max(expiryMs - now - REFRESH_BUFFER_MS, 0);

      refreshTimerRef.current = setTimeout(async () => {
        try {
          const data = await authApi.post<LoginData>("/api/v1/auth/refresh");
          setUser(data.user);
          scheduleRefresh(data.access_token_expires_at);
        } catch {
          setUser(null);
          router.replace("/login");
        }
      }, delay);
    },
    [router],
  );

  // Set auth state and arm the refresh timer
  const setAuth = useCallback(
    (user: User, expiresAt: string) => {
      setUser(user);
      scheduleRefresh(expiresAt);
    },
    [scheduleRefresh],
  );

  // Clear auth state and cancel any pending refresh
  const clearAuth = useCallback(() => {
    setUser(null);
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  // Update just the user object without touching the refresh timer
  const updateUser = useCallback((newUser: User) => {
    setUser(newUser);
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await authApi.post("/api/v1/auth/logout");
    } catch {
      // Swallow — clear client state regardless
    }
    clearAuth();
    router.replace("/login");
  }, [clearAuth, router]);

  // Check session on first mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const userData = await authApi.get<User>("/api/v1/auth/me");
        if (!cancelled) {
          setUser(userData);
          // We don't know the exact expiry from /me — schedule a refresh in 25 minutes
          // (access token TTL is 30 min, so 25 min is safe)
          scheduleRefresh(
            new Date(Date.now() + 25 * 60 * 1000).toISOString(),
          );
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [scheduleRefresh]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, setAuth, updateUser, clearAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
