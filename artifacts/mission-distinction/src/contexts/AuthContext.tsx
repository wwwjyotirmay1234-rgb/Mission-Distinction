import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, setTokenRefresher, setAuthTokenGetter } from "@workspace/api-client-react";

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
    localStorage.removeItem("mission_refresh_token");
  };

  const logout = () => {
    fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    }).catch(() => {});
    setUser(null);
    setToken(null);
    localStorage.removeItem("mission_user");
    localStorage.removeItem("mission_token");
    localStorage.removeItem("mission_refresh_token");
  };

  const updateUser = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem("mission_user", JSON.stringify(newUser));
  };

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("mission_token"));
    setTokenRefresher(async () => {
      try {
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
      }
    });

    return () => {
      setTokenRefresher(null);
      setAuthTokenGetter(null);
    };
  }, []);

  useEffect(() => {
    const onLogout = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem("mission_user");
      localStorage.removeItem("mission_token");
      localStorage.removeItem("mission_refresh_token");
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
