import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { useEffect, useState } from "react";
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
  Menu,
  Newspaper,
  Settings,
  Shield,
  User,
  X,
  ChevronDown,
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
import { Button } from "@/components/ui/button";
import JournalSwitcher from "@/components/dashboard/JournalSwitcher";
import UserSettings from "./UserSettings";
import LanguageSelector from "./LanguageSelector";

const TOOLS = [
  { label: "Economic Calendar", icon: CalendarDays },
  { label: "Lot Size Calculator", icon: Calculator },
  { label: "Market Sessions", icon: Globe },
  { label: "Forex News", icon: Newspaper },
  { label: "Risk Calculator", icon: Shield },
  { label: "AI Market Brief", icon: Bot },
  { label: "Trading Academy", icon: GraduationCap },
  { label: "Strategy Builder", icon: Lightbulb },
];
function readCollapsed() {
  try {
    return localStorage.getItem("sidebar_collapsed") === "true";
  } catch {
    return false;
  }
}
function Hint({ label, children }) {
  useLanguage();
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{t(label)}</TooltipContent>
    </Tooltip>
  );
}
export default function AppShell({ children }) {
  useLanguage();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const resize = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  useEffect(() => {
    if (!mobileOpen) return;
    const navigation = document.getElementById("app-navigation");
    navigation.querySelector("a,button")?.focus();
    const close = (event) => {
      if (event.key === "Escape") setMobileOpen(false);
      if (event.key === "Tab") {
        const nodes = [...navigation.querySelectorAll("a[href],button:not(:disabled)")].filter(
          (node) => node.offsetParent !== null,
        );
        const first = nodes[0],
          last = nodes.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("keydown", close);
      document.getElementById("mobile-navigation-trigger")?.focus();
    };
  }, [mobileOpen]);
  const compact = collapsed && !mobile;
  const name =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.email?.split("@")[0] ||
    "Account";
  const initials =
    (user?.first_name?.[0] || user?.email?.[0] || "N") + (user?.last_name?.[0] || "");
  const journalRoute = location.pathname.startsWith("/journal/");
  function toggleCollapsed() {
    setCollapsed((value) => {
      try {
        localStorage.setItem("sidebar_collapsed", String(!value));
      } catch {
        /* Local persistence is optional. */
      }
      return !value;
    });
  }
  return (
    <div className="nx-shell" data-collapsed={compact} data-mobile-open={mobileOpen}>
      <a
        href="#main-content"
        className="fixed left-4 top-2 z-[100] -translate-y-24 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground focus:translate-y-0"
      >{t("Skip to content")}</a>
      {mobileOpen && (
        <button
          type="button"
          aria-label={t("Close navigation")}
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}
      <aside
        id="app-navigation"
        className="nx-sidebar"
        aria-label={t("Application navigation")}
        inert={mobile && !mobileOpen ? true : undefined}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border/60 px-5">
          <Link
            to="/dashboard"
            aria-label={t("Nexora dashboard")}
            onClick={() => setMobileOpen(false)}
            className="flex min-w-0 items-center gap-2.5"
          >
            <img src="/nexora.png" alt="" className="size-8 shrink-0 rounded-lg" />
            {!compact && (
              <div className="min-w-0">
                <span className="text-[17px] font-semibold tracking-[-0.05em]">
                  nexora<span className="text-primary">.</span>
                </span>
                <p className="text-[8px] uppercase tracking-[0.22em] text-zinc-500">{t("Trading intelligence")}</p>
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon-xs"
            className="md:hidden"
            aria-label={t("Close navigation")}
            onClick={() => setMobileOpen(false)}
          >
            <X />
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-5 pt-5">
          <p className="nx-sidebar-caption !mt-0">{t("Workspace")}</p>
          <Hint label={t("Dashboard")}>
            <Link
              to="/dashboard"
              className="nx-nav-item"
              data-active={!journalRoute}
              aria-current={!journalRoute ? "page" : undefined}
              onClick={() => setMobileOpen(false)}
            >
              <LayoutDashboard className="size-4 shrink-0" />
              <span className="nx-nav-label">{t("Dashboard")}</span>
            </Link>
          </Hint>
          <div className="flex items-center justify-between">
            <p className="nx-sidebar-caption">{t("Tools")}</p>
            {!compact && (
              <span className="mt-5 rounded border border-border px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-zinc-500">{t("Soon")}</span>
            )}
          </div>
          <div className="space-y-0.5">
            {TOOLS.map(({ label, icon: Icon }) => (
              <Hint key={label} label={`${t(label)} · ${t("Coming soon")}`}>
                <div aria-disabled="true" className="nx-nav-item cursor-not-allowed opacity-50">
                  <Icon className="size-4 shrink-0" />
                  <span className="nx-nav-label">{t(label)}</span>
                </div>
              </Hint>
            ))}
          </div>
        </nav>
        <div className="space-y-3 border-t border-border/60 p-3">
          {!compact && (
            <div className="rounded-lg border border-border/50 bg-card p-3">
              <p className="text-[11px] font-medium text-zinc-300">{t("A clearer view of your edge.")}</p>
              <p className="mt-1 text-[10px] leading-4 text-zinc-500">{t("Every trade tells a story. Make yours count.")}</p>
            </div>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={compact ? t("Expand sidebar") : t("Collapse sidebar")}
            aria-expanded={!compact}
            className="nx-nav-item hidden w-full md:flex"
          >
            {compact ? (
              <ChevronsRight className="size-4" />
            ) : (
              <>
                <ChevronsLeft className="size-4" />
                <span className="nx-nav-label">{t("Collapse sidebar")}</span>
              </>
            )}
          </button>
        </div>
      </aside>
      <div className="nx-shell-body" inert={mobile && mobileOpen ? true : undefined}>
        <header className="nx-header">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <Button
              id="mobile-navigation-trigger"
              type="button"
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label={t("Open navigation")}
              aria-controls="app-navigation"
              aria-expanded={mobileOpen}
            >
              <Menu />
            </Button>
            <span className="hidden text-[12px] text-zinc-500 lg:block">{t("Workspace")}</span>
            <span className="hidden text-border lg:block">/</span>
            <JournalSwitcher />
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <LanguageSelector />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={t("Account menu")}
                  className="flex items-center gap-2.5 rounded-lg p-1.5 outline-none transition-colors hover:bg-secondary"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-[11px] font-medium uppercase text-primary">
                    {initials}
                  </span>
                  <span className="hidden max-w-32 truncate text-[12px] text-zinc-300 sm:block">
                    {name}
                  </span>
                  <ChevronDown className="size-3 text-zinc-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-[13px] font-medium">{name}</p>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <User className="size-4" />{t("Profile")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                  <Settings className="size-4" />{t("Settings")}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="size-4" />{t("Sign out")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main id="main-content" className="nx-page">
          {children}
        </main>
      </div>
      {settingsOpen && <UserSettings onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
