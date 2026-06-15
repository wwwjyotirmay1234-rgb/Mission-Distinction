import React, { createContext, useContext, useState, ReactNode } from "react";
import { User } from "@workspace/api-client-react";

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
    if (response.refreshToken) {
      localStorage.setItem("mission_refresh_token", response.refreshToken);
    }
  };

  const logout = () => {
    const refreshToken = localStorage.getItem("mission_refresh_token");
    if (refreshToken) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }
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
