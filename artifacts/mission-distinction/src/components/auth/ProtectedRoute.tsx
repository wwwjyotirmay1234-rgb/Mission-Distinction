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

  // Admins are allowed onto student routes deliberately (e.g. via the
  // "Switch to Student View" toggle in the header) — do NOT auto-redirect
  // them back to the admin panel here.

  return <>{children}</>;
}
