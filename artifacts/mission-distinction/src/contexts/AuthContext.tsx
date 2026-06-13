import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, AuthResponse } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (response: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("mission_user");
    const storedToken = localStorage.getItem("mission_token");
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (e) {
        localStorage.removeItem("mission_user");
        localStorage.removeItem("mission_token");
      }
    }
  }, []);

  const login = (response: AuthResponse) => {
    setUser(response.user);
    setToken(response.token);
    localStorage.setItem("mission_user", JSON.stringify(response.user));
    localStorage.setItem("mission_token", response.token);
  };

  const logoutContext = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("mission_user");
    localStorage.removeItem("mission_token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isAdmin: user?.role === "admin",
        login,
        logout: logoutContext,
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
