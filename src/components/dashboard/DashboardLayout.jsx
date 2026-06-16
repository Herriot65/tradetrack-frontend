import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, LogOut, BarChart3, TrendingUp } from "lucide-react";

import { useAuth } from "@/auth/useAuth";
import { useWorkspace } from "@/workspaces/useWorkspace";
import { Button } from "@/components/ui/button";

import WorkspaceSwitcher from "./WorkspaceSwitcher";

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="sticky top-0 z-40 border-b border-zinc-800/60 bg-zinc-950/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
                <TrendingUp className="size-4" />
              </div>
              <span className="hidden font-semibold tracking-tight sm:inline">
                TradeTrack
              </span>
            </Link>

            <nav className="hidden items-center gap-1 sm:flex">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={location.pathname === "/dashboard" ? "bg-zinc-800/60 text-zinc-100" : ""}
              >
                <Link to="/dashboard">
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </Link>
              </Button>

              {activeWorkspace && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className={
                    location.pathname.endsWith("/hub")
                      ? "bg-zinc-800/60 text-zinc-100"
                      : ""
                  }
                >
                  <Link to={`/workspace/${activeWorkspace.id}/hub`}>
                    <BarChart3 className="size-4" />
                    Performance Hub
                  </Link>
                </Button>
              )}
            </nav>

            <WorkspaceSwitcher />
          </div>

          <div className="flex items-center gap-3">
            {user?.email && (
              <span className="hidden text-sm text-muted-foreground md:inline">
                {user.email}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
