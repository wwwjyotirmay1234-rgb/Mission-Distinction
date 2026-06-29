import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, setTokenRefresher, setAuthTokenGetter } from "@workspace/api-client-react";
import { signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  login: (response: LoginResponse) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("mission_token"));
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("mission_user");
      return stored ? (JSON.parse(stored) as User) : null;
    } catch {
      return null;
    }
  });

  const login = (response: LoginResponse) => {
    setUser(response.user);
    setToken(response.token);
    localStorage.setItem("mission_user", JSON.stringify(response.user));
    localStorage.setItem("mission_token", response.token);
    // Refresh token is stored server-side in an httpOnly cookie (md_refresh).
    // We do NOT persist it in localStorage to avoid XSS exposure.
  };

  const logout = () => {
    fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    }).catch(() => {});
    // Sign out of Firebase too so Google-authenticated students
    // are not automatically re-logged in via onAuthStateChanged.
    firebaseSignOut(auth).catch(() => {});
    setUser(null);
    setToken(null);
    localStorage.removeItem("mission_user");
    localStorage.removeItem("mission_token");
  };

  const updateUser = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem("mission_user", JSON.stringify(newUser));
  };

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("mission_token"));

    // Refresh lock — prevents parallel 401s from each triggering a rotation,
    // which would invalidate all but the first (single-use tokens).
    let refreshPromise: Promise<string | null> | null = null;

    const doRefresh = async (): Promise<string | null> => {
      if (refreshPromise) return refreshPromise;
      refreshPromise = (async () => {
        try {
          // Refresh token is in the httpOnly md_refresh cookie — no body needed.
          const res = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });
          if (!res.ok) {
            window.dispatchEvent(new Event("auth:logout"));
            return null;
          }
          const data = await res.json();
          localStorage.setItem("mission_token", data.token);
          localStorage.setItem("mission_user", JSON.stringify(data.user));
          window.dispatchEvent(new CustomEvent("auth:tokenRefreshed", { detail: data }));
          return data.token as string;
        } catch {
          window.dispatchEvent(new Event("auth:logout"));
          return null;
        } finally {
          refreshPromise = null;
        }
      })();
      return refreshPromise;
    };

    setTokenRefresher(doRefresh);

    // On mount: proactively refresh if the stored token is close to expiry.
    // This ensures the session is healthy on every cold start, not just when
    // the visibility changes later.
    (function checkOnMount() {
      const t = localStorage.getItem("mission_token");
      if (!t) return;
      try {
        const payload = JSON.parse(atob(t.split(".")[1]));
        const expiresIn = (payload.exp ?? 0) * 1000 - Date.now();
        if (expiresIn < 7 * 24 * 60 * 60 * 1000) {
          doRefresh().catch(() => {});
        }
      } catch {}
    })();

    // Silently refresh the token when the app comes back from background.
    // This prevents stale/expired tokens after the user has been away.
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      const t = localStorage.getItem("mission_token");
      if (!t) return;
      // Decode the JWT exp claim (no library needed — it's just base64).
      try {
        const payload = JSON.parse(atob(t.split(".")[1]));
        const expiresIn = (payload.exp ?? 0) * 1000 - Date.now();
        // Proactively refresh if token expires within 7 days.
        if (expiresIn < 7 * 24 * 60 * 60 * 1000) {
          doRefresh().catch(() => {});
        }
      } catch {
        // Malformed token — let the next API call handle it.
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      setTokenRefresher(null);
      setAuthTokenGetter(null);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const onLogout = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem("mission_user");
      localStorage.removeItem("mission_token");
    };
    const onRefreshed = (e: Event) => {
      const { token: t, user: u } = (e as CustomEvent<LoginResponse>).detail;
      setToken(t);
      setUser(u);
    };
    window.addEventListener("auth:logout", onLogout);
    window.addEventListener("auth:tokenRefreshed", onRefreshed as EventListener);
    return () => {
      window.removeEventListener("auth:logout", onLogout);
      window.removeEventListener("auth:tokenRefreshed", onRefreshed as EventListener);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isAdmin: user?.role === "admin",
        isSuperAdmin: !!(user?.isSuperAdmin),
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
