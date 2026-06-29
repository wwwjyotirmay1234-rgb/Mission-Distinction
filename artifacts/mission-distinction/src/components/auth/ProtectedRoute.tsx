import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "wouter";
import { CompleteProfileModal, isProfileComplete } from "./CompleteProfileModal";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, user } = useAuth();

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  if (requireAdmin && !isAdmin) {
    return <Redirect to="/student/dashboard" />;
  }

  if (!requireAdmin && isAdmin) {
    return <Redirect to="/admin/dashboard" />;
  }

  // Students must complete their profile before accessing any page.
  // Admins are exempt — they have a separate, simpler registration.
  if (!isAdmin && !isProfileComplete(user)) {
    return <CompleteProfileModal />;
  }

  return <>{children}</>;
}
