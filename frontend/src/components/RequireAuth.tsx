import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { LoadingState, ErrorState } from "@/components/States";

export function RequireAuth() {
  const { user, loading, error, refetch } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingState label="Verificando sessão..." />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!user)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function RequireAdmin() {
  const { isAdmin } = useAuth();
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
}
