import { Navigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import { type Role } from "../lib/db";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  if (!user || !token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function RoleRoute({ allow, children }: { allow: Role[]; children: React.ReactNode }) {
  const { user, token } = useAuth();
  if (!user || !token) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
