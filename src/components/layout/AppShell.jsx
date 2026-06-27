import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Bot,
  Calculator,
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  Globe,
  GraduationCap,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Newspaper,
  Settings,
  Shield,
  TrendingUp,
  User,
} from "lucide-react";

import { useAuth } from "@/auth/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import JournalSwitcher from "@/components/dashboard/JournalSwitcher";

// ─── Nav data ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
];

const TOOL_ITEMS = [
  { label: "Economic Calendar",   icon: CalendarDays  },
  { label: "Lot Size Calculator", icon: Calculator    },
  { label: "Market Sessions",     icon: Globe         },
  { label: "Forex News",          icon: Newspaper     },
  { label: "Risk Calculator",     icon: Shield        },
  { label: "AI Market Brief",     icon: Bot           },
  { label: "Trading Academy",     icon: GraduationCap },
  { label: "Strategy Builder",    icon: Lightbulb     },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(user) {
  if (user?.first_name || user?.last_name) {
    return `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "TT";
  }
  return (user?.email ?? "TT").slice(0, 2).toUpperCase();
}

function getDisplayName(user) {
  if (user?.first_name || user?.last_name) {
    return [user.first_name, user.last_name].filter(Boolean).join(" ");
  }
  return user?.email?.split("@")[0] ?? "";
}

function readCollapsed() {
  try { return localStorage.getItem("sidebar_collapsed") === "true"; } catch { return false; }
}

// ─── Component ────────────────────────────────────────────────────────────────

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

  function isActive(to) {
    if (to === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname.startsWith("/journal");
    }
    return location.pathname.startsWith(to);
  }

  const sidebarW  = collapsed ? "w-[60px]"   : "w-[224px]";
  const contentPl = collapsed ? "pl-[60px]"  : "pl-[224px]";
  const initials  = getInitials(user);
  const displayName = getDisplayName(user);

  return (
    <div className="flex min-h-screen bg-zinc-950">

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-zinc-800/50 bg-zinc-950 transition-[width] duration-200 ease-in-out ${sidebarW}`}
      >

        {/* Brand */}
        <div className={`flex h-14 shrink-0 items-center border-b border-zinc-800/50 ${collapsed ? "justify-center px-3" : "px-4"}`}>
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 ring-1 ring-emerald-500/25">
            <TrendingUp className="size-3.5 text-emerald-400" />
          </div>
          {!collapsed && (
            <div className="ml-2.5 overflow-hidden">
              <p className="whitespace-nowrap text-[13px] font-semibold leading-tight tracking-tight text-zinc-100">
                TradeTrack
              </p>
              <p className="whitespace-nowrap text-[10px] leading-tight tracking-wide text-zinc-500">
                Analytics
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden p-2">

          {/* Main items */}
          {NAV_ITEMS.map(({ label, icon: Icon, to }) => {
            const active = isActive(to);
            if (collapsed) {
              return (
                <Tooltip key={label}>
                  <TooltipTrigger asChild>
                    <Link
                      to={to}
                      className={`flex h-9 w-full items-center justify-center rounded-md transition-colors ${
                        active
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
                      }`}
                    >
                      <Icon className="size-4 shrink-0" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              );
            }
            return (
              <Link
                key={label}
                to={to}
                className={`relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-emerald-500" />
                )}
                <Icon className="size-4 shrink-0" />
                <span className="whitespace-nowrap">{label}</span>
              </Link>
            );
          })}

          {/* Tools section divider */}
          <div className={`${collapsed ? "my-3" : "mt-5 mb-1"}`}>
            {collapsed
              ? <div className="mx-2 h-px bg-zinc-800/60" />
              : <p className="px-2.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                  Tools
                </p>
            }
          </div>

          {/* Coming soon tools */}
          {TOOL_ITEMS.map(({ label, icon: Icon }) => {
            if (collapsed) {
              return (
                <Tooltip key={label}>
                  <TooltipTrigger asChild>
                    <div className="flex h-9 w-full cursor-not-allowed items-center justify-center rounded-md opacity-30">
                      <Icon className="size-4 shrink-0 text-zinc-500" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">{label} · Coming Soon</TooltipContent>
                </Tooltip>
              );
            }
            return (
              <div
                key={label}
                className="flex h-9 cursor-not-allowed items-center gap-2.5 rounded-md px-2.5 opacity-35"
              >
                <Icon className="size-4 shrink-0 text-zinc-500" />
                <span className="flex-1 whitespace-nowrap text-sm text-zinc-500">{label}</span>
                <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-zinc-600">
                  Soon
                </span>
              </div>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-zinc-800/50 p-2">
          <button
            onClick={toggleCollapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex h-9 w-full items-center rounded-md text-sm text-zinc-600 transition-colors hover:bg-zinc-800/60 hover:text-zinc-300 ${
              collapsed ? "justify-center" : "gap-2.5 px-2.5"
            }`}
          >
            {collapsed
              ? <ChevronsRight className="size-4 shrink-0" />
              : (
                <>
                  <ChevronsLeft className="size-4 shrink-0" />
                  <span className="whitespace-nowrap">Collapse</span>
                </>
              )
            }
          </button>
        </div>
      </aside>

      {/* ── Content area ── */}
      <div className={`flex min-h-screen flex-1 flex-col transition-[padding-left] duration-200 ease-in-out ${contentPl}`}>

        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-4 border-b border-zinc-800/50 bg-zinc-950/80 px-6 backdrop-blur-xl">
          <JournalSwitcher />

          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 outline-none transition-colors hover:bg-zinc-800/60">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[11px] font-bold text-emerald-400 ring-1 ring-emerald-500/30">
                    {initials}
                  </div>
                  <span className="hidden max-w-[140px] truncate text-sm text-zinc-300 md:block">
                    {displayName}
                  </span>
                  <svg className="size-3 text-zinc-500" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[12px] font-bold text-emerald-400">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-100">{displayName}</p>
                      <p className="truncate text-[11px] text-zinc-500">{user?.email}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem disabled className="cursor-not-allowed opacity-40">
                  <User className="size-3.5" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="cursor-not-allowed opacity-40">
                  <Settings className="size-3.5" />
                  Settings
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={logout} variant="destructive">
                  <LogOut className="size-3.5" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-8">
          {children}
        </main>
      </div>

    </div>
  );
}
