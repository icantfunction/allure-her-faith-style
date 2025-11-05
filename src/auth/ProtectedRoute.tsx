import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { authed, loading } = useAuth();
  if (loading) return <div className="admin-wrap">Loading…</div>;
  return authed ? children : <Navigate to="/admin/login" replace />;
}
