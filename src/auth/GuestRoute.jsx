import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";

export default function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  if (loading) return <main className="min-h-screen bg-background" />;
  return children;
}
