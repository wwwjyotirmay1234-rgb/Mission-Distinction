import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  if (requireAdmin && !isAdmin) {
    return <Redirect to="/student/dashboard" />;
  }

  if (!requireAdmin && isAdmin) {
    return <Redirect to="/admin/dashboard" />;
  }

  return <>{children}</>;
}
