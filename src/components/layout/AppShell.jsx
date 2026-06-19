import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  LogOut,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { useAuth } from "@/auth/useAuth";
import { Button } from "@/components/ui/button";
import JournalSwitcher from "@/components/dashboard/JournalSwitcher";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
  { label: "Accounts",  icon: Wallet,          key: "accounts",  disabled: true },
];

function readCollapsed() {
  try { return localStorage.getItem("sidebar_collapsed") === "true"; } catch { return false; }
}

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(readCollapsed);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem("sidebar_collapsed", String(next)); } catch {}
      return next;
    });
  }

  function isActive(key) {
    if (key === "dashboard") return location.pathname === "/dashboard";
    return false;
  }

  const sidebarW  = collapsed ? "w-[56px]"  : "w-52";
  const contentPl = collapsed ? "pl-[56px]" : "pl-52";

  return (
    <div className="flex min-h-screen bg-zinc-950">

      {/* ── Left Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-zinc-800/60 bg-zinc-950 transition-[width] duration-200 ease-in-out ${sidebarW}`}
      >
        {/* Brand */}
        <div
          className={`flex h-14 shrink-0 items-center border-b border-zinc-800/60 px-3 ${
            collapsed ? "justify-center" : "gap-2.5"
          }`}
        >
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 ring-1 ring-emerald-500/30">
            <TrendingUp className="size-3.5 text-emerald-400" />
          </div>
          {!collapsed && (
            <span className="overflow-hidden whitespace-nowrap font-semibold tracking-tight text-zinc-100">
              TradeTrack
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-hidden p-2">
          {NAV_ITEMS.map(({ label, icon: Icon, key, disabled }) => {
            if (disabled) {
              return (
                <div
                  key={key}
                  title={collapsed ? label : undefined}
                  className={`flex cursor-not-allowed select-none items-center rounded-md px-2 py-2 text-sm text-zinc-600 ${
                    collapsed ? "justify-center" : "gap-3"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 whitespace-nowrap">{label}</span>
                      <span className="rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider bg-zinc-800/60 text-zinc-600">
                        Soon
                      </span>
                    </>
                  )}
                </div>
              );
            }

            const active = isActive(key);
            return (
              <Link
                key={key}
                to="/dashboard"
                title={collapsed ? label : undefined}
                className={`flex items-center rounded-md px-2 py-2 text-sm transition-colors ${
                  collapsed ? "justify-center" : "gap-3"
                } ${
                  active
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && <span className="whitespace-nowrap">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-zinc-800/60 p-2">
          <button
            onClick={toggleCollapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex w-full items-center rounded-md px-2 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-800/60 hover:text-zinc-300 ${
              collapsed ? "justify-center" : "gap-3"
            }`}
          >
            {collapsed
              ? <ChevronsRight className="size-4 shrink-0" />
              : <ChevronsLeft  className="size-4 shrink-0" />
            }
            {!collapsed && <span className="whitespace-nowrap">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* ── Content area ── */}
      <div
        className={`flex min-h-screen flex-1 flex-col transition-[padding-left] duration-200 ease-in-out ${contentPl}`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-4 border-b border-zinc-800/60 bg-zinc-950/90 px-6 backdrop-blur-xl">
          <JournalSwitcher />
          <div className="ml-auto flex items-center gap-4">
            {user?.email && (
              <span className="hidden text-sm text-zinc-500 md:block">{user.email}</span>
            )}
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-6">
          {children}
        </main>
      </div>

    </div>
  );
}
