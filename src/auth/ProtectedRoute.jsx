import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, sessionExpired } = useAuth();
  if (isAuthenticated) return children;
  // Existing accounts render immediately; a first session check stays quiet.
  if (loading) return <main className="min-h-screen bg-background" />;
  return <Navigate to={sessionExpired ? "/login?reason=session-expired" : "/login"} replace />;
}
