import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "./useAuth";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, sessionError, sessionExpired, retrySession, resetSession } = useAuth();
  if (loading) {
    return <main className="flex min-h-screen items-center justify-center px-6"><p role="status" className="text-sm text-muted-foreground">Reconnecting to your account…</p></main>;
  }
  if (sessionError) {
    return <main className="flex min-h-screen items-center justify-center px-6"><div className="max-w-sm space-y-4 rounded-xl border border-border bg-card p-6">
      <h1 className="text-lg font-medium">Unable to restore your session</h1>
      <p role="alert" className="text-sm text-muted-foreground">{sessionError}</p>
      <div className="flex flex-wrap gap-3"><Button onClick={retrySession}>Try again</Button><Button variant="outline" onClick={resetSession}>Back to sign in</Button></div>
    </div></main>;
  }
  if (!isAuthenticated) {
    return <Navigate to={sessionExpired ? "/login?reason=session-expired" : "/login"} replace />;
  }
  return children;
}
